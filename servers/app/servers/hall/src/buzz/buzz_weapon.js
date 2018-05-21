const async = require('async');
const CstError = require('../../../../consts/fish_error');
const ERROR_OBJ = CstError.ERROR_OBJ;
const redisKesy = require('../../../../database').dbConsts.REDISKEY;
const ObjUtil = require('./ObjUtil');
const DateUtil = require('../utils/DateUtil');
const BuzzUtil = require('../utils/BuzzUtil');
const ArrayUtil = require('../utils/ArrayUtil');
const RedisUtil = require('../utils/RedisUtil');
const RandomUtil = require('../../../../utils/RandomUtil');
const RewardModel = require('../../../../utils/account/RewardModel');
const CacheAccount = require('./cache/CacheAccount');
const DESIGN_CFG = require('../../../../utils/imports').DESIGN_CFG;
const shop_shop_buy_type_cfg = DESIGN_CFG.shop_shop_buy_type_cfg;
const string_strings_cfg = DESIGN_CFG.string_strings_cfg;
const newweapon_star_cfg = DESIGN_CFG.newweapon_star_cfg;
const newweapon_weapons_cfg = DESIGN_CFG.newweapon_weapons_cfg;
const common_log_const_cfg = DESIGN_CFG.common_log_const_cfg;
const newweapon_upgrade_cfg = DESIGN_CFG.newweapon_upgrade_cfg;
const GameEventBroadcast = require('../../../../common/broadcast/GameEventBroadcast');

const COST_ITEM_KEY = 'i007';
const COST_PEARL_KEY = 'i002';
const STONE_KEY = 'i500';

let MIN_WEAPON_ID = 1;
let MAX_WEAPON_ID = MIN_WEAPON_ID;
for (let id in newweapon_weapons_cfg) {
    let wid = parseInt(id);
    if (wid > MAX_WEAPON_ID) {
        MAX_WEAPON_ID = wid;
    }
}

const TAG = "【buzz_weapon】";

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.levelup = levelup;
exports.buySkin = buySkin;
exports.equip = equip;

exports.upstar = upstar;
exports.vote = vote;
exports.querySkinVote = querySkinVote;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * yDONE: 125-皮肤投票
 * 皮肤投票.
 */
function vote(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    _vote(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'vote'], "buzz_weapon.vote", cb);
    }
}

/**
 * yDONE: 125-皮肤投票
 * 皮肤投票查询.
 */
function querySkinVote(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    _querySkinVote(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_weapon.querySkinVote", cb);
    }
}

/**
 * yDONE: 97-皮肤升星
 * 皮肤升星.
 */
function upstar(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    _upstar(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'weapon'], "buzz_weapon.upstar", cb);
    }
}

/**
 * 武器升级
 */
function levelup(dataObj, cb) {
    _newWeaponUp(dataObj.use_stone, dataObj.account, cb);

    // if (!lPrepare(dataObj)) return;

    // _levelup(dataObj, cb);

    // function lPrepare(input) {
    //     return BuzzUtil.checkParams(input, ['token'], "buzz_weapon", cb);
    // }
}

/**
 * 武器皮肤购买
 */
function buySkin(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    _buySkin(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_weapon", cb);
    }
}

/**
 * 武器皮肤装备
 */
function equip(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    _equip(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_weapon", cb);
    }
}

//==============================================================================
// private
//==============================================================================

/**
 * yDONE: 125-皮肤投票
 * 皮肤投票.
 */
function _vote(dataObj, cb) {
    const FUNC = TAG + "_vote() --- ";
    let account = dataObj.account;
    let uid = dataObj.uid;
    let clientVote = dataObj.vote;//玩家投票的皮肤id: [2,3]
    let weapon_skin = account.weapon_skin;
    logger.info(FUNC + 'weapon_skin:', weapon_skin);
    let serverOwn = weapon_skin.own || [];
    let serverVote = weapon_skin.vote || [];
    async.waterfall(
        [
            function step1(cb) {
                clientVote = filterNotOwn(serverOwn, clientVote);
                let delta = getDiff(serverVote, clientVote);
                logger.info(FUNC + 'delta:', delta);
                cb(null, delta);
            }
            , function step2(delta, cb) {
                let data = [];
                for (let i = 0; i < delta.incr.length; i++) {
                    data.push(['hincrby', redisKesy.WEAPON_VOTE, delta.incr[i], 1]);
                }
                for (let i = 0; i < delta.decr.length; i++) {
                    data.push(['hincrby', redisKesy.WEAPON_VOTE, delta.decr[i], -1]);
                }
                // 有投票动作的玩家需要记录uid到对应武器的集合中
                for (let i = 0; i < serverOwn.length; i++) {
                    data.push(['sadd', redisKesy.SKIN_VOTE_UID + ':' + serverOwn[i], uid]);
                }
                data.push(['sadd', redisKesy.SKIN_VOTE_UID, uid]);
                RedisUtil.multi(data, function (err, res) {
                    cb(null, res);
                });
            }
            , function step3(result, cb) {
                weapon_skin.vote = clientVote;
                account.weapon_skin = weapon_skin;
                account.commit();
                cb(null, 'next');
            }
            , function step4(result, cb) {
                getNewVoteResult(cb);
            }
        ]
        , function (err, result) {
            cb(err, result);
        }
    );
}

/**
 * 过滤不拥有的皮肤.
 */
function filterNotOwn(serverOwn, clientVoteOri) {
    const FUNC = TAG + "filterNotOwn() --- ";
    let clientVote = [];
    for (let i = 0; i < clientVoteOri.length; i++) {
        let voteSkin = parseInt(clientVoteOri[i]);
        if (ArrayUtil.contain(serverOwn, voteSkin)) {
            clientVote.push(voteSkin);
        }
        else {
            logger.info(FUNC + '玩家并不拥有皮肤:', voteSkin);
            logger.info(FUNC + '玩家拥有的皮肤:', serverOwn);
        }
    }
    return clientVote;
}

/**
 * 获取差量(incr为新增, decr为减少)
 */
function getDiff(serverVote, clientVote) {
    const FUNC = TAG + "getDiff() --- ";
    // 投票增量计算
    let incr = [];
    let decr = [];
    for (let i = 0; i < clientVote.length; i++) {
        if (!ArrayUtil.contain(serverVote, clientVote[i])) {
            incr.push(clientVote[i]);
        }
    }
    for (let i = 0; i < serverVote.length; i++) {
        if (!ArrayUtil.contain(clientVote, serverVote[i])) {
            decr.push(serverVote[i]);
        }
    }
    logger.info(FUNC + '新增支持的武器:', incr);
    logger.info(FUNC + '放弃支持的武器:', decr);
    return { incr: incr, decr: decr };
}

/**
 * 获取新的投票结果.
 */
function getNewVoteResult(cb) {
    const FUNC = TAG + "getNewVoteResult() --- ";
    async.waterfall(
        [
            function step1(cb) {
                let data = [];
                for (let i = MIN_WEAPON_ID; i <= MAX_WEAPON_ID; i++) {
                    data.push(['scard', redisKesy.SKIN_VOTE_UID + ':' + i]);
                }
                RedisUtil.multi(data, function (err, res) {
                    let count_list = {};
                    for (let i = 0; i < res.length; i++) {
                        count_list[i + MIN_WEAPON_ID] = res[i];
                    }
                    logger.info('count_list:', count_list);
                    cb(null, count_list);
                });
            }
            , function step2(count_list, cb) {
                let ret = [];
                RedisUtil.repeatHscan(redisKesy.WEAPON_VOTE, 0, 100,
                    function op(res, nextCursor) {
                        let voteList = res[1];
                        for (let i = 0; i < voteList.length; i += 2) {
                            let weaponId = voteList[i];
                            logger.info(FUNC + 'weapon id:', voteList[i]);
                            logger.info(FUNC + 'vote count:', voteList[i + 1]);
                            if (count_list[weaponId] > 0) {
                                let count = count_list[weaponId];
                                ret.push({
                                    weapon: voteList[i],
                                    vote: voteList[i + 1] / count,
                                });
                            }
                        }
                        nextCursor();
                    },
                    function next() {
                        cb(null, ret);
                    }
                );
            }
        ]
        , function (err, result) {
            result.sort(function (a, b) {
                return b.vote - a.vote;
            });
            cb(err, result);
        }
    );
}

/**
 * yDONE: 125-皮肤投票
 * 皮肤投票查询.
 */
function _querySkinVote(dataObj, cb) {
    getNewVoteResult(cb);
}

/**
 * yDONE: 97-皮肤升星
 * 皮肤升星.
 */
function _upstar(dataObj, cb) {
    const FUNC = TAG + "_upstar() --- ";

    let weapon = dataObj.weapon;//需要升星的皮肤id
    let account = dataObj.account;
    let weaponSkin = account.weapon_skin;
    let pack = account.package;
    let goldOwn = account.gold;

    let weaponStar = weaponSkin.star || (weaponSkin.star = {});
    let targetWeaponStar = weaponStar[weapon] || 0;
    let nextWeaponStar = targetWeaponStar + 1;

    let starInfo = getInfoFromWeaponStar(weapon, nextWeaponStar);
    let goldNeed = starInfo.cost;//需要金币
    let item = starInfo.item;
    let itemId = item[0];
    let itemNeed = item[1];
    let itemType = BuzzUtil.getItemTypeById(itemId);

    let itemOwn = pack[itemType][itemId];

    if (goldOwn < goldNeed) {
        logger.info(FUNC + '玩家金币不足');
        logger.info(FUNC + 'goldOwn:', goldOwn);
        logger.info(FUNC + 'goldNeed:', goldNeed);
        cb(ERROR_OBJ.GOLD_NOT_ENOUGH);
        return;
    }

    if (itemOwn < itemNeed) {
        logger.info(FUNC + '玩家碎片不足');
        logger.info(FUNC + 'itemOwn:', itemOwn);
        logger.info(FUNC + 'itemNeed:', itemNeed);
        cb(ERROR_OBJ.CHIP_NOT_ENOUGH);
        return;
    }

    account.gold = -goldNeed;

    pack[itemType][itemId] -= itemNeed;
    account.package = pack;

    weaponStar[weapon] = nextWeaponStar;
    weaponSkin.star = weaponStar;
    account.weapon_skin = weaponSkin;

    CacheAccount.resetCharmPoint(account, function () {
        let ret = {};
        ret.change = {
            gold: account.gold,
            package: account.package,
            // weapon_skin: account.weapon_skin,
            charm_point: account.charm_point,
            charm_rank: account.charm_rank,
        };
        ret.star = {};
        ret.star[weapon] = nextWeaponStar;
        cb && cb(null, ret);
    });

    function getInfoFromWeaponStar(weapon, star) {
        for (let i = 0; i < newweapon_star_cfg.length; i++) {
            let starInfo = newweapon_star_cfg[i];
            if (starInfo.id == weapon && starInfo.star == star) {
                return starInfo;
            }
        }
    }
}

/**
 * 武器升级
 */
function _levelup(dataObj, cb) {
    let uid = dataObj.uid;
    let use_stone = dataObj.use_stone;
    let chs = null;
    let account = dataObj.account;

    let need_stone = 0;
    if (typeof (use_stone) == "undefined") {
        use_stone = false;
    }

    let weapon_energy = account.weapon_energy;
    let weapon_level = getMaxWeaponLevel(weapon_energy);
    weapon_level = Math.max(account.weapon, weapon_level);

    let weapon_info = BuzzUtil.getWeaponUpgradeByLevel(weapon_level);
    if (!_checkLevelup1()) return;
    let weapon_level_next = weapon_info.weaponlevel;
    let weapon_unlock_cost = weapon_info.unlock_cost;
    let weapon_unlock_material = weapon_info.unlock_material;
    if (weapon_energy && weapon_energy[weapon_level_next] >= 0) {
        logger.info('这个等级已升过了，干嘛还要升级？数据有误', weapon_level_next, ' weapon_energy = ', weapon_energy);
        cb && cb(ERROR_OBJ.WEAPON_LEVELUP_REPEAT);
        return;
    }

    logger.info("weapon_level_next:", weapon_level_next);
    logger.info("weapon_unlock_cost:", weapon_unlock_cost);
    logger.info("weapon_unlock_material:", weapon_unlock_material);
    if (!_checkLevelup2()) return;

    account.pearl = -weapon_unlock_cost;
    let change = { pearl: account.pearl };
    if (0 == weapon_unlock_material.length) {
        didWeaponLevelUp();
        _handleReturn(change, cb);
    }
    else {
        // 消耗材料
        let item_list_cost = BuzzUtil.getItemList(weapon_unlock_material);
        logger.info("1.item_list_cost:", item_list_cost);
        // 改变武器等级
        // TODO: 锻造可能会失败, 失败
        let unlock_rate = weapon_info.unlock_rate;
        if (use_stone) {
            need_stone = Math.round((1 - unlock_rate) * 100);
            logger.info("need_stone:", need_stone);
            if (!_checkLevelup3()) return;
            if (need_stone > 0)
                item_list_cost.push({
                    item_id: 'i500',
                    item_num: need_stone,
                });
            didWeaponLevelUp();
        }
        else {
            // unlock_rate = 0.9, 则random<=0.9可锻造成功
            if (unlock_rate >= RandomUtil.random()) {
                didWeaponLevelUp();
            }
        }
        logger.info("2.item_list_cost:", item_list_cost);
        BuzzUtil.removeFromPack(account, item_list_cost, function (cost_info) {
            let change_m = BuzzUtil.getChange(account, cost_info);
            let change = { pearl: account.pearl };
            change = ObjUtil.merge(change, change_m);
            _handleReturn(change, cb);
        });
        logBuilder.addGoldAndItemLog(item_list_cost, account, common_log_const_cfg.WEAPON_UNLOCK, -1);
    }
    logBuilder.addGoldAndItemLog([{
        item_id: 'i002',
        item_num: weapon_unlock_cost
    }], account, common_log_const_cfg.WEAPON_UNLOCK, -1);

    function _handleReturn(change, cb) {
        let cfg = newweapon_upgrade_cfg[weapon_level_next];
        if (cfg) {
            weapon_energy[weapon_level_next] = cfg.needpower;
            account.weapon_energy = weapon_energy;
            account.commit();
        }

        let ret = {
            change: change,
            weapon_level: weapon_level_next,
            is_success: weapon_level != account.weapon,
            weapon_energy: account.weapon_energy,
        };

        CacheAccount.setWeapon(account, weapon_level, function (chs) {
            if (chs && chs.length == 2) {
                let charmPoint = chs[0];
                let charmRank = chs[1];
                charmPoint >= 0 && (ret.change.charm_point = charmPoint);
                charmRank >= 0 && (ret.change.charm_rank = charmRank);
            }
            cb && cb(null, ret);
        });
    }

    // 校验方法1
    function _checkLevelup1() {
        if (null == weapon_info) {
            logger.info("查询的武器升级信息为空");
            cb(ERROR_OBJ.WEAPON_INFO_NULL);
            return false;
        }

        return true;
    }

    function _checkLevelup2() {
        if (weapon_unlock_cost > account.pearl) {

            logger.info("玩家解锁武器需要的钻石不足");
            logger.info("武器等级:", weapon_level_next);
            logger.info("需要钻石:", weapon_unlock_cost);
            logger.info("玩家钻石:", account.pearl);

            cb(ERROR_OBJ.WEAPON_UNLOCK_DIAMOND_NOT_ENOUGH);
            return false;
        }

        if (!isWeaponLevelupMaterialEnough(account, weapon_unlock_material)) {

            logger.info("玩家解锁武器需要的材料不足");
            logger.info("武器等级:", weapon_level_next);
            logger.info("需要材料:", weapon_unlock_material);

            cb(ERROR_OBJ.WEAPON_UNLOCK_MATERIAL_NOT_ENOUGH);
            return false;
        }

        return true;
    }

    function _checkLevelup3() {
        if (typeof (account.package['9']) == "undefined") {
            account.package['9'] = {};
        }
        if (typeof (account.package['9']['i500']) == "undefined") {
            account.package['9']['i500'] = 0;
        }
        let own_stone = account.package['9']['i500'];
        logger.info("玩家陨石精华:", own_stone);
        if (need_stone > own_stone) {

            logger.info("玩家需要的陨石精华不足");
            logger.info("武器等级:", weapon_level_next);
            logger.info("需要陨石精华:", need_stone);
            logger.info("玩家陨石精华:", own_stone);

            cb(ERROR_OBJ.WEAPON_LEVELUP_YUNSHI_NOT_ENOUGH);
            return false;
        }

        return true;
    }

    /**
     * 确定武器升级.
     */
    function didWeaponLevelUp() {
        let old_level = account.weapon;
        account.weapon = weapon_level_next;

        let reward = new RewardModel(account);
        reward.addProcess(RewardModel.TaskType.UPDATE_WEAPON_LV, account.weapon);

        addWeaponLog(account.weapon, old_level);
    }

    /**
     * 玩家升级武器(锻造)所需要的材料是否足够.
     * @param account 玩家数据.
     * @param weapon_unlock_material 锻造需要的材料列表.
     */
    function isWeaponLevelupMaterialEnough(account, weapon_unlock_material) {
        for (let i = 0; i < weapon_unlock_material.length; i++) {
            let material = weapon_unlock_material[i];
            let material_id = material[0];
            let material_num = material[1];

            let material_type = BuzzUtil.getItemTypeById(material_id);
            logger.info("material_type:", material_type);

            let material_own = BuzzUtil.getItemNum(account, material_type, material_id);
            logger.info("材料ID:", material_id);
            logger.info("需要材料:", material_num);
            logger.info("拥有材料:", material_own);
            if (material_num > material_own) {
                return false;
            }
        }
        return true;
    }


    //todo 武器日志
    /**
     * 向缓存CacheWeapon中增加一条武器升级的日志
     */
    function addWeaponLog(level, old_level) {
        const FUNC = TAG + "addWeaponLog() --- ";
        let weaponLog = {
            account_id: uid,
            log_at: DateUtil.getTime(),
            level: level,
            type: 0,
            level_up: level - old_level,
            nickname: 0,
        };
    }
}

function getMaxWeaponLevel(weapon_energy) {
    let ret = 1;
    for (let level in weapon_energy) {
        if (Number(level) > ret) {
            ret = Number(level);
        }
    }
    return ret;
}

/**
 * 武器皮肤购买
 */
function _buySkin(dataObj, cb) {
    let account = dataObj.account;
    let coinType = shop_shop_buy_type_cfg.BUY_SKIN.name;
    let coinId = shop_shop_buy_type_cfg.BUY_SKIN.id;
    let mySkin = account.weapon_skin;
    let own = mySkin.own;
    let i = own.length;
    while (i > 0 && i--) {
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
            errorMsg: msg,
        };
        ret.errorMsg = coinType === 'pearl' ? ERROR_OBJ.DIAMOND_NOT_ENOUGH.msg : ERROR_OBJ.GOLD_NOT_ENOUGH.msg;
        return cb && cb(null, ret);
    };
    let newSkinList = [];
    let moneyCost = 0;
    let skinId = dataObj.skinId;
    if (own.indexOf(skinId) != -1) {
        return failOperation('不可重复购买');
    } else {
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
        BuzzUtil.useCoin(account, coinId, moneyCost, function (err, res) {
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
                cb && cb(null, ret);
            });
            //日志
            logBuilder.addGoldAndItemLog([{
                item_id: coinId,
                item_num: moneyCost
            }], account, common_log_const_cfg.SKIN_BUY, -1);
            //公告
            let player = account.nickname;
            for (let i = 0; i < newSkinList.length; i++) {
                let skinId = newSkinList[i];
                let weapon_item = newweapon_weapons_cfg["" + skinId];
                if (weapon_item) {
                    let weaponNameId = weapon_item.name;
                    let weapon_skin = string_strings_cfg[weaponNameId].cn;
                    let charm = account.charm_rank && parseInt(account.charm_rank) || 0;
                    let content = {
                        type: GameEventBroadcast.TYPE.GAME_EVENT.SKIN_GOT,
                        params: [player, weapon_skin, account.vip, charm],
                    };
                    new GameEventBroadcast(content).extra(account).add();
                }
            }
        });
    }
}

/**
 * 武器皮肤装备
 */
function _equip(dataObj, cb) {
    let account = dataObj.account;
    let skinId = dataObj.skinId;
    if (isNaN(Number(skinId))) {
        cb(ERROR_OBJ.PARAM_WRONG_TYPE);
    }
    let own = account.weapon_skin.own;
    if (own.indexOf(Number(skinId)) != -1 || own.indexOf("" + skinId) != -1) {
        account.weapon_skin.equip = skinId;
        account.weapon_skin = account.weapon_skin;
        account.commit();
        cb && cb(null, { weapon_skin: account.weapon_skin });
    } else {
        cb && cb(ERROR_OBJ.INVALID_WP_SKIN);
    }
}

/**
 * 武器升级重构
 */
function _newWeaponUp(isUseStone, account, cb) {
    let curWpLV = account.weapon;
    let curEnergys = account.weapon_energy;
    let isDone = true;

    //确认合法的当前等级
    let maxLv = 1;
    for (let k in curEnergys) {
        let num = parseInt(k);
        maxLv = Math.max(num, maxLv);
    }
    if (curEnergys[curWpLV] == null) {
        curWpLV = maxLv;
    }else {
        curWpLV = Math.max(maxLv, curWpLV);
    }

    //找出当前等级下一级的配置并校验
    let cfg = DESIGN_CFG.newweapon_upgrade_cfg;
    let wbks = Object.keys(cfg);
    wbks.sort(function (a, b) {
        return Number(a) > Number(b) ? 1 : -1;
    });
    let i = wbks.indexOf(curWpLV.toString());
    if (i === -1) {
        return cb(ERROR_OBJ.WEAPON_LEVEL_INVALID);
    }else if (i === wbks.length - 1) {
        return cb(ERROR_OBJ.WEAPON_INFO_NULL);
    }
    let nextWpLV =  Number(wbks[i + 1]);
    let nextCfg = cfg[nextWpLV];
    if (!nextCfg) {
        return cb(ERROR_OBJ.WEAPON_INFO_NULL); 
    }
    if (curEnergys[nextWpLV] >= 0) {
        return cb(ERROR_OBJ.WEAPON_LEVELUP_REPEAT);
    }

    let cost = nextCfg.unlock_cost; //指定货币消耗数量
    let material = nextCfg.unlock_material; //材料及数量
    if (!cost && nextWpLV > 1) {
        return cb(ERROR_OBJ.WEAPON_INFO_NULL); 
    }

    //升级约定消耗道具i007、锻造成功率i500
    let itemCostLit = [];
    let ITEM_CFGS = DESIGN_CFG.item_item_cfg;
    if (!ITEM_CFGS || !ITEM_CFGS[COST_ITEM_KEY]) {
        return cb(ERROR_OBJ.PACK_ITEM_NOT_EXIST);
    }
    let curPackage = account.package;
    let curSkill = account.skill;
    let res = _costItemFromPackage(null, curPackage, COST_ITEM_KEY, cost);
    let actCost = cost;
    let leftPearl = 0;
    if (res.err) {
        leftPearl = res.leftPearl;
        if (leftPearl > 0 && account.pearl < leftPearl) {
            return cb(res.err);
        }
        actCost = res.curItemCount;
        itemCostLit.push({
            item_id: COST_PEARL_KEY,
            item_num: leftPearl
        });
    }
    itemCostLit.push({
        item_id: COST_ITEM_KEY,
        item_num: actCost
    });

    //锻造所需材料确认及消耗
    if (!material || !(material instanceof Array)) {
        return cb(ERROR_OBJ.WEAPON_INFO_NULL); 
    }
    let materialLength = material.length;
    if (materialLength > 0) {
        isDone = false;
        for (let i = 0; i < materialLength; i ++) {
            let temp = material[i];
            if (!temp || temp.length != 2) {
                return cb(ERROR_OBJ.WEAPON_INFO_NULL);  
            }
            let itemKey = temp[0];
            let itemNum = temp[1];
            let res = _costItemFromPackage(curSkill, curPackage, itemKey, itemNum);
            if (res.err) {
                return cb(res.err);
            }
            itemCostLit.push({
                item_id: itemKey,
                item_num: itemNum
            });
        }
        //确定成功率\陨石消耗
        let unlockRate = nextCfg.unlock_rate;
        if (isUseStone) {
            let needStone = Math.round((1 - unlockRate) * 100);
            if (!needStone) {
                return cb(ERROR_OBJ.WEAPON_INFO_NULL); 
            }
            let res = _costItemFromPackage(null, curPackage, STONE_KEY, needStone);
            if (res.err) {
                return cb(res.err);
            }
            itemCostLit.push({
                item_id: STONE_KEY,
                item_num: needStone,
            });
            isDone = true;
        }
        else {
            isDone = unlockRate >= Math.random();
        }
    }

    //升级结果、返回数据、日志记录、任务统计、计算魅力值并返回
    if (isDone) {
        curEnergys[nextWpLV] = nextCfg.needpower;
        account.weapon_energy = curEnergys;
        account.weapon = nextWpLV;
        leftPearl > 0 && (account.pearl = -leftPearl); //注意增量，消耗则为负数
    }
    account.package = curPackage;
    account.skill = curSkill;
    logBuilder.addGoldAndItemLog(itemCostLit, account, common_log_const_cfg.WEAPON_UNLOCK, -1);
    let reward = new RewardModel(account);
    reward.addProcess(RewardModel.TaskType.UPDATE_WEAPON_LV, account.weapon);
    account.commit();
    let ret = {
        change: {
            pearl: account.pearl,
            package: curPackage,
            skill: curSkill,
        },
        weapon_level: account.weapon,
        is_success: isDone,
        weapon_energy: account.weapon_energy,
    };
    CacheAccount.resetCharmPoint(account, function (chs) {
        if (chs && chs.length == 2) {
            let charmPoint = chs[0];
            let charmRank = chs[1];
            charmPoint >= 0 && (ret.change.charm_point = charmPoint);
            charmRank >= 0 && (ret.change.charm_rank = charmRank);
        }
        cb(null, ret);
    });
}

/**
 * 从背包中扣除道具
 * @param {*} itemKey 
 */
function _costItemFromPackage(curSkill, curPackage, itemKey, costCount) {
    let ITEM_CFGS = DESIGN_CFG.item_item_cfg;
    let itemCfg = ITEM_CFGS[itemKey];
    let itype = itemCfg.type;
    if (itype === 3) {
        if (!curSkill) {
            return { err: ERROR_OBJ.WEAPON_UNLOCK_DIAMOND_NOT_ENOUGH };
        }
        let skillId = itemCfg.id;
        if (!curSkill[skillId] || curSkill[skillId] < costCount) {
            return { err: ERROR_OBJ.WEAPON_UNLOCK_DIAMOND_NOT_ENOUGH };
        }
        curSkill[skillId] = Math.max(0, curSkill[skillId] - costCount);
    }else {
        if (!curPackage[itype]) {
            if (itemKey === COST_ITEM_KEY) {
                return { 
                    err: ERROR_OBJ.WEAPON_UNLOCK_DIAMOND_NOT_ENOUGH,
                    leftPearl: costCount, //武器精华不足的用钻石补齐购买
                    curItemCount: 0, //实际消耗的武器精华
                 };
            }
            return { err: ERROR_OBJ.WEAPON_UNLOCK_DIAMOND_NOT_ENOUGH };
        }
        let curItemCount = curPackage[itype][itemKey] || 0;
        curItemCount = Math.max(0, curItemCount);
        if (curItemCount < costCount) {
            if (itemKey === COST_ITEM_KEY) {
                curPackage[itype][itemKey] = 0;
                return { 
                    err: ERROR_OBJ.WEAPON_UNLOCK_DIAMOND_NOT_ENOUGH,
                    leftPearl: costCount - curItemCount,//武器精华不足的用钻石补齐购买
                    curItemCount: curItemCount, //实际消耗的武器精华
                 };
            }
            return { err: ERROR_OBJ.WEAPON_UNLOCK_DIAMOND_NOT_ENOUGH };
        }
        curPackage[itype][itemKey] = Math.max(0, curItemCount - costCount);
    }
    return { err: null };
}


