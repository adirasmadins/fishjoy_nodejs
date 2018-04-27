const Reward = require('../buzz/pojo/Reward');
const ObjUtil = require('../buzz/ObjUtil');
const buzz_limit_items = require('../buzz/buzz_limit_items');
const ItemTypeC = require('../buzz/pojo/Item').ItemTypeC;
const DaoGold = require('./dao_gold');
const DaoPearl = require('./dao_pearl');
const _ = require('underscore');


const TAG = "【dao_reward】";

exports.getCommonReward = getCommonReward;
exports.costCommon = costCommon;
exports.getReward = getReward;
exports.cost = cost;// 交换时的代价, 需要从背包中移除的物品
exports.enough = enough;// 交换时的代价, 判断玩家是否拥有足够的物品进行交换
exports.resetMonthSign = resetMonthSign;

/**
 * 每月一日重置月签数据
 */
function resetMonthSign(pool, monthSignInitStr, cb) {
    const FUNC = TAG + "resetMonthSign() --- ";

    let sql = "";
    sql += "UPDATE `tbl_account_sign` ";
    sql += "SET month_sign=? ";

    let sql_data = [monthSignInitStr];

    pool.query(sql, sql_data, function (err, result) {
        logger.error(FUNC + "err:", err);
        logger.info(FUNC + "result:", result);
        cb();
    });
}

/**
 * 获取奖励.
 * @param data 包含两个数据account, reward.
 */
function getCommonReward(data, cb) {
    let account = data.account;
    let reward = data.reward;
    getReward(account, reward, cb);
}

/**
 * 消耗物品.
 * @param data 包含两个数据account, reward.
 */
function costCommon(data, cb) {
    let account = data.account;
    let reward = data.reward;
    cost(account, reward, cb);
}

/**
 * 获取奖励.
 * @param account 获取奖励的账户.
 * @param reward 获取的奖励字符串(或对象), 需要统一为对象作为Reward的输入.
 *     reward格式为
 */
function getReward(account, reward, cb) {
    const FUNC = TAG + "getReward() --- ";

    logger.info(FUNC + 'reward:', reward);

    reward = ObjUtil.str2Data(reward);
    //新增限时道具获得时间，方便计算过期时间
    buzz_limit_items.setItemGetAt(account, reward);
    let rewardInfo = new Reward(reward);

    logger.info(FUNC + 'rewardInfo:', rewardInfo);

    let gold = rewardInfo.gold;
    let pearl = rewardInfo.pearl;

    let skill_inc = rewardInfo.skill;
    let debris_inc = rewardInfo.debris;
    let gift_inc = rewardInfo.gift;
    let tokens_inc = rewardInfo.tokens;
    let mix_inc = rewardInfo.mix;
    let skin_inc = rewardInfo.skin;
    let skin_debris_inc = rewardInfo.skin_debris;


    logger.info(FUNC + "更新缓存中的玩家数据");

    if (gold > 0) {
        account.gold = gold;
    }

    if (pearl > 0) {
        account.pearl = pearl;
    }

    logger.info(FUNC + "(1)cache_account.skill:", account.skill);
    logger.info(FUNC + "skill_inc:", skill_inc);

    if (skill_inc) {
        if (!account.skill) {
            account.skill = {};
        }
        account.skill = ObjUtil.update(account.skill, skill_inc);
    }

    logger.info(FUNC + "(2)cache_account.skill:", account.skill);

    if (account.package[ItemTypeC.DEBRIS] == null) {
        account.package[ItemTypeC.DEBRIS] = {};
    }
    account.package[ItemTypeC.DEBRIS] = ObjUtil.update(account.package[ItemTypeC.DEBRIS], debris_inc);

    if (account.package[ItemTypeC.GIFT] == null) {
        account.package[ItemTypeC.GIFT] = {};
    }
    account.package[ItemTypeC.GIFT] = ObjUtil.update(account.package[ItemTypeC.GIFT], gift_inc);

    if (account.package[ItemTypeC.TOKENS] == null) {
        account.package[ItemTypeC.TOKENS] = {};
    }
    account.package[ItemTypeC.TOKENS] = ObjUtil.update(account.package[ItemTypeC.TOKENS], tokens_inc);

    if (account.package[ItemTypeC.MIX] == null) {
        account.package[ItemTypeC.MIX] = {};
    }
    account.package[ItemTypeC.MIX] = ObjUtil.update(account.package[ItemTypeC.MIX], mix_inc);


    if (account.package[ItemTypeC.SKIN] == null) {
        account.package[ItemTypeC.SKIN] = {};
    }
    account.package[ItemTypeC.SKIN] = ObjUtil.update(account.package[ItemTypeC.SKIN], skin_inc);

    if (account.package[ItemTypeC.SKIN_DEBRIS] == null) {
        account.package[ItemTypeC.SKIN_DEBRIS] = {};
    }
    account.package[ItemTypeC.SKIN_DEBRIS] = ObjUtil.update(account.package[ItemTypeC.SKIN_DEBRIS], skin_debris_inc);

    account.package = account.package;
    account.commit(function () {
        cb(null, 1);
    });
}

function cost(account, needitem, cb) {
    const FUNC = TAG + "cost() --- ";

    let account_id = account.id;

    logger.info(FUNC + 'needitem:', needitem);

    let rewardInfo = new Reward(needitem);

    let gold = rewardInfo.gold;
    let pearl = rewardInfo.pearl;

    let skill_inc = rewardInfo.skill;
    let debris_inc = rewardInfo.debris;
    let gift_inc = rewardInfo.gift;
    let tokens_inc = rewardInfo.tokens;
    let mix_inc = rewardInfo.mix;
    let skin_inc = rewardInfo.skin;
    let skin_debris_inc = rewardInfo.skin_debris;

    logger.info(FUNC + "account.skill:", account.skill);


    doNextWithAccount(account);

    // =========================================================================
    // 消耗物品(更新缓存)
    // =========================================================================

    function doNextWithAccount(account) {
        logger.info(FUNC + "更新缓存中的玩家数据");
        if (skill_inc) {
            ObjUtil.cost(account.skill, skill_inc, cb);
            account.skill = account.skill;
        }

        ObjUtil.cost(account.package[ItemTypeC.DEBRIS], debris_inc, cb);
        ObjUtil.cost(account.package[ItemTypeC.GIFT], gift_inc, cb);
        ObjUtil.cost(account.package[ItemTypeC.TOKENS], tokens_inc, cb);
        ObjUtil.cost(account.package[ItemTypeC.MIX], mix_inc, cb);
        ObjUtil.cost(account.package[ItemTypeC.SKIN], skin_inc, cb);
        ObjUtil.cost(account.package[ItemTypeC.SKIN_DEBRIS], skin_debris_inc, cb);

        account.package = account.package;
        if (gold > 0) {
            account.gold = -gold;//金币使用增量，等号后面是delta
        }
        if (pearl > 0) {
            account.pearl = -pearl;
        }
        account.commit();
        cb(null, 1);
    }
}

function enough(account, needitem) {
    const FUNC = TAG + "enough() --- ";

    let account_id = account.id;

    logger.info(FUNC + 'needitem: ', needitem);

    let rewardInfo = new Reward(needitem);

    let gold = rewardInfo.gold;
    let pearl = rewardInfo.pearl;

    let skill_inc = rewardInfo.skill;
    let debris_inc = rewardInfo.debris;
    let gift_inc = rewardInfo.gift;
    let tokens_inc = rewardInfo.tokens;
    let mix_inc = rewardInfo.mix;
    let skin_inc = rewardInfo.skin;
    let skin_debris_inc = rewardInfo.skin_debris;

    // =========================================================================
    // 兑换中消耗物品
    // =========================================================================
    let skill_old = ObjUtil.str2Data(account.skill == null ? {} : account.skill);
    let pack_old = ObjUtil.str2Data(account.package == null ? {} : account.package);

    logger.info(FUNC + "skill_old: ", skill_old);
    //logger.info(FUNC + "pack_old: ", pack_old);

    let notEnough = {};

    // 技能
    if (skill_inc && !ObjUtil.isEmpty(skill_inc)) {
        logger.info(FUNC + "验证技能!");
        let diff = ObjUtil.enough(skill_old, skill_inc);
        if (ObjUtil.length(diff) > 0) notEnough["skill"] = diff;
    }
    // 碎片
    if (!ObjUtil.isEmpty(debris_inc)) {
        logger.info(FUNC + "验证碎片!");
        pack_old[ItemTypeC.DEBRIS] = ObjUtil.noNull(pack_old[ItemTypeC.DEBRIS]);
        let diff = ObjUtil.enough(pack_old[ItemTypeC.DEBRIS], debris_inc);
        if (ObjUtil.length(diff) > 0) notEnough[ItemTypeC.DEBRIS] = diff;
    }
    // 礼包
    if (!ObjUtil.isEmpty(gift_inc)) {
        logger.info(FUNC + "验证礼包!");
        pack_old[ItemTypeC.GIFT] = ObjUtil.noNull(pack_old[ItemTypeC.GIFT]);
        let diff = ObjUtil.enough(pack_old[ItemTypeC.GIFT], gift_inc);
        if (ObjUtil.length(diff) > 0) notEnough[ItemTypeC.GIFT] = diff;
    }
    // 代币
    if (!ObjUtil.isEmpty(tokens_inc)) {
        logger.info(FUNC + "验证代币!");
        pack_old[ItemTypeC.TOKENS] = ObjUtil.noNull(pack_old[ItemTypeC.TOKENS]);
        let diff = ObjUtil.enough(pack_old[ItemTypeC.TOKENS], tokens_inc);
        if (ObjUtil.length(diff) > 0) notEnough[ItemTypeC.TOKENS] = diff;
    }
    // 合成物品
    if (!ObjUtil.isEmpty(mix_inc)) {
        logger.info(FUNC + "验证合成物品!");
        pack_old[ItemTypeC.MIX] = ObjUtil.noNull(pack_old[ItemTypeC.MIX]);
        let diff = ObjUtil.enough(pack_old[ItemTypeC.MIX], mix_inc);
        if (ObjUtil.length(diff) > 0) notEnough[ItemTypeC.MIX] = diff;
    }
    // 武器皮肤
    if (!ObjUtil.isEmpty(skin_inc)) {
        logger.info(FUNC + "验证武器皮肤!");
        pack_old[ItemTypeC.SKIN] = ObjUtil.noNull(pack_old[ItemTypeC.SKIN]);
        let diff = ObjUtil.enough(pack_old[ItemTypeC.SKIN], skin_inc);
        if (ObjUtil.length(diff) > 0) notEnough[ItemTypeC.SKIN] = diff;
    }
    // 武器皮肤碎片
    if (!ObjUtil.isEmpty(skin_debris_inc)) {
        logger.info(FUNC + "验证武器皮肤碎片!");
        pack_old[ItemTypeC.SKIN_DEBRIS] = ObjUtil.noNull(pack_old[ItemTypeC.SKIN_DEBRIS]);
        let diff = ObjUtil.enough(pack_old[ItemTypeC.SKIN_DEBRIS], skin_debris_inc);
        if (ObjUtil.length(diff) > 0) notEnough[ItemTypeC.SKIN_DEBRIS] = diff;
    }
    // =========================================================================
    // 金币
    if (!ObjUtil.isEmpty(gold)) {
        logger.info(FUNC + "验证金币!");
        if (account.gold < gold) notEnough[ItemTypeC.GOLD] = 1;
    }
    // 验证钻石
    if (!ObjUtil.isEmpty(pearl)) {
        logger.info(FUNC + "验证钻石!");
        if (account.pearl < pearl) notEnough[ItemTypeC.PEARL] = 1;
    }

    logger.info(FUNC + 'notEnough: ', notEnough);

    return ObjUtil.length(notEnough) == 0;
}

//==============================================================================
// private
//==============================================================================

// 100这种场景就是获得奖励时的场景.

function _addGoldLog(pool, uid, gain, cost, total, level) {
    const FUNC = TAG + "_addGoldLog() --- ";

    let data = {
        account_id: uid,
        gain: gain,
        cost: cost,
        total: total,
        duration: 0,
        scene: 100,
        nickname: 0,
        level: level,
    };
    DaoGold.insert(pool, data, function (err, result) {
        if (err) {
            logger.error(FUNC + "[ERROR][uid:" + uid + "]err:", err);
            return;
        }
        logger.info(FUNC + "result:", result);
    });
}

function _addPearlLog(pool, uid, gain, cost, total) {
    const FUNC = TAG + "_addPearlLog() --- ";

    let data = {
        account_id: uid,
        gain: gain,
        cost: cost,
        total: total,
        scene: 100,
        nickname: 0,
    };
    DaoPearl.insert(pool, data, function (err, result) {
        if (err) {
            logger.error(FUNC + "[ERROR][uid:" + uid + "]err:", err);
            return;
        }
        logger.info(FUNC + "result:", result);
    });
}
