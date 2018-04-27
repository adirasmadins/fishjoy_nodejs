const logicResponse = require('../../../common/logicResponse');
const dao_activity = require('../../src/dao/dao_activity');

exports.showMeActivity = showMeActivity;
exports.getReward = getReward;

/**
 * 显示所有活动列表
 */
async function showMeActivity(data) {
    return new Promise(function(resolve, reject){
        dao_activity.showMeActivity(data, function (err, results) {
            if(err){
                logger.error('showMeActivity err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(results));
        });
    }); 
}

/**
 * 获取活动奖励
 */
async function getReward(data) {
    return new Promise(function(resolve, reject){
        dao_activity.getReward(data, function (err, account) {
            if(err){
                logger.error('getReward err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(account));
        });
    }); 
}

