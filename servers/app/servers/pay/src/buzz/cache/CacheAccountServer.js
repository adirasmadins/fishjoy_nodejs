////////////////////////////////////////
// CacheAccountServer
// 玩家登录服务器信息的相关数据缓存
//--------------------------------------
// 如何使用
// var CacheAccountServer = require('src/buzz/cache/CacheAccountServer');
// CacheAccountServer.func();
////////////////////////////////////////

//==============================================================================
// import
//==============================================================================


//==============================================================================
// constant
//==============================================================================
var ERROR = 1;
var DEBUG = 0;
var TAG = "【CacheAccountServer】";


//==============================================================================
// global variable
//==============================================================================
// 使用说明: 定时存储记录, 存储时用队列方式
// 记录下当前长度len, 从队列中移除len个数据存入数据库, 等待下个周期
// 每一条记录格式如下
/**
account_server = 
{
    uid: int,
    sid: int,
    login_time: int(timestamp),
}
 */
var gAccountServerCache = {};


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
// 缓存技能日志日志相关
exports.push = push;
exports.cache = cache;
exports.shift = shift;
exports.length = length;

/**
 * 需要记录技能日志记录则设置为1, 否则设置为0.
 */
var RECORD_SKILL = 1;
exports.RECORD_SKILL = RECORD_SKILL;


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 检测gAccountServerCache长度, 超过11000条数据时将前面的10000条写入数据库中
 */
function push(data) {
    var uid = data.uid;
    gAccountServerCache["" + uid] = data;
}

/**
 * 获取缓存中的所有用户服务器对应数据.
 */
function cache() {
    return gAccountServerCache;
}

/**
 * 将gAccountServerCache全部写入数据库中
 */
function shift() {
    var ret = [];
    for (var uid in gAccountServerCache) {
        ret.push(gAccountServerCache[uid]);
        delete gAccountServerCache[uid];
    }
    return ret;
}

/**
 * 将gAccountServerCache全部写入数据库中
 */
function length() {
    return gAccountServerCache.length;
}

