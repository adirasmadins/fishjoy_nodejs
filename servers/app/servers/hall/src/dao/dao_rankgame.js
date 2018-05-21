const ObjUtil = require('../buzz/ObjUtil');
const BuzzUtil = require('../utils/BuzzUtil');
const DateUtil = require('../utils/DateUtil');
const redisKeys = require('../../../../database').dbConsts.REDISKEY;
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const CacheAccount = require('../buzz/cache/CacheAccount');
const buzz_reward = require('../buzz/buzz_reward');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const rank_rankgame_cfg = gameConfig.rank_rankgame_cfg;
const treasure_treasure_cfg = gameConfig.treasure_treasure_cfg;
const common_const_cfg = gameConfig.common_const_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const DaoCommon = require('./dao_common');

const dropManager = require('../../../../utils/DropManager');

const TAG = "【dao_rankgame】";

const OP_TYPE = {
    UNLOCK: 0,
    SPEED: 1,
    REWARD: 2,
};
exports.OP_TYPE = OP_TYPE;

const SEASON_TARGET = {
    WIN: 10,
    BOX: 10,
    FIRST_WIN: 5,
};

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.getRankgame = getRankgame;
exports.rankgameInfo = rankgameInfo;
exports.rankgameBox = rankgameBox;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
/**
 * 获取排位赛数据(比赛结束后立即获取).
 */

function getRankgame(data, cb) {
    let account = data.account;
    let uid = data.uid;
    logger.info('account.match_unfinish:', account.match_unfinish);
    if (account.match_unfinish > 0) {
        // 查询tbl_rankgame_log并返回比赛结果.
        getRankgameLog(mysqlConnector, uid, account, cb);

        // 查询后立即重置unfinish字段
        account.match_unfinish = 0;
        account.commit();
    }
    else {
        cb(null, {finish: false});
    }
}

/**
 * 获取排位赛信息(客户端打开排位赛UI时调用).
 */
function rankgameInfo(account, cb) {
    const FUNC = TAG + "rankgameInfo() --- ";

    let season_win = account.match_season_win;
    let season_box = account.match_season_box;
    let season_first_win = account.match_season_1st_win;
    let is_season_reward = account.match_got_season_reward;
    let first_box = account.match_1st_box;
    logger.info(FUNC + "--------first_box:\n", first_box);
    let first_box_lefttime = getFirstBoxLefttime(first_box.timestamp);
    let old_stat = first_box.stat;
    if (old_stat == 0 && first_box_lefttime == 0) {
        first_box.stat = 1;
        logger.info(FUNC + "如果是从0变化到1, 则更新数据库");
        account.match_1st_box = first_box;
    }
    first_box = {
        id: first_box.id,
        stat: first_box.stat,
        lefttime: first_box_lefttime,
    };
    logger.info(FUNC + "========first_box:\n", first_box);

    // 计算排位赛的排名.
    account.account_id = account.id;

    // PAIR.RANK.MATCH
    logger.info(FUNC + 'match_box_list:', account.match_box_list);
    logger.info(FUNC + 'match_box_timestamp:', account.match_box_timestamp);

    let ret = {
        points: account.match_points,
        my_rank: 0, //todo:linyng
        rank: account.match_rank,
        box: account.match_box_list,
        // -1表示未解锁, >0表示解锁中, 0表示解锁完毕, 可以领取
        lefttime: _getBoxLefttime(account.match_box_list, account.match_box_timestamp, false),
        first_box: first_box,
        season: {
            win: {count: season_win, total: SEASON_TARGET.WIN},
            box: {count: season_box, total: SEASON_TARGET.BOX},
            first_win: {count: season_first_win, total: SEASON_TARGET.FIRST_WIN},
            lefttime: DateUtil.getLeftTimeToTheEndOfThisMonth(),
            is_season_reward: is_season_reward,
        }
    };
    let redis_key = redisKeys.CHART.RANK_MONTH_AWARD + ":" + redisKeys.RANK.MATCH;
    buzz_reward.getRewardInfo(account, redis_key, function (err, res) {
        if (err) {
            cb(err);
            return;
        }

        if (res && res.score) {
            let rank_lm = BuzzUtil.getRankIdFromPointsAndRank(res.score, res.rank - 1);
            if (0 == rank_lm) {
                rank_lm = BuzzUtil.getRankIdFromPoints(res.score);
            }
            ret.chart_lm = {
                rank: rank_lm,
            };
        }
        if (res) {
            ret.season.is_season_reward = res.award ? 0 : 1;
        }
        account.commit();
        cb(null, ret);
    });

}

/**
 * 排位赛中的宝箱操作相关.
 */
function rankgameBox(data, cb) {
    let type = data.type;// 操作类型
    switch (type) {
        case OP_TYPE.UNLOCK:
            opUnlock(data, cb);
            break;

        case OP_TYPE.SPEED:
            opSpeed(data, cb);
            break;

        case OP_TYPE.REWARD:
            opReward(data, cb);
            break;
    }
}


//==============================================================================
// private
//==============================================================================

/**
 * 宝箱操作: 解锁宝箱.
 */
function opUnlock(data, cb) {
    let idx = data.idx;// 操作的宝箱索引(0,1,2)
    let account = data.account;
    let box = account.match_box_list;
    let box_timestamp = account.match_box_timestamp;

    if (idx < 0 && idx > 2) {
        cb(new Error("宝箱编号超出索引范围idx:", idx));
        return;
    }

    // 检查是否有正在解锁中的宝箱
    for (let i = 0; i < box_timestamp.length; i++) {
        let start_time = parseInt(box_timestamp[i]);
        if (start_time > 0) {
            let box_id = box[i];
            let lefttime = _getLeftTime(start_time, box_id);
            if (lefttime > 0) {
                cb(ERROR_OBJ.RANKGAME_UNLOCKING);
                return;
            }
        }
    }

    let box_id = box[idx];

    // 判断条件: 对应索引的宝箱ID不为0
    if (box_id == 0) {
        cb(new Error("当前位置的宝箱是空的"));
        return;
    }
    // 设置: 宝箱解锁时间
    box_timestamp[idx] = new Date().getTime();
    account.match_box_timestamp = box_timestamp;
    account.commit();

    // TODO: 返回当前操作宝箱的数据
    let lefttime = _getLeftTime(box_timestamp[idx], box_id);
    let ret = {
        id: box_id,
        lefttime: lefttime,
    };
    cb(null, ret);
}

function _getLeftTime(timestamp, id, isSpeed) {
    const FUNC = TAG + "_getLeftTime() --- ";

    let needtime = _getTreasureTimeById(id);

    if (timestamp == -1 && isSpeed) {
        logger.info(FUNC + "加速宝箱没有解锁, 剩余时间查配置表");
        return needtime;
    }

    if (timestamp == -1) {
        return timestamp;
    }
    let pasttime = (new Date().getTime() - timestamp) / 1000;
    // let needtime = _getTreasureTimeById(id);
    let lefttime = needtime - pasttime;
    if (lefttime < 0) {
        lefttime = 0;
    }
    return Math.round(lefttime);
}

let pearlNeed = 50;

/**
 * 宝箱操作: 加速解锁.
 */
function opSpeed(data, cb) {
    const FUNC = TAG + "opSpeed() --- ";
    let account = data.account;
    let idx = data.idx;// 操作的宝箱索引(0,1,2)
    let box = account.match_box_list;
    let box_timestamp = account.match_box_timestamp;
    let season_box = account.match_season_box;

    let box_id = box[idx];

    // 判断条件: 对应索引的宝箱ID不为0
    if (box_id == 0) {
        cb(new Error("当前位置的宝箱是空的"));
        return;
    }

    let lefttime = _getLeftTime(box_timestamp[idx], box[idx], true);
    logger.info(FUNC + "lefttime:", lefttime);
    pearlNeed = getPearlNeed(lefttime);
    logger.info(FUNC + "pearlNeed:", pearlNeed);

    let pearl = account.pearl;
    if (pearl < pearlNeed) {
        // cb(new Error("玩家没有足够的钻石"));
        cb(ERROR_OBJ.DIAMOND_NOT_ENOUGH);
        return;
    }

    // 设置: 宝箱设置为0表示当前位置没有宝箱
    box[idx] = 0;
    let new_box = box;
    // 设置: 宝箱解锁时间为0则宝箱处于可以领取的状态
    box_timestamp[idx] = 0;

    account.match_box_list = new_box;
    account.match_box_timestamp = box_timestamp;
    account.match_season_box = 1;
    account.pearl = -pearlNeed;
    account.commit();

    _openBox(account, box_id, 0, cb);
    logBuilder.addItemLog(account.id, 'i002', -pearlNeed, account.pearl, common_log_const_cfg.RMATCH_BOX, account.level);
}

/**
 * 查表计算加速需要的钻石数量.
 * @param lefttime 单位: 秒
 */
function getPearlNeed(lefttime) {
    let pearlNeed = Math.ceil(lefttime / common_const_cfg.RMATCH_COST);
    return pearlNeed;
}

/**
 * 直接开宝箱，免去客户端再调用一次open_box却不能校验 by Scott on 2018.03.14
 * @param {*} boxId
 * @param {*} cb
 */
function _openBox(account, boxId, lefttime, cb) {
    let ret = {
        id: boxId,
        lefttime: lefttime || 0,
    };
    let dpRet = dropManager.openTreasure(account, boxId, common_const_cfg.RMATCH_BOX);
    ret.change = {
        pearl: account.pearl,
        gold: account.gold,
        skill: account.skill,
        package: account.package,
    };
    ret.item_list = dpRet.logItems;
    cb && cb(null, ret);
}

/**
 * 宝箱操作: 领取奖励.
 */
function opReward(data, cb) {
    const FUNC = TAG + "opReward() --- ";
    let account = data.account;
    let idx = data.idx;// 操作的宝箱索引(0,1,2)
    let box = account.match_box_list;
    let box_timestamp = account.match_box_timestamp;
    let season_box = account.match_season_box;

    if (idx == 3) {
        let first_box = account.match_1st_box;
        let box_id = first_box.id;
        if (box_id == 0) {
            logger.error(FUNC + "玩家没有首胜宝箱");
            cb(ERROR_OBJ.RANKGAME_NO_1ST_WIN_BOX);
            return;
        }
        let timestamp = new Date().getTime();
        let lefttime = getFirstBoxLefttime(timestamp);
        account.match_1st_box = {"stat": 0, "timestamp": timestamp, "id": 0};
        account.match_season_box = 1;
        account.commit();
        _openBox(account, box_id, lefttime, cb);
        return;
    }

    let box_id = box[idx];

    // 判断条件: 对应索引的宝箱ID不为0
    if (box_id == 0) {
        logger.error(FUNC + "当前位置的宝箱是空的");
        cb(ERROR_OBJ.RANKGAME_EMPTY_BOX);
        return;
    }
    // 设置: 宝箱设置为0表示当前位置没有宝箱
    box[idx] = 0;
    let new_box = box;

    let lefttime = _getLeftTime(box_timestamp[idx], box_id);
    logger.info(FUNC + "lefttime:", lefttime);
    if (lefttime > 0) {
        logger.error(FUNC + "当前位置的宝箱还在解锁中");
        cb(ERROR_OBJ.RANKGAME_UNLOCKING);
        return;
    }
    if (lefttime == -1) {
        logger.error(FUNC + "当前位置的宝箱还没有解锁");
        cb(ERROR_OBJ.RANKGAME_LOCKED);
        return;
    }
    // 设置: 宝箱解锁时间为0则宝箱处于可以领取的状态
    box_timestamp[idx] = 0;

    account.match_box_list = new_box;
    account.match_box_timestamp = box_timestamp;
    account.match_season_box = 1;
    _openBox(account, box_id, 0, cb);
    account.commit();
}

/**
 * 获取首胜宝箱的剩余开启时间.
 */
function getFirstBoxLefttime(timestamp) {
    const FUNC = TAG + "getFirstBoxLefttime() --- ";

    let pasttime = (new Date().getTime() - timestamp) / 1000;
    let needtime = DateUtil.SECONDS_IN_ONE_DAY;
    let lefttime = needtime - pasttime;
    logger.info(FUNC + "pasttime:", pasttime);
    logger.info(FUNC + "needtime:", needtime);
    logger.info(FUNC + "lefttime:", lefttime);
    if (lefttime < 0) {
        lefttime = 0;
    }
    return Math.round(lefttime);
}


const BOX_LOCKED = -1;

/**
 * 获取宝箱获取后过去的时间.
 */
function _getBoxPasttime(box_timestamp) {
    const FUNC = TAG + "_getBoxPasttime() --- ";

    logger.info(FUNC + "box_timestamp:", box_timestamp);
    logger.info(FUNC + "box_timestamp:", box_timestamp);

    let ret = [];
    let list = box_timestamp;
    logger.info(FUNC + "list:", list);
    if (list) {
        for (let i = 0; i < list.length; i++) {
            let timestamp = list[i];
            logger.info(FUNC + "timestamp:", timestamp);
            if (timestamp == BOX_LOCKED) {
                logger.info(FUNC + "timestamp == BOX_LOCKED");
                ret.push(BOX_LOCKED);
            }
            else {
                ret.push(Math.round(new Date().getTime() - timestamp));
            }
        }
    }
    else {
        logger.error(FUNC + 'box_timestamp为空');
    }
    return ret;
}

/**
 * 获取宝箱开启还剩余的时间.
 */
function _getBoxLefttime(box, box_timestamp, is_first) {
    const FUNC = TAG + "_getBoxLefttime() --- ";

    let ret = [];
    let box_list = box;
    let list = _getBoxPasttime(box_timestamp);
    if (box_list.length != list.length) {
        logger.error(FUNC + "宝箱数组与剩余时间数组长度不符");
        return ret;
    }
    for (let i = 0; i < list.length; i++) {
        let pasttime = list[i];
        let needtime = _getTreasureTimeById(box_list[i]);//单位秒, 需要读取数据库
        needtime = needtime * 1000;
        logger.info(FUNC + "---needtime:", needtime);
        if (is_first) {
            needtime = DateUtil.MINISECONDS_IN_ONE_DAY;// 固定为1天(毫秒)
        }
        let lefttime = needtime - pasttime;
        lefttime = Math.round(lefttime / 1000);
        if (lefttime < 0) lefttime = 0;
        if (pasttime == BOX_LOCKED) {
            lefttime = BOX_LOCKED;
        }

        logger.info(FUNC + "pasttime:", pasttime);
        logger.info(FUNC + "lefttime:", lefttime);

        ret.push(lefttime);
    }
    return ret;
}

function _getTreasureTimeById(id) {
    let treasure = _getTreasureById(id);
    if (treasure) {
        return treasure.time;
    }
    return 0;
}

function _getTreasureById(id) {
    for (let idx in treasure_treasure_cfg) {
        let treasure = treasure_treasure_cfg[idx];
        if (treasure.id == id) {
            return treasure;
        }
    }
    return null;
}

const DEFAULT_VALUE = {
    /** 初始玩家积分. */
    POINTS: 800,
    /** 初始玩家段位. */
    RANK: getRankIdFromPoints(800),
};

function getRankIdFromPoints(points) {
    for (let i = rank_rankgame_cfg.length - 1; i > 0; i--) {
        let rank_info = rank_rankgame_cfg[i];
        if (points >= rank_info.integral) {
            return rank_info.id;
        }
    }
}


function getRankgameLog(pool, uid, account, cb) {
    const FUNC = TAG + "getRankgameLog() --- ";

    let id = account.match_unfinish;

    let sql = "";
    sql += "SELECT * ";
    sql += "FROM `tbl_rankgame_log` ";
    sql += "WHERE `id`=? ";
    let sql_data = [id];

    logger.info(FUNC + "sql:\n", sql);
    logger.info(FUNC + "sql_data:\n", sql_data);

    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            logger.error(FUNC + "err:", err);
            cb(err);
            return;
        }
        if (results.length == 0) {
            logger.error(FUNC + "err:results.length == 0");
            cb(ERROR_OBJ.RANKGAME_WRONG_LOG_ID);// TODO: 返回比赛记录不存在的错误
            return;
        }
        logger.info(FUNC + "results:", results);
        let result = ObjUtil.str2Data(results[0].result);
        let p1 = result.player1;
        let p2 = result.player2;

        let match_info = [
            {
                uid: p1.uid,
                nickname: p1.nickname,
                fish_account: p1.fish_account,
                rank: p1.rank,
                nuclear_fish_count: p1.nuclear_fish_count,
                nuclear_score: p1.nuclear_score,
                winning_rate: p1.winning_rate,
                figure_url: p1.figure_url,
                star: p1.star,
                vip: p1.vip,
                provocativeVal: p1.provocativeVal
            },
            {
                uid: p2.uid,
                nickname: p2.nickname,
                fish_account: p2.fish_account,
                rank: p2.rank,
                nuclear_fish_count: p2.nuclear_fish_count,
                nuclear_score: p2.nuclear_score,
                winning_rate: p2.winning_rate,
                figure_url: p2.figure_url,
                star: p2.star,
                vip: p2.vip,
                provocativeVal: p2.provocativeVal
            }
        ];
        for (let key in result) {
            // {"player1":{}, "player2":{}, "winner":num}
            if (key != "winner") {
                let player = result[key];
                if (player.uid == uid) {
                    let ret = {
                        finish: true,// 固定为true.
                        point_change: player.point_change,
                        box: player.box,// 败者宝箱为null
                        rank: player.rank,
                        rank_change: player.rank_change,
                        winning_streak: player.winning_streak,
                        match_info: match_info,
                    };
                    if (account) {
                        ret.charm_point = account.charm_point;
                        ret.charm_rank = account.charm_rank;
                    }
                    logger.info(FUNC + "rank_change:", ret.rank_change);
                    cb(null, ret);
                    break;
                }
            }
        }
    });

}
