var _ = require('underscore');

/**
MailReward = 
{
    uid: bigint,
    mid: bigint,
    reward: text,
    log_at: timestamp,
}
 */
var gMailRewardLogCache = [];

exports.push = push;
exports.cache = cache;
exports.length = length;

/**
 * 检测gMailRewardLogCache长度, 超过11000条数据时将前面的10000条写入数据库中
 */
function push(data) {
    gMailRewardLogCache.push(data);
}

/**
 * 将gMailRewardLogCache全部写入数据库中
 */
function cache() {
    return gMailRewardLogCache;
}

/**
 * 将gMailRewardLogCache全部写入数据库中
 */
function length() {
    return gMailRewardLogCache.length;
}
