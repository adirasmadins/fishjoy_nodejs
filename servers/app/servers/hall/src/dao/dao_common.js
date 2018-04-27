const CstError = require('../../../../consts/fish_error');
const DaoAccountCommon = require('./account/common');
const CacheAccount = require('../buzz/cache/CacheAccount');
const async = require('async');
const StringUtil = require('../utils/StringUtil');
const utils = require('../utils/utils');
const ERROR_OBJ = CstError.ERROR_OBJ;


let ERROR = 1;
let DEBUG = 0;

const TAG = "【dao_common】";

exports.checkAccount = checkAccount;
exports.handleError = handleError;
exports.checkAccountById = checkAccountById;

exports.getAccount = getAccount;



function checkTest(test, server_token, uid, cb) {
    const FUNC = TAG + "checkTest() --- ";
    if (server_token && StringUtil.endsWith(server_token, "cheat")) {
        if (ERROR) logger.error(FUNC + "Token显示玩家作弊");
        cb && cb(ERROR_OBJ.TOKEN_INVALID);// 1001
        return false;
    }
    if (test == -1) {
        if (ERROR) logger.error(FUNC + "玩家作弊被封号:" + uid);
        let token = uid + "_cheat";
        CacheAccount.setToken(uid, token);
        cb && cb(ERROR_OBJ.PLAYER_CHEAT);
        return false;
    }
    return true;
}

function checkToken(server_token, token) {
    let FUNC = 'checkToken';

    if (server_token == "daily_reset") {
        if (ERROR) logger.error(FUNC + "服务器跨天更新token");
        // cb && cb(ERROR_OBJ.DAILY_RESET);// 1013
        return false;
    }
    if (server_token == "server_update") {
        if (ERROR) logger.error(FUNC + "服务器更新重启");
        // cb && cb(ERROR_OBJ.SERVER_UPDATE);// 1012
        return false;
    }
    if (server_token != token) {
        if (ERROR) logger.error(FUNC + "Token过期");
        if (ERROR) logger.error(FUNC + "client_token:", token);
        if (ERROR) logger.error(FUNC + "server_token:", server_token);
        // cb && cb(ERROR_OBJ.TOKEN_INVALID);// 1001
        return false;
    }
    return true;
}

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
function checkAccount(pool, token, cb) {
    let uid = token.split("_")[0];
    CacheAccount.getAccountById(uid, function (err, account) {
        cb(err, account);
    });
}

/**
 * 后台获取玩家信息
 */
function getAccount(pool, uid, cb) {
    const FUNC = TAG + "getAccount() --- ";

    logger.info(FUNC + "updateSingleValue()uid:", uid);
    async.waterfall([function (_cb) {
        CacheAccount.getAccountById(uid, _cb);
    }, function (account, _cb) {
        if (!account) {
            DaoAccountCommon.getAccountByUid(pool, uid, function(err, account) {
                if (err) {
                    if (ERROR) logger.error(FUNC + "数据库读写错误");
                    _cb(ERROR_OBJ.DB_ERR);
                    return;
                }
                logger.info(FUNC + "updateSingleValue()玩家数据来自数据库:", uid);
                _cb(null, account);
            });
        }
        else {
            logger.info(FUNC + "updateSingleValue()玩家数据来自缓存:", uid);
            _cb(null, account);
        }
    }], function(err, account) {
        if(err){
            utils.invokeCallback(cb, err, null);
        }
        else{
            utils.invokeCallback(cb,null, account);
        }
    });
}

/**
 * 通过id查询用户信息
 * @param pool
 * @param id
 * @param cb
 */
function checkAccountById(pool, uid, cb) {
    const FUNC = TAG + "checkAccountById() --- ";
    DaoAccountCommon.getAccountByUid(pool, uid, function (err, account) {
        if (err) {
            if (ERROR) logger.error(FUNC + "数据库读写错误");
            cb(ERROR_OBJ.DB_ERR);
            return;
        }
        if (DEBUG)logger.info(FUNC + "玩家数据来自数据库:", uid);
        cb(null, account);
    });
}

/**
 * 处理错误信息: 如果出现错误，则在服务器log中输出并调用回调
 * @err Error 错误对象
 * @cb Function 回调函数
 */
function handleError(err, cb) {
    if (err) {
        logger.info(JSON.stringify(err));
        cb(err);
    }
    return err;
}