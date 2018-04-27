const BuzzUtil = require('../utils/BuzzUtil');
const RedisUtil = require('../utils/RedisUtil');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const CacheAccount = require('./cache/CacheAccount');
const CacheAccountServer = require('./cache/CacheAccountServer');
const DaoCommon = require('../dao/dao_common');
const redisKeys = require('../../../../database').dbConsts.REDISKEY;
const dao_account_server = require('../dao/dao_account_server');


const TAG = "【buzz_account】";

exports.check = check;
exports.getAccountByToken = getAccountByToken;
exports.banUser = banUser;

/**
 * 对玩家施行封号操作
 */
function banUser(dataObj, cb) {
    const FUNC = TAG + "banUser() --- ";

    if (!lPrepare(dataObj)) return;
    let admin_account=dataObj.account;
    let uid=dataObj.uid;
    let uid_list = dataObj.uid_list;
    let isAdmin = admin_account.msgboard_mgmt;
    if (!isAdmin) {
        admin_account.test = -1;
        admin_account.commit();
        _removeRank([uid]);
        logger.error(FUNC + "玩家" + uid + "被封号, 原因: 不是管理员调用封号接口");
        cb && cb(ERROR_OBJ.PLAYER_CHEAT);
        let nickname = admin_account.nickname;
        logBanUser(uid, nickname, uid_list, "fail, reason: not an admin");
    }else {
        _banUser(dataObj, cb);
    }

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'uid_list'], "buzz_account.banUser", cb);
    }

}

function logBanUser(admin_uid, nickname, uid_list, comment) {
    const FUNC = TAG + "logBanUser() --- ";

    let value = {
        admin_uid: admin_uid,
        nickname: nickname,
        uid_list: uid_list,
        comment: comment,
        timestamp: new Date().getTime(),
    };
    value = JSON.stringify(value);
    RedisUtil.rpush(redisKeys.LOG.BAN_USER, value, function (err, res) {
        if (err) {
            logger.error(FUNC + "Redis设置失败, err:", err);
        }
        else {
            logger.info(FUNC + "Redis设置成功, res:", res);
        }
    });
}

function _removeRank(uids) {
    let rank_key = {
        GOLD: "rank:gold",
        ACHIEVE: "rank:achieve",
        GODDESS: "rank:goddess",
        MATCH: "rank:match",
        AQUARIUM: "rank:aquarium",
        CHARM: "rank:charm",
        BP: "rank:bp",
        FLOWER: "rank:flower",
    };
    for(let key in rank_key){
        _delPlayerRankData(`${rank_key[key]}:1`, uids);
        _delPlayerRankData(`${rank_key[key]}:2`, uids);
    }
}

function _delPlayerRankData(key, uids){
    RedisUtil.zrem(key, uids, function(err, result){
        logger.info('-------------------', result);
        if(err){
            logger.error('清空玩家排行榜信息失败');
            return;
        }
        logger.info('移除玩家排行信息ok,玩家列表:', uids, '排行类型:', key);
    });
}

function _banUser(dataObj, cb) {
    const FUNC = TAG + "_banUser() --- ";
    let admin_uid = dataObj.uid;
    let account = dataObj.account;
    let uid_list = dataObj.uid_list;
    uid_list = uid_list.split(',');

    if (uid_list.length > 0) {
        for (let i = 0; i < uid_list.length; i++) {
            CacheAccount.setTest(uid_list[i], -1);
        }
        // 删除排行榜
        _removeRank(uid_list);
        logger.info(FUNC + "如下玩家被封号:", uid_list);
        cb && cb(null, "success");
        let nickname = account.nickname;
        logBanUser(admin_uid, nickname, uid_list, "success");
    }
    else {
        logger.info(FUNC + "do nothing...");
        cb && cb(ERROR_OBJ.PARAM_MISSING);
    }
}

/**
 * 验证用户有效性
 */
function check(data, cb) {

    let token = data["token"];
    
    if (token == null) {
        cb(ERROR_OBJ.TOKEN_NULL);
        return;
    }
    
    // 用户token数据进缓存, 读取缓存, 如果没有就读取数据库并存入缓存
    let account_id = _getIdByToken(token);
    
    if (account_id == null) {
        cb(ERROR_OBJ.TOKEN_FORMAT_ERR);
        return;
    }

    if (!_checkCache(account_id, token, cb)) return;

    _checkDb(token, function (err, account) {
        cb(err, account);
    });

}

/**
 * 通过用户的token信息来获取玩家账户信息.
 */
function getAccountByToken(req, token, cb) {

    const FUNC = TAG + "getAccountByToken() --- ";
    
    if (token == null) {
        cb(ERROR_OBJ.TOKEN_NULL);
        return;
    }
    let uid = _getIdByToken(token);

    CacheAccount.getAccountById(uid, function (err, account) {
        if(err || !account){
            cb && cb(ERROR_OBJ.ACCOUNT_NULL);
            return;
        }

        if (account.token == token) {
            cb(null, account);
        }
        else {
            logger.error(FUNC + "token与客户端不匹配");
            if (account.token == "daily_reset") {
                logger.error(FUNC + "服务器跨天更新token");
                cb(ERROR_OBJ.DAILY_RESET);// 1013
            }
            else if (account.token == "server_update") {
                logger.error(FUNC + "服务器更新重启");
                cb(ERROR_OBJ.SERVER_UPDATE);// 1012
            }
            else {
                logger.error(FUNC + "token:", token);
                logger.error(FUNC + "account.token:", account.token);
                logger.error(FUNC + "玩家账号在其他地方登录");
                cb(ERROR_OBJ.TOKEN_INVALID);//1011
            }
        }
    });

}


//==============================================================================
// private
//==============================================================================

function _getIdByToken(token) {
    let arr = token.split("_");
    if (arr.length != 2) {
        return null;
    }
    return arr[0];
}

// 缓存中验证玩家token.
function _checkCache(account_id, token, cb) {
    const FUNC = TAG + "_checkCache() --- ";
    CacheAccount.getAccountById(account_id, function (err, account) {
        if (!account || account.token != token) {
            logger.error(FUNC + "玩家token错误, 请重新登录更新");
            logger.error(FUNC + "缓存token:", CacheAccount.getToken(account_id));
            logger.error(FUNC + "参数token:", token);
            cb(ERROR_OBJ.TOKEN_INVALID);
            return;// 验证完毕, 返回
        }
        cb(null, account);
    });

}

// 数据库中验证玩家token.
function _checkDb(token, cb) {
    myDao.getAccountByToken(token, function (err, results) {
        if (err) {
            logger.error("在数据库中查找token失败");
            cb(ERROR_OBJ.DB_ERR);
            return;
        }
        if (results.length == 0) {
            logger.error("玩家token未在数据库中查找到");
            cb(ERROR_OBJ.TOKEN_INVALID);
            return;
        }
        // 用户数据进缓存
        let account = results[0];
        CacheAccount.push(account);
        cb(err, account);
    });
}