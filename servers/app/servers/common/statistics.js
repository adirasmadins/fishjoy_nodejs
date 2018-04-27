const redisKeys = require('../../database/consts/redisKey');
const redisClient = require('../../utils/dbclients').redisClient;

class Statistics{

    //玩家活跃统计
    playerActive(uid){
        if(uid == null){
            return;
        }
        redisClient.cmd.hset(redisKeys.LAST_ONLINE_TIME, uid, Date.now());
        redisClient.cmd.sadd(redisKeys.ONLINE_UID_10_MINUTES, uid);
        redisClient.cmd.sadd(redisKeys.ONLINE_UID_1_HOUR, uid);
        redisClient.cmd.set(`${redisKeys.ONLINE_UID_RECENT_HOUR}:${uid}`, 1);
        redisClient.cmd.expire(`${redisKeys.ONLINE_UID_RECENT_HOUR}:${uid}`, 3600);
    }

    //api调用统计
    playerApiOperateLog(uid, api){
        logBuilder.addLinkLog(uid, api);
    }
}

module.exports = new Statistics();