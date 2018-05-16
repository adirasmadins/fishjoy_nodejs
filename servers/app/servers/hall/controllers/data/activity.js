const logicResponse = require('../../../common/logicResponse');
const dao_activity = require('../../src/dao/dao_activity');
const buzz_newbie = require('../../src/buzz/buzz_newbie');

exports.showMeActivity = showMeActivity;
exports.getReward = getReward;

// 新手狂欢
exports.getNewbieInfo = getNewbieInfo;
exports.syncMissionProgress = syncMissionProgress;
exports.getNewbieReward = getNewbieReward;

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

////////////////////////////////////////////////////////////
// 新手狂欢
////////////////////////////////////////////////////////////

/**
 * 获取新手狂欢信息
 */
async function getNewbieInfo(data) {
    return new Promise(function(resolve, reject){
        buzz_newbie.getNewbieInfo(data, function (err, account) {
            if(err){
                logger.error('getReward err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(account));
        });
    }); 
}

/**
 * 同步新手狂欢进度数据
 */
async function syncMissionProgress(data) {
    return new Promise(function(resolve, reject){
        buzz_newbie.syncMissionProgress(data, function (err, account) {
            if(err){
                logger.error('getReward err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(account));
        });
    }); 
}

/**
 * 获取新手狂欢奖励
 */
async function getNewbieReward(data) {
    return new Promise(function(resolve, reject){
        buzz_newbie.getNewbieReward(data, function (err, account) {
            if(err){
                logger.error('getReward err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(account));
        });
    }); 
}

