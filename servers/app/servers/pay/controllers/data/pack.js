/**
 * 背包类: 处理背包的相关操作
 */
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const item_mix_cfg = gameConfig.item_mix_cfg;
const item_itemtype_cfg = gameConfig.item_itemtype_cfg;
const newweapon_weapons_cfg = gameConfig.newweapon_weapons_cfg;
const shop_shop_buy_type_cfg = gameConfig.shop_shop_buy_type_cfg;
const BuzzUtil = require('../../src/utils/BuzzUtil');
const utils = require('../../src/buzz/utils');
const buzz_limit_items = require('../../src/buzz/buzz_limit_items');
const CacheAccount = require('../../src/buzz/cache/CacheAccount');
const dropManager = require('../../../../utils/DropManager');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const logicResponse = require('../../../common/logicResponse');

const itemDef = require('../../../../consts/itemDef');
const tools = require('../../../../utils/tools');

const Item = require('../../src/buzz/pojo/Item'),
    ItemType = Item.ItemType,
    ItemTypeC = Item.ItemTypeC;

/**
 * 背包合成
 * @param {*} data
 */
async function mix(data) {
    return new Promise(function (resolve, reject) {
        _mix(data, function (err, res) {
            if (err) {
                logger.error('背包合成失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(res));
        });
    });
}

function _mix(data, cb) {
    const FUNC = "Pack:mix --- ";
    const HINT = "背包合成";

    BuzzUtil.cacheLinkDataApi(data, "pack_mix");

    let item_key = "" + data.item_key;
    let gain_num = data.num;

    doNext(data.account);

    function doNext(account) {
        let uid = account.id;
        if (!_checkMix(account, item_key, gain_num)) return;

        let mix = _getMixInfo(item_key);
        let cost = mix.count * gain_num;
        let gold_cost = mix.gold * gain_num;
        let cost_item = item_key;
        let gain_item = mix.mixid;


        let logString = `${uid} 消耗${cost}个${cost_item}，`;
        logString += `合成${gain_num}个${gain_item}，`;
        logString += `总共消耗金币${gold_cost}。`;
        logger.info(FUNC + logString);

        let gain_item_list = [{
            item_id: gain_item,
            item_num: gain_num,
        }];

        let cost_item_list = [
            {
                item_id: cost_item,
                item_num: cost,
            },
            {
                item_id: itemDef.GOLD,
                item_num: gold_cost,
            }
        ];

        exchange({ account: account }, cost_item_list, gain_item_list, common_log_const_cfg.SYNTHESIS);
        let ret = {
            item_list: gain_item_list,
            change: {
                gold: account.gold,
                package: account.package,
                skill: account.skill,
            },
        };
        cb(null, ret);
    }

    function _getMixInfo(item_key) {
        for (let idx in item_mix_cfg) {
            let mix = item_mix_cfg[idx];
            if (mix.id == item_key) {
                return mix;
            }
        }
        return null;
    }

    /**
     * 检测合成原料是否足够.
     */
    function _checkMix(account, item_key, num) {
        let item_type = item_itemtype_cfg.ITEM_MIX;
        let item = tools.CfgUtil.item_item.getInfo(item_key);
        // 条件1: 物品类型必须是合成类型
        // 条件2: 物品没有售价, 有售价的物品不能合成
        if (item.type != item_type || item.saleprice > 0) {
            {
                logger.error(FUNC + "item_itemtype_cfg:", item_itemtype_cfg);
                logger.error(FUNC + "item.type:", item.type);
                logger.error(FUNC + "item_type:", item_type);
                logger.error(FUNC + "saleprice:", item.saleprice);
            }
            cb(ERROR_OBJ.MIX_WRONG_ITEM);
            return false;
        }

        let gold = account.gold;
        let pack = account.package;
        let pack_mix = pack["" + item_type];
        if (pack_mix) {
            let raw_num = pack_mix[item_key];

            for (let idx in item_mix_cfg) {
                let mix = item_mix_cfg[idx];
                if (mix.id == item_key) {
                    if (mix.count * num > raw_num) {
                        cb(ERROR_OBJ.MIX_RAW_NOT_ENOUGH);
                        return false;
                    }
                    if (mix.gold * num > gold) {
                        cb(ERROR_OBJ.MIX_GOLD_NOT_ENOUGH);
                        return false;
                    }
                    break;
                }
            }
            return true;
        } else {
            return false;
        }
    }
}

/**
 * 背包使用
 * @param {*} data
 */
async function use(data) {
    return new Promise(function (resolve, reject) {
        _use(data, function (err, res) {
            if (err) {
                logger.error('背包使用失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(res));
        });
    });
}

function _use(data, cb) {
    const FUNC = "Pack:use --- ";
    const HINT = "背包使用";

    let itemId = data.itemId;
    let num = data.num;

    let itemInfo = tools.CfgUtil.item_item.getInfo(itemId);
    if (!itemInfo) {
        throw ERROR_OBJ.PACK_ITEM_NOT_EXIST;
        return;
    }
    if (itemInfo.saleprice > 0) {
        _sell(data, cb);
        return;
    }
    BuzzUtil.cacheLinkDataApi(data, "pack_use");
    let ltype = itemInfo.lengthtype;
    if (ltype === 1 || ltype === 2) {
        //校验是否已过期，过期则不能使用
        buzz_limit_items.checkItemLimitEndWithItemId(data.account, itemId, function (ret) {
            logger.error('ret = ', ret);
            if (ret && !ret[itemId]) {
                return cb(ERROR_OBJ.ITEM_NOT_EXIST);
            }
            doNext(data.account);
        });
    } else {
        doNext(data.account);
    }

    function doNext(account) {
        let uid = account.id;

        if (isNaN(num) || num <= 0) {
            logger.error(FUNC + `${uid}传入了非法的数量${num}，使用的物品是${itemId}`);
            cb(ERROR_OBJ.PACK_USE_WRONG_NUM);
            return;
        }

        let itemType = itemInfo.type;
        if (!account.package
            || !account.package[itemType]
            || !account.package[itemType][itemId]) {
            logger.error(FUNC + `${uid}尝试使用不存在的物品${itemId}`);
            cb(ERROR_OBJ.ITEM_NOT_EXIST);
            return;
        }
        let itemOwn = account.package[itemType][itemId];

        if (num > itemOwn) {
            logger.error(FUNC + `${uid}使用的物品${itemId}数量不足，需要${num}个，实际拥有${itemOwn}个`);
            cb(ERROR_OBJ.PACK_USE_ITEM_NOT_ENOUGH);
            return;
        }

        // 道具兑换皮肤
        if (itemType === ItemType.SKIN) {
            let mySkin = account.weapon_skin;
            let skinId = itemInfo.dropid;

            let item_list = [];
            if (_checkSkinExist(mySkin, skinId)) {
                //如果存在，则写入相应的碎片，增加对应碎片数量，扣除道具数量

                //写入皮肤碎片信息
                let skinInfo = newweapon_weapons_cfg[skinId];
                let pieceInfo = skinInfo.piece;

                logger.info(FUNC + `pieceInfo:${pieceInfo}`);
                if (!account.package[ItemTypeC.SKIN_DEBRIS]) {
                    account.package[ItemTypeC.SKIN_DEBRIS] = {};
                }
                if (!account.package[ItemTypeC.SKIN_DEBRIS][pieceInfo[0]]) {
                    account.package[ItemTypeC.SKIN_DEBRIS][pieceInfo[0]] = 0;
                }
                account.package[ItemTypeC.SKIN_DEBRIS][pieceInfo[0]] += pieceInfo[1];
                item_list = [
                    {
                        item_id: pieceInfo[0],
                        item_num: pieceInfo[1],
                    }
                ];
            }
            else {
                //如果不存在,则增加一款皮肤，扣除相应道具数量
                mySkin.own.push(parseInt(skinId));
                // account.weapon_skin = mySkin;
                CacheAccount.setWeaponSkin(account, mySkin);
            }

            account.package[itemType][itemId] -= num;
            account.package = account.package;
            account.commit();
            let ret = {
                item_list: item_list,
                change: {
                    package: account.package,
                    weapon_skin: account.weapon_skin,
                    charm_point: account.charm_point,
                    charm_rank: account.charm_rank,
                }
            };
            // data_util.handleReturn(res, aes, null, ret, HINT);
            cb(null, ret);

        }
        else {
            account.package[itemType][itemId] -= num;
            // 处理使用物品后的效果
            let doneFunc = function () {
                _afterUse(mysqlConnector, account, itemId, num, function (err, reward) {
                    if (err) {
                        logger.error(FUNC + 'err:', err);
                        cb(err);
                    } else {
                        account.package = account.package;
                        account.commit();

                        _replace(account, reward);
                    }
                });
            };
            //使用成功，若是限时道具，则及时剔除
            if (ltype === 1 || ltype === 2) {
                buzz_limit_items.clearLimitItem(account.id, itemId, num, function () {
                    doneFunc();
                });
            } else {
                doneFunc();
            }
        }
        logBuilder.addGoldAndItemLog([{ item_id: itemId, item_num: num }], account, common_log_const_cfg.USE, -1);
    }

    function _checkSkinExist(mySkin, skinId) {

        if (mySkin.equip == skinId) {
            return true;
        }

        for (let i = 0; i < mySkin.own.length; ++i) {
            if (mySkin.own[i] == skinId) {
                return true;
            }
        }

        return false;

    }

    function _afterUse(pool, account, itemId, cost, cb) {
        let itemInfo = tools.CfgUtil.item_item.getInfo(itemId);
        let reward = [];
        let gainGold = 0;
        if (itemInfo.dropid === '0') {
            throw ERROR_OBJ.PACK_ITEM_CANNOT_USE;
        }
        let droplist = itemInfo.dropid;
        let dropRet = dropManager.try2Drop(account, droplist, cost, common_log_const_cfg.USE);
        if (dropRet && dropRet.logItems.length > 0) {
            let its = dropRet.logItems;
            for (let i = 0; i < its.length; i++) {
                let it = its[i];
                reward.push([it.item_id, it.item_num]);
                if (it.item_id == itemDef.GOLD) {
                    gainGold += it.item_num;
                }
            }
        }
        cb(null, reward);
        if (gainGold > 0) {
            logBuilder.addGoldLogEx({
                account_id: account.id,
                log_at: new Date(),
                gain: gainGold,
                cost: 0,
                duration: 0,
                total: account.gold,
                scene: common_log_const_cfg.USE,
                nickname: 0,
                level: account.level,
            });
        }
    }


    /**
     * 将冗余的奖品获得进行整理, 同样的都放在一个数组元素中.
     */
    function _sortReward(input) {
        let output = [];
        let temp = {};
        for (let i = 0; i < input.length; i++) {
            let one_reward = input[i];
            let id = one_reward[0];
            let count = one_reward[1];
            if (!temp[id]) {
                temp[id] = count;
            }
            else {
                temp[id] += count;
            }
        }
        for (let idx in temp) {
            output.push([idx, temp[idx]]);
        }
        return output;
    }

    /**
     * 获取一个随机物品.
     */
    function _rewardProbabilityItems(droplist, probability) {

        let total = 0;
        for (let i = 0; i < probability.length; i++) {
            total += probability[i];
        }
        // logger.info(FUNC + "total:", total);

        let random = utils.randomInt(total);
        // logger.info(FUNC + "random:", random);

        total = 0;
        let idx = 0;
        for (let i = 0; i < probability.length; i++) {
            total += probability[i];
            if (total >= random) {
                idx = i;
                break;
            }
        }
        logger.info(FUNC + "drop reward:", droplist[idx]);
        return droplist[idx];
    }

    function _replace(account, reward) {
        account.package = account.package;
        account.commit();
        // TODO: add more in this place.
        let item_list = BuzzUtil.getItemList(reward);
        let ret = {
            item_list: item_list,
            change: {
                gold: account.gold,
                pearl: account.pearl,
                package: account.package,
                skill: account.skill,
                weapon_skin: account.weapon_skin,
                charm_point: account.charm_point,
                charm_rank: account.charm_rank,
            }
        };
        // data_util.handleReturn(res, aes, null, ret, HINT);
        cb(null, ret);
    }

}

function _sell(data, cb) {
    const FUNC = "Pack:sell --- ";
    const HINT = "背包售出";

    BuzzUtil.cacheLinkDataApi(data, "pack_sell");

    let itemId = data.itemId;
    let num = data.num;

    let coinId = shop_shop_buy_type_cfg.SALE_ITEM.id;
    let coinType = shop_shop_buy_type_cfg.SALE_ITEM.name;

    doNext(data.account);

    function doNext(account) {
        let uid = account.id;
        let itemInfo = BuzzUtil.getItemById(itemId);

        if (isNaN(num) || num <= 0) {
            logger.error(FUNC + `${uid}传入了非法的数量${num}，出售物品是${itemId}`);
            cb(ERROR_OBJ.PACK_USE_WRONG_NUM);
            return;
        }

        if (!itemInfo || itemInfo.saleprice <= 0) {
            logger.error(FUNC + `${uid}尝试出售不能出售的物品${itemId}`);
            cb(ERROR_OBJ.PACK_SELL_ITEM_CANNOT_SELL);
            return;
        }

        let itemType = itemInfo.type;
        if (3 != itemType) {
            if (!account.package
                || !account.package[itemType]
                || !account.package[itemType][itemId]) {
                logger.error(FUNC + `${uid}尝试出售不存在的物品${itemId}`);
                cb(ERROR_OBJ.ITEM_NOT_EXIST);
                return;
            }
        }

        // 出售技能
        let itemOwn = 0;
        if (3 == itemType) {
            let skillId = itemInfo.id;
            itemOwn = account.skill[skillId] || 0;
        }
        else {
            itemOwn = account.package[itemType][itemId];
        }
        if (num > itemOwn) {
            logger.error(FUNC + `${uid}出售的物品${itemId}数量不足，需要${num}个，实际拥有${itemOwn}个`);
            let error = { code: -1, msg: "物品数量不足" };
            cb(error);
            return;
        }

        let sellPrice = itemInfo.saleprice * num;
        let left = 0;
        if (3 == itemType) {
            let skillId = itemInfo.id;
            account.skill[skillId] = account.skill[skillId] || 0;
            account.skill[skillId] -= num;
            left = account.skill[skillId];
            account.skill = account.skill;
        }
        else {
            account.package[itemType][itemId] -= num;
            left = account.package[itemType][itemId];
            account.package = account.package;
        }
        account[coinType] = sellPrice;
        logger.info(FUNC + `${uid}出售的物品${itemId}总价为${sellPrice}，出售数量${num}，剩余数量${left}`);

        let logInfo = {
            account_id: uid,
            log_at: new Date(),
            gain: sellPrice,
            cost: 0,
            total: account[coinType],
            scene: common_log_const_cfg.SELL,
            nickname: 0,
        };
        switch (coinType) {
            case "pearl":
                logger.info(FUNC + uid + "出售道具" + itemId + "获取钻石" + sellPrice);
                logBuilder.addPearlLogEx(logInfo);
                break;
            case "gold":
                logger.info(FUNC + uid + "出售道具" + itemId + "获取金币" + sellPrice);
                logInfo.duration = 0;
                logInfo.level = account.level;
                logBuilder.addGoldLogEx(logInfo);
                break;
        }

        let item_list = [
            {
                item_id: coinId,
                item_num: sellPrice,
            }
        ];

        account.commit();
        let ret = {
            item_list: item_list,
            change: {}
        };
        if (3 == itemType) {
            ret.change.skill = account.skill;
        }
        else {
            ret.change.package = account.package;
        }
        ret.change[coinType] = account[coinType];
        cb(null, ret);

    }

}

/**
 * 在背包中消耗costList的物品, 得到gainList的物品
 * @param {*} costList 
 * @param {*} gainList 
 */
function exchange(data, costList, gainList, scene) {
    costList = removeRmbCost(costList);
    if (!check(data, costList)) {
        throw ERROR_OBJ.DIAMOND_NOT_ENOUGH;
    }
    let account = data.account;
    for (let i = 0; i < costList.length; i++) {
        const item = costList[i];
        switch (item.item_id) {
            case itemDef.GOLD:
                {
                    account.gold = -item.item_num;
                    break;
                }
            case itemDef.DIAMOND:
                {
                    account.pearl = -item.item_num;
                    break;
                }
            default:
                {
                    const item_type = tools.CfgUtil.item_item.getType(item.item_id);
                    if (item_type) {
                        if (item_itemtype_cfg.ITEM_SKILL == item_type) {
                            const skill_id = tools.CfgUtil.item_item.getSkillId(item.item_id);
                            if (account.skill[skill_id]) {
                                account.skill[skill_id] -= item.item_num;
                                account.skill = account.skill;
                            }
                        }
                        else {
                            if (account.package[item_type] && account.package[item_type][item.item_id]) {
                                account.package[item_type][item.item_id] -= item.item_num;
                                account.package = account.package;
                            }
                        }
                    }
                    break;
                }
        }
    }

    let reward = [];
    for (let i = 0; i < gainList.length; i++) {
        const item = gainList[i];
        reward.push([item.item_id, item.item_num]);
        switch (item.item_id) {
            case itemDef.GOLD:
                {
                    account.gold = item.item_num;
                    break;
                }
            case itemDef.DIAMOND:
                {
                    account.pearl = item.item_num;
                    break;
                }
            default:
                {
                    const item_type = tools.CfgUtil.item_item.getType(item.item_id);
                    if (item_type) {

                        if (item_itemtype_cfg.ITEM_SKILL == item_type) {
                            const skill_id = tools.CfgUtil.item_item.getSkillId(item.item_id);
                            tools.ObjUtil.makeDeepObj(account.skill, [skill_id], 0);
                            account.skill[skill_id] += item.item_num;
                            account.skill = account.skill;
                        }
                        else {
                            tools.ObjUtil.makeDeepObj(account.package, [item_type, item.item_id], 0);
                            account.package[item_type][item.item_id] += item.item_num;
                            account.package = account.package;
                        }
                    }
                    break;
                }
        }
    }
    // buzz_limit_items.setItemGetAt(account, reward);

    account.commit();

    logBuilder.addGoldAndItemLog(costList, account, scene, -1);
    logBuilder.addGoldAndItemLog(gainList, account, scene, 1);
}

/**
 * 移除人民币消耗(人民币不是游戏内物品, 不可获得，不可消耗)
 * @param {*} costList 
 */
function removeRmbCost(costList) {
    let ret = [];
    for (let i = 0; i < costList.length; i++) {
        if (itemDef.RMB != costList[i].item_id) {
            ret.push(costList[i]);
        }
    }
    return ret;
}

/**
 * 检查物品是否足够
 * @param {*} itemList 
 */
function check(data, itemList) {
    let account = data.account;
    let ret = true;
    for (let i = 0; i < itemList.length; i++) {
        const item = itemList[i];
        switch (item.item_id) {
            case itemDef.GOLD:
                {
                    ret = ret && (account.gold >= item.item_num);
                    break;
                }
            case itemDef.DIAMOND:
                {
                    ret = ret && (account.pearl >= item.item_num);
                    break;
                }
            default:
                {
                    const item_type = tools.CfgUtil.item_item.getType(item.item_id);
                    if (item_type) {
                        if (item_itemtype_cfg.ITEM_SKILL == item_type) {
                            const skill_id = tools.CfgUtil.item_item.getSkillId(item.item_id);
                            if (account.skill[skill_id]) {
                                ret = ret && account.skill[skill_id] >= item.item_num;
                            }
                            else {
                                ret = false;
                            }
                        }
                        else {
                            if (account.package[item_type] && account.package[item_type][item.item_id]) {
                                ret = ret && account.package[item_type][item.item_id] >= item.item_num;
                            }
                            else {
                                ret = false;
                            }
                        }
                    }
                    break;
                }
        }
    }
    return ret;
}

module.exports.mix = mix;
module.exports.use = use;
module.exports.exchange = exchange;