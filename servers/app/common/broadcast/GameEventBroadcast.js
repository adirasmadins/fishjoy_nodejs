const Broadcast = require('./Broadcast');
const REDISKEY = require('../../database').dbConsts.REDISKEY;

/**
 * 游戏事件公告类
 */
class GameEventBroadcast extends Broadcast {
    constructor(account, content) {
        super(account, content)
        this.eventType = REDISKEY.CH.BROADCAST_GAME_EVENT
    }
}

module.exports = GameEventBroadcast
