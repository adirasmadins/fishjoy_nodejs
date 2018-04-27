const data_util = require('./data_util');
const buzz_account = require('../../src/buzz/buzz_account');
const buzz_cst_game = require('../../src/buzz/cst/buzz_cst_game');
const logicResponse = require('../../../common/logicResponse');

const TAG = "【data/feedback】";

exports.banUser = banUser;

/**
 * 封号.
 * token, uid_list
 */
async function banUser(data) {
    return new Promise(function(resolve, reject){
        buzz_account.banUser(data, function (err, result) {
            if(err){
                logger.error('玩家封号 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

/**
 * 解析请求中的数据格式.
 * @param req 请求对象.
 * @param hint 提示信息.
 */
function _parseDataObj(req, hint) {
    let dataObj = {};

    try {
        dataObj = buzz_cst_game.getDataObj(req.body.data, req.body.aes);
    }
    catch (json_parse_err) {
        logger.error("msg:", hint + "失败(json解析错误)");
        logger.error("err:", json_parse_err);
    }

    return dataObj;
}