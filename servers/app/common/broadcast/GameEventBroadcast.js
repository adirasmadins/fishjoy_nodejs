const Broadcast = require('./Broadcast');
const REDISKEY = require('../../database').dbConsts.REDISKEY;

/**
 * 游戏事件公告类.
 * 使用方法: new GameEventBroadcast(content).extra(account).add();
 */
class GameEventBroadcast extends Broadcast {
    constructor(content) {
        super(content);
        this.eventType = REDISKEY.CH.BROADCAST_GAME_EVENT;
    }
}

module.exports = GameEventBroadcast;
