const buzz_cst_game = require('../../src/buzz/cst/buzz_cst_game');
const logicResponse = require('../../../common/logicResponse');

exports.get_broadcast = get_broadcast;

/**
 * 获取公告
 */
async function get_broadcast(data) {
    return new Promise(function(resolve, reject){
        buzz_cst_game.getBroadcast(data, function (err, gameBroadcast) {
            if(err){
                logger.error('返回公告数据失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(gameBroadcast));
        });
    });

}