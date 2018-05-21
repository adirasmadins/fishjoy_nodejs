const ROOM_TYPE = {
    SINGLE: 1, //单人模式
    MULTI_FREE: 2, //多人自由模式
    GODDESS: 3, //保卫女神模式
    ARENA_MATCH: 4, //1v1竞技模式
    RANK_MATCH: 5,//排位赛模式
};

const ROOM_PLAYER_MAX = {};
ROOM_PLAYER_MAX[ROOM_TYPE.SINGLE] = 1;
ROOM_PLAYER_MAX[ROOM_TYPE.MULTI_FREE] = 4;
ROOM_PLAYER_MAX[ROOM_TYPE.GODDESS] = 1;
ROOM_PLAYER_MAX[ROOM_TYPE.ARENA_MATCH] = 2;
ROOM_PLAYER_MAX[ROOM_TYPE.RANK_MATCH] = 2;

module.exports = {
    ROOM_TYPE: ROOM_TYPE,
    ROOM_PLAYER_MAX: ROOM_PLAYER_MAX,

    PLAYER_TYPE:{
        GODDESS:1,
        FISH:2,
        MATCH_FISH:3,
        RANK_MATCH:4,
        ARENA_MATCH:5,
    },

    SKILL_ID: {
        SK_FREEZ: 1, //冰冻技能,与表对应，可能不连续，下同
        SK_AIM: 2, //锁定自动瞄准技能
        SK_CALL: 3, //召唤技能
        SK_LASER: 4, //激光
        SK_NBOMB0: 8, //青铜弹头
        SK_NBOMB1: 9, //白银弹头
        SK_NBOMB2: 10, //黄金弹头
    },

    GOD_PROPERTY_ID: {
        lv1: 1, //水族馆养鱼上限+ x
        lv2: 2, //解锁微笑表情
        lv3: 3, //解锁害羞表情
        lv4: 4, //解锁卖萌表情
        lv5: 5, //解锁缠绵表情
        lv6: 6, //同系鱼产出间隔降低x%秒
        lv7: 7, //同系鱼产出量增加x次
        lv8: 8, //锁定技能持续时长提高x%
        lv9: 9, //冰冻技能持续时长提高x%
        lv10: 10, //捕鱼获得升级经验提高x%
        lv11: 11, //激光累积速度提高x%
        lv12: 12, //钻石购买金币量提高x%
    },

    WP_SKIN_ID: {
        HUOPAO: 1,// 火炮
        EMO: 2,// 恶魔之血
        TIANSHI: 3,// 天使之眼
        DIANCHIPAO: 4,// GX770电磁炮
        RONGYAN: 5,// 熔岩巨炮
        HAMA: 6,// 蛤蟆文太
        LIMING: 7,// 星舰·黎明
        PAOPAOTANG: 8,// 泡泡膛
        JIATELIN: 9,// 黄金加特林
        GULANG: 10,// 星舰·孤狼
        DIANWAN: 11,// 电玩精英
        SHUANG: 12,// 霜之哀伤
        CHIYANNVSHEN: 13,// 赤炎女神的诅咒
        YUELIANGTU: 14,// 月亮兔
        JIAN20: 15,// 歼20战机
    },

    FIGHTING_NOTIFY: {
        WP_SKIN: 0, //切换武器皮肤
        MINI_GAME: 1, //小游戏
        TURN_DRAW: 2, //奖金鱼抽奖
        RMATCH_STATE: 3, //排位赛标记,0开始，1结束
        RMATCH_NB: 4, //排位赛核弹与否，0取消 1使用
    },

    FIRE_FLAG: {
        NORMAL: 0, //普通命中
        LIGHTING: 1, //鱼闪电技能命中
        BOMB: 2, //鱼炸弹技能命中
        NBOMB: 3, //被核弹打中
        LASER: 4, //被激光打中
    },

    RMATCH_STATE: {
        READY: 0, //准备中,3秒倒计时
        NB_USED: 1,//使用核弹 
        NB_CANCEL: 2,//取消核弹 
    },

    FLUSH_EVENT: Symbol('flushFish'),
    RMATCH_EVENT: Symbol('rmatchEvt'),
    
    ENTITY_TYPE: {
        PLAYER: 0, //玩家
        ROBOT: 1 //普通机器人
    },

    MATCH_ROOM_STATE: {
        WAIT: 1, //等待
        DOING: 2, //比赛中
        OVER: 3, //结束
    },

    RMATCH_ROBOT_OPT: {
        WEAPON_CHANGE: 0, //切换武器
        FIGHTING: 1, //普通开炮
        USE_NBOMB: 2, //使用核弹
        CANCEL_NBOMB: 3, //取消核弹
        RANDOM_CHAT: 4, //随机聊天
        PROVOCATIVE: 5, //魅惑
    },

    /** 首胜宝箱状态 */
    BOX_STAT: {
        /** 时间未到不可用 */
        WAIT: 0,
        /** 时间已到未获取 */
        NULL: 1,
        /** 已获取还未领取, 领取后才会将状态设置为0 */
        GOT: 2,
    },

    BROADCAST_TYPE: {
        SERVER: 1,
        GAME_EVENT: 2,
        FAMOUS_ONLINE: 3,
        DRAW: 4,
    },

    GAME_EVENT_TYPE: {
        BOSS_KILL: 1,
        WEAPON_UPGRADE: 2,
        SKIN_GOT: 3,
        TOOL_GOT: 4,
        GOLDFISH_DRAW: 5,
        GODDESS_UNLOCK: 6,
        GODDESS_UPGRADE: 7,
        GODDESS_CHALLENGE: 8,
        DRAW_REWARD: 9,
        VICTORS: 10,
    },

    CHAT_TYPE: {
        TXT: 0, //文本
        PIC: 1, //图片
        SOUND: 2, //音频
    },

    CHEAT_FLAG: {
        NO_SKIN: -100, //使用没有的皮肤开炮而作弊, 注意作弊标记都是小于0，下同
        NO_WP_LEVEL: -101, //使用当前场景不允许的等级开炮而作弊
        NO_CLONE: -102, //使用不具备反弹特性武器开出反弹特性子弹而作弊
        NO_GOLD: -103, //金币收支比(gain/cost)比值超出限制1而作弊
        NO_GOLD2: -104, //金币收支比(gain/cost)比值超出限制2而作弊
        NO_GOLD3: -105, //最近一千炮都无消耗而作弊
    },

    MINI_TYPE: {
        COIN_CATCHING: 0, //接金币
        CRAZY_FUGU: 1, //疯狂的河豚
    }

};