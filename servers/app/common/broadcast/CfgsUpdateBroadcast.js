const Broadcast = require('./Broadcast');
const REDISKEY = require('../../database').dbConsts.REDISKEY;

/**
 * 配置文件更新公告类.
 * 使用方法: new CfgsUpdateBroadcast(content).add();
 */
class CfgsUpdateBroadcast extends Broadcast {
    constructor(content) {
        super(content);
        this.eventType = REDISKEY.CH.BROADCAST_CFGS_UPDATE;
    }
}

module.exports = CfgsUpdateBroadcast;