////////////////////////////////////////
// CacheWeapon
// 武器相关数据缓存
//--------------------------------------
// 如何使用
// var CacheWeapon = require('src/buzz/CacheWeapon');
// CacheWeapon.func();
////////////////////////////////////////

//==============================================================================
// import
//==============================================================================
//var StringUtil = require('../../utils/StringUtil');
var DaoWeapon = require('../../dao/dao_pearl');


//==============================================================================
// constant
//==============================================================================
var ERROR = 1;
var DEBUG = 0;


//==============================================================================
// global variable
//==============================================================================
// 使用说明: 最大长度为11000条记录, 如果超过则执行一次写入数据库的操作, 一次记录10000条
// 调用flush()后将所有数据写入数据库(此方法仅在重启服务器之前, 或服务器崩溃时调用一次)
// 写入操作都放置在另一个线程中进行, 不影响当前线程
var gWeaponLogCache = [];


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
// 缓存武器日志相关
exports.push = push;
exports.cache = cache;
exports.length = length;
exports.getLogListByAccountId = getLogListByAccountId;


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 检测gWeaponLogCache长度, 超过11000条数据时将前面的10000条写入数据库中
 */
function push(data) {
    gWeaponLogCache.push(data);
}

/**
 * 将gWeaponLogCache全部写入数据库中
 */
function cache() {
    return gWeaponLogCache;
}

/**
 * 将gWeaponLogCache全部写入数据库中
 */
function length() {
    return gWeaponLogCache.length;
}

function getLogListByAccountId(account_id) {
    var ret = [];
    for (var i = 0; i < gWeaponLogCache.length; i++) {
        // TODO: 添加与用户ID相关的条件
        // logger.info("record[" + i + "]:", gWeaponLogCache[i]);
        if (gWeaponLogCache[i].account_id == account_id) {
            ret.push(gWeaponLogCache[i]);
        }
    }
    return ret;
}

