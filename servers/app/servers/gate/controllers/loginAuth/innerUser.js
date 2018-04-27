const WHITE_LIST = require('./white_list');
const crypto = require('crypto');
const async = require('async');
const User = require('./user');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const common = require('../../../hall/src/dao/account/common');
const {
    redisClient,
    mysqlClient
} = require('../../../../utils/dbclients');
const redisAccountSync = require('../../../../utils/redisAccountSync');
const logBuilder = require('../../../../utils/logSync/logBuilder');
const constDef = require('../../../../consts/constDef');
const {
    REDISKEY,
    KEYTYPEDEF
} = require('../../../../database').dbConsts;
const logger = require('omelo-logger').getLogger('gate', __filename);

function createSalt(pwd) {
    const hash = crypto.createHash('sha1');
    hash.update(pwd);
    return hash.digest('hex');
}

class InnerUser extends User {
    constructor(config) {
        super();
    }

    loginStatus(token) {}

    getUserInfo(data) {
        return data;
    }

    async isRegiste(data) {
        return await this._checkUserExist(data);
    }

    async registe(data) {
        let regData = data;
        regData.openid = data.username;
        regData.figure_url = data.figure_url || KEYTYPEDEF.OtherDef.figure_url.def;
        regData.city = data.city || KEYTYPEDEF.AccountDef.city.def;
        regData.saltPassword = createSalt(data.username + data.password);
        regData.channel = constDef.AUTH_CHANNEL_ID.INNER;
        regData.device = data.device;

        return await super.registe(regData);

    }

    async login(data) {
        let self = this;
        return new Promise(async function (resolve, reject) {
            let uid = await self.getUID(data.username);
            //TODO 临时方案
            // if (WHITE_LIST.indexOf(Number(uid)) == -1 && uid > 20) {
            //     reject(ERROR_OBJ.NOT_SUPPORT_SERVICE);
            //     return;
            // }
            if (!uid) {
                reject(ERROR_OBJ.USER_NOT_EXIST);
            }
            let account = await redisAccountSync.getAccountAsync(uid);

            if (account) {
                let saltPassword = createSalt(account.channel_account_id + data.password);
                if (saltPassword !== account.password) {
                    reject(ERROR_OBJ.USERNAME_PASSWORD_ERROR);
                    return;
                }

                logBuilder.addLoginLog(account.id, data.deviceId, data.ip);

                self._someOptAfterLogin(account, function (err, account) {
                    resolve(account);
                });
            } else {
                reject(ERROR_OBJ.USER_NOT_EXIST);
            }
        });
    }

    async bindPhone(data) {
        let uid = await this.getUID(data.phone);
        if (uid) {
            throw ERROR_OBJ.PHONE_EXIST;
        }

        let account = await redisAccountSync.getAccountAsync(data.uid);

        if (account) {
            if (account.phone) {
                throw ERROR_OBJ.USER_NOT_EXIST;
            } else {
                account.phone = data.phone;
                account.commit();
                return account;
            }
        } else {
            throw ERROR_OBJ.USER_NOT_EXIST;
        }
    }

    async modifyPassword(data) {
        let uid = await this.getUID(data.username);
        if (!uid) {
            throw ERROR_OBJ.USER_NOT_EXIST;
        }
        let account = await redisAccountSync.getAccountAsync(uid);
        if (account) {
            let oldSaltPassword = createSalt(account.channel_account_id + data.oldPassword);
            if (oldSaltPassword == account.password) {
                let newSaltPassword = createSalt(account.channel_account_id + data.newPassword);
                account.password = newSaltPassword;
                account.commit();
                return account;
            } else {
                throw ERROR_OBJ.PASSWORD_ERROR;
            }
        } else {
            throw ERROR_OBJ.USER_NOT_EXIST;
        }
    }

    async _chekcUsername(username) {
        return new Promise(function (resolve, reject) {
            let sql = `SELECT id FROM tbl_account WHERE channel_account_id=?`;
            let sqlData = [username];
            mysqlClient.query(sql, sqlData, function (err, result) {
                if (err) {
                    logger.error(err);
                    reject(err);
                }
                resolve(result && result[0] && result[0].id || null);
            });
        });
    }

    async _chekcPhone(phone) {
        return new Promise(function (resolve, reject) {
            let sql = `SELECT id FROM tbl_account WHERE phone=?`;
            let sqlData = [phone];
            mysqlClient.query(sql, sqlData, function (err, result) {
                if (err) {
                    logger.error(err);
                    reject(ERROR_OBJ.DB_ERR);
                    return;
                }
                resolve(result && result[0] && result[0].id || null);
            });
        });
    }

    _checkUserExist(data) {
        let self = this;
        return new Promise(function (resolve, reject) {
            redisClient.cmd.hget(REDISKEY.OPENID_UID, data.username, async function (err, uid) {
                if (err) {
                    logger.error(err);
                    reject(ERROR_OBJ.DB_ERR);
                    return;
                }

                if (uid) {
                    resolve(ERROR_OBJ.USERNAME_EXIST);
                    return;
                }

                if (!uid) {
                    uid = await self._chekcUsername(data.username);
                    if (uid) {
                        reject(ERROR_OBJ.USERNAME_EXIST);
                        return;
                    }
                }

                resolve(false);
            });
        });
    }

    getUID(username) {
        let self = this;
        return new Promise(function (resolve, reject) {
            redisClient.cmd.hget(REDISKEY.OPENID_UID, username, async function (err, uid) {
                if (err) {
                    reject(ERROR_OBJ.DB_ERR);
                    return;
                }
                if (!uid) {
                    uid = await self._chekcUsername(username);
                    if (!uid) {
                        resolve(null);
                    } else {
                        async.waterfall([function (cb) {
                            common.getAccountById(mysqlClient, uid, cb);
                        }, function (result, cb) {
                            redisClient.cmd.hset(REDISKEY.OPENID_UID, username, uid, cb);
                        }], function (err, result) {
                            if (err) {
                                reject(ERROR_OBJ.DB_ERR);
                            } else {
                                resolve(uid);
                            }
                        });
                    }
                } else {
                    resolve(uid);
                }
            });
        });
    }


}

module.exports = InnerUser;