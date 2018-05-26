const utils = require('./utils');
const Account = require('./account/account');
const modelsUtil = require('../models/modelsUtil');
const redisDataParser = require('../models/redisDataParser');
const REDISKEY = require('../models/redisKey');
const ERROR_OBJ = require('../consts/fish_error').ERROR_OBJ;
const EventHandler = require('./account/eventHandler');

class Util {
    constructor() {}

    parseHashKey(res) {
        let uids = [];
        for (let i = 0; i < res.length; i += 2) {
            let uid = Number(res[i]);
            if (!isNaN(uid)) {
                uids.push({
                    uid: uid
                });
            }
        }
        return uids;
    }

    parseHashKeyArray(res) {
        let uids = [];
        for (let i = 0; i < res.length; i += 2) {
            let uid = Number(res[i]);
            if (!isNaN(uid)) {
                uids.push(uid);
            }
        }
        return uids;
    }

    parseHashValue(key, res) {
        let values = [];
        for (let i = 0; i < res.length; i += 2) {
            values.push(redisDataParser.parseValue(key, res[i + 1]));
        }
        return values;
    }

    convertValue(key, datas) {
        let values = [];
        for (let i = 0; i < datas.length; i++) {
            values.push(redisDataParser.parseValue(key, datas[i]));
        }
        return values;
    }

    filterInvalidAccount(accounts) {
        let account_filter = accounts.filter(function (item) {
            return item !== null && item !== undefined;
        });

        return account_filter;
    }

    genUid() {
        return new Promise(function (resolve, reject) {
            redisConnector.cmd.incr(REDISKEY.KEY_ACC_COUNTER, function (err, count) {
                if (err) {
                    reject(err);
                } else {
                    resolve(count);
                }
            });
        });
    }
}

/**
 * 判断用户是否存在于redis中
 * @param uid
 * @param cb
 * @private
 */
function _exist(uid, cb) {
    redisConnector.cmd.hget(REDISKEY.PLATFORM, uid, function (err, result) {
        if (err) {
            logger.error('_exist ERROR:', err);
            //TODO TEST 
            let ERROR = Object.deepClone(ERROR_OBJ.DB_REDIS_ERR);
            utils.invokeCallback(cb, ERROR);
            return;
        }

        if (!result) {
            utils.invokeCallback(cb, ERROR_OBJ.USER_NOT_EXIST);
            return;
        }

        utils.invokeCallback(cb, null, result);
    });
}

/**
 * 设置用户信息到redis
 * @param id
 * @param data 支持[{key:value},{key:value}]和{key1:value1,key2:value2}两种数据格式
 * @param cb
 */
function _setAccount(id, data, cb) {
    if (!id || !data) {
        utils.invokeCallback(cb, ERROR_OBJ.PARAM_MISSING);
        return;
    }

    let fields = [];
    if (data instanceof Array) {
        fields = data;
    } else {
        for (let key in data) {
            let item = {};
            item[key] = data[key];
            fields.push(item);
        }
    }

    if (fields.length === 0) {
        utils.invokeCallback(cb, null);
        return;
    }

    let cmds = [];
    let fieldKeys = [];
    fields.forEach(function (item) {
        for (let key in item) {
            let cmd = Account.getCmd(key);
            if (cmd) {
                fieldKeys.push(key);
                cmds.push([cmd, REDISKEY.getKey(key), id, redisDataParser.serializeValue(key, item[key])]);
            }
        }
    });

    redisConnector.cmd.multi(cmds).exec(function (err, result) {
        if (err) {
            logger.error('SET REDIS OPERATE ERROR:', err);
            let ERROR = Object.deepClone(ERROR_OBJ.DB_REDIS_ERR);
            utils.invokeCallback(cb, ERROR);
            return;
        }
        let syncfunc = EventHandler.genSyncFunc(id, fieldKeys);
        syncfunc();
        utils.invokeCallback(cb, null, result);
    });
}

function _setAccountAsync(id, data) {
    return new Promise(function (resolve, reject) {
        _setAccount(id, data, function (err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * 从redis缓存中获取用户数据
 * @param id
 * @param fields
 * @param cb
 */
function _getAccount(uid, fields, cb) {
    if (uid == null) {
        utils.invokeCallback(cb, ERROR_OBJ.PARAM_MISSING);
        return;
    }

    let all = false;
    if (typeof (fields) === 'function') {
        cb = fields;
        all = true;
    }

    if (!fields || fields.length == 0) {
        all = true;
    }

    _exist(uid, function (err) {
        if (err) {
            utils.invokeCallback(cb, err);
            return;
        }

        if (all || !!fields && fields.length > 1) {
            let cmds = [];
            let _fileds = null;
            if (all) {
                _fileds = Array.from(modelsUtil.PlayerModelFields);
            } else {
                _fileds = fields;
            }

            _fileds.forEach(function (item) {
                cmds.push(['hget', REDISKEY.getKey(item), uid]);
            });

            redisConnector.cmd.multi(cmds).exec(function (err, docs) {
                if (err) {
                    logger.error('GET MULTI REDIS OPERATE ERROR:', err);
                    let ERROR = Object.deepClone(ERROR_OBJ.DB_REDIS_ERR);
                    utils.invokeCallback(cb, ERROR);
                    return;
                }

                let account = new Account(uid);
                for (var i = 0; i < _fileds.length; ++i) {
                    account.appendValue(_fileds[i], docs[i]);
                }
                utils.invokeCallback(cb, null, account);
            });
        } else {
            redisConnector.cmd.hget(REDISKEY.getKey(fields[0]), uid, function (err, doc) {
                if (err) {
                    logger.error('GET REDIS OPERATE ERROR:', err);
                    let ERROR = Object.deepClone(ERROR_OBJ.DB_REDIS_ERR);
                    utils.invokeCallback(cb, ERROR);
                    return;
                }

                let account = new Account(uid);
                account.appendValue(fields[0], doc);
                utils.invokeCallback(cb, null, account);
            });
        }

    });

}

function _getAccountAsync(uid, fields) {
    return new Promise(function (resolve, reject) {
        _getAccount(uid, fields, function (err, account) {
            if (err) {
                reject(err);
            } else {
                resolve(account);
            }
        });
    });
}

/**
 * 嵌套执行hscan操作, 直到将hash表中所有玩家遍历完.
 * redisKey.getKey(redisKey.PLATFORM)
 */
function _getHashValueLimit(redisKey, skip, limit, op, finish) {
    redisConnector.cmd.hscan(redisKey, skip, 'COUNT', limit, function (err, res) {
        if (err) {
            utils.invokeCallback(finish, err);
            return;
        }
        let cursor = res[0];
        utils.invokeCallback(op, res[1], function nextCursor() {
            if (0 == cursor) {
                utils.invokeCallback(finish);
            } else {
                _getHashValueLimit(redisKey, cursor, limit, op, finish);
            }

        });
    });
}

/**
 * 嵌套执行hscan操作, 直到将hash表中所有玩家遍历完.
 * redisKey.getKey(redisKey.PLATFORM)
 */
function _getSetValueLimit(redisKey, skip, limit, op, finish) {
    redisConnector.cmd.sscan(redisKey, skip, 'COUNT', limit, function (err, res) {
        if (err) {
            utils.invokeCallback(op, err);
            return;
        }
        let cursor = res[0];
        utils.invokeCallback(op, res[1], function nextCursor() {
            if (0 == cursor) {
                utils.invokeCallback(finish, null);
            } else {
                _getSetValueLimit(redisKey, cursor, limit, op, finish);
            }
        });
    });
}


function _remSetValues(redisKey, members, cb) {
    let cmds = [];
    members.forEach(function (member) {
        cmds.push(['srem', redisKey, member.uid]);
    });

    let promise = new Promise(function (resolve, reject) {
        redisConnector.cmd.multi(cmds).exec(function (err, results) {
            if (err) {
                utils.invokeCallback(cb, err);
                resolve(results);
                return;
            }

            utils.invokeCallback(cb, null, results);
            resolve(results);
        });
    });

    return promise;
}


/**
 * 删除用户所有的缓存数据
 * @param uids
 * @param cb
 */
function _delAccount(uids, cb) {
    return new Promise(function (resolve, reject) {
        let cmds = [];
        uids.forEach(function (uid) {
            modelsUtil.PlayerModelFields.forEach(function (item) {
                cmds.push(['hdel', REDISKEY.getKey(item), uid]);
            });
        });

        redisConnector.cmd.multi(cmds).exec(function (err, result) {
            if (err) {
                utils.invokeCallback(cb, err);
                reject(err);
                return;
            }
            utils.invokeCallback(cb, null, result);
            resolve(result);
        });
    });
}

function _delRank(uids,cb) {
    return new Promise(function (resolve, reject) {
        let cmds = [];
        for (let platform of Object.values(REDISKEY.PLATFORM_TYPE)) {
            for(let i in REDISKEY.RANK) {
                cmds.push(['ZREM', `${REDISKEY.RANK[i]}:${platform}`, uids]);
            }
        }

        redisConnector.cmd.multi(cmds).exec(function (err, result) {
            if (err) {
                utils.invokeCallback(cb, err);
                reject(err);
                return;
            }
            utils.invokeCallback(cb, null, result);
            resolve(result);
        });
    });
}


function _genAccount(uid, data) {
    return Account.parse(uid, data);
}

function _multiAsync(cmds) {
    let promise = new Promise(function (resolve, reject) {
        if (0 == cmds.length) {
            resolve();
            return;
        }
        redisConnector.cmd.multi(cmds).exec(function (err, results) {
            if (err) {
                logger.error(`${this.taskId}执行_execRedisMulti玩家数据异常`, err);
                reject(err);
                return;
            }
            resolve(results);
        }.bind(this));
    });

    return promise;
}

function _oneCmdAsync(cmd) {
    let promise = new Promise(function (resolve, reject) {
        redisConnector.cmd.multi([cmd]).exec(function (err, results) {
            if (err) {
                logger.error(`${this.taskId}执行_execRedisMulti玩家数据异常`, err);
                reject(err);
                return;
            }
            resolve(results.length > 0 ? results[0] : null);
        }.bind(this));
    });

    return promise;
}

function _getRankLimit(key, skip, limit) {
    let promise = new Promise(function (resolve, reject) {
        redisConnector.cmd.zrevrange(key, skip, limit, 'WITHSCORES', function (err, results) {
            if (err) {
                reject(err);
                return;
            }
            resolve(results);
        });
    });

    return promise;
}


module.exports.Util = new Util();
module.exports.getAccount = _getAccount;
module.exports.getAccountAsync = _getAccountAsync;
module.exports.setAccount = _setAccount;
module.exports.setAccountAsync = _setAccountAsync;
module.exports.genAccount = _genAccount;
module.exports.delAccount = _delAccount;
module.exports.accountCheck = _exist;
module.exports.getHashValueLimit = _getHashValueLimit;
module.exports.remSetValues = _remSetValues;
module.exports.getSetValueLimit = _getSetValueLimit;
module.exports.multiAsync = _multiAsync;
module.exports.oneCmdAsync = _oneCmdAsync;
module.exports.getRankLimit = _getRankLimit;
module.exports.delRank = _delRank;