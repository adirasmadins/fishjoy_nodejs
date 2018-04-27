const BuzzUtil = require('../utils/BuzzUtil');
const ArrayUtil = require('../utils/ArrayUtil');
const CommonUtil = require('../buzz/CommonUtil');
const buzz_draw = require('../buzz/buzz_draw');
const buzz_cst_game = require('../buzz/cst/buzz_cst_game');
const CstError = require('../../../../consts/fish_error');
const _ = require('underscore');
const DaoCommon = require('./dao_common');
const dao_gold = require('./dao_gold');
const DaoReward = require('./dao_reward');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const common_const_cfg = gameConfig.common_const_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const active_draw_cfg = gameConfig.active_draw_cfg;// 抽奖奖品
const active_drawcost_cfg = gameConfig.active_drawcost_cfg;// 抽奖花费
const item_item_cfg = gameConfig.item_item_cfg;// 物品表
const string_strings_cfg = gameConfig.string_strings_cfg;// 字符串表
const ItemType = require('../buzz/pojo/Item').ItemType;
const ERROR_OBJ = CstError.ERROR_OBJ;

let TAG = "【dao_draw】";

const DRAW_TYPE = buzz_draw.DRAW_TYPE;
exports.DRAW_TYPE = DRAW_TYPE;

let GOLD_POOL = _pool(DRAW_TYPE.GOLD);
let PEARL_POOL = _pool(DRAW_TYPE.PEARL);
const DRAW_POOL = {
    '1': GOLD_POOL,
    '2': PEARL_POOL,
};
/** 武器皮肤的抽奖随机池. */
for (let i = 0; i < active_drawcost_cfg.length; i++) {
    let drawCost = active_drawcost_cfg[i];
    let drawType = drawCost.drawtype;
    if (drawType != 1 && drawType != 2) {
        DRAW_POOL[drawType] = _pool(drawType);
    }
}

let RANDOM_MAX = {
    '1': _randomMax(DRAW_TYPE.GOLD),
    '2': _randomMax(DRAW_TYPE.PEARL),
};
/** 武器皮肤的总数目. */
for (let i = 0; i < active_drawcost_cfg.length; i++) {
    let drawCost = active_drawcost_cfg[i];
    let drawType = drawCost.drawtype;
    if (drawType != 1 && drawType != 2) {
        RANDOM_MAX[drawType] = _randomMax(drawType);
    }
}

let DRAW_TIME_LIMIT_1 = 1;
let DRAW_TIME_LIMIT_MULTI = 5;


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.getDraw = getDraw;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 获取抽奖获得的奖品{item:?, item_id:?, item_count:?}.
 */
function getDraw(pool, data, cb) {
    const FUNC = TAG + "getDraw() --- ";

    if (!_prepare(data, cb)) return;
    BuzzUtil.cacheLinkDataApi(data, "get_draw");

    let token = data.token;

    DaoCommon.checkAccount(pool, token, function (error, account) {
        if (error) {
            cb(error);
            return;
        }

        let type = data.type;
        let times = data.times;
        let draw_pool = DRAW_POOL[type];
        let platform = account.platform;

        // 需要检查玩家的金币或钻石是否足够
        let cost = _getCost(type);
        logger.info(FUNC + "cost:", cost);
        logger.info(FUNC + "type:", type);
        if (cost) {

            let draw_type = cost.type === ItemType.GOLD ? DRAW_TYPE.GOLD : DRAW_TYPE.PEARL;
            // let bGold = cost.type === ItemType.GOLD ? true : false;


            switch (cost.type) {
                case ItemType.GOLD: {
                    let goldTimes = buzz_draw.getActualCostTimes(account, draw_type, times);
                    buzz_draw.useFree(account, DRAW_TYPE.GOLD, times - goldTimes);
                    cost.num = cost.num * goldTimes;
                    logger.info(FUNC + "使用金币:", cost.num);
                    if (account.gold < cost.num) {
                        logger.error(FUNC + "抽奖金币不足, 需要" + cost.num + "，实际拥有" + account.gold);
                        cb(ERROR_OBJ.GOLD_NOT_ENOUGH);
                        return;
                    }
                    break;
                }


                case ItemType.PEARL: {
                    let pearlTimes = buzz_draw.getActualCostTimes(account, DRAW_TYPE.PEARL, times);
                    buzz_draw.useFree(account, DRAW_TYPE.PEARL, times - pearlTimes);
                    cost.num = cost.num * pearlTimes;
                    logger.info(FUNC + "使用钻石:", cost.num);
                    if (account.pearl < cost.num) {
                        logger.error(FUNC + "抽奖钻石不足, 需要" + cost.num + "，实际拥有" + account.pearl);
                        cb(ERROR_OBJ.DIAMOND_NOT_ENOUGH);
                        return;
                    }
                    break;
                }


                // case ItemType.TOKENS:
                case ItemType.SKIN_DEBRIS: {
                    let weaponSkinOwn = account.weapon_skin.own;
                    let weaponDrawId = type % 100;
                    logger.info(FUNC + "weaponSkinOwn:", weaponSkinOwn);
                    logger.info(FUNC + "weaponDrawId:", weaponDrawId);
                    if (!ArrayUtil.contain(weaponSkinOwn, weaponDrawId)) {
                        logger.error(FUNC + "玩家没有皮肤" + weaponDrawId + "，抽奖被禁止");
                        cb(ERROR_OBJ.WEAPON_SKIN_DRAW_WRONG_SKIN_ID);
                        return;
                    }

                    let tokensTimes = buzz_draw.getActualCostTimes(account, type, times);
                    logger.info(FUNC + "tokensTimes:", tokensTimes);
                    buzz_draw.useFree(account, type, times - tokensTimes);
                    cost.num = cost.num * tokensTimes;
                    logger.info(FUNC + "使用代币:", cost.num);
                    /** 玩家拥有的代币数量. */
                    let tokensCount = account.package[cost.type][cost.item];

                    if (tokensCount < cost.num) {
                        logger.error(FUNC + "抽奖代币不足, 需要" + cost.num + "，实际拥有" + tokensCount);
                        let lessTokens = cost.num - tokensCount;
                        logger.error(FUNC + "代币还差" + lessTokens);
                        let diamondNeed = lessTokens * common_const_cfg.WEAPONS_DRAW_COST;
                        logger.error(FUNC + "使用钻石补充不足的代币:", diamondNeed);
                        if (account.pearl < diamondNeed) {
                            cb(ERROR_OBJ.DIAMOND_NOT_ENOUGH);
                            return;
                        }
                        account.pearl = -diamondNeed;
                        cost.num = tokensCount;
                    }
                    logger.info(FUNC + "cost.num :", cost.num);
                    break;
                }
            }

            let rand = [];
            let items = [];
            let idx = [];
            for (let i = 0; i < times; i++) {
                let r = _.random(1, RANDOM_MAX[type]);
                logger.info(FUNC + 'r:', r);
                let item = _pickup1(draw_pool, r);
                logger.info(FUNC + 'item:', item);
                rand.push(r);
                items.push(item.item);
                idx.push(item.idx);
            }

            logger.info(FUNC + "-----------------items:", items);
            logger.info(FUNC + "-----------------idx:", idx);
            // 获取物品
            DaoReward.getReward(pool, account, items, function (err_get_reward, results_get_reward) {
                // AccountCommon.getAccountByToken(pool, token, function (err1, results1) {
                // AccountCommon.getAccountByUid(pool, token, function (err1, account) {

                let cost_items = [[cost.item, cost.num]];
                logger.info(FUNC + "cost_items:", cost_items);
                // 消耗金币或钻石
                DaoReward.cost(pool, account, cost_items, function (err, ret) {

                    let ret_account = account;
                    ret_account.idx = idx;
                    // 在total_draw中记录抽奖的次数.
                    buzz_draw.addDrawCount(account, type, times);
                    // 新增total_draw的返回.
                    ret_account.draw = {
                        free_draw: account.free_draw,
                        total_draw: account.total_draw,
                    };

                    cb(null, ret_account);


                    let player = account.nickname;
                    if (!player || player == "") {
                        player == account.channel_account_name;
                        account.nickname = player;
                    }
                    if (!player || player == "") {
                        player == account.tempname;
                        account.nickname = player;
                    }
                    account.commit();
                    let txt = player + '抽中了';
                    let params = [player];
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        let item_name = _getNameFromItemId(item[0]);
                        let item_num = item[1];
                        if (i > 0) {
                            txt += "，";
                        }
                        txt += item_name + 'x' + item_num;
                        params.push(item_name);
                        params.push(item_num);
                    }
                    // 如果需要抽奖显示vip则解开注释.
                    // 确认这里不需要VIP
                    // params.push(account.vip);
                    let content = {
                        txt: txt,
                        times: 1,
                        params: params,
                        platform: platform,
                    };
                    buzz_cst_game.addBroadcastDraw(content);

                    // yDONE: 金币数据记录
                    let gain = 0;
                    let cost = 0;
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        let item_id = item[0];
                        let item_num = item[1];
                        if ('i001' == item_id) {
                            gain += item_num;
                        }
                    }
                    logger.info(FUNC + "-----------------cost_items:", cost_items);
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
                        let data = {
                            account_id: ret_account.id,
                            token: token,
                            total: ret_account.gold,
                            duration: 0,
                            group: [{
                                "gain": gain,
                                "cost": cost,
                                "scene": common_log_const_cfg.ACTIVE_DRAW,
                            }],
                        };
                        logger.info(FUNC + "插入一条金币日志:", data);
                        dao_gold.addGoldLogCache(pool, data, function (err, res) {
                            if (err) return logger.error(FUNC + "err:", err);
                        });
                    }


                    // yDONE: 钻石数据记录
                    let diamondGain = 0;
                    let diamondCost = 0;
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        let item_id = item[0];
                        let item_num = item[1];
                        if ('i002' == item_id) {
                            diamondGain += item_num;
                        }
                    }
                    for (let i = 0; i < cost_items.length; i++) {
                        let item = cost_items[i];
                        let item_id = item[0];
                        let item_num = item[1];
                        if ('i002' == item_id) {
                            diamondCost += item_num;
                        }
                    }
                    if (diamondGain > 0 || diamondCost > 0) {
                        logBuilder.addPearlLogEx({
                            account_id: account.id,
                            log_at: new Date(),
                            gain: diamondGain,
                            cost: diamondCost,
                            total: account.pearl,
                            scene: common_log_const_cfg.ACTIVE_DRAW,
                            nickname: 0,
                        });
                    }
                });
            });
        }
        else {
            logger.error(FUNC + "type:", type);
            logger.error(FUNC + "times:", times);
            logger.error(FUNC + "uid:", account.id);
        }

    });

}


//==============================================================================
// private
//==============================================================================

function _getNameFromItemId(item_id) {
    return string_strings_cfg[item_item_cfg[item_id].name].cn;
}

function _randomMax(type) {
    let ret = 0;
    for (let idx in active_draw_cfg) {
        let item = active_draw_cfg[idx];
        if (item.drawtype == type) {
            ret += item.item_probability;
        }
    }
    return ret;
}

function _getCost(type) {
    let item = _getCostItem(type);
    if (item) {
        let cost_type = _getItemTypeByKey(item[0]);
        let cost_num = item[1];
        return {
            item: item[0],
            type: cost_type,
            num: cost_num,
        };
    }
    else {
        return null;
    }
}

// 返回物品类型(Item.ItemType中有存放).
function _getItemTypeByKey(item_key) {
    for (let idx in item_item_cfg) {
        let item = item_item_cfg[idx];
        if (idx == item_key) {
            return item.type;
        }
    }
    logger.info("item_key:", item_key);
    logger.info("不该走到这里");
}

// 获取抽奖一次的花费, 返回一个item : ["i001",50000]或["i002",50].
function _getCostItem(type) {
    for (let idx in active_drawcost_cfg) {
        let cost = active_drawcost_cfg[idx];
        if (cost.drawtype == type) {
            return cost.item;
        }
    }
}

// 做一次减法和一次比较
function _pickup1(pool, r) {
    for (let i in pool) {
        let item = pool[i];
        r -= item.item_probability;
        if (r <= 0) return {item: [item.item_id, item.item_count], idx: item.item};
    }
}

// 做两次比较
function _pickup2(pool, r) {
    for (let i in pool) {
        let item = pool[i];
        if (r > item.min && r <= item.max) return item;
    }
}

////////////////////////////////////////////////////////////////////////////////

// 计算一个min和一个max用于做大小比较
function _limit(pool) {
    let temp = 0;
    return _.map(pool, function (item) {
        item.min = temp;
        item.max = item.item_probability + temp;
        temp = item.max;
        return item;
    });
}

//过滤抽奖类型(返回仅类型1或2的所有对象数组)
function _pool(type) {
    return _.filter(active_draw_cfg, function (item) {
        return item.drawtype == type;
    });
}

function _prepare(data, cb) {

    let token = data['token'];
    let type = data['type'];
    let times = data['times'];

    if (!CommonUtil.isParamExist("dao_draw", token, "接口调用请传参数token", cb)) return false;
    if (!CommonUtil.isParamExist("dao_draw", type, "接口调用请传参数type(抽奖类型, 1.金币抽奖; 2.钻石抽奖)", cb)) return false;
    if (!CommonUtil.isParamExist("dao_draw", times, "接口调用请传参数times(抽奖次数，1次或10次)", cb)) return false;

    if (times != DRAW_TIME_LIMIT_1 && times != DRAW_TIME_LIMIT_MULTI) {
        cb(ERROR_OBJ.DRAW_TIMES_ERR);
        return false;
    }

    return true;
}