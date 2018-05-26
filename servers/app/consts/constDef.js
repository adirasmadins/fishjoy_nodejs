module.exports = {
    PALYER_STATE: {
        OFFLINE: 0,
        ONLINE: 1
    },
    CACHE_DATA_TYPE: {
        PUMPWATER: 1, //系统抽水系数变化
        PLATFORM_CATCHRATE: 2, //平台捕获率变化
    },
    SERVER_PERIOD: {
        GENERAL: 0, //普通周期
        OUT_SCORE: 1,//出分周期
        EATE_SCORE: 2, //吃分周期
    },

    //用户授权渠道ID定义
    AUTH_CHANNEL_ID: {
        TEST: 1000,
        EGRET: 1001,
        WANBA: 1002,
        FACEBOOK: 1003,
        GOOGLE: 1004,
        INNER: 1005,
        COCO: 1006,
        WECHAT:1007,
    },

    //支付渠道ID定义
    PAY_CHANNEL_ID: {
        LOCALPAY: 1000,//开发测试
        EGRETPAY: 1001, //白鹭支付
        WANBAPAY: 1002, //玩吧支付
        IOSPAY: 1003, //IOS支付
        WECHATPAY: 1004, //微信支付
        ALIPAY: 1005, //支付宝
        VIETNAMPAY: 1006, //越南支付
        VIETNAM_VNPAY: 1007, //越南VN支付
        GOOGLEPAY: 1008, //谷歌支付
        COCOPAY: 1009, //Coco支付
        VIETNAM_VN_TESTPAY: 1010, //越南VN支付
    },

    HTTP_CACHE_TIME: 86400, //http最大缓存时间
    GAME_INTER_PAY_ORDER_ID: -1, //游戏内购，无需创建订单

    WORLD_CHANNEL_NAME: {
        BARRAGE: 'barrage', //弹幕
    },

    GLOBAL_STATUS_DATA_TYPE: {
        PLAYER_GAME_POS: {
            name: 'player_game_pos',
            type: 'object'
        },
        PLAYER_RANKMATCH_POS: {
            name: 'player_rankmatch_pos',
            type: 'object'
        }
    },

    MATCH: {
        MATCH_AI_INTERVAL: 3600000, //比赛机器人数据产生周期
        MATE_INTERVAL: 1000, //比赛匹配周期
        MATE_TIMEOUT: 10000, //匹配超时时间，超时则分配机器人
        FIRE: 100, //排位赛100炮
        MSECONDS: 3 * 60 * 1000, //倒计时3分钟，单位毫秒
    },

    ARENA_MATCH_STATE:{
        CREATED: 1,
        GOING: 2,
        FINISHED: 3
    },

    FRIENDS_ONLINE_LAST_MINUTES: 2,   //好友在线判断时间段范围（10分钟内在线即为在线）

    RANK_TYPE: {
        MATCH: 3,   //排位赛排行榜
        GODDESS: 4,  //保卫女神排行榜
        PETFISH: 5, //宠物鱼
        CHARM: 6,  //魅力值排行榜
        BP: 7,    //捕鱼积分排行榜(渔王争霸)
        FLOWER: 8,  //鲜花排行榜
    },

    MSG_TYPE: {
        PRIVATE_MSG: 0,
        WORLD_MSG: 1,
        FRIEND_REQUEST: 2,  //好友请求
        BROADCAST: 3,
        CONFIG_CHANGE: 4
    },

    PLATFORM_TYPE: {
        ANDROID: 1,
        IOS: 2
    },

    SEX:{
        MALE:0,
        FEMALE:1
    },

};