const Broadcast = require('./Broadcast');
const REDISKEY = require('../../database').dbConsts.REDISKEY;

/**
 * 抽奖公告类
 * 使用方法: new DrawBroadcast(content).extra(account).add();
 */
class DrawBroadcast extends Broadcast {
    constructor(content) {
        super(content);
        this.eventType = REDISKEY.CH.BROADCAST_DRAW;
    }
}

module.exports = DrawBroadcast;
