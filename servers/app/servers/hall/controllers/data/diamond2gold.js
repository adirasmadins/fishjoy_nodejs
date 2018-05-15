// //--[[
// description: 钻石兑换金币
// author: scott (liuwenming@chufengnet.com)
// date: 2018051
// ATTENTION：新开路由，调用原有接口
// //--]]

const logicResponse = require('../../../common/logicResponse');
const AccountUpdateGoldShopping = require('../../src/dao/account/update/gold_shopping');

exports.exchange = async function _updateAccount(data) {
    return new Promise(function(resolve, reject){
        AccountUpdateGoldShopping.update(data, function (err, results) {
            if (err) {
                logger.error('兑换失败 err:', err);
                reject(err);
                return;
            } 
            resolve(logicResponse.ask(results[0]));
        }, data.account);
    }); 
}

