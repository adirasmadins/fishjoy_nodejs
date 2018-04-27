const logicResponse = require('../../../common/logicResponse');
const dao_draw = require('../../src/dao/dao_draw');
exports.getDraw = getDraw;

/**
 * 抽取奖励(可抽取一次，也可以抽取十次)
 */
async function getDraw(data) {
    return new Promise(function(resolve, reject){
        dao_draw.getDraw(data, function (err, ret) {
            if(err){
                logger.error('抽奖失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(ret));
        });
    });
}

