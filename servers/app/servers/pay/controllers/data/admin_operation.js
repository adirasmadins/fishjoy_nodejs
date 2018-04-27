const buzz_operation = require('../../src/buzz/buzz_operation');
const logicResponse = require('../../../common/logicResponse');

exports.buyCard = buyCard;

/**
 * 提现
 */
async function buyCard(data) {
    return new Promise(function(resolve, reject){
        buzz_operation.buyCard(data, function (err, account) {
            if(err){
                logger.error('使用CD-KEY失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(account));
        });
    });
}