const buzz_info = require('../../src/buzz/buzz_info');
const logicResponse = require('../../../common/logicResponse');
const redisAccountSync = require('../../../../utils/redisAccountSync');

exports.getHuafeiquan = getHuafeiquan;

/**
 * 获取话费券数量.
 */
async function getHuafeiquan(data) {
    return new Promise(function (resolve, reject) {
        buzz_info.getHuafeiquan(data, function (err, result) {
            if (err) {
                logger.error('getHuafeiquan err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}


/**
 * 查询玩家使用的喇叭和收到的鲜花
 * 注意是收到的鲜花，不是当前鲜花总量
 */
exports.getHornFlower = async function (data) {
    return new Promise(function (resolve, reject) {
        buzz_info.getHornFlower( data, function (err, result) {
            if (err) {
                logger.error('获取喇叭、鲜花数量 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
};

/**
 * 查询指定某个道具剩余过期时间
 */
exports.getItemLimitTime = async function (data) {
    return new Promise(function (resolve, reject) {
        buzz_info.getItemLimitTime(data, function (err, result) {
            if (err) {
                logger.error('获取限时道具剩余时间 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
};

/**
 * 查询玩家限时道具获得时间
 */
exports.getItemLimitGotTime = async function (data) {
    return new Promise(function (resolve, reject) {
        buzz_info.getItemLimitGotTime(data, function (err, result) {
            if (err) {
                logger.error('获取玩家限时道具获得时间 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
};

exports.queryAccountFields = async function (data) {
    return new Promise(function (resolve, reject) {
        redisAccountSync.getAccount(data.uid, data.fields, function (err, account) {
            if (err) {
                reject(err);
                return;
            }
            resolve(logicResponse.ask(account.toJSON()));
        });
    });
};

exports.openRank = async function (data) {
    return new Promise(function (resolve, reject) {
        redisAccountSync.getAccount(data.uid, ['privacy'], function (err, account) {
            if (err) {
                reject(err);
                return;
            }
            account.privacy = 1;
            account.commit();
            resolve(logicResponse.ask(account.toJSON()));
        });
    });
};


