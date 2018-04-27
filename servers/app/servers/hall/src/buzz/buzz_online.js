const RedisUtil = require('../utils/RedisUtil');
const redisKeys = require('../../../../database').dbConsts.REDISKEY;

exports.isOnline = isOnline;

function isOnline(id,cb) {
    RedisUtil.hget(redisKeys.LAST_ONLINE_TIME, id, function (err, result) {
        if (err) {
            cb(err);
            return;
        }
        let now = new Date().getTime();
        let last_online_time = parseInt(result);
        cb(null,now - last_online_time < 120000);
    });
}