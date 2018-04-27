const logicResponse = require('../../../common/logicResponse');
const dao_mail = require('../../src/dao/dao_mail');
exports.readMail = readMail;

async function readMail(data) {
    return new Promise(function(resolve, reject){
        dao_mail.readMail( data,  function(err, results) {
            if(err){
                logger.error('领取邮件奖励失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(results));
        });
    });
}

