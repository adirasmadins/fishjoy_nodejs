module.exports = {
    ROBOT: {
        VACANCY_QUERY_TIMEOUT: 1000, //空位查询周期
        FIRE_TIMEOUT: 500, //开火周期
        WEAPON_LEVEL_RANDOM: [-3, 8], //武器等级浮动范围
        ROLE_LEVEL_RANDOM: [-10, 20], //角色等级浮动范围
        GOLD_DEFAULT: 500000, //金币默认值
        PEARL_DEFAULT: 100, //钻石默认值
        GOLD_RANDOM: [-20, 100], //金币浮动范围
        GOLD_STEP: 50000, //金币浮动步长
        PEARL_RANDOM: [-10, 20], //钻石浮动范围
        PEARL_STEP: 100, //钻石浮动步长
        EXP_DEFAULT: 100, //默认经验值
        VIP_DEFAULT: 1, //默认vip
        JOIN_TIMEOUT: 100000, //单位(秒:ms)
    },
    PLAYER: {
        OFFLINE_TIMEOUT: 120000,//离线玩家踢出游戏超时时间，单位(秒:ms)
        KICK_OFFLINE_CHECK_TIMEOUT: 10000 //离线玩家超时踢出检查周期 单位(秒:ms)
    },
    MATCH: {
        MATCH_AI_INTERVAL: 3600000, //比赛机器人数据产生周期
        MATE_INTERVAL: 1000, //比赛匹配周期
        MATE_TIMEOUT: 10000, //匹配超时时间，超时则分配机器人
        FIRE: 100, //排位赛100炮
        MSECONDS: 180000, //倒计时3分钟，单位毫秒
    },

    ARENA: {
        FIRE: 100, //1v1对战200炮
        START_COUNTDOWN: 120000, //单位ms
        PK_DURATION: 120000, //PK持续时间单位ms
        TICK_DT: 200, //事件轮训周期单位ms
        MATCH_STATE: {
            CREATED: 1,
            GOING: 2,
            FINISHED: 3
        },

        GEN_MATCH_ID: function (roomId, uid) {
            return `${roomId}-${uid}-${Date.now()}`;
        },
        STORE_MODE:{
            ASYNC:1,
            SYNC:2,
        }
    }
};