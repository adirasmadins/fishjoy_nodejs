const buzz_update = require('../../src/buzz/buzz_update');

const logicResponse = require('../../../common/logicResponse');
exports.updateAccount = _updateAccount;

/**
 * 创建CD-KEY
 */
async function _updateAccount(data) {
    return new Promise(function(resolve, reject){
        buzz_update.updateAccount(data, function (err, results) {
            if (err) {
                logger.error('更新账户数据失败 err:', err);
                reject(err);
                return;
            } 
            resolve(logicResponse.ask(results[0]));
        });
    }); 
}

