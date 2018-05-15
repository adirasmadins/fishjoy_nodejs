const Broadcast = require('./Broadcast');
const REDISKEY = require('../../database').dbConsts.REDISKEY;

/**
 * 名人上线公告类.
 * 使用方法: new FamousOnlineBroadcast(content).extra(account).add();
 */
class FamousOnlineBroadcast extends Broadcast {
    constructor(content) {
        super(content);
        this.eventType = REDISKEY.CH.BROADCAST_FAMOUS_ONLINE;
    }
}

module.exports = FamousOnlineBroadcast;