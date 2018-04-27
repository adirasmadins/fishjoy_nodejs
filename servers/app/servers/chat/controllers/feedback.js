const buzz_feedback = require('../src/buzz/buzz_feedback');

const logicResponse = require('../../common/logicResponse');

exports.playerPropose = playerPropose;
exports.queryMsgboard = queryMsgboard;
exports.likeMsgboard = likeMsgboard;
exports.delMsgboard = delMsgboard;

/**
 * 玩家建议.
 */
async function playerPropose(data) {
    return new Promise(function(resolve, reject){
        buzz_feedback.playerPropose(data, function(err, propose) {
            if(err){
                logger.error('留言失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(propose));
        });
    });
}

/**
 * 客户端拉取留言板内容.
 */
async function queryMsgboard(data) {
    return new Promise(function(resolve, reject){
        buzz_feedback.queryMsgboard(data, function(err, ret) {
            if(err){
                logger.error('拉取留言板内容 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(ret));
        });
    });
}

/**
 * 玩家点赞.
 */
async function likeMsgboard(data) {
    return new Promise(function(resolve, reject){
        buzz_feedback.likeMsgboard(data, function(ret) {
            resolve(logicResponse.ask(ret));
        });
    });
}

/**
 * 刪除留言.
 * token, mid
 */
async function delMsgboard(data) {
    return new Promise(function(resolve, reject){
        buzz_feedback.delMsgboard(data, function(ret) {
            if (ret == -1) {
                logger.error('刪除留言失败');
                reject('刪除留言失败');
                return;
            }
            resolve(logicResponse.ask(ret));
        });
    });
}