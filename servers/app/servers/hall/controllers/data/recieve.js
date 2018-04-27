const buzz_recieve = require('../../src/buzz/buzz_recieve');
const logicResponse = require('../../../common/logicResponse');

exports.packMix = packMix;
exports.queryCik = queryCik;
exports.weaponUp = weaponUp;
exports.buyVipGift = buyVipGift;
exports.vipDailyReward = vipDailyReward;


async function packMix(data) {
    return new Promise(function (resolve, reject) {
        buzz_recieve.packMix(data, function (err, result) {
            if (err) {
                logger.error('背包合成 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function weaponUp(data) {
    return new Promise(function (resolve, reject) {
        buzz_recieve.weaponUp(data, function (err, result) {
            if (err) {
                logger.error('武器升级 err:', err);
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

//----------------------------------------------------------

async function queryCik() {
    return new Promise(function (resolve, reject) {
        buzz_recieve.queryCik(function (err, result) {
            if (err) {
                logger.error('实物查询 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}