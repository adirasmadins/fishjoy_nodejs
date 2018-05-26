const i18n = require('../utils/imports').DESIGN_CFG.string_strings_cfg;
const lan = 'cn';

const _errorCode = {
    OK: 200, //成功
    Error: 201, //未知错误
    SYSTEM_ERROR: 202, //系统错误
    DB_INNER_ERROR: 203, //数据库內部错误
    NETWORK_ERROR: 204, //网络错误
    SERVER_RESOURCE_NOT_ENOUGHT: 300, //服务器资源不足
    SERVER_ALLOC_ERROR: 301, //服务器分配错误
    SCENE_NOT_EXIST: 303, //场景服务器不存在
    NOT_SUPPORT_GAMETYPE: 304, //不支持的游戏类型
    SERVER_NOT_RUNNING: 305, //服务器未启动
    SERVER_OVERLOAD: 306, //服务器繁忙
    SERVER_DEPLOY_ERROR: 307, //服务器部署错误
    SERVER_ILLEGAL: 308, //服务器非法
    ROOMID_INVALID: 309, //房间号无效
    GET_GAME_ENTRY_FAIL: 310, //获取游戏入口失败
    PLAYER_ILLEGAL: 350, //玩家非法
    PLAYER_UID_INVALID: 351, //玩家UID无效
    PLAYER_NOT_EXIST: 352, //玩家不存在
    PLAYER_CREATE_FAILED: 353, //玩家创建失败
    PLAYER_NOT_LOGIN: 354, //玩家未登录
    PLAYER_BLOCK: 355, //玩家已被封号
    AUTHENTICATION_FAILED: 356, //实名认证失败
    AUTHENTICATION_END: 357, //已经实名认证
    WRONG_SIGN: 358, //验证码错误
    NEED_SIGN: 359, //需要验证码
    NOT_MATCHED_PHONENUM: 360, //电话号码不匹配
    PLAYER_AuthError: 361, //玩家授权失败
    PLAYER_REWARD_NOT_EXIST: 362, //玩家奖励信息不存在
    PLAYER_REWARD_RECEIVED: 363, //玩家奖励已领取
    PALYER_NOT_IN_SCENE: 364, //玩家不在场景中
    PALYER_GAME_ROOM_DISMISS: 365, //玩家游戏房间已经解散
    ROBOT_NOT_EXIST: 366, //某人已离开
    PLAYER_GAMEING: 367, //玩家已经在游戏房间
    ROOM_PLAYER_FULL: 368, //房间人数已满
    GAME_SCENE_NOT_MATCH: 369, //游戏场景不匹配
    ARGS_INVALID: 400, //参数无效
    ARGS_VALUE_WRONG: 401, //参数值错误
    ARGS_LENGTH_LIMIT: 402, //参数长度限制
    GAME_TYPE_INVALID: 451, //游戏类型无效
    GAME_SCENE_INVALID: 452, //游戏场景无效
    GAME_SCENE_ADD_ERR: 453, //加入游戏场景错误
    GM_LEVEL_LIMIT: 500, //GM等级限制
    GM_NOT_AGENT: 501, //GM不是代理
    RESOURCE_LACK: 550, //资源锁定
    RESOURCE_NOT_EXIST: 551, //资源不存在
    ACTIVITY_NOT_OPEN: 600, //活动未开启
    ACTIVITY_NOT_REACH: 601, //活动未达成
    ACTIVITY_FETCHED: 602, //活动已领取
    REWARD_FETCHED: 603, //奖励已领取
    PLAYER_CHEATING: 604, // 玩家作弊
    GUIDE_REWARD_ALREADY: 605, // 玩家已经领取了新手奖励

    SERVICE_SWITCH: -1, //服务关停开关
    API_SWITCH: -2, //功能维护升级中，敬请期待

    TOKEN_INVALID: 1001, //token失效
    DB_ERR: 1002, //数据库读写错误
    PARAM_MISSING: 1003, //客户端参数缺失
    PARAM_WRONG_TYPE: 1004, //传入参数类型错误
    CACHE_EMPTY: 1005, //flush的缓存为空, 无需操作
    FAIL_DOWNLOAD_IMG: 1006, //图片下载失败
    FAIL_OPEN_FILE: 1007, //文件打开失败
    TOKEN_NULL: 1008, //token为空
    TOKEN_FORMAT_ERR: 1009, //token格式错误(正确格式为id_sault)
    NEGATIVE_GOLD_ERR: 1010, //金币负数错误(客户端更新金币数量时传入total为负数)
    NEGATIVE_DIAMOND_ERR: 1011, //钻石负数错误(客户端更新钻石数量时传入total为负数)
    SERVER_UPDATE: 1012, //服务器更新退出游戏
    DAILY_RESET: 1013, //服务器每日重置数据
    UID_INVALID: 1014, //客户端传入的用户uid在数据库中没有找到
    UID_CANNOT_FIND: 1015, //用户ID无法找到
    PLAYER_CHEAT: 1016, //账号因为作弊行为被封禁，有疑问请联系客服微信：gamekefu01

    NOT_SUPPORT_SERVICE: 1017, //不支持此服务
    NOT_SUPPORT_CHANNEL_LOGIN: 1018, //不支持此渠道用户登录
    THIRDPARTY_AUTH_FAILED: 1019, //第三方登录授权失败
    USER_REGISTE_FAILED: 1020, //用户注册失败
    USERNAME_EXIST: 1021, //用户名已经存在
    USERNAME_PASSWORD_ERROR: 1022, //用户名或者密码错误
    OLD_PASSWORD_ERROR: 1023, //原密码错误
    SERVER_INTERNAL_ERROR: 1025, //服务器内部错误
    USER_NOT_EXIST: 1026, //用户不存在
    USER_ILLEGAL_LOGIN: 1027, //用户非法登录
    LOGINOUT_FAIL: 1028, //退出账户失败

    CALL_TOO_OFTEN: 1029, //请求过于频繁，请耐心等待服务器返回结果
    CALL_SDK_FAIL: 1030, //SDK请求失败

    SESSION_EXPIRED: 1031, //session过期
    DB_REDIS_ERR: 1032, //REDIS数据库操作错误

    // 游戏逻辑错误(从1101开始)
    REPEAT_OPERATION: 1101, //重复操作(重复购买，重复领取)
    VIP_NOT_ENOUFH: 1102, //玩家VIP等级不足
    DIAMOND_NOT_ENOUGH: 1103, //玩家钻石不足
    GOLD_NOT_ENOUGH: 1104, //玩家金币不足
    DIAMOND_MISSMATCH: 1105, //玩家钻石数量不匹配
    GOLD_MISSMATCH: 1106, //玩家金币数量不匹配
    ACTIVE_DISSATISFY: 1107, //活动奖励领取条件不满足
    DRAW_TIMES_ERR: 1108, //抽奖次数错误
    CHIP_NOT_ENOUGH: 1109, //玩家碎片不足
    ACTIVE_EXCHANGE_OVER: 1110, //活动中的交换次数已经用完

    PETFISH_LOCKED: 1111, //宠物鱼尚未解锁(即水族馆中没有对应宠物鱼ID)
    PETFISH_PLACED: 1112, //宠物鱼已经处于放养状态
    PETFISH_STATE_ERR: 1113, //宠物鱼状态错误
    PETFISH_REWARD_ERR_NOTPLACED: 1114, //宠物鱼领取错误: 宠物鱼没有放养
    PETFISH_REWARD_ERR_TIME_NOT_UP: 1115, //宠物鱼领取错误: 收取时间未到
    GODDESS_LOCKED: 1121, //放置的女神没有解锁
    GODDESS_PLACED: 1122, //女神已经处于放置状态，请勿重复放置
    GODDESS_STATE_ERR: 1123, //女神状态错误
    GIFT_ADV_GOTTEN: 1124, //今日礼包已经领取
    ADV_REWARD_TIMES_FINISH: 1125, //今日广告观看领取奖励的次数已经用完
    GODDESS_LEVEL_NOT_REACHED: 1126, //女神还没有达到解锁特权的等级
    GODDESS_INTERACT_REWARD_ALREADY: 1127, //女神互动奖励已经领取

    RANK_COUNT_TOO_LARGE: 1131, //请求的最大排名数超过了100

    RANKGAME_WRONG_LOG_ID: 1141, //请求的排位赛ID不存在
    RANKGAME_UNLOCKING: 1142, //已有宝箱正在解锁中, 请耐心等待
    RANKGAME_EMPTY_BOX: 1143, //当前位置的宝箱是空的
    RANKGAME_LOCKED: 1144, //当前位置的宝箱还没有解锁
    RANKGAME_NO_1ST_WIN_BOX: 1145, //玩家没有首胜宝箱

    //转盘抽奖错误码
    BONUS_GOLDLEVEL_WRONG: 1151, //客户端传入的奖金鱼抽奖等级错误
    BONUS_FISH_NOT_ENOUGH: 1152, //玩家抽奖时奖金鱼数量不够
    BONUS_GOLD_NOT_ENOUGH: 1153, //玩家抽奖时奖金数量不够
    DRAW_TIMES_OVER_LIMIT_TODAY: 1154, //抽奖次数超过今日次数限制

    //背包合成错误码
    MIX_WRONG_ITEM: 1161, //客户端上传的物品不是可合成物品
    MIX_RAW_NOT_ENOUGH: 1162, //合成材料不足
    MIX_GOLD_NOT_ENOUGH: 1163, //合成所需金币不足

    PACK_USE_WRONG_NUM: 1164, //传入了非法的数量(num<=0)
    PACK_USE_ITEM_NOT_ENOUGH: 1166, //使用的物品数量不足
    PACK_SELL_ITEM_CANNOT_SELL: 1167, //物品不能出售
    PACK_ITEM_CANNOT_USE: 1168, //所选物品不可使用
    PACK_ITEM_NOT_EXIST: 1169, //物品不存在(游戏没有配置或已经取消)

    //实物兑换错误码
    CIK_TOKEN_NOT_ENOUGH: 1171, //兑换券不足
    CIK_TOTAL_NOT_ENOUGH: 1172, //实物兑换总量不足
    CIK_COUNT_NOT_ENOUGH: 1173, //实物兑换当日量不足
    CIK_WRONG_CHANGE_ID: 1174, //兑换ID错误
    CIK_WRONG_ITEM: 1175, //实物兑换错误物品
    CIK_CANCEL_FAIL: 1176, //玩家取消实物兑换订单失败

    //签到错误码(月签)
    SIGN_REPEAT: 1181, //请勿重复签到
    SIGN_FORBIDDEN1: 1182, //请勿在注册日期前签到
    SIGN_FORBIDDEN2: 1183, //请勿签到今天以后
    SIGN_DIAMOND_NOT_ENOUGH: 1184, //补签钻石不够
    SIGN_DAY_OUT_OF_RANGE: 1185, //签到日期超出范围

    //领奖错误码
    MISSION_WRONG_QUEST_ID: 1191, //错误的任务码
    MISSION_NULL: 1192, //任务进度为空
    MISSION_NULL_RECORD: 1193, //任务记录为空
    MISSION_DISATISFY: 1194, //任务条件不满足
    MISSION_GOTTON: 1195, //请勿重复领取任务奖励
    MISSION_WRONG_ACTIVE_IDX: 1196, //活跃值领取传入的索引错误
    MISSION_ACTIVE_DISATISFY: 1197, //活跃值领取条件不满足
    MISSION_WRONG_TYPE: 1198, //一键领取类型错误(0:成就,1:日常)

    // 兑换码错误(从1201开始)
    CDKEY_INVALID: 1201, //兑换码无效
    CDKEY_USED: 1202, //兑换码已经使用过
    CDKEY_REPEAT: 1203, //同组奖励已经领取过
    CDKEY_EXPIRED: 1204, //兑换码已过期
    CDKEY_LIMIT: 1205, //兑换码领取次数达到上限

    // 邮件错误(从1211开始)
    MAIL_WRONG_JSON_FORMAT: 1211, //邮件奖励字段(reward)不是一个标准的JSON字符串
    MAIL_REWARD_NOT_ARRAY: 1212, //邮件奖励字段(reward)解析后不是一个JSON数组
    MAIL_REWARD_INVALID: 1213, //邮件奖励中有物品表中不存在的物品
    MAIL_NULL_RECEIVER_LIST: 1214, //收件人列表为空，不会发送邮件
    MAIL_LIST_EMPTY: 1215, // 邮件列表为空
    MAIL_CONTENT_ERROR: 1216, // 查询邮件信息失败

    // 女神错误码
    GODDESS_ID_ERROR: 1221, // 女神ID错误, 无法获取女神信息
    GODDESS_UNLOCK_IDX_ERROR: 1222, // 女神解锁索引错误, 请确保idx值为0~8
    GODDESS_UNLOCK_NO_STONE: 1223, // 女神解锁魂石不足
    GODDESS_ALREADY_UNLOCKED: 1224, // 女神已经解锁
    GODDESS_UP_DATA_WRONG: 1225, // 女神升级数据未找到
    GODDESS_UP_LACK_GOLD: 1226, // 女神升级金币不够
    GODDESS_UP_LACK_DEBRIS: 1226, // 女神升级魂石不够
    GODDESS_WEEKREWARD_WRONG_STATUS: 1227, // 保卫女神周奖励状态错误
    GODDESS_WEEKREWARD_UNABLE: 1228, // 保卫女神上周奖励不可领取
    GODDESS_WEEKREWARD_ALREADY: 1229, // 保卫女神上周奖励已经领取
    GODDESS_WEEKREWARD_OUT_OF_RANKS: 1230, // 保卫女神未进入排名, 不可领取

    // 武器错误码
    WEAPON_INFO_NULL: 1241, // 查询的武器升级信息为空
    WEAPON_UNLOCK_DIAMOND_NOT_ENOUGH: 1242, // 玩家解锁武器需要的钻石不足
    WEAPON_UNLOCK_MATERIAL_NOT_ENOUGH: 1243, // 玩家解锁武器需要的材料不足
    WEAPON_LEVELUP_YUNSHI_NOT_ENOUGH: 1244, // 玩家锻造选取了陨石精华但数量不够
    WEAPON_SKIN_DRAW_WRONG_SKIN_ID: 1246, // 玩家抽取了没有拥有的皮肤碎片
    WEAPON_LEVELUP_REPEAT: 1247, // 重复升级

    // 玩家升级
    LEVELUP_EXP_NOT_ENOUGH: 1251, // 玩家解锁武器需要的材料不足
    LEVELUP_EXP_TOO_MUCH: 1252, // 玩家的经验值不可能涨到下一级
    LEVELUP_MAX_LEVEL: 1253, // 玩家已经是最大等级

    // 商品购买
    BUY_WRONG_SHOP_ID: 1261, // 调用购买接口时传入了错误的商品ID
    BUY_WRONG_GIFT_TIME: 1262, // 购买的礼包不在开放时间内
    BUY_GIFT_COUNT_MAX: 1263, // 购买的礼包已经达到最大购买次数
    BUY_FUND_ALREADY: 1264, // 翻盘基金已经购买, 请勿重复购买
    BUY_GIFT_CFG_ERR: 1265, // 购买的礼包配置有误

    // 订单相关
    ORDER_CREATE_FAIL: 1271, // 订单生成失败
    ORDER_ILLEGAL: 1272, // 非法订单
    ORDER_PAY_FAIL: 1273, // 支付失败
    ORDER_REPEAT: 1274, // 重复订单
    NOT_SUPPORT_CHANNEL_PAY: 1275, // 不支持此渠道支付
    BUY_GOODS_ILLEGAL: 1276, // 购买物品非法
    AMOUNT_NOT_ENOUGH: 1277, // 余额不足
    SDK_ACCESS_TOKEN_INVALID: 1288, //第三方SDK接口凭证无效


    // 排行榜相关
    CHART_REWARD_FAIL: 1281, // 排行榜奖励领取失败

    // 活动奖励领取
    ACTIVE_CLICK_TOO_QUICK: 1301, // 你点击得太快了
    ACTIVE_NEWBIE_END: 1302, // 新手狂欢活动已经结束
    ACTIVE_NEWBIE_REWARD_NOT_SATISFIED: 1303, // 新手狂欢活动奖励领取条件不满足

    // 激光
    LASER_CHEAT: 1481, // 激光能量数据异常, 无法发射

    // VIP
    VIP_DAILY_REWARD_GOTTEN: 1491, // 玩家今日已经领取了VIP每日奖励

    // 范围
    RANGE_SCENE_CATCHRATE_LOW: 2001, // 捕获率设置值低于最低限制0.5
    RANGE_SCENE_CATCHRATE_HIGH: 2002, // 捕获率设置值高于最高限制1.5

    DATA_NULL_ERROR: 4001, // 数据为空错误

    //聊天
    CHAT_COST_ERROR: 5001, //钻石喇叭不足
    CHAT_FRIEND_ERROR: 5002, //好友请求错误
    CHAT_REWARD_ERROR: 5003, //打赏过了
    CHAT_REWARD_LESS_ERROR: 5004, //物品不足
    CHAT_FRIEND_ALREADY_ERROR: 5005, //已经是好友了
    CHAT_FRIEND_GAME_ERROR: 5006, //只能删除游戏好友

    CHAT_ERROR_CANNOT_SEND_MSG_TO_YOURSLEF: 5007, //不能给自己发消息
    CHAT_ERROR_FORBIDDEN_BY_ADMIN: 5008, //你已被管理员禁言
    CHAT_ERROR_CANNOT_ADD_YOURSELF_AS_FRIEND: 5009, //不能加自己为好友
    CHAT_ERROR_FRIEND_LIMIT_ME: 5010, //好友已经达到上限，请提升vip等级
    CHAT_ERROR_FRIEND_LIMIT_TARGET: 5011, //对方好友已满

    // 战斗服

    // 补漏
    DAY_EXTRA_REWARD_NOT_SATISFIED: 6001, //玩家不满足领取每日额外奖励的条件
    DAY_EXTRA_REWARD_ALREADY: 6002, //玩家每日额外奖励已经领取，请勿重复领取

    INVITE_NULL_FRIEND: 6003, //邀请的好友列表为空
    WRONG_JSON_FORMAT: 6004, //json数据异常
    MONTH_CARD_NORMAL_ALREADY: 6005, //已经开通普通月卡
    MONTH_CARD_SENIOR_ALREADY: 6006, //已经开通土豪月卡
    WEEK_CARD_ALREADY: 6007, //已经开通周卡
    INVITE_NOT_ENOUGH: 6008, //邀请人数不足
    CANNOT_INVITE_YOURSLEF: 6009, //不能邀请自己
    SOCIAL_REWARD_NOT_SATISFIED: 6010, //玩家不满足领取社交奖励的条件

    OPENID_ILLEGAL: 6011, //不合法的openid

    TIME_NOT_REACH: 6012, //时间未到
    ACCOUNT_NULL: 6013, //用户信息获取失败
    ACCOUNT_CHECK_ERROR: 6014, //用户校验失败
    ACCOUNT_NOT_REGIST: 6015, //账号未注册

    NO_LIMIT_ITEM: 6021, //尚无限时道具
    NOT_LIMIT_ITEM: 6022, //不是限时道具
    WRONG_TIMESTAMP: 6023, //时间戳有误
    ITEM_NOT_EXIST: 6024, //道具不存在
    CARD_TYPE_WRONG: 6025, //卡类型非法
    CARD_AMOUNT_WRONG: 6026, //卡面额不支持
    ITEM_TYPE_ILLEGAL: 6027, //道具类型不合法

    FIRST_RECHARGE_NO_RMB: 6031, //领取首充奖励但是没有充值
    FIRST_RECHARGE_ALREADY: 6032, //领取首充奖励但是已经领取了

    GOLD_NOT_ENOUTH: 7000, //金币不足
    WEAPON_LEVEL_LOW: 7001, //武器等级不够
    NOT_SUPPORT_ROOMMODE: 7002, //不支持的房间模式
    NOT_SUPPORT_SCENETYPE: 7007, //不支持的场景类型
    NOT_MATCH_WEAPON: 7004, //武器皮肤或等级不匹配
    INVALID_SKILL: 7005, //非法技能调用
    INVALID_SKILL_STATE: 7006, //技能状态匹配
    LOCK_FAILD: 7007, //锁定鱼不存在
    INVALID_SKILL_ING: 7008, //技能进行中
    NOT_SUPPORT_OPERATE: 7009, //场景不支持此操作
    INTERFACE_DEVELOPPING: 7010, //接口开发中
    INVALID_WP_LASER: 7011, // 激光能不足
    INVALID_WP_SKIN: 7012, // 无此皮肤，疑似作弊
    INVALID_WP_BK: 7017, // 子弹数据有误
    INVALID_WP_FIRE: 7014, // 开炮太频繁了，疑似作弊
    INVALID_GOD: 7015, // 女神数据不匹配
    LOCK_GOD: 7016, // 女神尚未解锁
    MATCH_REPEATE_JOIN: 7100, // 重复加入比赛
    MATCH_ROOM_NOPLAYER: 7101, // 玩家不在此比赛房间
    MATCH_ROOM_NOT_EXIST: 7102, // 比赛房间不存在
    MATCH_ROOM_GAMEOVER: 7107, // 比赛房间已结束
    PIRATE_NOT_DONE: 7104, // 海盗任务尚未完成
    BROKE_OVER_TODAY: 7105, // 今日破产领取已结束
    BROKE_INVALID: 7106, // 非法破产领取
    MINIGAME_INVALID: 7107, // 没有掉落mini游戏
    MINIGAME_TYPE_INVALID: 7108, // 没有掉落该类型的mini游戏
    WEAPON_LEVEL_INVALID: 7109, //非法武器等级
    RM_WEAPON_LEVEL_LIMIT: 7120, // 倍率低于配位赛最低要求

    DESIGN_CFGS_NOT_EXIST:7121, //配置文件不存在
    NOT_SUPPORT_MODE_PLAYER: 7122, //不支持此模式玩家
    WEAPON_TURN_GOLD_TOO_LOW: 7123, //你的金币过低，不能使用更高倍率
    ARENA_OTHER_PLAYER_MATCHING:7124, //其他玩家挑战中
    MATCH_WAIT_TIMEOUT:7125, //比赛已经开始了,只能异步对战了，自己创建房间吧
    PLAYER_READYING:7126, //玩家还未准备好，拒绝操作
    ARENA_MATCH_NOT_EXIST:7127, //竞技场对战已经不存在
    ARENA_NOT_FINISHED:7128, //对战未完成，请先完成对战
    ARENA_MATCHID_INVALID:7129, //比赛ID无效
    ARENA_MATCHID_BUSY:7130, //有人考虑挑战此比赛，稍后再试试
    ARENA_MATCH_SELF:7131, //不能挑战自己创建的比赛
    ARENA_MATCH_FINISH:7132, //对战已经结束
};

const _errorObj = {
    OK: {
        code: _errorCode.OK,
        msg: i18n.OK[lan],
    },

    Error: {
        msg: i18n.Error[lan],
        code: _errorCode.ERROR,
    },

    SYSTEM_ERROR: {
        msg: i18n.SYSTEM_ERROR[lan],
        code: _errorCode.SYSTEM_ERROR,
    },

    DB_INNER_ERROR: {
        msg: i18n.DB_INNER_ERROR[lan],
        code: _errorCode.DB_INNER_ERROR,
    },

    NETWORK_ERROR: {
        msg: i18n.NETWORK_ERROR[lan],
        code: _errorCode.NETWORK_ERROR,
    },

    SERVER_RESOURCE_NOT_ENOUGHT: {
        msg: i18n.SERVER_RESOURCE_NOT_ENOUGHT[lan],
        code: _errorCode.SERVER_RESOURCE_NOT_ENOUGHT,
    },

    SERVER_ALLOC_ERROR: {
        msg: i18n.SERVER_ALLOC_ERROR[lan],
        code: _errorCode.SERVER_ALLOC_ERROR,
    },

    SCENE_NOT_EXIST: {
        msg: i18n.SCENE_NOT_EXIST[lan],
        code: _errorCode.SCENE_NOT_EXIST,
    },

    NOT_SUPPORT_GAMETYPE: {
        msg: i18n.NOT_SUPPORT_GAMETYPE[lan],
        code: _errorCode.NOT_SUPPORT_GAMETYPE,
    },

    SERVER_NOT_RUNNING: {
        msg: i18n.SERVER_NOT_RUNNING[lan],
        code: _errorCode.SERVER_NOT_RUNNING,
    },

    SERVER_OVERLOAD: {
        msg: i18n.SERVER_OVERLOAD[lan],
        code: _errorCode.SERVER_OVERLOAD,
    },

    SERVER_DEPLOY_ERROR: {
        msg: i18n.SERVER_DEPLOY_ERROR[lan],
        code: _errorCode.SERVER_DEPLOY_ERROR,
    },

    SERVER_ILLEGAL: {
        msg: i18n.SERVER_ILLEGAL[lan],
        code: _errorCode.SERVER_ILLEGAL,
    },

    ROOMID_INVALID: {
        // msg: i18n.ROOMID_INVALID[lan],
        // msg: '房间号无效',
        msg: 'ROOMID_INVALID',
        code: _errorCode.ROOMID_INVALID,
    },

    GET_GAME_ENTRY_FAIL: {
        // msg: i18n.GET_GAME_ENTRY_FAIL[lan],
        // msg: '获取游戏入口失败',
        msg: 'GET_GAME_ENTRY_FAIL',
        code: _errorCode.GET_GAME_ENTRY_FAIL,
    },

    PLAYER_ILLEGAL: {
        msg: i18n.PLAYER_ILLEGAL[lan],
        code: _errorCode.PLAYER_ILLEGAL,
    },

    PLAYER_UID_INVALID: {
        msg: i18n.PLAYER_UID_INVALID[lan],
        code: _errorCode.PLAYER_UID_INVALID,
    },

    PLAYER_NOT_EXIST: {
        msg: i18n.PLAYER_NOT_EXIST[lan],
        code: _errorCode.PLAYER_NOT_EXIST,
    },

    PLAYER_CREATE_FAILED: {
        msg: i18n.PLAYER_CREATE_FAILED[lan],
        code: _errorCode.PLAYER_CREATE_FAILED,
    },

    PLAYER_NOT_LOGIN: {
        msg: i18n.PLAYER_NOT_LOGIN[lan],
        code: _errorCode.PLAYER_NOT_LOGIN,
    },

    PLAYER_BLOCK: {
        msg: i18n.PLAYER_BLOCK[lan],
        code: _errorCode.PLAYER_BLOCK,
    },

    AUTHENTICATION_FAILED: {
        msg: i18n.AUTHENTICATION_FAILED[lan],
        code: _errorCode.AUTHENTICATION_FAILED,
    },

    AUTHENTICATION_END: {
        msg: i18n.AUTHENTICATION_END[lan],
        code: _errorCode.AUTHENTICATION_END,
    },

    WRONG_SIGN: {
        msg: i18n.WRONG_SIGN[lan],
        code: _errorCode.WRONG_SIGN,
    },

    NEED_SIGN: {
        msg: i18n.NEED_SIGN[lan],
        code: _errorCode.NEED_SIGN,
    },

    NOT_MATCHED_PHONENUM: {
        msg: i18n.NOT_MATCHED_PHONENUM[lan],
        code: _errorCode.NOT_MATCHED_PHONENUM,
    },

    PLAYER_AuthError: {
        msg: i18n.PLAYER_AuthError[lan],
        code: _errorCode.PLAYER_AuthError,
    },

    PLAYER_REWARD_NOT_EXIST: {
        msg: i18n.PLAYER_REWARD_NOT_EXIST[lan],
        code: _errorCode.PLAYER_REWARD_NOT_EXIST,
    },

    PLAYER_REWARD_RECEIVED: {
        msg: i18n.PLAYER_REWARD_RECEIVED[lan],
        code: _errorCode.PLAYER_REWARD_RECEIVED,
    },

    PALYER_NOT_IN_SCENE: {
        msg: i18n.PALYER_NOT_IN_SCENE[lan],
        code: _errorCode.PALYER_NOT_IN_SCENE,
    },

    PALYER_GAME_ROOM_DISMISS: {
        msg: i18n.PALYER_GAME_ROOM_DISMISS[lan],
        code: _errorCode.PALYER_GAME_ROOM_DISMISS,
    },

    ROBOT_NOT_EXIST: {
        msg: i18n.ROBOT_NOT_EXIST[lan],
        code: _errorCode.ROBOT_NOT_EXIST,
    },

    PLAYER_GAMEING: {
        msg: i18n.PLAYER_GAMEING[lan],
        code: _errorCode.PLAYER_GAMEING,
    },

    ROOM_PLAYER_FULL: {
        // msg: i18n.ROOM_PLAYER_FULL[lan],
        // msg: '房间人数已满',
        msg: 'ROOM_PLAYER_FULL',
        code: _errorCode.ROOM_PLAYER_FULL,
    },

    GAME_SCENE_NOT_MATCH: {
        // msg: i18n.GAME_SCENE_NOT_MATCH[lan],
        // msg: '游戏场景不匹配',
        msg: 'GAME_SCENE_NOT_MATCH',
        code: _errorCode.GAME_SCENE_NOT_MATCH,
    },

    ARGS_INVALID: {
        msg: i18n.ARGS_INVALID[lan],
        code: _errorCode.ARGS_INVALID,
    },

    ARGS_VALUE_WRONG: {
        msg: i18n.ARGS_VALUE_WRONG[lan],
        code: _errorCode.ARGS_VALUE_WRONG,
    },

    ARGS_LENGTH_LIMIT: {
        msg: i18n.ARGS_LENGTH_LIMIT[lan],
        code: _errorCode.ARGS_LENGTH_LIMIT,
    },

    GAME_TYPE_INVALID: {
        msg: i18n.GAME_TYPE_INVALID[lan],
        code: _errorCode.GAME_TYPE_INVALID,
    },

    GAME_SCENE_INVALID: {
        msg: i18n.GAME_SCENE_INVALID[lan],
        code: _errorCode.GAME_SCENE_INVALID,
    },

    GAME_SCENE_ADD_ERR: {
        msg: i18n.GAME_SCENE_ADD_ERR[lan],
        code: _errorCode.GAME_SCENE_ADD_ERR,
    },


    GM_LEVEL_LIMIT: {
        msg: i18n.GM_LEVEL_LIMIT[lan],
        code: _errorCode.GM_LEVEL_LIMIT,
    },

    GM_NOT_AGENT: {
        msg: i18n.GM_NOT_AGENT[lan],
        code: _errorCode.GM_NOT_AGENT,
    },

    RESOURCE_LACK: {
        msg: i18n.RESOURCE_LACK[lan],
        code: _errorCode.RESOURCE_LACK,
    },

    RESOURCE_NOT_EXIST: {
        msg: i18n.RESOURCE_NOT_EXIST[lan],
        code: _errorCode.RESOURCE_NOT_EXIST,
    },

    ACTIVITY_NOT_OPEN: {
        msg: i18n.ACTIVITY_NOT_OPEN[lan],
        code: _errorCode.ACTIVITY_NOT_OPEN,
    },

    ACTIVITY_NOT_REACH: {
        msg: i18n.ACTIVITY_NOT_REACH[lan],
        code: _errorCode.ACTIVITY_NOT_REACH,
    },

    ACTIVITY_FETCHED: {
        msg: i18n.ACTIVITY_FETCHED[lan],
        code: _errorCode.ACTIVITY_FETCHED,
    },

    REWARD_FETCHED: {
        msg: i18n.REWARD_FETCHED[lan],
        code: _errorCode.REWARD_FETCHED,
    },

    PLAYER_CHEATING: {
        msg: i18n.PLAYER_CHEATING[lan],
        code: _errorCode.PLAYER_CHEATING,
    },

    GUIDE_REWARD_ALREADY: {
        msg: i18n.GUIDE_REWARD_ALREADY[lan],
        code: _errorCode.GUIDE_REWARD_ALREADY,
    },

    SERVICE_SWITCH: {
        code: _errorCode.SERVICE_SWITCH,
        msg: i18n.SERVICE_SWITCH[lan]
    },
    API_SWITCH: {
        code: _errorCode.API_SWITCH,
        // msg: '功能维护升级中，敬请期待'
        msg: 'Function upgrade, please wait...'
        // msg: i18n.API_SWITCH[lan]
    },
    TOKEN_INVALID: {
        code: _errorCode.TOKEN_INVALID,
        msg: i18n.TOKEN_INVALID[lan]
    },
    DB_ERR: {
        code: _errorCode.DB_ERR,
        msg: i18n.DB_ERR[lan]
    },
    DB_REDIS_ERR: {
        code: _errorCode.DB_REDIS_ERR,
        // msg: 'REDIS数据库操作错误'
        msg: 'REDIS Error'
        // msg: i18n.DB_REDIS_ERR[lan]
    },
    PARAM_MISSING: {
        code: _errorCode.PARAM_MISSING,
        msg: i18n.PARAM_MISSING[lan]
    },
    PARAM_WRONG_TYPE: {
        code: _errorCode.PARAM_WRONG_TYPE,
        msg: i18n.PARAM_WRONG_TYPE[lan]
    },
    CACHE_EMPTY: {
        code: _errorCode.CACHE_EMPTY,
        msg: i18n.CACHE_EMPTY[lan]
    },
    FAIL_DOWNLOAD_IMG: {
        code: _errorCode.FAIL_DOWNLOAD_IMG,
        msg: i18n.FAIL_DOWNLOAD_IMG[lan]
    },
    FAIL_OPEN_FILE: {
        code: _errorCode.FAIL_OPEN_FILE,
        msg: i18n.FAIL_OPEN_FILE[lan]
    },
    TOKEN_NULL: {
        code: _errorCode.TOKEN_NULL,
        msg: i18n.TOKEN_NULL[lan]
    },
    TOKEN_FORMAT_ERR: {
        code: _errorCode.TOKEN_FORMAT_ERR,
        msg: i18n.TOKEN_FORMAT_ERR[lan]
    }, //正确格式为id_sault
    NEGATIVE_GOLD_ERR: {
        code: _errorCode.NEGATIVE_GOLD_ERR,
        msg: i18n.NEGATIVE_GOLD_ERR[lan]
    }, //客户端更新金币数量时传入total为负数
    NEGATIVE_DIAMOND_ERR: {
        code: _errorCode.TOKEN_FORMAT_ERR,
        msg: i18n.NEGATIVE_DIAMOND_ERR[lan]
    }, //客户端更新钻石数量时传入total为负数
    SERVER_UPDATE: {
        code: _errorCode.SERVER_UPDATE,
        msg: i18n.SERVER_UPDATE[lan]
    },
    DAILY_RESET: {
        code: _errorCode.DAILY_RESET,
        msg: i18n.DAILY_RESET[lan]
    },
    UID_INVALID: {
        code: _errorCode.UID_INVALID,
        msg: i18n.UID_INVALID[lan]
    },
    UID_CANNOT_FIND: {
        code: _errorCode.UID_CANNOT_FIND,
        msg: i18n.UID_CANNOT_FIND[lan]
    },
    PLAYER_CHEAT: {
        code: _errorCode.PLAYER_CHEAT,
        msg: i18n.PLAYER_CHEAT[lan]
    },

    NOT_SUPPORT_SERVICE: {
        code: _errorCode.NOT_SUPPORT_SERVICE,
        msg: i18n.NOT_SUPPORT_SERVICE[lan]
    },
    NOT_SUPPORT_CHANNEL_LOGIN: {
        code: _errorCode.NOT_SUPPORT_CHANNEL_LOGIN,
        msg: i18n.NOT_SUPPORT_CHANNEL_LOGIN[lan]
    },
    THIRDPARTY_AUTH_FAILED: {
        code: _errorCode.THIRDPARTY_AUTH_FAILED,
        msg: i18n.THIRDPARTY_AUTH_FAILED[lan]
    },
    USER_REGISTE_FAILED: {
        code: _errorCode.USER_REGISTE_FAILED,
        msg: i18n.USER_REGISTE_FAILED[lan]
    },
    USERNAME_EXIST: {
        code: _errorCode.USERNAME_EXIST,
        msg: i18n.USERNAME_EXIST[lan]
    },
    USERNAME_PASSWORD_ERROR: {
        code: _errorCode.USERNAME_PASSWORD_ERROR,
        msg: i18n.USERNAME_PASSWORD_ERROR[lan]
    },
    OLD_PASSWORD_ERROR: {
        code: _errorCode.OLD_PASSWORD_ERROR,
        msg: i18n.OLD_PASSWORD_ERROR[lan]
    },
    SERVER_INTERNAL_ERROR: {
        code: _errorCode.SERVER_INTERNAL_ERROR,
        msg: i18n.SERVER_INTERNAL_ERROR[lan]
    },
    USER_NOT_EXIST: {
        code: _errorCode.USER_NOT_EXIST,
        msg: i18n.USER_NOT_EXIST[lan]
    },
    USER_ILLEGAL_LOGIN: {
        code: _errorCode.USER_ILLEGAL_LOGIN,
        msg: i18n.USER_ILLEGAL_LOGIN[lan]
    },
    LOGINOUT_FAIL: {
        code: _errorCode.LOGINOUT_FAIL,
        msg: i18n.LOGINOUT_FAIL[lan]
    },
    CALL_TOO_OFTEN: {
        code: _errorCode.CALL_TOO_OFTEN,
        msg: i18n.CALL_TOO_OFTEN[lan]
    },
    CALL_SDK_FAIL: {
        code: _errorCode.CALL_SDK_FAIL,
        msg: i18n.CALL_SDK_FAIL[lan]
    },
    SESSION_EXPIRED: {
        code: _errorCode.SESSION_EXPIRED,
        msg: 'Session Expired'
    },
    //
    REPEAT_OPERATION: {
        code: _errorCode.REPEAT_OPERATION,
        msg: i18n.REPEAT_OPERATION[lan]
    },
    VIP_NOT_ENOUFH: {
        code: _errorCode.VIP_NOT_ENOUFH,
        msg: i18n.VIP_NOT_ENOUFH[lan]
    },
    DIAMOND_NOT_ENOUGH: {
        code: _errorCode.DIAMOND_NOT_ENOUGH,
        msg: i18n.DIAMOND_NOT_ENOUGH[lan]
    },
    GOLD_NOT_ENOUGH: {
        code: _errorCode.GOLD_NOT_ENOUGH,
        msg: i18n.GOLD_NOT_ENOUGH[lan]
    },
    DIAMOND_MISSMATCH: {
        code: _errorCode.DIAMOND_MISSMATCH,
        msg: i18n.DIAMOND_MISSMATCH[lan]
    },
    GOLD_MISSMATCH: {
        code: _errorCode.GOLD_MISSMATCH,
        msg: i18n.GOLD_MISSMATCH[lan]
    },
    ACTIVE_DISSATISFY: {
        code: _errorCode.ACTIVE_DISSATISFY,
        msg: i18n.ACTIVE_DISSATISFY[lan]
    },
    DRAW_TIMES_ERR: {
        code: _errorCode.DRAW_TIMES_ERR,
        msg: i18n.DRAW_TIMES_ERR[lan]
    },
    CHIP_NOT_ENOUGH: {
        code: _errorCode.CHIP_NOT_ENOUGH,
        msg: i18n.CHIP_NOT_ENOUGH[lan]
    },
    ACTIVE_EXCHANGE_OVER: {
        code: _errorCode.ACTIVE_EXCHANGE_OVER,
        msg: i18n.ACTIVE_EXCHANGE_OVER[lan]
    },

    PETFISH_LOCKED: {
        code: _errorCode.PETFISH_LOCKED,
        msg: i18n.PETFISH_LOCKED[lan]
    }, //水族馆中没有对应宠物鱼ID
    PETFISH_PLACED: {
        code: _errorCode.PETFISH_PLACED,
        msg: i18n.PETFISH_PLACED[lan]
    },
    PETFISH_STATE_ERR: {
        code: _errorCode.PETFISH_STATE_ERR,
        msg: i18n.PETFISH_STATE_ERR[lan]
    },
    PETFISH_REWARD_ERR_NOTPLACED: {
        code: _errorCode.PETFISH_REWARD_ERR_NOTPLACED,
        msg: i18n.PETFISH_REWARD_ERR_NOTPLACED[lan]
    },
    PETFISH_REWARD_ERR_TIME_NOT_UP: {
        code: _errorCode.PETFISH_REWARD_ERR_TIME_NOT_UP,
        msg: i18n.PETFISH_REWARD_ERR_TIME_NOT_UP[lan]
    },
    GODDESS_LOCKED: {
        code: _errorCode.GODDESS_LOCKED,
        msg: i18n.GODDESS_LOCKED[lan]
    },
    GODDESS_PLACED: {
        code: _errorCode.GODDESS_PLACED,
        msg: i18n.GODDESS_PLACED[lan]
    },
    GODDESS_STATE_ERR: {
        code: _errorCode.GODDESS_STATE_ERR,
        msg: i18n.GODDESS_STATE_ERR[lan]
    },
    GIFT_ADV_GOTTEN: {
        code: _errorCode.GIFT_ADV_GOTTEN,
        msg: i18n.GIFT_ADV_GOTTEN[lan]
    },
    ADV_REWARD_TIMES_FINISH: {
        code: _errorCode.ADV_REWARD_TIMES_FINISH,
        msg: i18n.ADV_REWARD_TIMES_FINISH[lan]
    },

    GODDESS_LEVEL_NOT_REACHED: {
        code: _errorCode.GODDESS_LEVEL_NOT_REACHED,
        msg: i18n.GODDESS_LEVEL_NOT_REACHED[lan]
    },

    GODDESS_INTERACT_REWARD_ALREADY: {
        code: _errorCode.GODDESS_INTERACT_REWARD_ALREADY,
        msg: i18n.GODDESS_INTERACT_REWARD_ALREADY[lan]
    },

    RANK_COUNT_TOO_LARGE: {
        code: _errorCode.RANK_COUNT_TOO_LARGE,
        msg: i18n.RANK_COUNT_TOO_LARGE[lan]
    },

    //
    RANKGAME_WRONG_LOG_ID: {
        code: _errorCode.RANKGAME_WRONG_LOG_ID,
        msg: i18n.RANKGAME_WRONG_LOG_ID[lan]
    },
    RANKGAME_UNLOCKING: {
        code: _errorCode.RANKGAME_UNLOCKING,
        msg: i18n.RANKGAME_UNLOCKING[lan]
    },
    RANKGAME_EMPTY_BOX: {
        code: _errorCode.RANKGAME_EMPTY_BOX,
        msg: i18n.RANKGAME_EMPTY_BOX[lan]
    },
    RANKGAME_LOCKED: {
        code: _errorCode.RANKGAME_LOCKED,
        msg: i18n.RANKGAME_LOCKED[lan]
    },
    RANKGAME_NO_1ST_WIN_BOX: {
        code: _errorCode.RANKGAME_NO_1ST_WIN_BOX,
        msg: i18n.RANKGAME_NO_1ST_WIN_BOX[lan]
    },

    //
    BONUS_GOLDLEVEL_WRONG: {
        code: _errorCode.BONUS_GOLDLEVEL_WRONG,
        msg: i18n.BONUS_GOLDLEVEL_WRONG[lan]
    },
    BONUS_FISH_NOT_ENOUGH: {
        code: _errorCode.BONUS_FISH_NOT_ENOUGH,
        msg: i18n.BONUS_FISH_NOT_ENOUGH[lan]
    },
    BONUS_GOLD_NOT_ENOUGH: {
        code: _errorCode.BONUS_GOLD_NOT_ENOUGH,
        msg: i18n.BONUS_GOLD_NOT_ENOUGH[lan]
    },
    DRAW_TIMES_OVER_LIMIT_TODAY: {
        code: _errorCode.DRAW_TIMES_OVER_LIMIT_TODAY,
        msg: i18n.DRAW_TIMES_OVER_LIMIT_TODAY[lan]
    },

    //
    MIX_WRONG_ITEM: {
        code: _errorCode.MIX_WRONG_ITEM,
        msg: i18n.MIX_WRONG_ITEM[lan]
    },
    MIX_RAW_NOT_ENOUGH: {
        code: _errorCode.MIX_RAW_NOT_ENOUGH,
        msg: i18n.MIX_RAW_NOT_ENOUGH[lan]
    },
    MIX_GOLD_NOT_ENOUGH: {
        code: _errorCode.MIX_GOLD_NOT_ENOUGH,
        msg: i18n.MIX_GOLD_NOT_ENOUGH[lan]
    },

    PACK_USE_WRONG_NUM: {
        code: _errorCode.PACK_USE_WRONG_NUM,
        msg: i18n.PACK_USE_WRONG_NUM[lan]
    },
    PACK_USE_ITEM_NOT_ENOUGH: {
        code: _errorCode.PACK_USE_ITEM_NOT_ENOUGH,
        msg: i18n.PACK_USE_ITEM_NOT_ENOUGH[lan]
    },
    PACK_SELL_ITEM_CANNOT_SELL: {
        code: _errorCode.PACK_SELL_ITEM_CANNOT_SELL,
        msg: i18n.PACK_SELL_ITEM_CANNOT_SELL[lan]
    },
    PACK_ITEM_CANNOT_USE: {
        code: _errorCode.PACK_ITEM_CANNOT_USE,
        msg: i18n.PACK_ITEM_CANNOT_USE[lan]
    },
    PACK_ITEM_NOT_EXIST: {
        code: _errorCode.PACK_ITEM_NOT_EXIST,
        msg: i18n.PACK_ITEM_CANNOT_USE[lan]
    },

    //
    CIK_TOKEN_NOT_ENOUGH: {
        code: _errorCode.CIK_TOKEN_NOT_ENOUGH,
        msg: i18n.CIK_TOKEN_NOT_ENOUGH[lan]
    },
    CIK_TOTAL_NOT_ENOUGH: {
        code: _errorCode.CIK_TOTAL_NOT_ENOUGH,
        msg: i18n.CIK_TOTAL_NOT_ENOUGH[lan]
    },
    CIK_COUNT_NOT_ENOUGH: {
        code: _errorCode.CIK_COUNT_NOT_ENOUGH,
        msg: i18n.CIK_COUNT_NOT_ENOUGH[lan]
    },
    CIK_WRONG_CHANGE_ID: {
        code: _errorCode.CIK_WRONG_CHANGE_ID,
        msg: i18n.CIK_WRONG_CHANGE_ID[lan]
    },
    CIK_WRONG_ITEM: {
        code: _errorCode.CIK_WRONG_ITEM,
        msg: i18n.CIK_WRONG_ITEM[lan]
    },
    CIK_CANCEL_FAIL: {
        code: _errorCode.CIK_CANCEL_FAIL,
        msg: i18n.CIK_CANCEL_FAIL[lan]
    },

    //签到错误码(月签)
    SIGN_REPEAT: {
        code: _errorCode.SIGN_REPEAT,
        msg: i18n.SIGN_REPEAT[lan]
    },
    SIGN_FORBIDDEN1: {
        code: _errorCode.SIGN_FORBIDDEN1,
        msg: i18n.SIGN_FORBIDDEN1[lan]
    },
    SIGN_FORBIDDEN2: {
        code: _errorCode.SIGN_FORBIDDEN2,
        msg: i18n.SIGN_FORBIDDEN2[lan]
    },
    SIGN_DIAMOND_NOT_ENOUGH: {
        code: _errorCode.SIGN_DIAMOND_NOT_ENOUGH,
        msg: i18n.SIGN_DIAMOND_NOT_ENOUGH[lan]
    },
    SIGN_DAY_OUT_OF_RANGE: {
        code: _errorCode.SIGN_DAY_OUT_OF_RANGE,
        msg: i18n.SIGN_DAY_OUT_OF_RANGE[lan]
    },

    //领奖错误码
    MISSION_WRONG_QUEST_ID: {
        code: _errorCode.MISSION_WRONG_QUEST_ID,
        msg: i18n.MISSION_WRONG_QUEST_ID[lan]
    },
    MISSION_NULL: {
        code: _errorCode.MISSION_NULL,
        msg: i18n.MISSION_NULL[lan]
    },
    MISSION_NULL_RECORD: {
        code: _errorCode.MISSION_NULL_RECORD,
        msg: i18n.MISSION_NULL_RECORD[lan]
    },
    MISSION_DISATISFY: {
        code: _errorCode.MISSION_DISATISFY,
        msg: i18n.MISSION_DISATISFY[lan]
    },
    MISSION_GOTTON: {
        code: _errorCode.MISSION_GOTTON,
        msg: i18n.MISSION_GOTTON[lan]
    },
    MISSION_WRONG_ACTIVE_IDX: {
        code: _errorCode.MISSION_WRONG_ACTIVE_IDX,
        msg: i18n.MISSION_WRONG_ACTIVE_IDX[lan]
    },
    MISSION_ACTIVE_DISATISFY: {
        code: _errorCode.MISSION_ACTIVE_DISATISFY,
        msg: i18n.MISSION_ACTIVE_DISATISFY[lan]
    },
    MISSION_WRONG_TYPE: {
        code: _errorCode.MISSION_WRONG_TYPE,
        msg: i18n.MISSION_WRONG_TYPE[lan]
    }, //0:成就，1:日常

    // 兑换码错误(从1201开始)
    CDKEY_INVALID: {
        code: _errorCode.CDKEY_INVALID,
        msg: i18n.CDKEY_INVALID[lan]
    },
    CDKEY_USED: {
        code: _errorCode.CDKEY_USED,
        msg: i18n.CDKEY_USED[lan]
    },
    CDKEY_REPEAT: {
        code: _errorCode.CDKEY_REPEAT,
        msg: i18n.CDKEY_REPEAT[lan]
    },
    CDKEY_EXPIRED: {
        code: _errorCode.CDKEY_EXPIRED,
        msg: i18n.CDKEY_EXPIRED[lan]
    },
    CDKEY_LIMIT: {
        code: _errorCode.CDKEY_LIMIT,
        msg: 'CD key limit expired...'
    },
    // CDKEY_LIMIT: { code: _errorCode.CDKEY_LIMIT, msg: i18n.CDKEY_LIMIT[lan] },

    // 邮件错误(从1211开始)
    MAIL_WRONG_JSON_FORMAT: {
        code: _errorCode.MAIL_WRONG_JSON_FORMAT,
        msg: i18n.MAIL_WRONG_JSON_FORMAT[lan]
    }, //邮件奖励字段reward不是一个标准的JSON字符串
    MAIL_REWARD_NOT_ARRAY: {
        code: _errorCode.MAIL_REWARD_NOT_ARRAY,
        msg: i18n.MAIL_REWARD_NOT_ARRAY[lan]
    }, //邮件奖励字段reward解析后不是一个JSON数组
    MAIL_REWARD_INVALID: {
        code: _errorCode.MAIL_REWARD_INVALID,
        msg: i18n.MAIL_REWARD_INVALID[lan]
    }, //邮件奖励中有物品表中不存在的物品
    MAIL_NULL_RECEIVER_LIST: {
        code: _errorCode.MAIL_NULL_RECEIVER_LIST,
        msg: i18n.MAIL_NULL_RECEIVER_LIST[lan]
    }, //收件人列表为空，不会发送邮件
    MAIL_LIST_EMPTY: {
        code: _errorCode.MAIL_LIST_EMPTY,
        msg: i18n.MAIL_LIST_EMPTY[lan]
    }, //邮件列表为空
    MAIL_CONTENT_ERROR: {
        code: _errorCode.MAIL_CONTENT_ERROR,
        msg: i18n.MAIL_CONTENT_ERROR[lan]
    }, //查询邮件信息失败

    // 女神错误码
    GODDESS_ID_ERROR: {
        code: _errorCode.GODDESS_ID_ERROR,
        msg: i18n.GODDESS_ID_ERROR[lan]
    },
    GODDESS_UNLOCK_IDX_ERROR: {
        code: _errorCode.GODDESS_UNLOCK_IDX_ERROR,
        msg: i18n.GODDESS_UNLOCK_IDX_ERROR[lan]
    },
    GODDESS_UNLOCK_NO_STONE: {
        code: _errorCode.GODDESS_UNLOCK_NO_STONE,
        msg: i18n.GODDESS_UNLOCK_NO_STONE[lan]
    },
    GODDESS_ALREADY_UNLOCKED: {
        code: _errorCode.GODDESS_ALREADY_UNLOCKED,
        msg: i18n.GODDESS_ALREADY_UNLOCKED[lan]
    },
    GODDESS_UP_DATA_WRONG: {
        code: _errorCode.GODDESS_UP_DATA_WRONG,
        msg: i18n.GODDESS_UP_DATA_WRONG[lan]
    },
    GODDESS_UP_LACK_GOLD: {
        code: _errorCode.GODDESS_UP_LACK_GOLD,
        msg: i18n.GODDESS_UP_LACK_GOLD[lan]
    },
    GODDESS_UP_LACK_DEBRIS: {
        code: _errorCode.GODDESS_UP_LACK_DEBRIS,
        msg: i18n.GODDESS_UP_LACK_DEBRIS[lan]
    },
    GODDESS_WEEKREWARD_WRONG_STATUS: {
        code: _errorCode.GODDESS_WEEKREWARD_WRONG_STATUS,
        msg: i18n.GODDESS_WEEKREWARD_WRONG_STATUS[lan]
    },
    GODDESS_WEEKREWARD_UNABLE: {
        code: _errorCode.GODDESS_WEEKREWARD_UNABLE,
        msg: i18n.GODDESS_WEEKREWARD_UNABLE[lan]
    },
    GODDESS_WEEKREWARD_ALREADY: {
        code: _errorCode.GODDESS_WEEKREWARD_ALREADY,
        msg: i18n.GODDESS_WEEKREWARD_ALREADY[lan]
    },
    GODDESS_WEEKREWARD_OUT_OF_RANKS: {
        code: _errorCode.GODDESS_WEEKREWARD_OUT_OF_RANKS,
        msg: i18n.GODDESS_WEEKREWARD_OUT_OF_RANKS[lan]
    },

    // 武器错误码
    WEAPON_INFO_NULL: {
        code: _errorCode.WEAPON_INFO_NULL,
        msg: i18n.WEAPON_INFO_NULL[lan]
    },
    WEAPON_UNLOCK_DIAMOND_NOT_ENOUGH: {
        code: _errorCode.WEAPON_UNLOCK_DIAMOND_NOT_ENOUGH,
        msg: i18n.WEAPON_UNLOCK_DIAMOND_NOT_ENOUGH[lan]
    },
    WEAPON_UNLOCK_MATERIAL_NOT_ENOUGH: {
        code: _errorCode.WEAPON_UNLOCK_MATERIAL_NOT_ENOUGH,
        msg: i18n.WEAPON_UNLOCK_MATERIAL_NOT_ENOUGH[lan]
    },
    WEAPON_LEVELUP_YUNSHI_NOT_ENOUGH: {
        code: _errorCode.WEAPON_LEVELUP_YUNSHI_NOT_ENOUGH,
        msg: i18n.WEAPON_LEVELUP_YUNSHI_NOT_ENOUGH[lan]
    },
    WEAPON_SKIN_DRAW_WRONG_SKIN_ID: {
        code: _errorCode.WEAPON_SKIN_DRAW_WRONG_SKIN_ID,
        msg: i18n.WEAPON_SKIN_DRAW_WRONG_SKIN_ID[lan]
    },
    WEAPON_LEVELUP_REPEAT: {
        code: _errorCode.WEAPON_LEVELUP_REPEAT,
        msg: i18n.WEAPON_LEVELUP_REPEAT[lan]
    },

    // 玩家升级
    LEVELUP_EXP_NOT_ENOUGH: {
        code: _errorCode.LEVELUP_EXP_NOT_ENOUGH,
        msg: i18n.LEVELUP_EXP_NOT_ENOUGH[lan]
    },
    LEVELUP_EXP_TOO_MUCH: {
        code: _errorCode.LEVELUP_EXP_TOO_MUCH,
        msg: i18n.LEVELUP_EXP_TOO_MUCH[lan]
    },
    LEVELUP_MAX_LEVEL: {
        code: _errorCode.LEVELUP_MAX_LEVEL,
        msg: i18n.LEVELUP_MAX_LEVEL[lan]
    },

    // 商品购买
    BUY_WRONG_SHOP_ID: {
        code: _errorCode.BUY_WRONG_SHOP_ID,
        msg: i18n.BUY_WRONG_SHOP_ID[lan]
    },
    BUY_WRONG_GIFT_TIME: {
        code: _errorCode.BUY_WRONG_GIFT_TIME,
        msg: i18n.BUY_WRONG_GIFT_TIME[lan]
    },
    BUY_GIFT_COUNT_MAX: {
        code: _errorCode.BUY_GIFT_COUNT_MAX,
        msg: i18n.BUY_GIFT_COUNT_MAX[lan]
    },
    BUY_FUND_ALREADY: {
        code: _errorCode.BUY_FUND_ALREADY,
        msg: i18n.BUY_FUND_ALREADY[lan]
    },
    BUY_GIFT_CFG_ERR: {
        code: _errorCode.BUY_GIFT_CFG_ERR,
        msg: i18n.BUY_GIFT_CFG_ERR[lan]
    },

    // 订单相关
    ORDER_CREATE_FAIL: {
        code: _errorCode.ORDER_CREATE_FAIL,
        msg: i18n.ORDER_CREATE_FAIL[lan]
    },
    ORDER_ILLEGAL: {
        code: _errorCode.ORDER_ILLEGAL,
        msg: i18n.ORDER_ILLEGAL[lan]
    },
    ORDER_PAY_FAIL: {
        code: _errorCode.ORDER_PAY_FAIL,
        msg: i18n.ORDER_PAY_FAIL[lan]
    },
    ORDER_REPEAT: {
        code: _errorCode.ORDER_REPEAT,
        msg: i18n.ORDER_REPEAT[lan]
    },
    NOT_SUPPORT_CHANNEL_PAY: {
        code: _errorCode.NOT_SUPPORT_CHANNEL_PAY,
        msg: i18n.NOT_SUPPORT_CHANNEL_PAY[lan]
    },
    BUY_GOODS_ILLEGAL: {
        code: _errorCode.BUY_GOODS_ILLEGAL,
        msg: i18n.BUY_GOODS_ILLEGAL[lan]
    },

    AMOUNT_NOT_ENOUGH: {
        code: _errorCode.AMOUNT_NOT_ENOUGH,
        // msg: '余额不足'
        msg: "Not enough money"
        // msg: i18n.AMOUNT_NOT_ENOUGH[lan]
    },

    SDK_ACCESS_TOKEN_INVALID: {
        code: _errorCode.SDK_ACCESS_TOKEN_INVALID,
        // msg: '第三方SDK接口凭证无效'
        msg: "SDK access token invalid"
        // msg: i18n.SDK_ACCESS_TOKEN_INVALID[lan]
    },

    // 订单相关
    CHART_REWARD_FAIL: {
        code: _errorCode.CHART_REWARD_FAIL,
        msg: i18n.CHART_REWARD_FAIL[lan]
    },

    // 活动相关
    ACTIVE_CLICK_TOO_QUICK: {
        code: _errorCode.ACTIVE_CLICK_TOO_QUICK,
        msg: i18n.ACTIVE_CLICK_TOO_QUICK[lan]
    },

    ACTIVE_NEWBIE_END: {
        code: _errorCode.ACTIVE_NEWBIE_END,
        // msg: "新手狂欢活动已经结束"
        msg: "Newbie ended"
        // msg: i18n.ACTIVE_NEWBIE_END[lan]
    },

    ACTIVE_NEWBIE_REWARD_NOT_SATISFIED: {
        code: _errorCode.ACTIVE_NEWBIE_REWARD_NOT_SATISFIED,
        // msg: "新手狂欢活动奖励领取条件不满足"
        msg: "Newbie not satisfied"
        // msg: i18n.ACTIVE_NEWBIE_END[lan]
    },

    // 激光
    LASER_CHEAT: {
        code: _errorCode.LASER_CHEAT,
        msg: i18n.LASER_CHEAT[lan]
    },

    // VIP
    VIP_DAILY_REWARD_GOTTEN: {
        code: _errorCode.VIP_DAILY_REWARD_GOTTEN,
        msg: i18n.VIP_DAILY_REWARD_GOTTEN[lan]
    },

    // 范围
    RANGE_SCENE_CATCHRATE_LOW: {
        code: _errorCode.RANGE_SCENE_CATCHRATE_LOW,
        // msg: "捕获率设置值低于最低限制0.5"
        msg: "Catch rate below 0.5"
        // msg: i18n.RANGE_SCENE_CATCHRATE_LOW[lan]
    },
    RANGE_SCENE_CATCHRATE_HIGH: {
        code: _errorCode.RANGE_SCENE_CATCHRATE_HIGH,
        // msg: "捕获率设置值高于最高限制1.5"
        msg: "Catch rate over 1.5"
        // msg: i18n.RANGE_SCENE_CATCHRATE_HIGH[lan]
    },

    DATA_NULL_ERROR: {
        code: _errorCode.DATA_NULL_ERROR,
        msg: i18n.DATA_NULL_ERROR[lan]
    },

    //聊天
    CHAT_COST_ERROR: {
        code: _errorCode.CHAT_COST_ERROR,
        msg: i18n.CHAT_COST_ERROR[lan]
    },
    CHAT_FRIEND_ERROR: {
        code: _errorCode.CHAT_FRIEND_ERROR,
        msg: i18n.CHAT_FRIEND_ERROR[lan]
    },
    CHAT_REWARD_ERROR: {
        code: _errorCode.CHAT_REWARD_ERROR,
        msg: i18n.CHAT_REWARD_ERROR[lan]
    },
    CHAT_REWARD_LESS_ERROR: {
        code: _errorCode.CHAT_REWARD_LESS_ERROR,
        msg: i18n.CHAT_REWARD_LESS_ERROR[lan]
    },
    CHAT_FRIEND_ALREADY_ERROR: {
        code: _errorCode.CHAT_FRIEND_ALREADY_ERROR,
        msg: i18n.CHAT_FRIEND_ALREADY_ERROR[lan]
    },
    CHAT_FRIEND_GAME_ERROR: {
        code: _errorCode.CHAT_FRIEND_GAME_ERROR,
        msg: i18n.CHAT_FRIEND_GAME_ERROR[lan]
    },

    CHAT_ERROR_CANNOT_SEND_MSG_TO_YOURSLEF: {
        code: _errorCode.CHAT_ERROR_CANNOT_SEND_MSG_TO_YOURSLEF,
        msg: i18n.CHAT_ERROR_CANNOT_SEND_MSG_TO_YOURSLEF[lan]
    },
    CHAT_ERROR_FORBIDDEN_BY_ADMIN: {
        code: _errorCode.CHAT_ERROR_FORBIDDEN_BY_ADMIN,
        msg: i18n.CHAT_ERROR_FORBIDDEN_BY_ADMIN[lan]
    },
    CHAT_ERROR_CANNOT_ADD_YOURSELF_AS_FRIEND: {
        code: _errorCode.CHAT_ERROR_CANNOT_ADD_YOURSELF_AS_FRIEND,
        msg: i18n.CHAT_ERROR_CANNOT_ADD_YOURSELF_AS_FRIEND[lan]
    },
    CHAT_ERROR_FRIEND_LIMIT_ME: {
        code: _errorCode.CHAT_ERROR_FRIEND_LIMIT_ME,
        msg: i18n.CHAT_ERROR_FRIEND_LIMIT_ME[lan]
    },
    CHAT_ERROR_FRIEND_LIMIT_TARGET: {
        code: _errorCode.CHAT_ERROR_CANNOT_SEND_MSG_TO_YOURSLEF,
        msg: i18n.CHAT_ERROR_FRIEND_LIMIT_TARGET[lan]
    },


    // 补漏
    DAY_EXTRA_REWARD_NOT_SATISFIED: {
        code: _errorCode.DAY_EXTRA_REWARD_NOT_SATISFIED,
        msg: i18n.DAY_EXTRA_REWARD_NOT_SATISFIED[lan]
    }, //玩家不满足领取每日额外奖励的条件
    DAY_EXTRA_REWARD_ALREADY: {
        code: _errorCode.DAY_EXTRA_REWARD_ALREADY,
        msg: i18n.DAY_EXTRA_REWARD_ALREADY[lan]
    }, //玩家不满足领取每日额外奖励的条件

    INVITE_NULL_FRIEND: {
        code: _errorCode.INVITE_NULL_FRIEND,
        msg: i18n.INVITE_NULL_FRIEND[lan]
    }, //邀请的好友列表为空
    WRONG_JSON_FORMAT: {
        code: _errorCode.WRONG_JSON_FORMAT,
        msg: i18n.WRONG_JSON_FORMAT[lan]
    }, //json数据异常
    MONTH_CARD_NORMAL_ALREADY: {
        code: _errorCode.MONTH_CARD_NORMAL_ALREADY,
        msg: i18n.MONTH_CARD_NORMAL_ALREADY[lan]
    }, //已经开通普通月卡
    MONTH_CARD_SENIOR_ALREADY: {
        code: _errorCode.MONTH_CARD_SENIOR_ALREADY,
        msg: i18n.MONTH_CARD_SENIOR_ALREADY[lan]
    }, //已经开通土豪月卡
    WEEK_CARD_ALREADY: {
        code: _errorCode.WEEK_CARD_ALREADY,
        msg: i18n.WEEK_CARD_ALREADY[lan]
    }, //已经开通周卡
    INVITE_NOT_ENOUGH: {
        code: _errorCode.INVITE_NOT_ENOUGH,
        msg: i18n.INVITE_NOT_ENOUGH[lan]
    }, //邀请人数不足

    CANNOT_INVITE_YOURSLEF: {
        code: _errorCode.CANNOT_INVITE_YOURSLEF,
        msg: i18n.CANNOT_INVITE_YOURSLEF[lan]
    }, //不能邀请自己
    SOCIAL_REWARD_NOT_SATISFIED: {
        code: _errorCode.SOCIAL_REWARD_NOT_SATISFIED,
        msg: i18n.SOCIAL_REWARD_NOT_SATISFIED[lan]
    }, //玩家不满足领取社交奖励的条件

    OPENID_ILLEGAL: {
        code: _errorCode.OPENID_ILLEGAL,
        msg: i18n.OPENID_ILLEGAL[lan]
    },

    TIME_NOT_REACH: {
        code: _errorCode.TIME_NOT_REACH,
        msg: i18n.TIME_NOT_REACH[lan]
    },
    ACCOUNT_NULL: {
        code: _errorCode.ACCOUNT_NULL,
        msg: i18n.ACCOUNT_NULL[lan]
    },
    ACCOUNT_CHECK_ERROR: {
        code: _errorCode.ACCOUNT_CHECK_ERROR,
        msg: i18n.ACCOUNT_CHECK_ERROR[lan]
    },
    ACCOUNT_NOT_REGIST: {
        code: _errorCode.ACCOUNT_NOT_REGIST,
        msg: i18n.ACCOUNT_NOT_REGIST[lan]
    },
    NO_LIMIT_ITEM: {
        code: _errorCode.NO_LIMIT_ITEM,
        msg: i18n.NO_LIMIT_ITEM[lan]
    },
    NOT_LIMIT_ITEM: {
        code: _errorCode.NOT_LIMIT_ITEM,
        msg: i18n.NOT_LIMIT_ITEM[lan]
    },
    WRONG_TIMESTAMP: {
        code: _errorCode.WRONG_TIMESTAMP,
        msg: i18n.WRONG_TIMESTAMP[lan]
    },
    ITEM_NOT_EXIST: {
        code: _errorCode.ITEM_NOT_EXIST,
        msg: i18n.ITEM_NOT_EXIST[lan]
    },
    CARD_TYPE_WRONG: {
        code: _errorCode.CARD_TYPE_WRONG,
        msg: i18n.CARD_TYPE_WRONG[lan]
    },
    CARD_AMOUNT_WRONG: {
        code: _errorCode.CARD_AMOUNT_WRONG,
        msg: 'Không thành vấn đề, không hỗ trợ thẻ'
    },
    // ITEM_TYPE_ILLEGAL: {
    //     code: _errorCode.ITEM_TYPE_ILLEGAL,
    //     msg: i18n.ITEM_TYPE_ILLEGAL[lan]
    // },
    ITEM_TYPE_ILLEGAL: {
        code: _errorCode.ITEM_TYPE_ILLEGAL,
        msg: 'Item Type Illegal'
    },

    //--------------------------------------------------------------------------

    FIRST_RECHARGE_NO_RMB: {
        code: _errorCode.FIRST_RECHARGE_NO_RMB,
        msg: i18n.FIRST_RECHARGE_NO_RMB[lan]
    },
    FIRST_RECHARGE_ALREADY: {
        code: _errorCode.FIRST_RECHARGE_ALREADY,
        msg: i18n.FIRST_RECHARGE_ALREADY[lan]
    },


    GOLD_NOT_ENOUTH: {
        msg: i18n.GOLD_NOT_ENOUTH[lan],
        code: _errorCode.GOLD_NOT_ENOUTH,
    },
    WEAPON_LEVEL_LOW: {
        msg: i18n.WEAPON_LEVEL_LOW[lan],
        code: _errorCode.WEAPON_LEVEL_LOW,
    },
    NOT_SUPPORT_ROOMMODE: {
        msg: i18n.NOT_SUPPORT_ROOMMODE[lan],
        code: _errorCode.NOT_SUPPORT_ROOMMODE,
    },
    NOT_SUPPORT_SCENETYPE: {
        msg: i18n.NOT_SUPPORT_SCENETYPE[lan],
        code: _errorCode.NOT_SUPPORT_SCENETYPE,
    },

    NOT_MATCH_WEAPON: {
        msg: i18n.NOT_MATCH_WEAPON[lan],
        code: _errorCode.NOT_MATCH_WEAPON,
    },

    INVALID_SKILL: {
        msg: i18n.INVALID_SKILL[lan],
        code: _errorCode.INVALID_SKILL,
    },

    INVALID_SKILL_STATE: {
        msg: i18n.INVALID_SKILL_STATE[lan],
        code: _errorCode.INVALID_SKILL_STATE,
    },

    LOCK_FAILD: {
        msg: i18n.LOCK_FAILD[lan],
        code: _errorCode.LOCK_FAILD,
    },

    INVALID_SKILL_ING: {
        msg: i18n.INVALID_SKILL_ING[lan],
        code: _errorCode.INVALID_SKILL_ING,
    },
    NOT_SUPPORT_OPERATE: {
        msg: i18n.NOT_SUPPORT_OPERATE[lan],
        code: _errorCode.NOT_SUPPORT_OPERATE,
    },
    INTERFACE_DEVELOPPING: {
        msg: i18n.INTERFACE_DEVELOPPING[lan],
        code: _errorCode.INTERFACE_DEVELOPPING,
    },

    INVALID_WP_LASER: {
        msg: i18n.INVALID_WP_LASER[lan],
        code: _errorCode.INVALID_WP_LASER,
    },
    INVALID_WP_SKIN: {
        msg: i18n.INVALID_WP_SKIN[lan],
        code: _errorCode.INVALID_WP_SKIN,
    },
    INVALID_WP_BK: {
        msg: i18n.INVALID_WP_BK[lan],
        code: _errorCode.INVALID_WP_BK,
    },

    INVALID_WP_FIRE: {
        msg: i18n.INVALID_WP_FIRE[lan],
        code: _errorCode.INVALID_WP_FIRE,
    },

    INVALID_GOD: {
        msg: i18n.INVALID_GOD[lan],
        code: _errorCode.INVALID_GOD,
    },

    LOCK_GOD: {
        msg: i18n.LOCK_GOD[lan],
        code: _errorCode.LOCK_GOD,
    },

    MATCH_REPEATE_JOIN: {
        msg: i18n.MATCH_REPEATE_JOIN[lan],
        code: _errorCode.MATCH_REPEATE_JOIN,
    },

    MATCH_ROOM_NOPLAYER: {
        msg: i18n.MATCH_ROOM_NOPLAYER[lan],
        code: _errorCode.MATCH_ROOM_NOPLAYER,
    },

    MATCH_ROOM_NOT_EXIST: {
        msg: i18n.MATCH_ROOM_NOT_EXIST[lan],
        code: _errorCode.MATCH_ROOM_NOT_EXIST,
    },

    MATCH_ROOM_GAMEOVER: {
        msg: i18n.MATCH_ROOM_GAMEOVER[lan],
        code: _errorCode.MATCH_ROOM_GAMEOVER,
    },

    PIRATE_NOT_DONE: {
        msg: i18n.PIRATE_NOT_DONE[lan],
        code: _errorCode.PIRATE_NOT_DONE,
    },

    BROKE_OVER_TODAY: {
        msg: i18n.BROKE_OVER_TODAY[lan],
        code: _errorCode.BROKE_OVER_TODAY,
    },

    BROKE_INVALID: {
        msg: i18n.BROKE_INVALID[lan],
        code: _errorCode.BROKE_INVALID,
    },

    MINIGAME_INVALID: {
        msg: i18n.MINIGAME_INVALID[lan],
        code: _errorCode.MINIGAME_INVALID,
    },

    MINIGAME_TYPE_INVALID: {
        msg: i18n.MINIGAME_TYPE_INVALID[lan],
        code: _errorCode.MINIGAME_TYPE_INVALID,
    },

    WEAPON_LEVEL_INVALID: {
        msg: i18n.WEAPON_LEVEL_INVALID[lan],
        code: _errorCode.WEAPON_LEVEL_INVALID,
    },

    RM_WEAPON_LEVEL_LIMIT: {
        msg: i18n.RM_WEAPON_LEVEL_LIMIT[lan],
        code: _errorCode.RM_WEAPON_LEVEL_LIMIT,
    },
    DESIGN_CFGS_NOT_EXIST: {
        msg: '配置文件不存在',
        code: _errorCode.DESIGN_CFGS_NOT_EXIST,
    },
    NOT_SUPPORT_MODE_PLAYER: {
        msg: '不支持此模式玩家',
        code: _errorCode.NOT_SUPPORT_MODE_PLAYER,
    },
    WEAPON_TURN_GOLD_TOO_LOW: {
        msg: '你的金币过低，不能使用更高倍率',
        code: _errorCode.WEAPON_TURN_GOLD_TOO_LOW,
    },
    ARENA_OTHER_PLAYER_MATCHING: {
        msg: '其他玩家挑战中',
        code: _errorCode.ARENA_OTHER_PLAYER_MATCHING,
    },
    MATCH_WAIT_TIMEOUT: {
        msg: '比赛已经开始了，自己创建房间吧',
        code: _errorCode.MATCH_WAIT_TIMEOUT,
    },
    PLAYER_READYING: {
        msg: '玩家还未准备好，拒绝操作',
        code: _errorCode.PLAYER_READYING,
    },
    ARENA_MATCH_NOT_EXIST: {
        msg: '竞技场对战不存在',
        code: _errorCode.ARENA_MATCH_NOT_EXIST,
    },
    ARENA_NOT_FINISHED: {
        msg: '对战未完成，请先完成对战',
        code: _errorCode.ARENA_NOT_FINISHED,
    },
    ARENA_MATCHID_INVALID: {
        msg: '比赛ID无效',
        code: _errorCode.ARENA_MATCHID_INVALID,
    },
    ARENA_MATCHID_BUSY: {
        msg: '有人考虑挑战此比赛，稍后再试试',
        code: _errorCode.ARENA_MATCHID_BUSY,
    },
    ARENA_MATCH_SELF: {
        msg: '不能挑战自己创建的比赛',
        code: _errorCode.ARENA_MATCH_SELF,
    },
    ARENA_MATCH_FINISH: {
        msg: '对战已经结束',
        code: _errorCode.ARENA_MATCH_FINISH,
    },

    // TODO: 配置表增加字段后解开注释
    // FIRST_RECHARGE_NO_RMB: { code: _errorCode.FIRST_RECHARGE_NO_RMB, msg: i18n.FIRST_RECHARGE_NO_RMB[lan] },
    // FIRST_RECHARGE_ALREADY: { code: _errorCode.FIRST_RECHARGE_ALREADY, msg: i18n.FIRST_RECHARGE_ALREADY[lan] },
};

module.exports.ERROR_CODE = _errorCode;
module.exports.ERROR_OBJ = _errorObj;