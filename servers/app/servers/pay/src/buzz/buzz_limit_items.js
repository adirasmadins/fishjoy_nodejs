const RedisUtil = require('../utils/RedisUtil');
const CacheAccount = require('./cache/CacheAccount');
const item_item_cfg = require('../../../../utils/imports').DESIGN_CFG.item_item_cfg;

const LIMIT_ITEM_HK = 'limit_item_at:uid:';
let LIMIT_ITEM_IDS = []; //限时道具id
for (let k in item_item_cfg) {
    let cfg = item_item_cfg[k];
    let ltype = cfg.lengthtype;
    if (ltype === 1 || ltype === 2) {
        LIMIT_ITEM_IDS.push(k);
    }
}

exports.setItemGetAt = setItemGetAt;
exports.clearLimitItem = clearLimitItem;
exports.checkItemLimitEnd = checkItemLimitEnd;
exports.getLimitLeft = getLimitLeft;
exports.checkItemLimitEndWithItemId = checkItemLimitEndWithItemId;

/**
 * 限时道具获得时间，方便计算过期时间
 */
function setItemGetAt(account, reward) {
    if (reward) {
        let cmds = [];
        let ts = {};
        const HK = LIMIT_ITEM_HK;
        checkItemLimitEnd(account, function (res) {
            if (res) {
                for (let k in res) {
                    let pk = HK + k;
                    ts[pk] = res[k];
                }
            }

            for (let i = 0; i < reward.length; i++) {
                let tw = reward[i];
                let itemId = tw[0];
                let itemNum = tw[1];
                let IT_CFG = item_item_cfg[itemId];
                if (IT_CFG) {
                    let ltype = IT_CFG.lengthtype;
                    if (ltype === 1 || ltype === 2) {
                        let pk = HK + itemId;
                        if (!ts[pk]) {
                            ts[pk] = [];
                        }
                        let tsp = ts[pk];
                        logger.error('-itemId - itemId = ', itemId);
                        if (ltype === 2 && tsp.length > 0) {
                            tsp[0][1] += itemNum; //天类型，则同一天的记录为一项多个
                            logger.error('-再次获得 = ', itemNum);
                        }else {
                            let now = new Date().getTime();
                            let td = [now, itemNum];//领取时间戳、该时间领取的数量
                            tsp.push(td);
                            logger.error('-第一次获得 = ', itemNum);
                        }
                    }
                }
            }
            let uid = account.id;
            for (let k in ts) {
                let temp = ts[k];
                if (temp.length > 0) {
                    let val = JSON.stringify(temp);
                    let tt = ['hset', k, uid, val];
                    cmds.push(tt);
                }
            }
            if (cmds.length > 0) {
                RedisUtil.multi(cmds, function (err, result) {
                    if (err) {
                        logger.error('限时道具获得时间批量写入失败！');
                    }
                });
            }
        });
    }
}

/**
 * 检查玩家所有限时道具是否到期,并及时清理
 */
function checkItemLimitEnd(account, cb) {
    let cmds = [];
    let ids = [];
    let uid = account.id;
    for (let i = 0; i < LIMIT_ITEM_IDS.length; i++) {
        let itemId = LIMIT_ITEM_IDS[i];
        let pk = LIMIT_ITEM_HK + itemId;
        let temp = ['hget', pk, uid];
        cmds.push(temp);
        ids.push(itemId);
    }
    _checkItemLimitEnd(account, cmds, ids, cb);
}

/**
 * 检查单个道具是否过期
 */
function checkItemLimitEndWithItemId(account, itemId, cb) {
    let cmds = [];
    let ids = [];
    let uid = account.id;
    let pk = LIMIT_ITEM_HK + itemId;
    let temp = ['hget', pk, uid];
    cmds.push(temp);
    ids.push(itemId);
    _checkItemLimitEnd(account, cmds, ids, cb);
}

/**
 * 批量检查限时道具是否到期,并及时清理
 */
function _checkItemLimitEnd(account, cmds, ids, cb) {
    if (cmds.length > 0) {
        let uid = account.id;
        RedisUtil.multi(cmds, function (err, result) {
            if (err) {
                logger.error('限时道具领取时间批量读取失败！');
                cb && cb(null);
            } else {
                if (result) {
                    let ret = {};
                    let clear = {};
                    for (let i = 0; i < result.length; i++) {
                        let one = result[i];
                        if (one) {
                            let itemId = ids[i];
                            let td = JSON.parse(one);
                            let newData = [];
                            for (let j = 0; j < td.length; j++) {
                                let info = td[j];
                                let at = info[0];//获得时间
                                //判定该获得是否过期，过期则筛选出数据，待剔除
                                let left = _getItemLimitLeft(itemId, at);
                                if (left <= 0) {
                                    if (!clear[itemId]) {
                                        clear[itemId] = [];
                                    }
                                    clear[itemId].push(info);
                                } else {
                                    newData.push(info);
                                }
                            }
                            if (newData.length > 0) {
                                ret[itemId] = newData;
                            }
                        }
                    }
                    //剔除过期，重写剩余值
                    if (clear && Object.keys(clear).length > 0) {
                        let curPackage = account.package;
                        let isDone = false;
                        let ncmds = [];
                        for (let k in clear) {
                            let itemId = k;
                            let val = ret[itemId];
                            let pk = LIMIT_ITEM_HK + itemId;
                            if (val) {
                                val = JSON.stringify(val);
                                let temp = ['hset', pk, uid, val];
                                ncmds.push(temp);
                            } else {
                                RedisUtil.hdel(pk, uid, function (err, res) {
                                    if (err) {
                                        logger.error('---删除失败！', pk, uid);
                                    }
                                });
                            }
                            let IT_CFG = item_item_cfg[itemId];
                            if (IT_CFG) {
                                let infos = clear[k];
                                let itc = 0;
                                for (let i = 0; i < infos.length; i++) {
                                    let tf = infos[i];
                                    let num = tf[1]; //该时间获得的数量
                                    itc += num;
                                }
                                let tp = curPackage[IT_CFG.type];
                                if (tp) {
                                    tp[itemId] -= itc;
                                    if (tp[itemId] < 0) {
                                        tp[itemId] = 0;
                                    }
                                    isDone = true;
                                }
                            }
                        }
                        if (isDone) {
                            //重写背包
                            CacheAccount.setPack(uid, curPackage);
                        }
                        if (ncmds.length > 0) {
                            RedisUtil.multi(ncmds, function (err, result) {
                                if (err) {
                                    logger.error('限时道具过期筛选结果批量写入失败！');
                                }
                            });
                        }
                    }
                    //返回查询结果
                    cb && cb(ret);
                } else {
                    cb && cb(null);
                }
            }
        });
    } else {
        cb && cb(null);
    }
}

/**
 * 某个道具限时剩余时间
 */
function _getItemLimitLeft(itemId, gotAt) {
    let IT_CFG = item_item_cfg[itemId];
    if (!IT_CFG) {
        return -3;
    }
    let ltype = IT_CFG.lengthtype;
    if (ltype !== 1 && ltype !== 2) {
        return -1;
    }
    let lengthtime = IT_CFG.lengthtime; //过期时长，单位秒
    if (ltype === 2) {
        //将天数转换成秒,减去领取时距离第二天0点已过的秒数
        lengthtime = lengthtime * 24 * 60 * 60;
        let theDate = new Date(gotAt);
        let hours = theDate.getHours();
        let minutes = theDate.getMinutes();
        let sec = theDate.getSeconds();
        let from0Seconds = hours * 60 * 60 + minutes * 60 + sec;
        lengthtime -= from0Seconds;
    }
    lengthtime *= 1000;//最终成毫秒

    let now = new Date().getTime();
    let pass = now - gotAt;
    if (pass >= -60000) {
        pass = Math.ceil(pass);
        let left = lengthtime - pass;
        if (left <= 0) {
            left = 0;
        }
        return left;
    } else {
        return -2;
    }
}

/**
 * 限时剩余时间，非限时道具返回-1，0标识已过期，>0 即剩余时间，单位毫秒;-2时间戳有误;-3不存在
 */
function getLimitLeft(uid, itemId, gotAt, cb) {
    let left = _getItemLimitLeft(itemId, gotAt);
    if (left < 0) {
        cb && cb(left);
        return;
    }
    let pk = LIMIT_ITEM_HK + itemId;
    RedisUtil.hget(pk, uid, function (err, ret) {
        if (ret) {
            ret = JSON.parse(ret);
            let isExist = false;
            if (ret && ret.length > 0) {
                for (let i = 0; i < ret.length; i++) {
                    let td = ret[i];
                    if (td[0] == gotAt) {
                        isExist = true;
                        break;
                    }
                }
            }
            if (isExist) {
                cb && cb(left);
            } else {
                cb && cb(-3);
            }
        } else {
            cb && cb(0);
        }
    });
}

/**
 * 剔除限时道具
 */
function clearLimitItem (uid, itemId, clearCount, doneFunc) {
    let pk = LIMIT_ITEM_HK + itemId;
    RedisUtil.hget(pk, uid, function (err, ret) {
        if (ret) {
            ret = JSON.parse(ret);
            let newData = [];
            let doneC = 0;
            logger.error('clearLimitItem ret = ', ret);
            for (let i = 0; i < ret.length; i ++) {
                let td = ret[i];
                let isChanged = false;
                let at = td[0];
                let ownCount = td[1];
                ownCount -= clearCount;
                if (ownCount < 0) {
                    ownCount = 0;
                }
                isChanged = ownCount == 0; //数量为0，则直接剔除
                td[1] = ownCount;
                doneC ++;
                if (!isChanged) {
                    newData.push(td);
                }
            }
            if (!doneC) {
                doneFunc && doneFunc();
                return;
            }
            if (newData.length > 0) {
                newData = JSON.stringify(newData);
                RedisUtil.hset(pk, uid, newData, function (err, res) {
                    if (err) {
                        logger.error('剔除失败！', pk, uid);
                    }else{
                        logger.info("----剔除done!");
                    }
                    doneFunc && doneFunc();
                });
            }else{
                RedisUtil.hdel(pk, uid, function (err, ret) {
                    if (err) {
                        logger.error('---剔除至0，删除失败！', pk, uid);
                    }else{
                        logger.info("---剔除至0，删除done!");
                    }
                    doneFunc && doneFunc();
                });
            }
        }else{
            doneFunc && doneFunc();
        }
    });
}