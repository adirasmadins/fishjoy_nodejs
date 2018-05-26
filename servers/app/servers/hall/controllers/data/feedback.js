const buzz_banUser = require('../../src/buzz/buzz_banUser');
const logicResponse = require('../../../common/logicResponse');

exports.banUser = banUser;

/**
 * 封号.
 * token, uid_list
 */
async function banUser(data) {
    return new Promise(function(resolve, reject){
        buzz_banUser.banUser(data, function (err, result) {
            if(err){
                logger.error('玩家封号 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}