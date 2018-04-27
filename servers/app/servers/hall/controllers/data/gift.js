const buzz_gift = require('../../src/buzz/buzz_gift');
const logicResponse = require('../../../common/logicResponse');

exports.getAdvGift = getAdvGift;

/**
 * 获取光告礼包.
 */
async function getAdvGift(data) {
    return new Promise(function (resolve, reject) {
        buzz_gift.getAdvGift(data, function (err, results) {
            if (err) {
                logger.error('广告礼包获取失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(results));
        });
    });
}


//==============================================================================
// private
//==============================================================================
