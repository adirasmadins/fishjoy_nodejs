const buzz_social = require('../../src/buzz/buzz_social');
const logicResponse = require('../../../common/logicResponse');

exports.getInviteProgress = getInviteProgress;
exports.getShareStatus = getShareStatus;
exports.getEnshrineStatus = getEnshrineStatus;
exports.inviteSuccess = inviteSuccess;
exports.shareSuccess = shareSuccess;
exports.enshrineSuccess = enshrineSuccess;
exports.getSocialReward = getSocialReward;
exports.getFriendsCharts = getFriendsCharts;
exports.inviteDaily = inviteDaily;
exports.getFreeCard = getFreeCard;
exports.getFreeBomb = getFreeBomb;

/**
 * 获取好友排行榜.
 */
async function getFriendsCharts(data) {
    return new Promise(function (resolve, reject) {
        buzz_social.getFriendsCharts(data, function (err, result) {
            if (err) {
                logger.error('获取好友排行榜 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

/**
 * 获取好友邀请进度.
 */
async function getInviteProgress(data) {
    return new Promise(function (resolve, reject) {
        buzz_social.getInviteProgress(data, function (err, result) {
            if (err) {
                logger.error('获取好友邀请进度 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

/**
 * 获取好友分享状态.
 */
async function getShareStatus(data) {
    return new Promise(function (resolve, reject) {
        buzz_social.getShareStatus(data, function (err, result) {
            if (err) {
                logger.error('获取好友分享状态 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

/**
 * 获取收藏状态.
 */
async function getEnshrineStatus(data) {
    return new Promise(function (resolve, reject) {
        buzz_social.getEnshrineStatus(data, function (err, result) {
            if (err) {
                logger.error('获取收藏状态 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

/**
 * 邀请好友.
 */
async function inviteSuccess(data) {
    return new Promise(function (resolve, reject) {
        buzz_social.inviteSuccess(data, function (err, result) {
            if (err) {
                logger.error('邀请好友 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

/**
 * 每日首次邀请好友记录.
 */
async function inviteDaily(data, cb) {
    return new Promise(function (resolve, reject) {
        buzz_social.inviteDaily({ pool: mysqlConnector }, data, function (err, result) {
            if (err) {
                logger.error('首次邀请好友记录 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

/**
 * 分享记录.
 */
async function shareSuccess(data) {
    return new Promise(function (resolve, reject) {
        buzz_social.shareSuccess(data, function (err, result) {
            if (err) {
                logger.error('分享记录 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

/**
 * 社交奖励领取.
 */
async function getSocialReward(data) {
    return new Promise(function (resolve, reject) {
        buzz_social.getSocialReward(data, function (err, result) {
            if (err) {
                logger.error('社交奖励领取 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

/**
 * 快捷方式相关(创建, 领取奖励).
 */
async function enshrineSuccess(data) {
    return new Promise(function (resolve, reject) {
        buzz_social.enshrineSuccess(data, function (err, result) {
            if (err) {
                logger.error('快捷方式相关 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function getFreeCard(data) {
    return new Promise(function (resolve, reject) {
        buzz_social.getFreeCard(data, function (err, result) {
            if (err) {
                logger.error("免费开通周卡月卡失败:", err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function getFreeBomb(data) {
    return new Promise(function (resolve, reject) {
        buzz_social.getFreeBomb(data, function (err, result) {
            if (err) {
                logger.error("查询免费核弹失败:", err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}