const tools = require('../../utils/tools');
const REDISKEY = require('../../database').dbConsts.REDISKEY;

/**
 * 公告类, 完成公告的相关操作
 */
class Broadcast {
    constructor(account, content) {
        this.content = content
        this.eventType = REDISKEY.CH.BROADCAST_GAME_EVENT
        this.content.txt = ''
        this.content.times = 1
        this.content.platform = account.platform
        this.content.uid = account.id
    }

    add() {
        let value = {
            content: this.content,
            timestamp: (new Date()).valueOf(),
        }

        // logger.error('------------------------------------------发布公告');
        redisConnector.pub(
            this.eventType,
            JSON.stringify(value)
        )
    }
}

module.exports = Broadcast

Broadcast.TYPE = {
    GAME_EVENT: {
        BOSS_KILL: 1,
        WEAPON_UPGRADE: 2,
        SKIN_GOT: 3,
        TOOL_GOT: 4,
        GOLDFISH_DRAW: 5,
        GODDESS_UNLOCK: 6,
        GODDESS_UPGRADE: 7,
        GODDESS_CHALLENGE: 8,//女神通关公告
        DRAW_REWARD: 9, //抽奖
        VICTORS: 10, //连胜公告(DONE)
        GUERDON: 11, //打赏

        FIRST_RECHARGE: 12, //首充(DONE)
        COLLECTION: 13, //收藏(DONE)
        MONTH_CARD: 14, //月卡(DONE)
        MONTH_CARD1: 15, //月卡豪(DONE)
        VIP_GIFT: 16, //vip礼包(DONE)
        SEASON_REWARD: 17,//赛季奖励(DONE)
        GODDESS_REWARD: 18,//女神周奖励(rank<=30)(DONE)
        RANK_FIRST: 19, //每日第一名奖励(DONE)
        SEASON_BOX: 20,//打排位赛获得超级和史诗宝箱(treasureid=12|13)(DONE)
        SEASON_END: 21, //排位赛终结别人5连胜以上的(DONE)
        NOTIFY_CHANGE_CARD: 22, //提现话费卡订单生成成功发公告(DONE)
        MONTH_CARD2: 23, //周卡(DONE)
    },
    FAMOUS_ONLINE: {
        GOLD: 1,        // 金币最多
        ACHIEVE: 2,     // 成就最高
        COMPETITION: 3, // 最强王者
        CHARM: 4        // 万人迷
    },
    DRAW: {
        UNKNOWN: 0,     // 金币抽奖
        GOLD: 1,        // 金币抽奖
        PEARL: 2,       // 钻石抽奖
        SKIN: 3,        // 武器碎片抽奖
    },
}
