const RedisUtil = require('../utils/RedisUtil');
const dao_reward = require('../dao/dao_reward');

exports.getReward = getReward;
exports.cost = cost;
exports.getRewardInfo = getRewardInfo;

/**
 * 验证用户有效性
 */
function getReward(account, reward, cb) {

    // 制作一个data数据.
    let data = {
        account: account,
        reward: reward
    };

    dao_reward.getCommonReward(data, cb);
}

/**
 * 验证用户有效性
 */
function cost(account, reward, cb) {

    // 制作一个data数据.
    let data = {
        account: account,
        reward: reward
    };

    dao_reward.costCommon(data, cb);
}

function getRewardInfo(account, redis_key, cb) {
    let uid = account.id;
    RedisUtil.hget(redis_key, uid, function (err, res) {
        if (err) {
            cb(err);
            return;
        }
        if (res) {
            res = JSON.parse(res);
        }
        cb(null, res);
    });

}