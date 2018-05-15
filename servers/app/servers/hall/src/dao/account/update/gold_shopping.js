////////////////////////////////////////////////////////////////////////////////
// Account Update Gold Shopping
// 每日购买金币的次数(使用钻石换取)
// update
////////////////////////////////////////////////////////////////////////////////

//==============================================================================
// import
//==============================================================================
const ObjUtil = require('../../../buzz/ObjUtil');
const BuzzUtil = require('../../../utils/BuzzUtil');
const gameConfig = require('../../../../../../utils/imports').DESIGN_CFG;
const shop_gold_cfg = gameConfig.shop_gold_cfg;
const vip_vip_cfg = gameConfig.vip_vip_cfg;
const goddess_goddessup_cfg = gameConfig.goddess_goddessup_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const shop_shop_buy_type_cfg = gameConfig.shop_shop_buy_type_cfg;
const RewardModel = require('../../../../../../utils/account/RewardModel');
//==============================================================================
// const
//==============================================================================


let TAG = "【update/gold_shopping】";

const GODDESS_PROPERTY = require('../../../buzz/buzz_goddess').GODDESS_PROPERTY;


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.update = update;
exports.getAllGold = getAllGold;

//------------------------------------------------------------------------------
// Test Export
//------------------------------------------------------------------------------
exports.getOneGoddessAddRate = getOneGoddessAddRate;
exports.getAllGoddessAddRate = getAllGoddessAddRate;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 每日购买金币的次数(使用钻石换取).
 */
function update(data, cb, account) {
    const FUNC = TAG + "update() --- ";

    logger.info(FUNC + "CALL...");

    let coinIdTarget = shop_shop_buy_type_cfg.BUY_GOLD_GAIN.id;
    let coinTypeTarget = shop_shop_buy_type_cfg.BUY_GOLD_GAIN.name;
    let coinIdCost = shop_shop_buy_type_cfg.BUY_GOLD_COST.id;
    let coinTypeCost = shop_shop_buy_type_cfg.BUY_GOLD_COST.name;
    
    let account_id = account['id'];
    let token = account['token'];
    let account_level = account['level'];
    let target_old = account[coinTypeTarget];
    let cost_old = account[coinTypeCost];
    let gold_shopping_old = account['gold_shopping'];

    let gold_shopping_new = data['gold_shopping'];

    // 新增字段: 表示本次购买金币的次数.
    let times = data['times'];
        
    logger.info(FUNC + "gold_shopping_old: " + gold_shopping_old);
    logger.info(FUNC + "gold_shopping_new: " + gold_shopping_new);
    logger.info(FUNC + "times: " + times);
        
    // 数据验证1: 购买次数只能增加不能减少
    if (gold_shopping_new <= gold_shopping_old) {
        cb(new Error(FUNC + "玩家的金币购买次数只能增加，不能减少!(old:" + gold_shopping_old + ", new;" + gold_shopping_new + ")"));
        return;
    }
        
    // 数据验证2: 购买次数不能大于当前VIP等级允许的次数
    // TODO: 暂时将上限定为5
    if (gold_shopping_new > _getMaxBuyCount(account.vip)) {
        cb(new Error(FUNC + "你的VIP等级不足, 请升级VIP等级后再来购买金币!"));
        return;
    }
        
    let all_gold = getAllGold(gold_shopping_old, gold_shopping_new, times);
    if (all_gold == 0) {
        logger.error("玩家购买金币的数额为0, OMG!!!");
        logger.error("gold_shopping_old:", gold_shopping_old);
        logger.error("gold_shopping_new:", gold_shopping_new);
        logger.error("times:", times);
    }
        
    // 计算金币增量和钻石减量
    let delta_target = 0;
    let delta_cost = 0;
    for (let i = 0; i < all_gold.length; i++) {
        let item = all_gold[i];
        //配置表有更新，现在取得的金币数量由gold_base决定
        //delta_target += item["item"];
        // 每一级获取的金币数量不同，由gold_level和account_level共同决定
        delta_target += item["gold_base"] + item["gold_level"] * account_level;
        delta_cost += item["needdiamond"];
    }

    // 根据解锁女神的属性来加成购买金币的数额
    // 策划已经确定, 需要遍历所有女神, 获取每个女神的等级并叠加金币加成属性
    let my_goddess = account["goddess"];
    let my_goddess_json = ObjUtil.str2Data(my_goddess);
    let addRate = getAllGoddessAddRate(my_goddess_json);

    delta_target = Math.round(delta_target * addRate);
    logger.info(FUNC + "addRate:", addRate);
    logger.info(FUNC + "delta_target:", delta_target);

    let target_new = target_old + delta_target;
    let cost_new = cost_old - delta_cost;
        
    logger.info(FUNC + "cost_old: " + cost_old);
    logger.info(FUNC + "delta_cost: " + delta_cost);
    logger.info(FUNC + "cost_new: " + cost_new);
        
    // 数据验证2: 保证玩家有足够的钻石购买
    if (cost_new < 0) {
        cb(new Error("玩家的钻石不够，请先充值钻石再来购买金币!"));
        return;
    }
    
    
    //--------------------------------------------------------------------------
    // 更新缓存中的数据(重要:数据库操作将会被删除)
    //--------------------------------------------------------------------------

    // account[coinTypeTarget] = delta_target;
    // account[coinTypeCost] = cost_new;

    logger.info(FUNC + 'target_old:', target_old);
    logger.info(FUNC + 'cost_old:', cost_old);

    BuzzUtil.addCoin(account, coinIdTarget, delta_target, function(err, res) {
        BuzzUtil.useCoin(account, coinIdCost, delta_cost, function (err, res) {

            logger.info(FUNC + 'target_new:', target_new);
            logger.info(FUNC + 'cost_new:', cost_new);

            account.gold_shopping = gold_shopping_old + times;

            //统计金币购买次数dfc
            let mission = new RewardModel(account);
            mission.addProcess(RewardModel.TaskType.GOLD_TIMES, times);
            account.commit();

            // yDONE: 金币数据记录
            // yDONE: 钻石数据记录

            let targetLog = {
                account_id: account_id,
                log_at: new Date(),
                gain: delta_target,
                cost: 0,
                total: target_new,
                scene: common_log_const_cfg.GOLD_BUY,
                nickname: 0,
            };
            switch(coinTypeTarget) {
                case "gold":
                    targetLog.duration = 0;
                    targetLog.level = account.level;
                    logBuilder.addGoldLogEx(targetLog);
                break;
                case "pearl":
                    logBuilder.addPearlLogEx(targetLog);
                break;
            }

            let costLog = {
                account_id: account_id,
                log_at: new Date(),
                gain: 0,
                cost: delta_cost,
                total: cost_new,
                scene: common_log_const_cfg.GOLD_BUY,
                nickname: 0,
            };
            switch(coinTypeCost) {
                case "gold":
                    costLog.duration = 0;
                    costLog.level = account.level;
                    logBuilder.addGoldLogEx(costLog);
                break;
                case "pearl":
                    logBuilder.addPearlLogEx(costLog);
                break;
            }
            let ret = {
                gold: account.gold,
                pearl: account.pearl,
                first_buy: account.first_buy,
                activity_gift: account.activity_gift,
                gold_shopping: account.gold_shopping,
            };
            cb(null, [ret]);
            
        });
    });
}

/**
 * 获取所有女神的购买金币加成.
 * @param my_goddess_json 女神数据(json格式).
 */
function getAllGoddessAddRate(my_goddess_json) {
    let ret = 1;
    for (let idx in my_goddess_json) {
        let goddess = my_goddess_json[idx];
        // 解锁了的女神才去处理
        if (goddess.level > 0) {
            ret += getOneGoddessAddRate(goddess.id, goddess.level);
        }
    }
    // toFixed只能转换为字符串, 还需要parseFloat转换为浮点数.
    return parseFloat(ret.toFixed(1));
}

/**
 * 获取一个女神的购买金币加成.
 * @param id 女神id.
 * @param level 女神等级.
 */
function getOneGoddessAddRate(id, level) {
    for (let idx in goddess_goddessup_cfg) {
        let info = goddess_goddessup_cfg[idx];
        if (info.id == id && info.level <= level) {
            if (info.property == GODDESS_PROPERTY.GOLD_SHOPPING) {
                return info.value;
            }
        }
    }
    return 0;
}


//==============================================================================
// private
//==============================================================================

function _getMaxBuyCount(vipLevel) {
    return vip_vip_cfg[vipLevel].vip_gold_buy;
}

// 获得所有金币购买包
function getAllGold(gold_shopping_old, gold_shopping_new, times) {
    let ret = [];
    // 以服务器为准计算购买得到的金币包
    for (let i = gold_shopping_old + 1; i <= gold_shopping_old + times; i++) {
    // for (let i = gold_shopping_old + 1; i <= gold_shopping_new; i++) {
        for (let gold_idx = 0; gold_idx < shop_gold_cfg.length; gold_idx++) {
            let item = shop_gold_cfg[gold_idx];
            let id = item["id"];
            if (i == id) {
                ret.push(item);
                break;
            }
        }
        let max_item = shop_gold_cfg[shop_gold_cfg.length - 1];
        if (i > max_item.id) {
            ret.push(max_item);
        }
    }
    logger.info("ret: ", ret);
    return ret;
}
