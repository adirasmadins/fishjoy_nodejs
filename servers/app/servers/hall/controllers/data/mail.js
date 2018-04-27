const logicResponse = require('../../../common/logicResponse');
const dao_mail = require('../../src/dao/dao_mail');
exports.mailList = mailList;

async function mailList(data) {
    return new Promise(function(resolve, reject){
        dao_mail.mailList(data,  function(err, mail_box) {
            if(err){
                logger.error('获取邮件列表失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(mail_box));
        });
    });
}

