const buzz_recieve = require('../../src/buzz/buzz_recieve');
const logicResponse = require('../../../common/logicResponse');


exports.turntableDraw = turntableDraw;
exports.changeInKind = changeInKind;
exports.getCikInfo = getCikInfo;
exports.getCikLog = getCikLog;
exports.cancelCik = cancelCik;
exports.buyVipGift = buyVipGift;
exports.vipDailyReward = vipDailyReward;

async function turntableDraw(data) {
    return new Promise(function (resolve, reject) {
        buzz_recieve.turntableDraw(data, function (err, result) {
            if (err) {
                logger.error('转盘抽奖 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function changeInKind(data) {
    return new Promise(function (resolve, reject) {
        buzz_recieve.changeInKind(data, function (err, result) {
            if (err) {
                logger.error('实物兑换 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function getCikInfo(data) {
    return new Promise(function (resolve, reject) {
        buzz_recieve.getCikInfo(data, function (err, result) {
            if (err) {
                logger.error('获取实物兑换信息 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function getCikLog(data) {
    return new Promise(function (resolve, reject) {
        buzz_recieve.getCikLog(data, function (err, result) {
            if (err) {
                logger.error('获取实物兑换的日志信息 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function cancelCik(data) {
    return new Promise(function (resolve, reject) {
        buzz_recieve.cancelCik(data, function (err, result) {
            if (err) {
                logger.error('取消实物订单 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function buyVipGift(data) {
    return new Promise(function (resolve, reject) {
        buzz_recieve.buyVipGift(data, function (err, result) {
            if (err) {
                logger.error('购买VIP礼包 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function vipDailyReward(data) {
    return new Promise(function (resolve, reject) {
        buzz_recieve.vipDailyReward(data, function (err, result) {
            if (err) {
                logger.error('领取VIP每日奖励 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}