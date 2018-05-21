const BuzzUtil = require('../utils/BuzzUtil');
const ArrayUtil = require('../utils/ArrayUtil');
const CommonUtil = require('../buzz/CommonUtil');
const buzz_draw = require('../buzz/buzz_draw');
const buzz_cst_game = require('../buzz/cst/buzz_cst_game');
const CstError = require('../../../../consts/fish_error');
const _ = require('underscore');
const DaoReward = require('./dao_reward');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const common_const_cfg = gameConfig.common_const_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const active_draw_cfg = gameConfig.active_draw_cfg; // 抽奖奖品
const active_drawcost_cfg = gameConfig.active_drawcost_cfg; // 抽奖花费
const item_item_cfg = gameConfig.item_item_cfg; // 物品表
const string_strings_cfg = gameConfig.string_strings_cfg; // 字符串表
const ItemType = require('../buzz/pojo/Item').ItemType;
const ERROR_OBJ = CstError.ERROR_OBJ;
const GameEventBroadcast = require('../../../../common/broadcast/GameEventBroadcast');
const DrawBroadcast = require('../../../../common/broadcast/DrawBroadcast');
const itemDef = require('../../../../consts/itemDef');
const RewardModel = require('../../../../utils/account/RewardModel');

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
function getDraw(data, cb) {
    const FUNC = TAG + "getDraw() --- ";

    if (!_prepare(data, cb)) return;
    BuzzUtil.cacheLinkDataApi(data, "get_draw");

    let token = data.token;

    let account = data.account;

    let type = data.type;
    /** 抽奖次数 */
    let times = data.times;
    let draw_pool = DRAW_POOL[type];
    let platform = account.platform;
    let real_times = 0;
    // 需要检查玩家的金币或钻石是否足够
    let cost = _getCost(type);
    logger.info(FUNC + "cost:", cost);
    logger.info(FUNC + "type:", type);
    if (cost) {

        let draw_type = cost.type === ItemType.GOLD ? DRAW_TYPE.GOLD : DRAW_TYPE.PEARL;
        let total_draw = account.total_draw;
        let vipInfo = BuzzUtil.getVipInfo(account.vip);
        let drawBroadcastType = GameEventBroadcast.TYPE.DRAW.UNKNOWN;

        switch (cost.type) {
            case ItemType.GOLD:
                // 需要判断玩家抽奖次数是否超过了限制(金币抽奖)
                let totalDrawGold = total_draw.gold;
                if (totalDrawGold + times > vipInfo.drawtimes) {
                    cb(ERROR_OBJ.DRAW_TIMES_OVER_LIMIT_TODAY);
                    return;
                }

                real_times = buzz_draw.getActualCostTimes(account, draw_type, times);
                // logger.info(FUNC + "抽奖消耗金币的次数-goldTimes:", goldTimes);
                buzz_draw.useFree(account, DRAW_TYPE.GOLD, times - real_times);
                cost.num = cost.num * real_times;
                logger.info(FUNC + "使用金币:", cost.num);
                if (account.gold < cost.num) {
                    logger.error(FUNC + "抽奖金币不足, 需要" + cost.num + "，实际拥有" + account.gold);
                    cb(ERROR_OBJ.GOLD_NOT_ENOUGH);
                    return;
                }
                drawBroadcastType = GameEventBroadcast.TYPE.DRAW.GOLD;
                break;

            case ItemType.PEARL:
                // 需要判断玩家抽奖次数是否超过了限制(钻石抽奖)
                let totalDrawDiamond = total_draw.diamond;
                if (totalDrawDiamond + times > vipInfo.drawtimes) {
                    cb(ERROR_OBJ.DRAW_TIMES_OVER_LIMIT_TODAY);
                    return;
                }

                real_times = buzz_draw.getActualCostTimes(account, DRAW_TYPE.PEARL, times);
                buzz_draw.useFree(account, DRAW_TYPE.PEARL, times - real_times);
                cost.num = cost.num * real_times;
                logger.info(FUNC + "使用钻石:", cost.num);
                if (account.pearl < cost.num) {
                    logger.error(FUNC + "抽奖钻石不足, 需要" + cost.num + "，实际拥有" + account.pearl);
                    cb(ERROR_OBJ.DIAMOND_NOT_ENOUGH);
                    return;
                }
                drawBroadcastType = GameEventBroadcast.TYPE.DRAW.PEARL;
                break;

            // 物品中的13:'c***'被配置表转换为14:'c***'的兼容处理
            case ItemType.SKIN_DEBRIS:
            case ItemType.SKIN_CARD:
                // 需要判断玩家抽奖次数是否超过了限制(武器碎片抽奖)
                let weaponSkinOwn = account.weapon_skin.own;
                let weaponDrawId = type % 100;
                let totalDrawSkin = total_draw[type] || 0;
                if (totalDrawSkin + times > vipInfo.drawtimes) {
                    cb(ERROR_OBJ.DRAW_TIMES_OVER_LIMIT_TODAY);
                    return;
                }

                logger.info(FUNC + "weaponSkinOwn:", weaponSkinOwn);
                logger.info(FUNC + "weaponDrawId:", weaponDrawId);
                if (!ArrayUtil.contain(weaponSkinOwn, weaponDrawId)) {
                    logger.error(FUNC + "玩家没有皮肤" + weaponDrawId + "，抽奖被禁止");
                    cb(ERROR_OBJ.WEAPON_SKIN_DRAW_WRONG_SKIN_ID);
                    return;
                }
                real_times = buzz_draw.getActualCostTimes(account, type, times);
                logger.info(FUNC + "tokensTimes:", real_times);
                buzz_draw.useFree(account, type, times - real_times);
                cost.num = cost.num * real_times;
                logger.info(FUNC + "使用代币:", cost.num);
                /** 玩家拥有的代币数量. */
                // 物品中的13:'c***'被配置表转换为14:'c***'的兼容处理
                if (null == account.package[ItemType.SKIN_DEBRIS]) {
                    account.package[ItemType.SKIN_DEBRIS] = {};
                }
                if (null == account.package[ItemType.SKIN_CARD]) {
                    account.package[ItemType.SKIN_CARD] = {};
                }
                let tokensCount13 = account.package[ItemType.SKIN_DEBRIS][cost.item] || 0;
                let tokensCount14 = account.package[ItemType.SKIN_CARD][cost.item] || 0;
                let tokensCount = tokensCount13 + tokensCount14;
                account.package[ItemType.SKIN_CARD][cost.item] = tokensCount;
                delete account.package[ItemType.SKIN_DEBRIS][cost.item];
                account.package = account.package;
                account.commit();

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
                drawBroadcastType = GameEventBroadcast.TYPE.DRAW.SKIN;

                break;
            default:
            {
                logger.error('item type:', cost.type);
                cb({code: 6027, msg: 'Item Type Illegal'});
                // cb(ERROR_OBJ.ITEM_TYPE_ILLEGAL);
                return;
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
        DaoReward.getReward(account, items, function (err_get_reward, results_get_reward) {
            let cost_items = [
                [cost.item, cost.num]
            ];
            logger.info(FUNC + "cost_items:", cost_items);
            // 消耗金币或钻石
            DaoReward.cost(account, cost_items, function (err, ret) {
                let ret_account = {
                    gold: account.gold,
                    pearl: account.pearl,
                    skill: account.skill,
                    package: account.package,
                    has_new_mail: account.has_new_mail,
                    charm_point: account.charm_point,
                    charm_rank: account.charm_rank
                };
                ret_account.idx = idx;
                // 在total_draw中记录抽奖的次数.
                buzz_draw.addDrawCount(account, type, real_times);
                // 新增total_draw的返回.
                ret_account.draw = {
                    free_draw: account.free_draw,
                    total_draw: account.total_draw,
                };

                // if (cost.type == ItemType.SKIN_DEBRIS || cost.type == 14) {
                if (cost.type == ItemType.SKIN_CARD) {
                    let mission = new RewardModel(account);
                    // logger.error(`抽奖任务记录`);
                    mission.commitProcess(RewardModel.TaskType.WEAPON_DRAW, times, 0);
                }

                cb(null, ret_account);

                let player = account.nickname;
                account.commit();
                let txt = player + '抽中了';
                let drawParams = [player];
                for (let i = 0; i < items.length; i++) {
                    let item = items[i];
                    let item_name = _getNameFromItemId(item[0]);
                    let item_num = item[1];
                    if (i > 0) {
                        txt += "，";
                    }
                    txt += item_name + 'x' + item_num;
                    drawParams.push(item_name);
                    drawParams.push(item_num);

                    // 发布公告
                    const itemNotice = item[2];
                    if (itemNotice) {
                        let gameEventParams = [player, item_name, item_num];
                        // logger.error('--------------发布公告:', gameEventParams);
                        let gameEventContent = {
                            type: GameEventBroadcast.TYPE.GAME_EVENT.DRAW_REWARD,
                            params: gameEventParams,
                        };
                        new GameEventBroadcast(gameEventContent).extra(account).add();
                    }
                }
                // 抽奖记录
                let drawContent = {
                    type: drawBroadcastType,
                    params: drawParams,
                };
                new DrawBroadcast(drawContent).extra(account).add();

                // yDONE: 金币数据记录
                let item_list = [];
                let cost_item_list = [];
                for (let i = 0; i < items.length; i++) {
                    let item = items[i];
                    let item_id = item[0];
                    let item_num = item[1];
                    item_list.push({
                        item_id: item_id,
                        item_num: item_num
                    });
                }
                logger.info(FUNC + "-----------------cost_items:", cost_items);
                for (let i = 0; i < cost_items.length; i++) {
                    let item = cost_items[i];
                    let item_id = item[0];
                    let item_num = item[1];
                    cost_item_list.push({
                        item_id: item_id,
                        item_num: item_num
                    });
                }

                logBuilder.addGoldAndItemLog(item_list, account, common_log_const_cfg.ACTIVE_DRAW);
                logBuilder.addGoldAndItemLog(cost_item_list, account, common_log_const_cfg.ACTIVE_DRAW, -1);

                // yDONE: 钻石数据记录
                let diamondGain = 0;
                let diamondCost = 0;
                for (let i = 0; i < items.length; i++) {
                    let item = items[i];
                    let item_id = item[0];
                    let item_num = item[1];
                    if (itemDef.DIAMOND == item_id) {
                        diamondGain += item_num;
                    }
                }
                for (let i = 0; i < cost_items.length; i++) {
                    let item = cost_items[i];
                    let item_id = item[0];
                    let item_num = item[1];
                    if (itemDef.DIAMOND == item_id) {
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
    } else {
        logger.error(FUNC + "type:", type);
        logger.error(FUNC + "times:", times);
        logger.error(FUNC + "uid:", account.id);
    }
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
    } else {
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
        if (r <= 0) return {
            item: [item.item_id, item.item_count, item.notice],
            idx: item.item
        };
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