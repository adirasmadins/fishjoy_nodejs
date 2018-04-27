const BuzzUtil = require('../../src/utils/BuzzUtil');
const logicResponse = require('../../../common/logicResponse');

exports.get_bankruptcy_compensation = get_bankruptcy_compensation;

/**
 * 领取破产救济金.
 */
async function get_bankruptcy_compensation(data) {
    BuzzUtil.cacheLinkDataApi(data, "get_bankruptcy_compensation");

    return new Promise(function (resolve, reject) {
        myDao.getBankruptcyCompensation(data, function (err, rows) {
            if (err) {
                logger.error('领取破产补偿失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(rows[0]));
        });
    });

}