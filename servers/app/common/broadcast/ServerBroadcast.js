const tools = require('../../utils/tools');
const Broadcast = require('./Broadcast');
const REDISKEY = require('../../database').dbConsts.REDISKEY;

/**
 * 全服公告类.
 * 使用方法: new ServerBroadcast(content).extra(id),add();
 */
class ServerBroadcast extends Broadcast {
    constructor(content) {
        super(content);
        this.eventType = REDISKEY.CH.BROADCAST_SERVER;
    }

    extra(id) {
        this.value.id = id ? id : tools.ObjUtil.createSalt();
        return this;
    }

    add() {
        super.add();
        // 全服通告需要记录到Redis中
        tools.RedisUtil.hset(REDISKEY.PLATFORM_DATA.SERVER_BROADCAST, this.value.id, this.message);
    }
}

module.exports = ServerBroadcast;