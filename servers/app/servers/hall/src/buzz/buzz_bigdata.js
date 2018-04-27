const DateUtil = require('../utils/DateUtil');
const DaoUtil = require('../utils/DaoUtil');
const RedisUtil = require('../utils/RedisUtil');
const REDIS_KEYS = require('../../../../database/consts').REDISKEY,
    BIG_DATA = REDIS_KEYS.BIG_DATA;
const common_log_const_cfg = require('../../../../utils/imports').DESIGN_CFG.common_log_const_cfg;

let GOLD_MAP = {};
GOLD_MAP[common_log_const_cfg.GAME_FIGHTING] = {
    gain: BIG_DATA.GOLD_GAIN_FIRE,
    cost: BIG_DATA.GOLD_COST_FIRE,
};
// 被BOSS偷取的金币算在捕鱼场景中
GOLD_MAP[common_log_const_cfg.BE_STOLEND] = {
    gain: BIG_DATA.GOLD_GAIN_FIRE,
    cost: BIG_DATA.GOLD_COST_FIRE,
};
GOLD_MAP[common_log_const_cfg.GOLDFISH_GAIN] = {
    gain: BIG_DATA.GOLD_GAIN_BONUSDRAW,
    cost: BIG_DATA.GOLD_COST_BONUSDRAW,
};
GOLD_MAP[common_log_const_cfg.MINI_GAME] = {
    gain: BIG_DATA.GOLD_GAIN_MINIGAME,
    cost: BIG_DATA.GOLD_COST_MINIGAME,
};
GOLD_MAP[common_log_const_cfg.NUCLER_DROP] = {
    gain: BIG_DATA.GOLD_GAIN_NUCLEAR,
    cost: BIG_DATA.GOLD_COST_NUCLEAR,
};
// yTODO: 需要注意在服务器端宠物鱼升级是否调用了add_gold_log
GOLD_MAP[common_log_const_cfg.PET_FISH_UPGRADE] = {
    gain: BIG_DATA.GOLD_GAIN_PETFISH_UPGRADE,
    cost: BIG_DATA.GOLD_COST_PETFISH_UPGRADE,
};
GOLD_MAP[common_log_const_cfg.NUCLER_LASER] = {
    gain: BIG_DATA.GOLD_GAIN_LASER,
    cost: BIG_DATA.GOLD_COST_LASER,
};
GOLD_MAP[common_log_const_cfg.CHARTS_REWARD] = {
    gain: BIG_DATA.GOLD_GAIN_CHARTS_REWARD,
    cost: BIG_DATA.GOLD_COST_CHARTS_REWARD,
};

GOLD_MAP[common_log_const_cfg.GOLD_BUY] = {
    gain: BIG_DATA.GOLD_GAIN_GOLD_SHOPPING,
    cost: BIG_DATA.GOLD_COST_GOLD_SHOPPING,
};
GOLD_MAP[common_log_const_cfg.ACTIVE_DRAW] = {
    gain: BIG_DATA.GOLD_GAIN_ACTIVE_DRAW,
    cost: BIG_DATA.GOLD_COST_ACTIVE_DRAW,
};
GOLD_MAP[common_log_const_cfg.TIMEGIFT_BUY] = {
    gain: BIG_DATA.GOLD_GAIN_TIMEGIFT_BUY,
    cost: BIG_DATA.GOLD_COST_TIMEGIFT_BUY,
};
GOLD_MAP[common_log_const_cfg.DAILY_GAIN] = {
    gain: BIG_DATA.GOLD_GAIN_DAILY_GAIN,
    cost: BIG_DATA.GOLD_COST_DAILY_GAIN,
};
GOLD_MAP[common_log_const_cfg.ACHIEVE_GAIN] = {
    gain: BIG_DATA.GOLD_GAIN_ACHIEVE_GAIN,
    cost: BIG_DATA.GOLD_COST_ACHIEVE_GAIN,
};
GOLD_MAP[common_log_const_cfg.FUND_BUY] = {
    gain: BIG_DATA.GOLD_GAIN_FUND_BUY,
    cost: BIG_DATA.GOLD_COST_FUND_BUY,
};
GOLD_MAP[common_log_const_cfg.MONTH_SIGN_REWARD] = {
    gain: BIG_DATA.GOLD_GAIN_MONTH_SIGN_REWARD,
    cost: BIG_DATA.GOLD_COST_MONTH_SIGN_REWARD,
};
GOLD_MAP[common_log_const_cfg.SHARE_REWARD] = {
    gain: BIG_DATA.GOLD_GAIN_SHARE_REWARD,
    cost: BIG_DATA.GOLD_COST_SHARE_REWARD,
};
GOLD_MAP[common_log_const_cfg.VIPGIFT_BUY] = {
    gain: BIG_DATA.GOLD_GAIN_VIPGIFT_BUY,
    cost: BIG_DATA.GOLD_COST_VIPGIFT_BUY,
};
GOLD_MAP[common_log_const_cfg.ACTIVE_QUEST] = {
    gain: BIG_DATA.GOLD_GAIN_ACTIVE_QUEST,
    cost: BIG_DATA.GOLD_COST_ACTIVE_QUEST,
};
GOLD_MAP[common_log_const_cfg.ACTIVE_EXCHANGE] = {
    gain: BIG_DATA.GOLD_GAIN_ACTIVE_EXCHANGE,
    cost: BIG_DATA.GOLD_COST_ACTIVE_EXCHANGE,
};
GOLD_MAP[common_log_const_cfg.ACTIVE_CHARGE] = {
    gain: BIG_DATA.GOLD_GAIN_ACTIVE_CHARGE,
    cost: BIG_DATA.GOLD_COST_ACTIVE_CHARGE,
};
GOLD_MAP[common_log_const_cfg.INVITE_REWARD] = {
    gain: BIG_DATA.GOLD_GAIN_INVITE_REWARD,
    cost: BIG_DATA.GOLD_COST_INVITE_REWARD,
};
GOLD_MAP[common_log_const_cfg.BOX_REWARD] = {
    gain: BIG_DATA.GOLD_GAIN_BOX_REWARD,
    cost: BIG_DATA.GOLD_COST_BOX_REWARD,
};
GOLD_MAP[common_log_const_cfg.FIRST_BUY] = {
    gain: BIG_DATA.GOLD_GAIN_FIRST_BUY,
    cost: BIG_DATA.GOLD_COST_FIRST_BUY,
};
GOLD_MAP[common_log_const_cfg.CARD_REWARD] = {
    gain: BIG_DATA.GOLD_GAIN_CARD_REWARD,
    cost: BIG_DATA.GOLD_COST_CARD_REWARD,
};
GOLD_MAP[common_log_const_cfg.ENSHRINE_REWARD] = {
    gain: BIG_DATA.GOLD_GAIN_ENSHRINE_REWARD,
    cost: BIG_DATA.GOLD_COST_ENSHRINE_REWARD,
};

let QUERY_MAP = [
    BIG_DATA.GOLD_COST_TOTAL,
    BIG_DATA.GOLD_COST_FIRE,
    BIG_DATA.GOLD_COST_LASER,
    BIG_DATA.GOLD_COST_BONUSDRAW,
    BIG_DATA.GOLD_COST_MINIGAME,
    BIG_DATA.GOLD_COST_NUCLEAR,
    BIG_DATA.GOLD_COST_PETFISH_UPGRADE,
    BIG_DATA.GOLD_COST_CHARTS_REWARD,
    BIG_DATA.GOLD_COST_GOLD_SHOPPING,
    BIG_DATA.GOLD_COST_ACTIVE_DRAW,
    BIG_DATA.GOLD_COST_TIMEGIFT_BUY,
    BIG_DATA.GOLD_COST_DAILY_GAIN,
    BIG_DATA.GOLD_COST_ACHIEVE_GAIN,
    BIG_DATA.GOLD_COST_FUND_BUY,
    BIG_DATA.GOLD_COST_MONTH_SIGN_REWARD,

    BIG_DATA.GOLD_COST_SHARE_REWARD,
    BIG_DATA.GOLD_COST_VIPGIFT_BUY,
    BIG_DATA.GOLD_COST_ACTIVE_QUEST,
    BIG_DATA.GOLD_COST_ACTIVE_EXCHANGE,
    BIG_DATA.GOLD_COST_ACTIVE_CHARGE,
    BIG_DATA.GOLD_COST_INVITE_REWARD,
    BIG_DATA.GOLD_COST_BOX_REWARD,
    BIG_DATA.GOLD_COST_FIRST_BUY,
    BIG_DATA.GOLD_COST_CARD_REWARD,
    BIG_DATA.GOLD_COST_ENSHRINE_REWARD,

    BIG_DATA.GOLD_COST_OTHER,

    BIG_DATA.GOLD_GAIN_TOTAL,
    BIG_DATA.GOLD_GAIN_FIRE,
    BIG_DATA.GOLD_GAIN_LASER,
    BIG_DATA.GOLD_GAIN_BONUSDRAW,
    BIG_DATA.GOLD_GAIN_MINIGAME,
    BIG_DATA.GOLD_GAIN_NUCLEAR,
    BIG_DATA.GOLD_GAIN_PETFISH_UPGRADE,
    BIG_DATA.GOLD_GAIN_CHARTS_REWARD,
    BIG_DATA.GOLD_GAIN_GOLD_SHOPPING,
    BIG_DATA.GOLD_GAIN_ACTIVE_DRAW,
    BIG_DATA.GOLD_GAIN_TIMEGIFT_BUY,
    BIG_DATA.GOLD_GAIN_DAILY_GAIN,
    BIG_DATA.GOLD_GAIN_ACHIEVE_GAIN,
    BIG_DATA.GOLD_GAIN_FUND_BUY,
    BIG_DATA.GOLD_GAIN_MONTH_SIGN_REWARD,

    BIG_DATA.GOLD_GAIN_SHARE_REWARD,
    BIG_DATA.GOLD_GAIN_VIPGIFT_BUY,
    BIG_DATA.GOLD_GAIN_ACTIVE_QUEST,
    BIG_DATA.GOLD_GAIN_ACTIVE_EXCHANGE,
    BIG_DATA.GOLD_GAIN_ACTIVE_CHARGE,
    BIG_DATA.GOLD_GAIN_INVITE_REWARD,
    BIG_DATA.GOLD_GAIN_BOX_REWARD,
    BIG_DATA.GOLD_GAIN_FIRST_BUY,
    BIG_DATA.GOLD_GAIN_CARD_REWARD,
    BIG_DATA.GOLD_GAIN_ENSHRINE_REWARD,

    BIG_DATA.GOLD_GAIN_OTHER,

    BIG_DATA.GOLD_LEFT_TOTAL,
    BIG_DATA.GOLD_LEFT_NUM,
];

let DEBUG = 0;
let TAG = "【buzz_bigdata】";


//==========================================================
// exports
//==========================================================

// Gold
exports.recordGold = recordGold;
exports.genGoldLeftToday = genGoldLeftToday;
exports.genGoldHistory = genGoldHistory;
exports.queryGold = queryGold;
exports.queryLog = queryLog;


//==========================================================
// implement
//==========================================================
/**
 * 记录金币的消耗和获取, 以及每个活跃用户的存量
 */
function recordGold(uid, cost, gain, total, scene) {
    const FUNC = TAG + "recordGold()---";

    // yDONE: 限制玩家等级在15级以上才进行统计
    RedisUtil.hget(REDIS_KEYS.LEVEL, uid, function (err, res) {
        if (err) return logger.error(FUNC + "查询玩家等级数据失败！");
        if (res) {
            let level = parseInt(res);
            if (level > 15) {
                _recordGold();
            }
        }
    });
    // 不限制玩家游戏等级
    // _recordGold();

    function _recordGold() {
        scene = parseInt(scene);
        scene = scene % 100;
        let map_data = GOLD_MAP[scene];
        // logger.info(FUNC + "map_data:", map_data);
        if (!map_data) map_data = {
            gain: BIG_DATA.GOLD_GAIN_OTHER,
            cost: BIG_DATA.GOLD_COST_OTHER,
        };

        if (gain > 0) {
            RedisUtil.hincrby(map_data.gain, uid, gain);
            RedisUtil.incrby(map_data.gain + ":today", gain);
            RedisUtil.hincrby(BIG_DATA.GOLD_GAIN_TOTAL, uid, gain);
            RedisUtil.incrby(BIG_DATA.GOLD_GAIN_TOTAL + ":today", gain);
        }
        if (cost > 0) {
            RedisUtil.hincrby(map_data.cost, uid, cost);
            RedisUtil.incrby(map_data.cost + ":today", cost);
            RedisUtil.hincrby(BIG_DATA.GOLD_COST_TOTAL, uid, cost);
            RedisUtil.incrby(BIG_DATA.GOLD_COST_TOTAL + ":today", cost);
        }

        RedisUtil.hset(BIG_DATA.GOLD_LEFT_TOTAL, uid, total);
    }
}

/**
 * 产生每日活跃用户金币存量的总数
 * 可以设置为每分钟更新.
 */
function genGoldLeftToday() {
    const FUNC = TAG + "genGoldLeftToday()---";

    if (DEBUG) logger.info(FUNC + "CALL...");

    let sum = 0;
    let count = 0;
    RedisUtil.repeatHscan(BIG_DATA.GOLD_LEFT_TOTAL, 0, 100,
        function op(res, nextCursor) {
            if (DEBUG) logger.info(FUNC + "res:", res);
            for (let i = 0; i < res[1].length; i += 2) {
                sum += parseInt(res[1][i + 1]);
                count++;
            }
            nextCursor();
        },
        function next() {
            if (DEBUG) logger.info(FUNC + "设置剩余总量-sum:", sum);
            RedisUtil.set(BIG_DATA.GOLD_LEFT_TOTAL + ":today", sum);
            RedisUtil.set(BIG_DATA.GOLD_LEFT_NUM + ":today", count);
        }
    );
}

/**
 * 产生历史的金币数据(每日的获取总量, 消耗总量, 金币存量)
 */
function genGoldHistory(cb) {
    const FUNC = TAG + "genGoldHistory()---";

    logger.info(FUNC + "CALL...");

    let data = [];
    for (let idx = 0; idx < QUERY_MAP.length; idx++) {
        data.push(['get', QUERY_MAP[idx] + ":today"]);
    }

    RedisUtil.multi(data, function (err, res) {

        if (err) return cb && cb(err);

        let ret = [];

        for (let i = 0; i < QUERY_MAP.length; i++) {
            
            let hashkey = QUERY_MAP[i] + ":history";
            let date = DateUtil.getCurrentByFormat('yyyy-MM-dd');
            RedisUtil.hset(hashkey, date, res[i]);
        }

        logger.info(FUNC + "产生历史的金币数据成功");

        cb && cb(null, "产生历史的金币数据成功");

        // 重置本日数据
        clearGoldData();
    });
}

/**
 * 重置所有today中的数据和每一个账号的数据.
 */
function clearGoldData(cb) {
    const FUNC = TAG + "clearGoldData()---";

    // yTODO: 重置所有today中的数据和每一个账号的数据
    let data = [];
    for (let idx = 0; idx < QUERY_MAP.length; idx++) {
        data.push(['del', QUERY_MAP[idx]]);
    }
    for (let idx = 0; idx < QUERY_MAP.length; idx++) {
        data.push(['del', QUERY_MAP[idx] + ":today"]);
    }

    RedisUtil.multi(data, function (err, res) {
        if (err) return cb && cb(err);
        logger.info(FUNC + "清空缓存数据成功");
    });
}

/**
 * 查看金币数据(根据起始日期进行查询)
 */
function queryGold(start_date, end_date, cb) {
    const FUNC = TAG + "queryGold()---";

    let query_num = DateUtil.dateDiff(start_date, end_date);
    let date_list = DateUtil.getDateList(start_date, end_date);

    logger.info(FUNC + "query_num:", date_list.length);

    let data = [];

    for (let i = 0; i < date_list.length; i++) {
        let date_key = date_list[i];
        let timestamp = new Date(date_list[i]).getTime();
        if (DateUtil.isToday(timestamp)) {
            // 从TODAY数据获取
            for (let idx = 0; idx < QUERY_MAP.length; idx++) {
                data.push(['get', QUERY_MAP[idx] + ":today"]);
            }
        }
        else {
            // 从HISTORY数据获取
            for (let idx = 0; idx < QUERY_MAP.length; idx++) {
                data.push(['hget', QUERY_MAP[idx] + ":history", date_key]);
            }
        }
    }

    RedisUtil.multi(data, function (err, res) {

        if (err) return cb && cb(err);

        let ret = [];

        for (let i = 0; i < res.length; i = i + QUERY_MAP.length) {

            let temp = {
                date: date_list.shift(),
            };
            for (let idx = 0; idx < QUERY_MAP.length; idx++) {
                if (res[i + idx]) {
                    temp[QUERY_MAP[idx]] = parseInt(res[i + idx]);
                }
                else {
                    temp[QUERY_MAP[idx]] = 0;
                }
            }
            ret.push(temp);
        }

        cb && cb(null, ret);
    });
}

/**
 * 获取服务器日志(查询数据库: MySQL or Redis)
 * 获取玩家uid一段时间内start_date ~ end_date的数据日志.
 */
function queryLog(data, start_date, end_date, cb) {
    const FUNC = TAG + "queryLog()---";

    // 获取后台传入的查询参数.
    let uid = data.uid;
    let type = data.type;
    let where = data.where;
    let db_table = DB_TABLE[type];
    logger.info(FUNC + "查询用户(%s)的%s日志, 查询类型为%s", uid, db_table, type);

    if (!where) {
        where = [];
    }
    where.push({field:'account_id', operator:'=', value:uid});
    where.push({field:'log_at', operator:'>', value:"'" + start_date + "'"});
    where.push({field:'log_at', operator:'<', value:"'" + end_date + "'"});

    DaoUtil.query(db_table, [], where, function(err, results) {
        if (err) cb && cb(err);
        for (let i = 0; i < results.length; i++) {
            delete results[i].account_id;
            delete results[i].nickname;
            delete results[i].duration;
            results[i].log_at = DateUtil.format(new Date(results[i].log_at), 'yyyy-MM-dd hh:mm:ss');
        }
        cb && cb(null, results);
    });
}

const DB_TABLE = {
    "1": "tbl_gold_log",
    "2": "tbl_pearl_log",
    "3": "tbl_weapon_log",
    "4": "tbl_skill_log",
};