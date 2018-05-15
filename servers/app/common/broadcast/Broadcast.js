const REDISKEY = require('../../database').dbConsts.REDISKEY;

/**
 * 公告类, 完成公告的相关操作
 */
class Broadcast {
    constructor(content) {
        this.content = content;
        this.eventType = REDISKEY.CH.BROADCAST_GAME_EVENT;
        this.content.txt = this.content.txt ? this.content.txt : '';
        this.content.times = this.content.times ? this.content.times : 1;
        this.value = {};
    }

    extra(account) {
        this.content.platform = account.platform;
        this.content.uid = account.id;
        return this;
    }

    add() {
        this.value.content = this.content;
        this.value.timestamp = (new Date()).valueOf();

        // logger.error('------------------------------------------发布公告');
        this.message = JSON.stringify(this.value);
        redisConnector.pub(this.eventType, this.message);
    }
}

module.exports = Broadcast;

Broadcast.TYPE = {
    GAME_EVENT: {
        BOSS_KILL: 1,           // 杀死BOSS
        WEAPON_UPGRADE: 2,      // 武器升级
        SKIN_GOT: 3,            // 得到技能
        TOOL_GOT: 4,            // 得到道具
        GOLDFISH_DRAW: 5,       // 奖金鱼抽奖
        GODDESS_UNLOCK: 6,      // 女神解锁
        GODDESS_UPGRADE: 7,     // 女神升级
        GODDESS_CHALLENGE: 8,   // 女神通关公告
        DRAW_REWARD: 9,         // 抽奖
        VICTORS: 10,            // 连胜公告
        GUERDON: 11,            // 打赏
        FIRST_RECHARGE: 12,     // 首充
        COLLECTION: 13,         // 收藏
        MONTH_CARD: 14,         // 月卡
        MONTH_CARD1: 15,        // 月卡豪
        VIP_GIFT: 16,           // vip礼包
        SEASON_REWARD: 17,      // 赛季奖励
        GODDESS_REWARD: 18,     // 女神周奖励(rank<=30)
        RANK_FIRST: 19,         // 每日第一名奖励
        SEASON_BOX: 20,         // 打排位赛获得超级和史诗宝箱(treasureid=12|13)
        SEASON_END: 21,         // 排位赛终结别人5连胜以上的
        NOTIFY_CHANGE_CARD: 22, // 提现话费卡订单生成成功发公告
        MONTH_CARD2: 23,        // 周卡
        CFGS_CHANGED: 24,       // 配置文件更新
        GODDESS_JUMP: 25,       // 女神跳关，碾压第一名
    },
    FAMOUS_ONLINE: {
        GOLD: 1,        // 金币最多
        ACHIEVE: 2,     // 成就最高
        MATCH: 3,       // 最强王者
        CHARM: 4,       // 万人迷
        GODDESS: 5,     // 保卫女神
        AQUARIUM: 6,    // 水族馆
    },
    DRAW: {
        UNKNOWN: 0,     // 金币抽奖
        GOLD: 1,        // 金币抽奖
        PEARL: 2,       // 钻石抽奖
        SKIN: 3,        // 武器碎片抽奖
    },
    CFGS_UPDATE: {
        UNKNOWN: 0,     // 未知文件
    },
};
