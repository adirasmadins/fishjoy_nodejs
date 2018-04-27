const Broadcast = require('./Broadcast');
const REDISKEY = require('../../database').dbConsts.REDISKEY;

/**
 * 抽奖公告类
 */
class DrawBroadcast extends Broadcast {
    constructor(account, content) {
        super(account, content);
        this.eventType = REDISKEY.CH.BROADCAST_DRAW;
    }
}

module.exports = DrawBroadcast
