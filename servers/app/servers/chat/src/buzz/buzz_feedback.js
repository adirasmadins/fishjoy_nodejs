const CommonUtil = require('../../../hall/src/buzz/CommonUtil');
const REDISKEY = require('../../../../models/index').REDISKEY;
const feedback = require('./feedback');
const redisAccountSync = require('../../../../utils/redisAccountSync');


exports.playerPropose = playerPropose;
exports.queryMsgboard = queryMsgboard;
exports.likeMsgboard = likeMsgboard;
exports.delMsgboard = delMsgboard;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 接收玩家发来的一条留言
 * token, text
 */
function playerPropose(dataObj, cb) {

    if (!lPrepare(dataObj)) return;

    // 插入数据到CachePropose
    let uid = dataObj.token.split("_")[0];
    let text = dataObj.text;

    redisConnector.cmd.hget(REDISKEY.TALK_FORBIDDEN, uid, function (err, res) {
        if (err) {
            logger.error(err);
            cb();
            return;
        }
        if (res == 1) {
            cb({code: 112312, msg: "你已经被禁言了,请联系管理员"});
        } else {
            feedback.insertMsg(uid, text, function (err, res) {
                cb(err, res);
            });
        }
    });

    function lPrepare(input) {
        return _checkParams(input, ['token', 'text'], "buzz_feedback", cb);
    }
}

/**
 * 客户端拉取留言板内容.
 * token, timestamp, count, hot4
 */
function queryMsgboard(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    let request_uid = dataObj.token.split("_")[0];
    let timestamp = dataObj.timestamp || 0;
    let count = dataObj.count;
    let hot4 = dataObj.hot4;
    feedback.getMsg(request_uid, timestamp, count, hot4, function (err, res) {
        if (err) {
            cb(err);
            logger.error(err);
            return;
        }
        cb(null, res);
    });

    function lPrepare(input) {
        return _checkParams(input, ['token', 'count'], "buzz_feedback", cb);
    }
}

/**
 * 玩家点赞.
 * token, mid
 */
function likeMsgboard(dataObj, cb) {

    if (!lPrepare(dataObj)) return;

    let uid = dataObj.token.split("_")[0];
    let mid = dataObj.mid;

    let ret = feedback.likeMsg(mid, uid);

    cb(ret);

    function lPrepare(input) {
        return _checkParams(input, ['token', 'mid'], "buzz_feedback", cb);
    }
}

/**
 * 刪除留言.
 * token, mid
 */
function delMsgboard(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    let uid = dataObj.token.split("_")[0];
    let mid = dataObj.mid;

    redisAccountSync.getAccount(uid, ['msgboard_mgmt'], function (err, account) {
        if (err) {
            return;
        }
        if (account && account.msgboard_mgmt == 1) {
            feedback.delMsg(mid);
            cb(mid);
        } else {
            cb(-1);
        }
    });

    function lPrepare(input) {
        return _checkParams(input, ['token', 'mid'], "buzz_feedback", cb);
    }
}

function _checkParams(input, params, hint, cb) {
    for (let i = 0; i < params.length; i++) {
        let param_name = params[i];
        let param = input[params[i]];
        if (!CommonUtil.isParamExist(hint, param, "接口调用请传参数" + param_name, cb)) return false;
    }
    return true;
}