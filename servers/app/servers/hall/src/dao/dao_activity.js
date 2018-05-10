const ErrCst = require('../../../../consts/fish_error');
const DateUtil = require('../utils/DateUtil');
const ObjUtil = require('../buzz/ObjUtil');
const buzz_draw = require('../buzz/buzz_draw');
const DaoReward = require('./dao_reward');
const dao_gold = require('./dao_gold');
const RedisUtil = require('../utils/RedisUtil');
const CacheAccount = require('../buzz/cache/CacheAccount');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const RewardModel = require('../../../../utils/account/RewardModel');
const shop_gift_cfg = gameConfig.shop_gift_cfg;
const active_active_cfg = gameConfig.active_active_cfg;
const active_activequest_cfg = gameConfig.active_activequest_cfg;
const active_activechange_cfg = gameConfig.active_activechange_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const _utils = require('../utils/utils');

const ERROR_OBJ = ErrCst.ERROR_OBJ;

const ACTIVITY_TYPE = {
    /** 活动任务 */
    QUEST: 1,
    /** 充值回馈 */
    CHARGE: 2,
    /** 限时兑换 */
    EXCHANGE: 3,
    /** 幸运大奖 */
    DRAW: 4,
    /** 所有 */
    ALL: 9,
    EMPTY: 10,
};

const TAG = "【dao_activity】";

exports.updateGift = updateGift;
exports.addNewGift = addNewGift;
exports.showMeActivity = showMeActivity;
exports.getReward = getReward;
exports.getCurActiveIds = _getCurActiveIds;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 添加一个礼包
 */
function addNewGift(gift_tobe_insert, pool, cb) {
    const FUNC = TAG + "addNewGift() --- ";
    let sql = '';
    sql += 'INSERT INTO `tbl_activity` ';
    sql += '(`gift_id`, `description`, `name`, `icon`, `price`, `item`, `condition`, `value`, `starttime`, `endtime`, `buycount`, `version`, `revoke`, `discount`) ';
    sql += 'VALUES ';
    for (let i = 0; i < gift_tobe_insert.length; i++) {
        let gift = gift_tobe_insert[i];
        if (i > 0) {
            sql += ",";
        }
        sql += "(";
        sql += gift['id'] + ",";
        sql += "'" + gift['description'] + "',";
        sql += "'" + gift['name'] + "',";
        sql += "'" + gift['icon'] + "',";
        sql += gift['price'] + ",";
        sql += "'" + JSON.stringify(gift['item']) + "',";
        sql += gift['condition'] + ",";
        sql += gift['value'] + ",";
        sql += "'" + gift['starttime'] + "',";
        sql += "'" + gift['endtime'] + "',";
        sql += gift['buycount'] + ",";
        sql += gift['version'] + ",";
        sql += gift['revoke'] + ",";
        sql += gift['discount'];
        sql += ')';
    }
    let sql_data = [];

    logger.info(FUNC + 'sql:', sql);
    logger.info(FUNC + 'sql_data:', sql_data);

    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            logger.error("[ERROR] err:", err);
            cb(err);
        } else {
            let affectedRows = results['affectedRows'];
            logger.info("插入成功！！！共更新了" + affectedRows + "条礼包数据");
        }
    });
}

/**
 * 更新礼包数据(直接从配置表shop_gift_cfg.js中读取数据插入数据库, 无需数据传入)
 * 重启服务器时调用.
 */
function updateGift(pool, cb) {

    // step-1: 查询活动礼包的历史数据
    _findGiftHistory(pool, cb, function (gift_history) {

        // step-2: 找出所有出现更新的数据
        _findNewGift(gift_history, function (gift_tobe_insert) {

            // step-3: 添加新的礼包数据
            addNewGift(gift_tobe_insert, pool, cb);

        });

    });

}

/**
 * 返回当前活动数据.
 * 活动分类为(1.活动任务, 2.充值回馈， 3.限时兑换).
 */
function showMeActivity(data, cb) {
    if (!_checkParams_4_ShowMeActivity(data, cb)) return;

    let type = data.type;

    let cur_active_ids = _getCurActiveIds();

    // TODO: 如果没有当前活动则不计算剩余时间
    let endtime = 0;
    if (cur_active_ids.length > 0) {
        endtime = _getActiveEndTime(cur_active_ids[0]);
    }

    _getActiveList(type, data.account, cur_active_ids, endtime, cb);
}

/**
 * 获取奖励.
 */
function getReward(data, cb) {
    const FUNC = TAG + "getReward() --- ";

    if (!_checkParams_4_GetReward(data, cb)) return;

    let type = data.type;
    let quest_id = data.id;
    let account = data.account;

    let uid = account.id;

    // 获取奖励的条件判定
    _canPlayerGetReward(type, uid, quest_id, function (err, can) {
        if (!can) return;
        // 获取奖励
        let reward = _getActiveReward(quest_id, type);
        reward = _transReward(reward);
        logger.info(FUNC + "reward:", reward);

        if (type == ACTIVITY_TYPE.EXCHANGE) {
            _didExchange(reward, type, quest_id, account, cb);
        } else {
            DaoReward.getReward(account, reward, function (err, results) {
                if (err) {
                    logger.error(FUNC + "err:", err);
                    cb(err);
                    return;
                }
                addActiveGoldLog(mysqlConnector, account, type, reward, []);
                _rewardEnd(mysqlConnector, type, uid, quest_id, cb);
            });
        }
        let item_list = [];
        for (let i = 0; i < reward.length; i++) {
            let item = reward[i];
            let item_id = item[0];
            let item_num = item[1];
            item_list.push({
                item_id: item_id,
                item_num: item_num
            });
        }
        let scene = common_log_const_cfg.ACTIVE_QUEST;
        if (ACTIVITY_TYPE.EXCHANGE == type) {
            scene = common_log_const_cfg.ACTIVE_EXCHANGE;
        } else if (ACTIVITY_TYPE.CHARGE == type) {
            scene = common_log_const_cfg.ACTIVE_CHARGE;
        }
        logBuilder.addActivityLogByAccount(item_list, account, scene, quest_id);
    });

}

//==============================================================================
// private
//==============================================================================

/**
 * 限时兑换功能
 */
function _didExchange(reward, type, quest_id, account, cb) {
    const FUNC = TAG + "_didExchange() --- ";

    let uid = account.id;
    let needitem = _needItems(quest_id);
    needitem = _transReward(needitem);
    logger.info(FUNC + "needitem:", needitem);

    if (DaoReward.enough(account, needitem)) {

        let active_stat = _getActiveStat(account, quest_id);
        if (!_isExchangeOver(active_stat[quest_id], quest_id)) {
            DaoReward.getReward(account, reward, function (err, results) {
                if (err) {
                    logger.error(FUNC + "err:", err);
                    cb && cb(err);
                    return;
                }
                logger.info(FUNC + "skill:", account.skill);
                try {
                    DaoReward.cost(account, needitem, function (err_cost, results_cost) {
                        addActiveGoldLog(mysqlConnector, account, type, reward, needitem);
                        _rewardEnd(mysqlConnector, type, uid, quest_id, cb);
                        let item_list = [];
                        for (let i = 0; i < needitem.length; i++) {
                            let item = needitem[i];
                            let item_id = item[0];
                            let item_num = item[1];
                            item_list.push({
                                item_id: item_id,
                                item_num: item_num
                            });
                        }
                        logBuilder.addActivityLogByAccount(item_list, account, ACTIVITY_TYPE.EXCHANGE, quest_id, -1);
                    });
                } catch (err_cost) {
                    // TODO: 带有错误码的返回值
                    logger.error(FUNC + "err_cost:\n", err_cost);
                    cb && cb(err_cost);
                }
            });
        } else {
            // 提示领取次数已经消耗完
            cb && cb(ERROR_OBJ.ACTIVE_EXCHANGE_OVER);
        }

    } else {
        logger.error(FUNC + "材料不足，无法兑换");
        cb && cb(ERROR_OBJ.CHIP_NOT_ENOUGH);
    }
}

function addActiveDiamondLog(account, type, reward_items, cost_items) {
    const FUNC = TAG + "addActiveDiamondLog() --- ";
    // yDONE: 钻石数据记录
    let gain = 0;
    let cost = 0;
    for (let i = 0; i < reward_items.length; i++) {
        let item = reward_items[i];
        let item_id = item[0];
        let item_num = item[1];
        if ('i002' == item_id) {
            gain += item_num;
        }
    }
    for (let i = 0; i < cost_items.length; i++) {
        let item = cost_items[i];
        let item_id = item[0];
        let item_num = item[1];
        if ('i002' == item_id) {
            cost += item_num;
        }
    }
    if (gain > 0 || cost > 0) {
        let scene = common_log_const_cfg.ACTIVE_QUEST;
        if (ACTIVITY_TYPE.EXCHANGE == type) {
            scene = common_log_const_cfg.ACTIVE_EXCHANGE;
        } else if (ACTIVITY_TYPE.CHARGE == type) {
            scene = common_log_const_cfg.ACTIVE_CHARGE;
        }

        logBuilder.addPearlLogEx({
            account_id: account.id,
            log_at: new Date(),
            gain: gain,
            cost: cost,
            total: account.pearl,
            scene: scene,
            nickname: 0,
        });
    }
}

function addActiveGoldLog(pool, account, type, reward_items, cost_items) {
    const FUNC = TAG + "addActiveGoldLog() --- ";
    // yDONE: 金币数据记录
    let gain = 0;
    let cost = 0;
    logger.info(FUNC + "-----------------reward_items:", reward_items);
    logger.info(FUNC + "-----------------cost_items:", cost_items);
    for (let i = 0; i < reward_items.length; i++) {
        let item = reward_items[i];
        let item_id = item[0];
        let item_num = item[1];
        if ('i001' == item_id) {
            gain += item_num;
        }
    }
    for (let i = 0; i < cost_items.length; i++) {
        let item = cost_items[i];
        let item_id = item[0];
        let item_num = item[1];
        if ('i001' == item_id) {
            cost += item_num;
        }
    }
    logger.info(FUNC + "gain:", gain);
    logger.info(FUNC + "cost:", cost);
    if (gain > 0 || cost > 0) {
        let scene = common_log_const_cfg.ACTIVE_QUEST;
        if (ACTIVITY_TYPE.EXCHANGE == type) {
            scene = common_log_const_cfg.ACTIVE_EXCHANGE;
        } else if (ACTIVITY_TYPE.CHARGE == type) {
            scene = common_log_const_cfg.ACTIVE_CHARGE;
        }

        let data = {
            account_id: account.id,
            token: account.token,
            total: account.gold,
            duration: 0,
            group: [{
                "gain": gain,
                "cost": cost,
                "scene": scene,
            }],
        };
        logger.info(FUNC + "活动插入一条金币日志:", data);
        dao_gold.addGoldLogCache(pool, data, function (err, res) {
            if (err) return logger.error(FUNC + "err:", err);
        });
    }
}

function _transReward(reward) {
    // TODO
    return reward;
}

function _rewardEnd(pool, type, uid, id, cb) {
    // 更新缓存中的active
    _updateActiveInCache(type, uid, id, function (err, account) {
        cb(err, account);
        CacheAccount.clearOp(uid, 'get_activity_reward');
    });
}

function _getActiveStat(account, quest_id) {
    let active_stat_once = account.active_stat_once;
    let active_stat_reset = account.active_stat_reset;

    let active_stat = _isExchangeReset(quest_id) ? active_stat_reset : active_stat_once;

    return active_stat;
}

/**
 * 更新缓存中的活动数据.
 */
function _updateActiveInCache(type, uid, quest_id, cb) {
    const FUNC = TAG + "_updateActiveInCache() --- ";
    logger.info(FUNC + "CALL...");


    CacheAccount.getAccountById(uid, function (err, account) {
        if (account) {
            // let active = account.active;

            if (account.active_stat_once == null) account.active_stat_once = {};
            if (account.active_stat_reset == null) account.active_stat_reset = {};

            let active_stat_once = account.active_stat_once;
            let active_stat_reset = account.active_stat_reset;

            if (type == ACTIVITY_TYPE.EXCHANGE) {
                // 根据是否重置决定操作的active_stat变量
                let active_stat = _isExchangeReset(quest_id) ? active_stat_reset : active_stat_once;

                // 交换中的状态表示已经交换的次数
                if (active_stat[quest_id] != null) {
                    // 是否超限判断
                    if (!_isExchangeOver(active_stat[quest_id], quest_id)) {
                        active_stat[quest_id] += 1;
                    } else {
                        // 提示领取次数已经消耗完
                        cb(ERROR_OBJ.ACTIVE_EXCHANGE_OVER);
                        return;
                    }
                } else {
                    active_stat[quest_id] = 1;
                }
            } else {
                let active_stat = _isQuestReset(quest_id) ? active_stat_reset : active_stat_once;
                active_stat[quest_id] = 1; // status中有对应任务id的状态
            }

            account.active_stat_once = account.active_stat_once;
            account.active_stat_reset = account.active_stat_reset;
            account.commit();

            cb(null, account);
        } else {
            logger.error(FUNC + "用户不在缓存中");
            cb(ERROR_OBJ.TOKEN_INVALID);
        }
    });
}

/**
 * 返回活动任务和充值回馈是否会在第二天凌晨重置.
 */
function _isQuestReset(id) {
    const FUNC = TAG + "_isQuestReset() --- ";
    let quest = _getQuestById(id, active_activequest_cfg);
    if (quest) {
        return quest.repeat == 1;
    } else {
        logger.error(FUNC + "没有找到quest,id:", id);
        return false;
    }
}

/**
 * 返回限时交换是否会在第二天凌晨重置.
 */
function _isExchangeReset(id) {
    let quest = _getQuestById(id, active_activechange_cfg);
    return quest.repeat == 1;
}

function _isExchangeOver(status, quest_id) {
    let quest = _getQuestById(quest_id, active_activechange_cfg);
    let limitcount = quest.limitcount;
    return status >= limitcount;
}

function mergeActive(active_once, active_daily_reset) {
    let ret = {};
    for (let condition in active_once) {
        if (!ret[condition]) {
            ret[condition] = {};
        }
        for (let val1 in active_once[condition]) {
            ret[condition][val1] = active_once[condition][val1];
        }
    }
    for (let condition in active_daily_reset) {
        if (!ret[condition]) {
            ret[condition] = {};
        }
        for (let val1 in active_daily_reset[condition]) {
            ret[condition][val1] = active_daily_reset[condition][val1];
        }
    }
    return ret;
}

/**
 * 判断玩家是否能领取奖励.
 * @param type 活动类型: 活动任务, 限时兑换, 充值回馈，
 * @param quest_id 活动id, 对应active_activequest中的id值.
 */
function _canPlayerGetReward(type, uid, quest_id, cb) {

    const FUNC = TAG + "_canPlayerGetReward() --- ";
    lCheck(cb);

    function lCheck(cb) {
        CacheAccount.getAccountById(uid, function (err, account) {
            let active_once = account.active;
            let active_daily_reset = account.active_daily_reset;
            let active = mergeActive(active_once, active_daily_reset);
            let active_stat_once = account.active_stat_once;
            let active_stat_reset = account.active_stat_reset;

            let quest = _findQuest(type, quest_id);
            if (quest) {
                // 交换条件
                if (type == ACTIVITY_TYPE.EXCHANGE) {
                    let active_stat = _isExchangeReset(quest_id) ? active_stat_reset : active_stat_once;
                    let cur = 0;
                    if (active_stat && active_stat["" + quest_id] != null) {
                        cur = active_stat["" + quest_id];
                    }

                    _utils.invokeCallback(cb, null, quest.limitcount > cur);
                    return;
                } else {
                    let active_stat = _isQuestReset(quest_id) ? active_stat_reset : active_stat_once;
                    if (active_stat != null) {
                        _utils.invokeCallback(cb, null, active_stat["" + quest_id] != 1);
                        return;
                    }

                    let player_step = _getPlayerStep(active, quest.condition, quest.value1);
                    let condition1 = player_step >= quest.value2;
                    let condition2 = true;
                    // 充值回馈条件
                    if (type == ACTIVITY_TYPE.CHARGE) {
                        // TODO: 判断玩家是否满足领取充值回馈的条件
                        // 玩家的rmb必须大于0
                        // 玩家当日充值记录(tbl_order)中必须有相应的记录且金额达到领取条件
                        let rmb = account.rmb;
                        let quest_rmb = quest.value2 * 10; // 单位是钻石，转换为分则乘以10.
                        condition2 = rmb >= quest_rmb;
                        if (!condition2) {
                            logger.error(FUNC + "[ERROR] 玩家(" + uid + ")没有达成领取充值回馈的条件!!!实际充值:" + rmb + ", 目标需求:" + quest_rmb);
                        }
                    }

                    _utils.invokeCallback(cb, null, condition1 && condition2);
                    return;
                }
            } else {
                _utils.invokeCallback(cb, null, false);
            }
        });
    }
}

// 通过类型和ID找到任务
function _findQuest(type, quest_id) {

    let cur_active_ids = _getCurActiveIds();

    let list = [];

    switch (type) {
        case ACTIVITY_TYPE.QUEST:
            list = _getActiveQuest(cur_active_ids);
            break;

        case ACTIVITY_TYPE.CHARGE:
            list = _getActiveCharge(cur_active_ids);
            break;

        case ACTIVITY_TYPE.EXCHANGE:
            list = _getActiveExchange(cur_active_ids);
            break;
    }

    for (let idx in list) {
        let quest = list[idx];

        if (quest.id == quest_id) {
            return quest;
        }
    }
}

/**
 * 获取玩家进度.
 */
function _getPlayerStep(active, condition, value1) {
    if (active) {
        if (active[condition]) {
            if (active[condition][value1]) { // 等于0也会跳出循环返回0
                return active[condition][value1];
            }
        }
    }
    return 0;
}

async function _getActiveList(type, account, cur_active_ids, endtime, cb) {
    let quest = null;
    let charge = null;
    let exchange = null;
    let ret = {};

    switch (type) {
        case ACTIVITY_TYPE.QUEST:
            quest = await _fillStep(type, account, _getActiveQuest(cur_active_ids));
            ret = {
                quest: quest
            };
            break;

        case ACTIVITY_TYPE.CHARGE:
            charge = await _fillStep(type, account, _getActiveCharge(cur_active_ids));
            ret = {
                charge: charge
            };
            break;

        case ACTIVITY_TYPE.EXCHANGE:
            exchange = await _fillStep(type, account, _getActiveExchange(cur_active_ids));
            ret = {
                exchange: exchange
            };
            break;

        case ACTIVITY_TYPE.DRAW:
            buzz_draw.getDrawCurrent(account, function (err, draw) {
                ret = {
                    draw: draw
                };
                ret.endtime = endtime;
                ret.active_id = cur_active_ids[0];
                cb(null, ret);
            });
            return;

        case ACTIVITY_TYPE.ALL:
            quest = await _fillStep(ACTIVITY_TYPE.QUEST, account, _getActiveQuest(cur_active_ids));
            charge = await _fillStep(ACTIVITY_TYPE.CHARGE, account, _getActiveCharge(cur_active_ids));
            exchange = await _fillStep(ACTIVITY_TYPE.EXCHANGE, account, _getActiveExchange(cur_active_ids));
            buzz_draw.getDrawCurrent(account, function (err, draw) {
                ret = {
                    quest: quest,
                    charge: charge,
                    exchange: exchange,
                    draw: draw
                };
                ret.endtime = endtime;
                ret.active_id = cur_active_ids[0];
                cb(null, ret);
            });
            return;
    }
    ret.endtime = endtime;
    ret.active_id = cur_active_ids[0];

    cb(null, ret);
}

// 获取活动还有多少时间结束(单位秒)
function _getActiveEndTime(active_id) {
    let active = _getActiveById(active_id);
    logger.info("active:", active);
    logger.info("active_id:", active_id);
    return (new Date(active.endtime).getTime() - new Date().getTime()) / 1000;
}

// 获取任务奖励
function _getActiveReward(active_id, type) {
    let cfg = active_activequest_cfg;
    if (type == ACTIVITY_TYPE.EXCHANGE) {
        cfg = active_activechange_cfg;
        //getitem不是数组(统一格式这里需要加括号进行转换)
        return [_getQuestById(active_id, cfg).getitem];
    }
    let quest = _getQuestById(active_id, cfg);
    if (quest) {
        return _getQuestById(active_id, cfg).reward;
    } else {
        return [];
    }
}

// 获取兑换消耗
function _needItems(active_id) {
    return _getQuestById(active_id, active_activechange_cfg).needitem;
}

// 根据ID获得活动内容
function _getQuestById(active_id, cfg) {
    for (let idx in cfg) {
        let active = cfg[idx];
        let id = active.id;
        if (active_id == id) {
            return active;
        }
    }
}

// 根据ID获得活动内容
function _getActiveById(active_id) {
    for (let idx in active_active_cfg) {
        let active = active_active_cfg[idx];
        let id = active.id;
        if (active_id == id) {
            return active;
        }
    }
}

function _multiFunc(cmds) {
    return new Promise(function (resolve, reject) {
        RedisUtil.getClient().multi(cmds).exec(function (err, res) {
            if (err) {
                reject(err);
                return;
            }
            resolve(res);
        });
    });
}

/**
 * 生成活动数据
 * @private
 */
async function _initActive(account, active_id) {
    let list = _getActiveQuest(active_id);
    const prefix = "activity:";
    let cmds = [];
    let type = [];
    let active = account.active;
    let active_daily_reset = account.active_daily_reset;
    for (let idx in list) {
        let quest = list[idx];
        let condition = quest.condition;
        let value1 = quest.value1;
        let repeat = quest.repeat;
        let redis_key = prefix + condition + "_" + value1;
        cmds.push(['hget', redis_key, account.id]);
        type.push({
            repeat: repeat,
            condition: condition,
            value1: value1
        });
    }
    let newVar = await _multiFunc(cmds);
    for (let i = 0; i < newVar.length; i++) {
        let data = Number(newVar[i]) || 0;
        let repeat = type[i].repeat;
        let condition = type[i].condition;
        let value1 = type[i].value1;
        if (data && repeat === 0) {
            if (!active[condition]) {
                active[condition] = {};
            }
            active[condition][value1] = data;
        }
        if (data && repeat === 1) {
            if (!active_daily_reset[condition]) {
                active_daily_reset[condition] = {};
            }
            active_daily_reset[condition][value1] = data;
        }
    }
    account.active = active;
    account.active_daily_reset = active_daily_reset;
    account.commit();
}


async function _fillStep(type, account, list) {
    const FUNC = TAG + "_fillStep() --- ";
    // 从缓存CacheAccount中获取玩家active字段
    let active = {};
    let active_once = {};
    let active_daily_reset = {};
    let active_stat_once = {};
    let active_stat_reset = {};

    if (account) {
        let processInfo = await RewardModel.getActivityTaskProcessInfo(account);
        active_once = processInfo.active_once;
        active_daily_reset = processInfo.active_daily_reset;

        active = mergeActive(active_once, active_daily_reset);
        active_stat_once = account.active_stat_once;
        active_stat_reset = account.active_stat_reset;
    }

    if (type == ACTIVITY_TYPE.EXCHANGE) {
        for (let idx in list) {
            let quest = list[idx];
            let quest_id = quest.id;
            let active_stat = _isExchangeReset(quest_id) ? active_stat_reset : active_stat_once;

            if (active_stat) {
                if (active_stat[quest_id] != null) {
                    quest.cur = active_stat[quest_id];
                } else {
                    quest.cur = 0;
                }
                quest.is_got = _isGotExchange(active_stat[quest_id], quest_id);
            } else {
                quest.cur = 0;
                quest.is_got = false;
            }
        }
    } else {
        for (let idx in list) {
            let quest = list[idx];
            if (quest) {
                let quest_id = quest.id;
                let condition = "" + quest.condition;
                let value1 = "" + quest.value1;
                let active_stat = _isQuestReset(quest_id) ? active_stat_reset : active_stat_once;

                if (active && active[condition]) {
                    if (active[condition][value1]) {
                        quest.cur = active[condition][value1];
                    } else {
                        quest.cur = 0;
                    }
                } else {
                    quest.cur = 0;
                }
                quest.is_got = _isGot(active_stat, quest_id);
            }
        }
    }
    return list;

}

function _isGotExchange(status, quest_id) {
    return _isExchangeOver(status, quest_id);
}

function _isGot(active_stat, quest_id) {
    if (active_stat == null) {
        return false;
    }
    return active_stat["" + quest_id] == 1;
}

// 获取活动任务记录
// active_activequest_cfg & showtype = QUEST
function _getActiveQuest(cur_active_ids) {
    return _getActiveQC(cur_active_ids, ACTIVITY_TYPE.QUEST);
}

// 获取充值回馈记录
// active_activequest_cfg & showtype = CHARGE
function _getActiveCharge(cur_active_ids) {
    return _getActiveQC(cur_active_ids, ACTIVITY_TYPE.CHARGE);
}


function _getActiveQC(cur_active_ids, type) {
    let ret = [];
    for (let idx in active_activequest_cfg) {
        let quest = active_activequest_cfg[idx];
        let activeid = quest.activeid;
        let showtype = quest.showtype;
        if (cur_active_ids.indexOf(activeid) != -1 && showtype == type) {
            ret.push(quest);
        }
    }
    return ret;
}

// 获取限时兑换记录
// active_activechange_cfg
function _getActiveExchange(cur_active_ids) {
    let ret = [];
    for (let idx in active_activechange_cfg) {
        let quest = active_activechange_cfg[idx];
        let activeid = quest.activeid;
        if (cur_active_ids.indexOf(activeid) != -1) {
            ret.push(quest);
        }
    }
    return ret;
}

// active_active_cfg
function _getCurActiveIds() {
    let cur_active_ids = [];

    for (let idx in active_active_cfg) {
        let active = active_active_cfg[idx];
        let starttime = new Date(active.starttime);
        let endtime = new Date(active.endtime);
        let curtime = new Date();

        if (DateUtil.between(curtime, starttime, endtime)) {
            cur_active_ids.push(active.id);
        }
    }
    return cur_active_ids;
}

function _checkParams_4_ShowMeActivity(data, cb) {
    let fnName = "_checkParams_4_ShowMeActivity()-";
    let token = data.token;
    let type = data.type;

    if (!_isParamExist(token, fnName + "接口调用请传参数token", cb)) return false;
    if (!_isParamExist(type, fnName + "接口调用请传参数type(活动类型: 1-活动任务,2-充值回馈,3-限时兑换,4-以上全部,5-仅返回活动信息)", cb)) return false;

    return true;
}

function _checkParams_4_GetReward(data, cb) {
    let fnName = "_checkParams_4_GetReward()-";
    let token = data.token;
    let type = data.type;
    let id = data.id;

    if (!_isParamExist(token, fnName + "接口调用请传参数token", cb)) return false;
    if (!_isParamExist(type, fnName + "接口调用请传参数type(活动类型: 1-活动任务,2-充值回馈,3-限时兑换,4-以上全部,5-仅返回活动信息)", cb)) return false;
    if (!_isParamExist(id, fnName + "接口调用请传参数id(任务id)", cb)) return false;

    return true;
}

function _isParamExist(param, err_info, cb) {
    if (param == null) {
        let extraErrInfo = {
            debug_info: "dao_activity._isParamExist()-" + err_info
        };
        logger.error(extraErrInfo.debug_info);
        cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.PARAM_MISSING));
        return false;
    }
    return true;
}

////////////////////////////////////////////////////////////

function _findGiftHistory(pool, cb, next) {
    let sql = '';
    sql += 'SELECT `id`, `gift_id`, `version` ';
    sql += 'FROM `tbl_activity`';
    let sql_data = [];

    pool.query(sql, sql_data, function (err, gift_history) {
        if (err) {
            logger.error("查询数据表tbl_activity出现错误！！！", err);
            cb(err);
        } else {
            next(gift_history);
        }
    });
}

function _findNewGift(gift_history, next) {
    let gift_tobe_insert = [];
    for (let i = 0; i < shop_gift_cfg.length; i++) {
        let need_insert = true;
        let gift = shop_gift_cfg[i];
        let gift_id = gift["id"];
        let version = gift["version"];

        for (let j = 0; j < gift_history.length; j++) {
            let gift_stored = gift_history[i];
            let gift_id_stored = gift["gift_id"];
            let version_stored = gift["version"];

            if (gift_id == gift_id && version == version_stored) {
                need_insert = false;
                break;
            }
        }

        if (need_insert) {
            gift_tobe_insert.push(gift);
        }
    }

    if (gift_tobe_insert != null && gift_tobe_insert.length > 0) {
        next(gift_tobe_insert);
    } else {
        logger.info("没有新的礼包数据，无需执行插入操作");
    }
}