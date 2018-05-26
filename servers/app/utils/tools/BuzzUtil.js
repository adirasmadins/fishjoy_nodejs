const RedisUtil = require('./RedisUtil');
const _ = require('underscore');
const API_CFGs = require('../../servers/admin/configs/api');
const CfgUtil = require('./CfgUtil');
const ArrayUtil = require('./ArrayUtil');
const SqlUtil = require('./SqlUtil');
const MathUtil = require('./MathUtil');
const ObjUtil = require('./ObjUtil');
const SQL_CONFIG = require('../../servers/admin/configs/sql');
const REDISKEY = require('../../models/index').REDISKEY;
const DESIGN_CFG = require('../../utils/imports').DESIGN_CFG;
const versions = require('../../../config/versions');
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const SCENE = DESIGN_CFG.common_log_const_cfg;
const goddess_goddess_cfg = DESIGN_CFG.goddess_goddess_cfg;
const social_guerdon_cfg = DESIGN_CFG.social_guerdon_cfg;
const goddess_rankreward_cfg = DESIGN_CFG.goddess_rankreward_cfg;
const shop_buygold_cfg = DESIGN_CFG.shop_buygold_cfg;
const GAIN_SCENE = [SCENE.GAME_FIGHTING, SCENE.NUCLER_DROP, SCENE.NUCLER_LASER, SCENE.GOLDFISH_GAIN];
const COST_SCENE = [SCENE.GAME_FIGHTING, SCENE.NUCLER_COST];

exports.getVipFromRmb = getVipFromRmb;
exports.syncAccount = syncAccount;
exports.getGain1HourFishingPlayer = getGain1HourFishingPlayer;
exports.getCost1HourFishingPlayer = getCost1HourFishingPlayer;
exports.getProfitInfoRecentHourForPlayer = getProfitInfoRecentHourForPlayer;
exports.getNameFromItemId = getNameFromItemId;
exports.getGiftCodeTitleFromId = getGiftCodeTitleFromId;
exports.getNameOfAdmin = getNameOfAdmin;
exports.isSSL = isSSL;
exports.getRmbTimes = getRmbTimes;
exports.getShopItemById = getShopItemById;
exports.checkCheat = checkCheat;
exports.isCheat = isCheat;
exports.getItemList = getItemList;
exports.getGoddessChartRewardByRank = getGoddessChartRewardByRank;
exports.getGoddessById = getGoddessById;
exports.getIP = getIP;
exports.extraCost = extraCost;
exports.getShopGoldById = getShopGoldById;

exports.SCENE = DESIGN_CFG.common_log_const_cfg;
exports.CDKEY_LIST = DESIGN_CFG.active_cdkey_cfg;

exports.checkFields = checkFields;
exports.routes = routes;

/**
 * 校验前端传入的参数
 * @param {*} data 
 * @param {*} api 
 * @param {*} type 
 */
function checkFields(data, api, type) {
    logger.info('api:', api);
    let API_PARAMS = API_CFGs[api].params;
    if (type) {
        API_PARAMS = API_CFGs[api][type];
    }
    if (ObjUtil.isUndefined(data, API_PARAMS)) {
        throw ERROR_OBJ.PARAM_MISSING;
    }
}

/**
 * 设置路由的通用方法
 * @param {*} setRoute 
 */
function routes(setRoute) {
    for (let api in API_CFGs) {
        let route = '/' + (api.api || api);
        let method = api;
        let menu = API_CFGs[api].menu;
        setRoute(route, menu, method);
    }
}

/**
 * 获取客户端IP地址
 * @param {*} ctx 
 */
function getIP(ctx) {
    ctx.request.body.data = ctx.request.body.data || {};
    ctx.request.body.data.ip = ctx.ip;
}

/**
 * 玩家作弊返回true, 玩家没有作弊返回false
 * BUG: 总是返回true
 * Reason: 没有使用了async限制但是调用时没有加await限定.
 */
function isCheat(account) {
    return account.test < 0;
}

/**
 * 检测玩家是否为作弊被封号的玩家
 */
async function checkCheat(uid) {
    let test = await RedisUtil.hget(REDISKEY.TEST, uid);
    if (isCheatBlock()) {
        if (test < 0) {
            throw ERROR_OBJ.PLAYER_CHEAT;
        }
    }
}

/**
 * 根据规则决定玩家购买的物品类别
 * @param {*} shop_id 
 */
function getShopCfgs(shop_id, itemtype = 0) {
    if (shop_id < 100) {
        if (itemtype == 0) {
            return DESIGN_CFG.shop_pearl_cfg;
        }
        else {
            return DESIGN_CFG.shop_buygold_cfg;
        }
    }
    else if (shop_id >= 100 && shop_id < 1000) {
        return DESIGN_CFG.shop_card_cfg;
    }
    else if (shop_id >= 1000 && shop_id < 10000) {
        return DESIGN_CFG.shop_fund_cfg;
    }
    else if (shop_id >= 10000) {
        return DESIGN_CFG.shop_gift_cfg;
    }
}

/**
 * 获取充值购买的物品信息
 * @param {*} id 客户端传入的id 
 */
function getShopItemById(id, itemtype = 0) {
    let cfgs = getShopCfgs(id, itemtype);
    for (let idx in cfgs) {
        let shopItem = cfgs[idx];
        if (shopItem.id == id) {
            return shopItem;
        }
    }
    return null;
}

/**
 * 获取rmb字段的倍率, 用于解决RMB是分的记录而其他版本是元的配置.
 */
function getRmbTimes() {
    if (this.isVersionChina()) {
        return 100;
    }
    if (this.isVersionVietnam()) {
        return 1;
    }
    return 1;
}

/**
 * 是否为HTTPS.
 */
function isSSL() {
    return versions.SSL;
}

/**
 * 是否为大陆版的判断. 用于某些特定的处理.
 */
exports.isVersionChina = () => {
    return ArrayUtil.contain(versions.VERSION_CHINA, versions.PUB);
};

/**
 * 是否为越南版的判断. 用于某些特定的处理.
 */
exports.isVersionVietnam = () => {
    return ArrayUtil.contain(versions.VERSION_VIETNAM, versions.PUB);
};

/**
 * 是否为赌博版.
 */
exports.isVersionGambling = () => {
    return ArrayUtil.contain(versions.VERSION_GAMBLING, versions.PUB);
};

/**
 * 如果是手动填写订单发货则返回true.
 */
exports.isVersionCikByHand = () => {
    return ArrayUtil.contain(versions.VERSION_CIK_BY_HAND, versions.PUB);
};

/**
 * 作弊玩家被阻挡的版本.
 */
function isCheatBlock() {
    return this.isVersionVietnam();
}

/**
 * 作弊玩家被隔离的版本.
 */
function isCheatConfine() {
    return this.isVersionChina();
}

/**
 * 查询管理者的名字
 * @param {*} id 
 */
async function getNameOfAdmin(id) {
    let info = await SqlUtil.query(SQL_CONFIG.getAccountByUid, [id]);
    if (info && info.length > 0) {
        return info[0].uname;
    }
    else {
        return null;
    }
}

/**
 * 获取礼品码的类型(名字)
 * @param {*} action_id 
 */
function getGiftCodeTitleFromId(action_id) {
    for (let i = 0; i < DESIGN_CFG.active_cdkey_cfg.length; i++) {
        let info = DESIGN_CFG.active_cdkey_cfg[i];
        if (info.id == action_id) {
            return info.description;
        }
    }
    return null;
}

/**
 * 查询给定RMB(充值金额)对应的VIP
 */
function getVipFromRmb(rmb) {
    let ret = 0;

    for (let i = 0; i < DESIGN_CFG.vip_vip_cfg.length; i++) {
        let vipInfo = DESIGN_CFG.vip_vip_cfg[i];
        if (rmb >= vipInfo.vip_unlock) {
            ret = vipInfo.vip_level;
        }
        else {
            break;
        }
    }

    return ret;
}

/**
 * 同步玩家数据到MySQL
 * @param {*} uid 
 * @param {*} field 
 */
async function syncAccount(uid, field) {
    await RedisUtil.sadd(`${REDISKEY.UPDATED_DELTA_FIELDS}:${uid}`, field);
    await RedisUtil.sadd(REDISKEY.UPDATED_DELTA_UIDS, uid);
}

/**
 * 获取指定玩家最近一小时的捕鱼金币收益
 * @param {*} uid 
 */
async function getGain1HourFishingPlayer(uid) {
    let sql = SQL_CONFIG.getGain1HourFishingPlayer.replace('|scene|', GAIN_SCENE.toString());
    let gainRecentHour = (await SqlUtil.query(sql, [uid]))[0].sum || 0;
    return gainRecentHour;
}

/**
 * 获取指定玩家最近一小时的捕鱼金币消耗
 * @param {*} uid 
 */
async function getCost1HourFishingPlayer(uid) {
    let sql = SQL_CONFIG.getCost1HourFishingPlayer.replace('|scene|', COST_SCENE.toString());
    let costRecentHour = (await SqlUtil.query(sql, [uid]))[0].sum || 0;
    return costRecentHour;
}

/**
 * 获取玩家最近一小时的盈亏信息(盈亏金币数，盈亏率)
 * @param {*} uid 玩家id 
 */
async function getProfitInfoRecentHourForPlayer(uid) {
    let gainRecentHour = await getGain1HourFishingPlayer(uid);
    let costRecentHour = await getCost1HourFishingPlayer(uid);
    let profitRecentHour = gainRecentHour - costRecentHour;
    let profitRateRecentHour = profitRecentHour / MathUtil.getDenominator(costRecentHour);
    profitRateRecentHour = MathUtil.makePercent(profitRateRecentHour);
    return {
        profitRecentHour: profitRecentHour,
        profitRateRecentHour: profitRateRecentHour,
    };
}

/**
 * 从itemId获取物品名字
 * @param {*} itemId 
 */
function getNameFromItemId(itemId) {
    let info = DESIGN_CFG.item_item_cfg[itemId];
    return DESIGN_CFG.string_strings_cfg[info.name].cn;
}

/**
 * 获取物品列表
 * @param items 配置表中的物品数组 [["i016",1],...]
 * @return [{item_id:"i106", item_num:1},...]
 */
function getItemList(items) {
    let item_list = [];
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        item_list.push({
            item_id: item[0],
            item_num: item[1],
        });
    }
    return item_list;
}

/**
 * 从保卫女神的排名获取奖励数组.
 * @param rank 玩家的排名
 */
function getGoddessChartRewardByRank(rank, max_wave) {
    for (let i = 0; i < goddess_rankreward_cfg.length; i++) {
        let rankreward_info = goddess_rankreward_cfg[i];
        let interval = rankreward_info.interval;
        // interval为INT
        if (i > 0) {
            let rankreward_info_last = goddess_rankreward_cfg[i - 1];
            let interval_last = rankreward_info_last.interval;
            if (rank >= interval_last && rank <= interval) {
                return getWeekRewardByMaxWave(rankreward_info, i, max_wave);
            }
        }
        else {
            if (rank <= interval) {
                return getWeekRewardByMaxWave(rankreward_info, i, max_wave);
            }
        }
    }
    return [];

    function getWeekRewardByMaxWave(rankreward_info, i, max_wave) {
        let limit = rankreward_info.limit;
        if (max_wave < limit) {
            if (i >= goddess_rankreward_cfg.length - 1) {
                return [];
            }
            else {
                rankreward_info = goddess_rankreward_cfg[i + 1];
                return getWeekRewardByMaxWave(rankreward_info, i + 1, max_wave);
            }
        }
        return rankreward_info.weekreward;
    }
}

/**
 * 从女神ID获取女神的数据
 */
function getGoddessById(id) {
    for (let idx in goddess_goddess_cfg) {
        let goddess = goddess_goddess_cfg[idx];
        if (id == goddess.id) {
            return goddess;
        }
    }
    return null;
}

/**
 * 打赏额外消耗
 * @param item
 */
function extraCost(item) {
    for (let i = 0; i < social_guerdon_cfg.length; i++) {
        for (let j = 0; j < social_guerdon_cfg[i].reward.length; j++) {
            let itemid = social_guerdon_cfg[i].reward[j][0];
            let num = social_guerdon_cfg[i].reward[j][1];
            if (item[0][0] == itemid && item[0][1] == num) {
                return social_guerdon_cfg[i].cost[j];
            }
        }
    }
}

/**
 * 获取购买金币的相关信息.
 */
function getShopGoldById(id) {
    for (let idx in shop_buygold_cfg) {
        let shop_gold = shop_buygold_cfg[idx];
        if (shop_gold.id == id) {
            return shop_gold;
        }
    }
    return null;
}

exports.getPumpwater = getPumpwater;
const PUMPWATER_MAP = [
    { key: 'extract', rediskey: REDISKEY.PLATFORM_DATA.EXPECT_EXTRACT },
    { key: 'durationNormal', rediskey: REDISKEY.PLATFORM_DATA.TOTAL_CYCLE },
    { key: 'durationGive', rediskey: REDISKEY.PLATFORM_DATA.ADD_CYCLE },
    { key: 'durationGain', rediskey: REDISKEY.PLATFORM_DATA.EAT_CYCLE },
    { key: 'catchRateGive', rediskey: REDISKEY.PLATFORM_DATA.ADD_BUFF_RATE },
    { key: 'catchRateGain', rediskey: REDISKEY.PLATFORM_DATA.EAT_BUFF_RATE },
];
/**
 * 获取抽水设置参数(先读取Redis，redis中没有值读取配置文件)
 * @param {*} cb 
 */
async function getPumpwater(cb) {
    let ret = {};
    // 读取配置
    ret = CfgUtil.common.getPumpWater();
    // 读取redis
    for (let i in PUMPWATER_MAP) {
        const setting = PUMPWATER_MAP[i];
        ret[setting.key] = await RedisUtil.get(setting.rediskey) || ret[setting.key];
    }
    ret.durationNormal = ret.durationNormal * 1000;
    ret.durationGive = ret.durationGive * 1000;
    ret.durationGain = ret.durationGain * 1000;
    cb && cb(null, ret);
}

exports.getPumpwaterAsync = getPumpwaterAsync;
/**
 * 异步获取抽水设置参数(先读取Redis，redis中没有值读取配置文件)
 * @param {*} cb 
 */
async function getPumpwaterAsync() {
    return new Promise((resolve, reject) => {
        getPumpwater((err, res) => {
            if (err) {
                logger.error('[ERROR] getPumpwater() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}