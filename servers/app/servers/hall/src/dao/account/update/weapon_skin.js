const ArrayUtil = require('../../../utils/ArrayUtil');
const BuzzUtil = require('../../../utils/BuzzUtil');
const buzz_cst_game = require('../../../buzz/cst/buzz_cst_game');
const CacheAccount = require('../../../buzz/cache/CacheAccount');
const gameConfig = require('../../../../../../utils/imports').DESIGN_CFG;
const newweapon_weapons_cfg = gameConfig.newweapon_weapons_cfg;
const string_strings_cfg = gameConfig.string_strings_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const shop_shop_buy_type_cfg = gameConfig.shop_shop_buy_type_cfg;
const GAME_EVENT_TYPE = buzz_cst_game.GAME_EVENT_TYPE;


const TAG = "【weapon_skin】";

exports.update = _update;
exports.addBroadcast = _addBroadcast;
//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 更新玩家的武器皮肤信息.
 * weapon_skin字段数据结构: {own:[1,2,3], equip:1}
 * 有效性验证:
 * 1. own字段只能增加新的皮肤ID而不能减少
 * 2. equip只能装备玩家拥有的皮肤ID
 */
function _update(data, cb, account) {
    const FUNC = TAG + "_update() --- ";
    logger.info("CALL weapon_skin.update()");

    let coinType = shop_shop_buy_type_cfg.BUY_SKIN.name;
    let coinId = shop_shop_buy_type_cfg.BUY_SKIN.id;
    let uid = account.id;
    let mySkin = account.weapon_skin;
    let own = mySkin.own;

    let i = own.length;
    while (i > 0 && i --) {
        let id = own[i];
        id = parseInt(id);
        if (!id) {
            own.splice(i, 1);
        }
    }
    mySkin.own = ArrayUtil.delRepeat(own);
    own = mySkin.own;

    let failOperation = function (msg) {
        let ret = {
            weapon_skin: mySkin,
            notEnough: true,
            errorMsg: msg,
        };
        return cb && cb(null, [ret]);
    };

    let newSkinList = [];
    let moneyCost = 0;
    let reqData = data.weapon_skin;
    let state = reqData.state;
    let skinId = reqData.skinId;
    if (state == 0) {
        //装备
        if (own.indexOf(skinId) >= 0) {
            mySkin.equip = skinId;
        }else{
            return failOperation('无皮肤不装备');
        }
        account.weapon_skin = mySkin;
        account.commit();
    }else if (state == 1) {
        //购买
        if (own.indexOf(skinId) >= 0) {
            return failOperation('不可重复购买');
        }else{
            const cfg = newweapon_weapons_cfg[skinId];
            if (!cfg) {
                return failOperation('无皮肤配置');
            }
            moneyCost = cfg.price;
            if (moneyCost < 0) {
                return failOperation('配置有误，价格不能为负数');
            }
            if (account[coinType] < moneyCost) {
                return failOperation('金钱不足以购买');
            }
            own.push(skinId);
            account.weapon_skin = mySkin;
            account.commit();
            newSkinList.push(skinId);
        }
    }else {
        return failOperation('参数有误');
    }

    BuzzUtil.useCoin(account, coinId, moneyCost, function (err, res) {
        logger.info(FUNC + 'account.gold:', account.gold);
        if (moneyCost > 0) {
            switch(coinType) {
                case "pearl":
                    logger.info(FUNC + uid + "购买皮肤消耗钻石");
                    logBuilder.addPearlLogEx({
                        account_id: uid,
                        log_at: new Date(),
                        gain: 0,
                        cost: moneyCost,
                        total: account[coinType],
                        scene: common_log_const_cfg.SKIN_BUY,
                        nickname: 0,
                    });
                break;
                case "gold":
                    logger.info(FUNC + uid + "购买皮肤消耗金币");
                    account.cost = moneyCost;//其他消耗 购买皮肤累加
                    account.commit();
                    logBuilder.addGoldLogEx({
                        account_id: uid,
                        log_at: new Date(),
                        gain: 0,
                        cost: moneyCost,
                        total: account[coinType],
                        scene: common_log_const_cfg.SKIN_BUY,
                        nickname: 0,
                        duration: 0,
                        level: account.level,
                    });
                break;
            }
        }

        mySkin = account.weapon_skin;
        CacheAccount.setWeaponSkin(account, mySkin, function (chs) {
            let ret = {
                weapon_skin: mySkin,
            };
            ret[coinType] = account[coinType];
            if (chs && chs.length == 2) {
                let charmPoint = chs[0];
                let charmRank = chs[1];
                charmPoint >= 0 && (ret.charm_point = charmPoint);
                charmRank >= 0 && (ret.charm_rank = charmRank);
            }
            cb && cb(null, [ret]);
        });

        //添加游戏事件公告
        _addBroadcast(account, newSkinList);
    });
}


//==============================================================================
// private
//==============================================================================

function _addBroadcast(account, newSkinList) {
    const FUNC = TAG + "_addBroadcast() --- ";

    // 玩家新增皮肤ID数组长度大于0则添加广播事件
    let player = account.nickname;
    for (let i = 0; i < newSkinList.length; i++) {
        let skinId = newSkinList[i];
        let weapon_item = newweapon_weapons_cfg["" + skinId];
        if (weapon_item) {
            let weaponNameId = weapon_item.name;
            let weapon_skin = string_strings_cfg[weaponNameId].cn;
            let charm = account.charm_rank && parseInt(account.charm_rank) || 0;
            let content = {
                txt: player + ' 获得了皮肤：' + weapon_skin,
                times: 1,
                type: GAME_EVENT_TYPE.SKIN_GOT,
                params: [player, weapon_skin, account.vip,charm],
                platform: account.platform,
            };
            buzz_cst_game.addBroadcastGameEvent(content);
        }
        else {
            logger.error(FUNC + "[ERROR]没有在配置表newweapon_weapons_cfg中找到对应的皮肤ID, 请更新服务器的配置表");
        }
    }
}
