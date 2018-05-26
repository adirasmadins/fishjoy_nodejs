const PREFIX = 'pair:uid:';
const RANK_PREFIX = ':result';
const ARENA_PREFIX  = 'match:arena:';
const MAP_PREFIX = 'map:';

// RANK_RESULT_PREFIX:'result:',

module.exports = {
    getKey: function (field) {
        return `${PREFIX}${field}`;
    },
    getArenaKey: function (field) {
        return `${ARENA_PREFIX}${field}`;
    },

    getMysqlKey: function (redisKey) {
        return redisKey.split(':')[2];
    },

    getRankDataKey(field) {
        return `${field}${RANK_PREFIX}`;
    },

    GLOBAL_DATA:{
        BLACKLIST:'global_data:blacklist',   //黑名单玩家
    },

    PLATFORM_TYPE: {
        ANDROID: 1,
        IOS: 2
    },

    DATA_EVENT_SYNC: {
        PUMPWATER:'platform_pumpwater',
        PLATFORM_CATCHRATE: 'data_event_sync_platform_catchrate', //平台捕获率
        SCENE_CATCHRATE: 'data_event_sync_scene_catchrate', //场景捕获率{sceneId:'', value:1}
        PLAYER_CATCH_RATE: 'data_event_sync_player_catchRate', //玩家捕获率变化
        PLAYER_GAIN_LOSS_LIMIT: 'data_event_sync_player_gain_loss_limit', //玩家盈亏限制
        PLATFORM_SERVICE_SWITCH: 'platform_service_switch', //平台服务开关
        PLATFORM_API_SWITCH: 'platform_api_switch', //平台API开关
        CASH_RECHAREGE_PERCET: 'cash_recharege_percet', //全服提现比例系数
        PLATFORM_CATCH_REVISE:'platform_catch_revise' //全服提现修正
    },

    PLATFORM_DATA: {
        PUMPWATER: 'fishjoy:room:pumpwater', //系统收益率平衡，默认为1
        PLATFORM_CATCHRATE: 'fishjoy:room:platformCatchRate', //捕鱼捕获率平台控制，默认为1
        SCENE_CATCHRATE: 'pair:scene:catchRate', //场景捕获率，默认为1
        PLATFORM_RECHARGE: 'fishjoy:platform:recharge', //平台充值总金额
        PLATFORM_CASH: 'fishjoy:platform:cash', //平台兑现总额度
        PLATFORM_GIVE: 'fishjoy:platform:give', //平台赠送金币总量
        TOTALGOLD: 'fishjoy:platform:totalGold', // 玩家金币总额
        TOTALDRAW: 'fishjoy:platform:totalDraw', // 幸运大奖总消耗
        TOTALNUCLEAR: 'fishjoy:platform:totalNuclear', // 核弹总消耗
        TOTALOTHERS: 'fishjoy:platform:totalOthers', // 其他总消耗
        TODAY_PLATFORM_CASH: "fishjoy:platform:today_cash", //平台玩家今日兑现总额度
        G_GPCT_OUT: "fishjoy:platform:g_gpct_out", //全服命中率过期时间
        G_GPCT_OUT_TIMESTAMP: "fishjoy:platform:g_gpct_out_timestamp", //全服命中率过期时间戳

        MAIL_GOLD_TOTAL: 'fishjoy:platform:mail_gold_total', // 全服邮件可以发放的金币总数(set, get, incr)
        MAIL_GOLD_PLAYER: 'fishjoy:platform:mail_gold_player', // 全服通过邮件发放给玩家的金币总数(set, get, incr)
        PLATFORM_CATCH_REVISE: 'fishjoy:platform:catch_revise', //全服命中修正值,默认1
        CASH_RECHAREGE_PERCET: 'fishjoy:platform:cash_recharege_percet', //全服命中修正值,默认1

        EXPECT_EXTRACT: 'fishjoy:platform:expect_extract',//期望抽水
        TOTAL_CYCLE: 'fishjoy:platform:total_cycle',//周期总时长
        ADD_BUFF_RATE: 'fishjoy:platform:add_buff_rate',//出分加成系数(命中乘以这个参数)
        ADD_CYCLE: 'fishjoy:platform:add_cycle',//出分周期时长
        EAT_BUFF_RATE: 'fishjoy:platform:eat_buff_rate',//吃分加成系数(命中乘以这个参数)
        EAT_CYCLE: 'fishjoy:platform:eat_cycle',//吃分周期时长

        SERVER_BROADCAST: 'pair:id:server_broadcast', //服务器公告(新版会有多于一条的服务器公告)
    },

    WARNING_COEFFICIENCY: {
        COEFFICIENCY: 'warning_coefficiency', //平台预警相关信息
    },

    SWITCH: {
        CIK: "global:switch:cik", //实物兑换开关
        CDKEY: "global:switch:cdkey", //礼包码开关
        ACTIVE: "global:switch:active", //活动开关
        SERVICE: "global:switch:service", //服务开关
        SERVICE_MSG: "global:switch:service:msg", //服务开关说明
        API:"global:switch:api", //api开关
    },

    RANK: {
        // GOLD: "rank:gold", //金币排行
        // ACHIEVE: "rank:achieve", //成就排行
        GODDESS: "rank:goddess", //女神波数排行(每周重置、每天奖励、周奖励)
        BP: "rank:bp", //捕鱼积分（每周重置、天奖励）
        FLOWER: "rank:flower", //人气王排行（每周重置、天奖励）
        MATCH: "rank:match", //排位赛胜点（每月重置，月、天奖励、并继承上赛季的一些战绩：Math.floor(740 + Math.max(points - 800, 100) * 0.6)）
        AQUARIUM: "rank:aquarium", //宠物鱼总等级排行（10000名以内天奖励）
        CHARM: "rank:charm", //魅力值排行{10000名以内天奖励}
        GAIN: "rank:gain", //盈排行榜
        LOSS: "rank:loss", //亏排行榜
        ARENA: "rank:arena", //竞技场排行榜
    },

    CHART: {
        //奖励存放 20171218 by dfc
        RANK_DAILY_AWARD: "pair:uid:rank_daily_award",
        RANK_WEEK_AWARD: "pair:uid:rank_week_award",
        RANK_MONTH_AWARD: "pair:uid:rank_month_award",
    },

    MSG: {
        PRIVATE_MSG: "msg:private",
        IS_REWARD_PEOPLE: "msg:isrewardpeople",
        ASK_FRIEND: "msg:askfriend",
    },

    CH: {
        BROADCAST_SERVER: "channel:broadcast:server",
        BROADCAST_GAME_EVENT: "channel:broadcast:gameevent",
        BROADCAST_FAMOUS_ONLINE: "channel:broadcast:famousonline",
        BROADCAST_DRAW: "channel:broadcast:draw",
        BROADCAST_REWARD_PEOPLE: "channel:broadcast:rewardpeople",
        BROADCAST_CFGS_UPDATE: "channel:broadcast:cfgsupdate",

        MAIL_SEND: "channel:mail:send",
        MAIL_RANK: "channel:mail:rank",
        MAIL_RELOAD: "channel:mail:reload",
        DROP_RELOAD: "channel:drop:reload",

        WORLD_CHAT: "channel:chat:world",
        PRIVATE_CHAT: "channel:chat:private",
        FEEDBACK: "channel:chat:feedback",
        DEL_FEEDBACK: "channel:chat:del_feedback",
        LIKE_FEEDBACK: "channel:chat:like_feedback",

        // 主服生成排行榜发送消息
        CHART_GOLD: "channel:chart:gold",
        CHART_ACHIEVE: "channel:chart:achieve",
        CHART_GODDESS: "channel:chart:goddess",
        CHART_MATCH: "channel:chart:match",
        CHART_AQUARIUM: "channel:chart:aquarium",
        CHART_CHARM: "channel:chart:charm",
        CHART_BP: "channel:chart:bp",
        CHART_FLOWER: "channel:chart:flower",

        // 主服生成排行榜发送消息
        CHART_GOLD_YD: "channel:chart:gold:yesterday",
        CHART_ACHIEVE_YD: "channel:chart:achieve:yesterday",
        CHART_GODDESS_YD: "channel:chart:goddess:yesterday",
        CHART_MATCH_YD: "channel:chart:match:yesterday",
        CHART_AQUARIUM_YD: "channel:chart:aquarium:yesterday",
        CHART_CHARM_YD: "channel:chart:charm:yesterday",
        CHART_BP_YD: "channel:chart:bp:yesterday",
        CHART_FLOWER_YD: "channel:chart:flower:yesterday",
    },

    LOG: {
        /** 玩家封号日志(谁在何时封号了谁?) */
        BAN_USER: "log:ban_user", // 返回所有日志信息: lrange log:ban_user 0 -1

        G_DAY_DROP: "global:day_drop", //全服按天掉落
        G_HOUR_DROP: "global:hour_drop", //全服按小时掉落
    },

    BIG_DATA: {
        /**
         * 时间段内产出金币总量.
         */
        GOLD_COST_TOTAL: "big_data:gold:cost:total", // hget big_data:gold:cost:total 69914
        GOLD_COST_FIRE: "big_data:gold:cost:fire", // hget big_data:gold:cost:fire 69914
        GOLD_COST_LASER: "big_data:gold:cost:laser",
        GOLD_COST_BONUSDRAW: "big_data:gold:cost:bonusdraw",
        GOLD_COST_MINIGAME: "big_data:gold:cost:minigame",
        GOLD_COST_NUCLEAR: "big_data:gold:cost:nuclear",
        GOLD_COST_PETFISH_UPGRADE: "big_data:gold:cost:petfish_upgrade",
        GOLD_COST_CHARTS_REWARD: "big_data:gold:cost:charts_reward",
        GOLD_COST_GOLD_SHOPPING: "big_data:gold:cost:gold_shopping",
        GOLD_COST_ACTIVE_DRAW: "big_data:gold:cost:active_draw",
        /** 限时礼包购买 */
        GOLD_COST_TIMEGIFT_BUY: "big_data:gold:cost:timegift_buy",
        GOLD_COST_DAILY_GAIN: "big_data:gold:cost:daily_gain",
        GOLD_COST_ACHIEVE_GAIN: "big_data:gold:cost:achieve_gain",
        GOLD_COST_FUND_BUY: "big_data:gold:cost:fund_buy",
        GOLD_COST_MONTH_SIGN_REWARD: "big_data:gold:cost:month_sign_reward",

        GOLD_COST_SHARE_REWARD: "big_data:gold:cost:share_reward",
        GOLD_COST_VIPGIFT_BUY: "big_data:gold:cost:vipgift_buy",
        GOLD_COST_ACTIVE_QUEST: "big_data:gold:cost:active_quest",
        GOLD_COST_ACTIVE_EXCHANGE: "big_data:gold:cost:active_exchange",
        GOLD_COST_ACTIVE_CHARGE: "big_data:gold:cost:active_charge",
        GOLD_COST_INVITE_REWARD: "big_data:gold:cost:invite_reward",
        GOLD_COST_BOX_REWARD: "big_data:gold:cost:box_reward",
        GOLD_COST_FIRST_BUY: "big_data:gold:cost:first_buy",
        GOLD_COST_CARD_REWARD: "big_data:gold:cost:card_reward",
        GOLD_COST_ENSHRINE_REWARD: "big_data:gold:cost:enshrine_reward",

        GOLD_COST_OTHER: "big_data:gold:cost:other",

        /**
         * 时间段内消耗金币总量.
         */
        GOLD_GAIN_TOTAL: "big_data:gold:gain:total", // hget big_data:gold:gain:total 69914
        GOLD_GAIN_FIRE: "big_data:gold:gain:fire", // hget big_data:gold:gain:fire 69914
        GOLD_GAIN_LASER: "big_data:gold:gain:laser", // hget big_data:gold:gain:laser 69914
        GOLD_GAIN_BONUSDRAW: "big_data:gold:gain:bonusdraw", // hget big_data:gold:gain:bonusdraw 69914
        GOLD_GAIN_MINIGAME: "big_data:gold:gain:minigame", // hget big_data:gold:gain:minigame 69914
        GOLD_GAIN_NUCLEAR: "big_data:gold:gain:nuclear",
        GOLD_GAIN_PETFISH_UPGRADE: "big_data:gold:gain:petfish_upgrade",
        GOLD_GAIN_CHARTS_REWARD: "big_data:gold:gain:charts_reward",
        GOLD_GAIN_GOLD_SHOPPING: "big_data:gold:gain:gold_shopping",
        GOLD_GAIN_ACTIVE_DRAW: "big_data:gold:gain:active_draw",
        /** 限时礼包购买 */
        GOLD_GAIN_TIMEGIFT_BUY: "big_data:gold:gain:timegift_buy",
        GOLD_GAIN_DAILY_GAIN: "big_data:gold:gain:daily_gain",
        GOLD_GAIN_ACHIEVE_GAIN: "big_data:gold:gain:achieve_gain",
        GOLD_GAIN_FUND_BUY: "big_data:gold:gain:fund_buy",
        GOLD_GAIN_MONTH_SIGN_REWARD: "big_data:gold:gain:month_sign_reward",

        GOLD_GAIN_SHARE_REWARD: "big_data:gold:gain:share_reward",
        GOLD_GAIN_VIPGIFT_BUY: "big_data:gold:gain:vipgift_buy",
        GOLD_GAIN_ACTIVE_QUEST: "big_data:gold:gain:active_quest",
        GOLD_GAIN_ACTIVE_EXCHANGE: "big_data:gold:gain:active_exchange",
        GOLD_GAIN_ACTIVE_CHARGE: "big_data:gold:gain:active_charge",
        GOLD_GAIN_INVITE_REWARD: "big_data:gold:gain:invite_reward",
        GOLD_GAIN_BOX_REWARD: "big_data:gold:gain:box_reward",
        GOLD_GAIN_FIRST_BUY: "big_data:gold:gain:first_buy",
        GOLD_GAIN_CARD_REWARD: "big_data:gold:gain:card_reward",
        GOLD_GAIN_ENSHRINE_REWARD: "big_data:gold:gain:enshrine_reward",

        GOLD_GAIN_OTHER: "big_data:gold:gain:other", // hget big_data:gold:gain:other 69914

        /**
         * 时间段内最终金币存量.
         * 根据玩家ID分别存储, 获取时取总量.
         */
        GOLD_LEFT_TOTAL: "big_data:gold:left:total", // hget big_data:gold:left:total 69914
        GOLD_LEFT_NUM: "big_data:gold:left:num", // 记录活跃人数

        // sadd
        SKIN_VOTE_UID: "big_data:skin:vote:uid", // 记录已经投票的玩家uid
    },

    UPDATED_UIDS: 'fishjoy:sync:full_uids',
    UPDATED_DELTA_UIDS: 'fishjoy:sync:delta_uids',
    UPDATED_DELTA_FIELDS: 'fishjoy:sync:delta_fields',

    FLOWER_RECEIVE_WEEKLY: PREFIX + 'flower_receive_weekly',
    FLOWER_RECEIVE: PREFIX + 'flower_receive',
    HORN_USED: PREFIX + "horn_used",
    FLOWER_SEND: PREFIX + "flower_send",

    RANK_DAILY_AWARD: PREFIX + 'rank_daily_award',
    RANK_WEEK_AWARD: PREFIX + 'rank_week_award',
    RANK_MONTH_AWARD: PREFIX + 'rank_month_award',

    "GAIN_LOSS_LIMIT": PREFIX + "gain_loss_limit", //玩家捕获率修正过期参数
    "GAIN_LOSS_SNAPSHOT": PREFIX + "gain_loss_snapshot", //盈亏值快照
    "PLAYER_CATCH_RATE": PREFIX + "player_catch_rate", //玩家捕获率
    "RECHARGE": PREFIX + "recharge", //玩家充值总额度
    "CASH": PREFIX + "cash", //玩家兑现总额度

    "COST": PREFIX + "cost", //玩家金币消耗
    "GAIN_LOSS": PREFIX + "gain_loss", //个人盈亏

    //auto build base on keyTypeDef.js
    "ID": PREFIX + "id",
    "JOINTYPE": PREFIX + "jointype",
    "WHO_INVITE_ME": PREFIX + "who_invite_me",
    "WHO_SHARE_ME": PREFIX + "who_share_me",
    "TEMPNAME": PREFIX + "tempname",
    "NICKNAME": PREFIX + "nickname",
    "PASSWORD": PREFIX + "password",
    "PWD_HISTORY": PREFIX + "pwd_history",
    "VIP": PREFIX + "vip",
    "LOGIN_COUNT": PREFIX + "login_count",
    "LOGOUT_COUNT": PREFIX + "logout_count",
    "CREATED_AT": PREFIX + "created_at",
    "UPDATED_AT": PREFIX + "updated_at",
    "LAST_ONLINE_TIME": PREFIX + "last_online_time",
    "SALT": PREFIX + "salt",
    "TOKEN": PREFIX + "token",
    "GOLD": PREFIX + "gold",
    "PEARL": PREFIX + "pearl",
    "WEAPON": PREFIX + "weapon",
    "SKILL": PREFIX + "skill",
    "BROKE_TIMES": PREFIX + "broke_times",
    "FIRST_LOGIN": PREFIX + "first_login",
    "DAY_REWARD": PREFIX + "day_reward",
    "DAY_REWARD_ADV": PREFIX + "day_reward_adv",
    "NEW_REWARD_ADV": PREFIX + "new_reward_adv",
    "DAY_REWARD_WEEKLY": PREFIX + "day_reward_weekly",
    "VIP_DAILY_FILL": PREFIX + "vip_daily_fill",
    "VIP_DAILY_REWARD": PREFIX + "vip_daily_reward",
    "RMB": PREFIX + "rmb",
    "CHANNEL": PREFIX + "channel",
    "CHANNEL_ACCOUNT_ID": PREFIX + "channel_account_id",
    "PLATFORM": PREFIX + "platform",
    "VIP_WEAPON_ID": PREFIX + "vip_weapon_id",
    "PFFT_AT": PREFIX + "pfft_at",
    "CHANNEL_ACCOUNT_NAME": PREFIX + "channel_account_name",
    "CHANNEL_ACCOUNT_INFO": PREFIX + "channel_account_info",
    "EXP": PREFIX + "exp",
    "LEVEL": PREFIX + "level",
    "LEVEL_MISSION": PREFIX + "level_mission",
    "MISSION_DAILY_RESET": PREFIX + "mission_daily_reset",
    "MISSION_ONLY_ONCE": PREFIX + "mission_only_once",
    "FIRST_BUY": PREFIX + "first_buy",
    "ACTIVITY_GIFT": PREFIX + "activity_gift",
    "HEARTBEAT": PREFIX + "heartbeat",
    "HEARTBEAT_MIN_COST": PREFIX + "heartbeat_min_cost",
    "ACHIEVE_POINT": PREFIX + "achieve_point",
    "GOLD_SHOPPING": PREFIX + "gold_shopping",
    "WEAPON_SKIN": PREFIX + "weapon_skin",
    "BONUS": PREFIX + "bonus",
    "DROP_RESET": PREFIX + "drop_reset",
    "DROP_ONCE": PREFIX + "drop_once",
    "COMEBACK": PREFIX + "comeback",
    "VIP_GIFT": PREFIX + "vip_gift",
    "WEAPON_ENERGY": PREFIX + "weapon_energy",
    "PIRATE": PREFIX + "pirate",
    "CARD": PREFIX + "card",
    "GET_CARD": PREFIX + "get_card",
    "FIRST_BUY_GIFT": PREFIX + "first_buy_gift",
    "PACKAGE": PREFIX + "package",
    "GUIDE": PREFIX + "guide",
    "GUIDE_WEAK": PREFIX + "guide_weak",
    "ACTIVE": PREFIX + "active",
    "ACTIVE_DAILY_RESET": PREFIX + "active_daily_reset",
    "ACTIVE_STAT_ONCE": PREFIX + "active_stat_once",
    "ACTIVE_STAT_RESET": PREFIX + "active_stat_reset",
    "MAIL_BOX": PREFIX + "mail_box",
    "FREE_DRAW": PREFIX + "free_draw",
    "TOTAL_DRAW": PREFIX + "total_draw",
    "ROIPCT_TIME": PREFIX + "roipct_time",
    "AQUARIUM": PREFIX + "aquarium",
    "GODDESS": PREFIX + "goddess",
    "FREE_GODDESS": PREFIX + "free_goddess",
    "GODDESS_FREE": PREFIX + "goddess_free",
    "GODDESS_CTIMES": PREFIX + "goddess_ctimes",
    "GODDESS_CROSSOVER": PREFIX + "goddess_crossover",
    "GODDESS_ONGOING": PREFIX + "goddess_ongoing",
    "GODDESS_JUMP": PREFIX + "goddess_jump",
    "REDRESS_NO": PREFIX + "redress_no",
    "TEST": PREFIX + "test",
    "RANK_IN_FRIENDS": PREFIX + "rank_in_friends",
    "OVER_ME_FRIENDS": PREFIX + "over_me_friends",
    "CHARM_RANK": PREFIX + "charm_rank",
    "CHARM_POINT": PREFIX + "charm_point",
    "SEX": PREFIX + "sex",
    "CITY": PREFIX + "city",
    "GAME_FRIEND": PREFIX + "game_friend",
    "MONTH_SIGN": PREFIX + "month_sign",
    "SID": PREFIX + "sid",
    "MATCH_ON": PREFIX + "match_on",
    "CIK_ON": PREFIX + "cik_on",
    "CDKEY_ON": PREFIX + "cdkey_on",
    "MSGBOARD_MGMT": PREFIX + "msgboard_mgmt",
    "MAX_WAVE": PREFIX + "max_wave",
    "GODDESS_BALANCE_TIME": PREFIX + "goddess_balance_time",
    "WEEK_REWARD": PREFIX + "week_reward",
    "WEEK_RANK": PREFIX + "week_rank",
    "PETFISH_RECENT_TIME": PREFIX + "petfish_recent_time",
    "PETFISH_TOTAL_LEVEL": PREFIX + "petfish_total_level",
    "MATCH_RECENT_TIME": PREFIX + "match_recent_time",
    "MATCH_WIN": PREFIX + "match_win",
    "MATCH_FAIL": PREFIX + "match_fail",
    "MATCH_POINTS": PREFIX + "match_points",
    "MATCH_RANK": PREFIX + "match_rank",
    "MATCH_UNFINISH": PREFIX + "match_unfinish",
    "MATCH_BOX_LIST": PREFIX + "match_box_list",
    "MATCH_BOX_TIMESTAMP": PREFIX + "match_box_timestamp",
    "MATCH_1ST_BOX": PREFIX + "match_1st_box",
    "MATCH_SEASON_COUNT": PREFIX + "match_season_count",
    "MATCH_SEASON_WIN": PREFIX + "match_season_win",
    "MATCH_SEASON_BOX": PREFIX + "match_season_box",
    "MATCH_SEASON_1ST_WIN": PREFIX + "match_season_1st_win",
    "MATCH_GOT_SEASON_REWARD": PREFIX + "match_got_season_reward",
    "MATCH_WINNING_STREAK": PREFIX + "match_winning_streak",
    "GOLD_TOTAL_GAIN": PREFIX + "gold_total_gain",
    "GOLD_TOTAL_COST": PREFIX + "gold_total_cost",
    "GOLD_SHOP_COUNT": PREFIX + "gold_shop_count",
    "GOLD_SHOP_AMOUNT": PREFIX + "gold_shop_amount",
    "DIAMOND_TOTAL_GAIN": PREFIX + "diamond_total_gain",
    "DIAMOND_TOTAL_COST": PREFIX + "diamond_total_cost",
    "DIAMOND_SHOP_COUNT": PREFIX + "diamond_shop_count",
    "DIAMOND_SHOP_AMOUNT": PREFIX + "diamond_shop_amount",
    "HAS_SOCIAL": PREFIX + "has_social",
    "SOCIAL_INVITE_FRIENDS": PREFIX + "social_invite_friends",
    "SOCIAL_SHARE_FRIENDS": PREFIX + "social_share_friends",
    "SOCIAL_INVITE_PROGRESS": PREFIX + "social_invite_progress",
    "SOCIAL_INVITE_DAILY_STATE": PREFIX + "social_invite_daily_state",
    "SOCIAL_INVITE_REWARD": PREFIX + "social_invite_reward",
    "SOCIAL_SHARE_STATUS_0": PREFIX + "social_share_status_0",
    "SOCIAL_SHARE_STATUS_1": PREFIX + "social_share_status_1",
    "SOCIAL_SHARE_STATUS_2": PREFIX + "social_share_status_2",
    "SOCIAL_ENSHRINE_STATUS": PREFIX + "social_enshrine_status",
    "SOCIAL_SHARE_TOP_GOLD": PREFIX + "social_share_top_gold",
    "SOCIAL_SHARE_TOP_RANK": PREFIX + "social_share_top_rank",
    "FIGURE_URL": PREFIX + "figure_url",
    "NEW_PLAYER": PREFIX + "new_player",
    "NEED_INSERT": PREFIX + "need_insert",
    "NEED_UPDATE": PREFIX + "need_update",
    "ONLINE_TIME": PREFIX + "online_time",
    "VIP_FILL_THIS_TIME": PREFIX + "vip_fill_this_time",
    "BP": PREFIX + "bp",
    "RECENT_ENEMY_10": PREFIX + "recentEnemy10",
    "CIK_NUM": PREFIX + "cik_num",
    "CIK_LIMIT": PREFIX + "cik_limit",
    "CIK_TIME": PREFIX + "cik_time",

    "CHEAT_GOLD": PREFIX + "cheat_gold",
    "CHEAT_GOLD_TOTAL": PREFIX + "cheat_gold_total",
    "CHEAT_FORBID_TIME": PREFIX + "cheat_forbid_time",

    "UID_QQ_FRIEND": PREFIX + "qq_friend",
    "UID_GAME_FRIEND": PREFIX + "game_friend",
    "TALK_FORBIDDEN": PREFIX + "talk_forbidden",
    WEAPON_VOTE: "pair:weapon:vote",
    SKIN_VOTE_UID: "big_data:skin:vote:uid", // 记录已经投票的玩家uid
    ADV_REWARD_TIMES: PREFIX + "adv_reward_times",
    KEY_ACC_COUNTER: "account_counter",
    TOBE_STORED: "cache:uid_tobe_stored",
    "MONTH_SIGN_EXTRA_REWARD": PREFIX + "month_sign_extra_reward",
    "MATCH_TIMESTAMP": "rank:match:timestamp",
    "SOCIAL_DAILY_INVITE_REWARD": PREFIX + "social_daily_invite_reward",
    "SOCIAL_INVITE_MONTH": PREFIX + "social_invite_month",
    "SOCIAL_INVITE_WEEK": PREFIX + "social_invite_week",
    "FREE_BOMB": PREFIX + "free_bomb",
    "PRIVACY": PREFIX + "privacy",
    "ACTIVE_STAT_NEWBIE": PREFIX + "active_stat_newbie",
    "GODDESS_FREE_PAUSE_AWAY": PREFIX + "goddess_free_pause_away",

    // Set类型的数据scard,sadd,del
    ONLINE_UID_10_MINUTES: "cache:online_uid:10_minutes",//10分钟内在线的玩家
    ONLINE_UID_1_HOUR: "cache:online_uid:1_hour",//1小时内(以整点为界限)在线的玩家
    NEW_DEVICE_1_HOUR: "cache:new_device:1_hour",//1小时内新增注册的设备
    NEW_DEVICE_1_DAY: "cache:new_device:1_day",//1天内新增注册的设备
    ACTIVE_DEVICE_1_HOUR: "cache:active_device:1_hour",//1小时内活跃的设备
    ACTIVE_DEVICE_1_DAY: "cache:active_device:1_day",//1天内活跃的设备

    // 对象类型数据
    ONLINE_UID_RECENT_HOUR: "pair:uid:online",//最近1小时内在线的玩家(每一个uid对应的值都会有一个过期时间)
    PAIR_IDX_ONLINE_COUNT: "pair:idx:online_count",//最近1小时内在线的玩家统计(1~6)

    BIT_DAILY_NEW_USERS: "bit:daily_new_users:", // 记录每日新增用户
    BIT_DAILY_ACTIVE_USERS: "bit:daily_active_users:", // 记录玩家一天的登录数据(需要拼接日期记录某天的数据)
    DATE_LOGIN_COUNT: "pair:date:login_count", // 记录玩家一天的登录次数(体现游戏粘度),使用hincr来完成数据收集

    CIK_DAILY_LEFT: "pair:cik:daily_left", // 实物兑换每日剩余量(库存)
    CIK_TOTAL_LEFT: "pair:cik:total_left", // 实物兑换总剩余量(库存)

    // 需要加上日期后缀(REALTIME_FIGHT_SERVER_PLAYER_COUNT + ':20180423')
    REALTIME_FIGHT_SERVER_PLAYER_COUNT: "pair:realtime:fight_server_player_count", // 实时数据: 战斗服玩家并发数
    REALTIME_FIGHT_SERVER_ROOM_COUNT: "pair:realtime:fight_server_room_count", // 实时数据: 战斗服房间并发数
    REALTIME_RANK_MATCH_PLAYER_COUNT: "pair:realtime:rank_match_player_count", // 实时数据: 排位赛玩家并发数
    REALTIME_RANK_MATCH_ROOM_COUNT: "pair:realtime:rank_match_room_count", // 实时数据: 排位赛房间并发数

    //映射表
    MAP_OPENID_UID: "pair:openid:uid", //openid 和 uid映射
    MAP_UID_ARENA_MATCHID: MAP_PREFIX + "uid_arena_matchid",

    //arean 1v1对战
    ARENA_CREATED_AT: ARENA_PREFIX + "arena_created_at",
    ARENA_INVITER: ARENA_PREFIX + "arena_inviter",
    ARENA_INVITEE: ARENA_PREFIX + "arena_invitee",
    ARENA_STATE: ARENA_PREFIX + "arena_state",
    ARENA_PKINFO: ARENA_PREFIX + "arena_pkInfo",
};