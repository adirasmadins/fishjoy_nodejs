const redisKeys = require('../../models/redisKey');

class Statistics{

    //玩家活跃统计
    playerActive(uid){
        if(uid == null){
            return;
        }
        redisConnector.cmd.hset(redisKeys.LAST_ONLINE_TIME, uid, Date.now());
        redisConnector.cmd.sadd(redisKeys.ONLINE_UID_10_MINUTES, uid);
        redisConnector.cmd.sadd(redisKeys.ONLINE_UID_1_HOUR, uid);
        redisConnector.cmd.set(`${redisKeys.ONLINE_UID_RECENT_HOUR}:${uid}`, 1);
        redisConnector.cmd.expire(`${redisKeys.ONLINE_UID_RECENT_HOUR}:${uid}`, 3600);
    }

    //api调用统计
    playerApiOperateLog(uid, api){
        logBuilder.addLinkLog(uid, api);
    }
}

module.exports = new Statistics();