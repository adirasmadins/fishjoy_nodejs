////////////////////////////////////////////////////////////////////////////////
// CD-KEY Operation
// 生成CD-KEY, 玩家使用CD-KEY兑换礼品
// generate
// use

const logicResponse = require('../../../common/logicResponse');
const dao_cdkey = require('../../src/dao/dao_cdkey');

exports.use = use;

/**
 * 使用CD-KEY
 */
async function use(data) {
    return new Promise(function(resolve, reject){
        dao_cdkey.use(data, function (err, account) {
            if(err){
                logger.error('使用CD-KEY失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(account));
        });
    });
}


