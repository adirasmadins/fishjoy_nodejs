const BuzzUtil = require('../../src/utils/BuzzUtil');
const logicResponse = require('../../../common/logicResponse');
const buzz_reward = require('../../src/buzz/buzz_reward');
const buzz_charts = require('../../src/buzz/buzz_charts');
const buzz_gift = require('../../src/buzz/buzz_gift');
const RewardModel = require('../../../../utils/account/RewardModel');

exports.monthSign = monthSign;
exports.get_day_reward = get_day_reward;
exports.get_bankruptcy_compensation = get_bankruptcy_compensation;
exports.get_online_time = get_online_time;

exports.guideReward = guideReward;
exports.dailyReward = dailyReward;
exports.missionReward = missionReward;
exports.activeReward = activeReward;
exports.onekeyReward = onekeyReward;
exports.getUserRank = getUserRank;
exports.getChartReward = getChartReward;

exports.getAdReward = getAdReward;
exports.getAdRewardTimes = getAdRewardTimes;
exports.missionInfo = missionInfo;
exports.get_day_extra_reward = get_day_extra_reward;

/**
 * 查询本月的可签到状态.
 */
async function monthSign(data) {
    return new Promise(function (resolve, reject) {
        buzz_reward.monthSign(data, function (err, result) {
            if (err) {
                logger.error('查询本月的可签到状态 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

/**
 * 领取每日奖励
 */
async  function get_day_reward(data) {
    return new Promise(function (resolve, reject) {
        buzz_reward.getDayReward(data, function (err, result) {
            if (err) {
                logger.error('领取每日奖励 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function get_day_extra_reward(data){
    return new Promise(function(resolve,reject){
        buzz_reward.getDayExtraReward(data,function(err,result){
            if(err){
                logger.error("领取签到额外奖励失败:",err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

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

/**
 * 获取在线时长.
 */
async function get_online_time(data) {
    BuzzUtil.cacheLinkDataApi(data, "get_online_time");

    return new Promise(function (resolve, reject) {
        myDao.getOnlineTime(data, function (err, rows) {
            if (err) {
                logger.error('获取在线时间失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(rows[0]));
        });
    });
}

async function guideReward(data) {
    return new Promise(function (resolve, reject) {
        buzz_reward.guideReward(data, function (err, result) {
            if (err) {
                logger.error('完成强制教学领奖 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function dailyReward(data) {
    return new Promise(function (resolve, reject) {
        buzz_reward.dailyReward(data, function (err, result) {
            if (err) {
                logger.error('日常领奖 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function missionReward(data) {

    return new Promise(function (resolve, reject) {
        buzz_reward.missionReward(data, function (err, result) {
            if (err) {
                logger.error('任务领奖 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function missionInfo(data) {
    let taskProcessInfo = await RewardModel.getMissionTaskProcessInfo(data.account);
    return logicResponse.ask(taskProcessInfo);
}

async function activeReward(data) {
    return new Promise(function (resolve, reject) {
        buzz_reward.activeReward(data, function (err, result) {
            if (err) {
                logger.error('活跃领奖 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function onekeyReward(data) {
    return new Promise(function (resolve, reject) {
        buzz_reward.onekeyReward({pool:mysqlConnector}, data, function (err, result) {
            if (err) {
                logger.error('一键领取 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function getUserRank(data) {
    return new Promise(function (resolve, reject) {
        buzz_charts.getUserRank(data, function (err, result) {
            if (err) {
                logger.error('获取玩家历史排行榜信息 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function getChartReward(data) {
    return new Promise(function (resolve, reject) {
        buzz_charts.getChartReward(data, function (err, result) {
            if (err) {
                logger.error('获取玩家排行榜奖励 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function getAdReward(data) {
    return new Promise(function (resolve, reject) {
        buzz_gift.getAdReward(data, function (err, result) {
            if (err) {
                logger.error('获取观看广告的奖励 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function getAdRewardTimes(data) {
    return new Promise(function (resolve, reject) {
        buzz_gift.getAdRewardTimes(data, function (err, result) {
            if (err) {
                logger.error('获取玩家今日领取观看广告奖励的次数 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

