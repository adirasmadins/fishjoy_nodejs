var ObjUtil = require('./ObjUtil');
var CacheAccount = require('./cache/CacheAccount');
var _ = require('underscore');
var gameConfig = require('../../../../utils/imports').DESIGN_CFG;// 抽奖奖品
var active_draw_cfg = gameConfig.active_draw_cfg;// 抽奖奖品
var active_drawcost_cfg = gameConfig.active_drawcost_cfg;// 抽奖花费
var string_strings_cfg = gameConfig.string_strings_cfg;
var item_item_cfg = gameConfig.item_item_cfg;
const _utils = require('../utils/utils');

var DEBUG = 0;
var ERROR = 1;

var TAG = '【buzz_draw】';

var DRAW_TYPE = {
    GOLD: 1,
    PEARL: 2,
};
//exports.DRAW_TYPE = DRAW_TYPE;
exports.DRAW_TYPE = {
    "GOLD": 1,
    "PEARL": 2,
};


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.getFreeDraw = getFreeDraw;
exports.getFreeDrawGold = getFreeDrawGold;
exports.getFreeDrawDiamond = getFreeDrawDiamond;

exports.getFreeDrawDefault = getFreeDrawDefault;
exports.getFreeDrawResetString = getFreeDrawResetString;
exports.getTotalDrawDefault = getTotalDrawDefault;
exports.getTotalDrawResetString = getTotalDrawResetString;

exports.getFreeDrawCurrent = getFreeDrawCurrent;
exports.getTotalDrawCurrent = getTotalDrawCurrent;

exports.getDrawCurrent = getDrawCurrent;

exports.useFree = useFree;
exports.getActualCostTimes = getActualCostTimes;

exports.addDrawCount = addDrawCount;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 同时获取free_draw和total_draw两种数据的当前值.
 */
function getDrawCurrent(account, cb) {
    let ret = {
        free_draw: account.free_draw,
        total_draw: account.total_draw
    };
    _utils.invokeCallback(cb, null, ret);
}

/**
 * 增加抽奖次数
 * @param uid 玩家的ID.
 * @param type 抽奖类型(1.金币抽奖; 2.钻石抽奖).
 * @param times 抽奖次数.
 */
function addDrawCount(account, type, times) {
    const FUNC = TAG + "addDrawCount() --- ";
    times = parseInt(times);
    // 更新CacheAccount
    var total_draw = account.total_draw;
    if (type == 1) {
        total_draw.gold += times;
    }
    else if (type == 2) {
        total_draw.diamond += times;
    }
    // yDONE: 97-皮肤碎片抽奖
    else if (type > 100 && type < 120) {
        if (total_draw[type] == null) {
            total_draw[type] = 0;
        }
        total_draw[type] += times;
    }
    else {
        if (ERROR) logger.error(FUNC + "[ERROR]错误的抽奖类型:" + type);
    }

    account.total_draw = total_draw;
    // 在调用的地方已经commit过了
    account.commit();
}

// block1: getFreeDraw*
function getFreeDraw(drawtype) {
    for (var idx in active_drawcost_cfg) {
        var item = active_drawcost_cfg[idx];
        if (item.drawtype == drawtype) {
            return item.free;
        }
    }
}

/**
 * yDONE: 97-皮肤碎片抽奖
 * 获取武器皮肤抽奖的免费次数.
 */
function getFreeDrawWeaponSkin() {
    let ret = {};
    for (var idx in active_drawcost_cfg) {
        var item = active_drawcost_cfg[idx];
        if (item.drawtype > 100) {
            ret[item.drawtype] = item.free;
        }
    }
    return ret;
}

function getFreeDrawGold() {
    return getFreeDraw(DRAW_TYPE.GOLD);
}

function getFreeDrawDiamond() {
    return getFreeDraw(DRAW_TYPE.PEARL);
}

// 初始化用户数据时返回一个默认对象放入缓存
function getFreeDrawDefault() {
    var data = getFreeDrawWeaponSkin();
    data.gold = getFreeDrawGold();
    data.diamond = getFreeDrawDiamond();
    return data;
}

function getTotalDrawDefault() {
    var data = {
        gold: 0,
        diamond: 0,
    };
    return data;
}

// 数据库中重置字符串
function getFreeDrawResetString() {
    return ObjUtil.data2String(getFreeDrawDefault());
}

/**
 * 重置玩家每日抽奖次数(重置为0)
 */
function getTotalDrawResetString() {
    return ObjUtil.data2String(getTotalDrawDefault());
}

// 获取玩家当前的剩余免费抽奖次数{gold:1, diamond:0}
function getFreeDrawCurrent(account_id, cb) {
    CacheAccount.getFreeDraw(account_id, cb);
}

// 获取玩家当前的今日抽奖次数{gold:1, diamond:0}
function getTotalDrawCurrent(account_id, cb) {
    return CacheAccount.getTotalDraw(account_id, cb);
}

// block2: useFree*
// 使用免费次数(缓存中减去对应值)
function useFree(account, type, times) {
    CacheAccount.useFreeDraw(account, type, times);// 需要更新updated_at值
}

// 获取实际使用金币或钻石的次数(减去免费次数)
function getActualCostTimes(account, type, times) {
    let ret = times;
    if (account) {
        if (type < 100) {
            switch (type) {
                case DRAW_TYPE.GOLD:
                    ret = times - account.free_draw.gold;
                    break;
                case DRAW_TYPE.PEARL:
                    ret = times - account.free_draw.diamond;
                    break;
            }
        }
        // yDONE: 97-皮肤碎片抽奖
        else {
            ret = times - account.free_draw[type];
        }
        return ret < 0 ? 0 : ret;
    }
    else {
        return ret;
    }

    // CacheAccount.getActualCostTimes(account_id, type, times, cb);
}

// block3: getCost*
// TODO

//==============================================================================
// private
//==============================================================================

function _getNameFromItemId(item_id) {
    return string_strings_cfg[item_item_cfg[item_id].name].cn;
}

function _randomMax(type) {
    var ret = 0;
    for (var idx in active_draw_cfg) {
        var item = active_draw_cfg[idx];
        if (item.drawtype == type) {
            ret += item.item_probability;
        }
    }
    return ret;
}

function _getCost(type) {
    var item = _getCostItem(type);
    var cost_type = _getItemTypeByKey(item[0]);
    var cost_num = item[1];
    return {
        item: item[0],
        type: cost_type,
        num: cost_num,
    };
}

// 返回物品类型(Item.ItemType中有存放).
function _getItemTypeByKey(item_key) {
    for (var idx in item_item_cfg) {
        var item = item_item_cfg[idx];
        if (idx == item_key) {
            return item.type;
        }
    }
    logger.info("item_key:", item_key);
    logger.info("不该走到这里");
}

// 获取抽奖一次的花费, 返回一个item : ["i001",50000]或["i002",50].
function _getCostItem(type) {
    for (var idx in active_drawcost_cfg) {
        var cost = active_drawcost_cfg[idx];
        if (cost.drawtype == type) {
            return cost.item;
        }
    }
}