////////////////////////////////////////
// CacheUserInfo
// 玩家信息相关数据缓存
//--------------------------------------
// 如何使用
// var CacheUserInfo = require('src/buzz/cache/CacheUserInfo');
// CacheUserInfo.func();
////////////////////////////////////////

//==============================================================================
// import
//==============================================================================
var ObjUtil = require('../ObjUtil');
// var DaoLink = require('../../dao/dao_link');

//------------------------------------------------------------------------------
// DAO
//------------------------------------------------------------------------------
var dao_feedback = require('../../dao/dao_feedback');
const redisSync = require('../../../../../utils/redisAccountSync');

//==============================================================================
// constant
//==============================================================================
var ERROR = 1;
var DEBUG = 0;
var TAG = "【CacheUserInfo】";


//==============================================================================
// global variable
//==============================================================================
// 使用说明: 定时存储记录, 存储时用队列方式
// 记录下当前长度len, 从队列中移除len个数据存入数据库, 等待下个周期
// 每一条记录格式如下
/**
UserInfo = 
{
    uid: bigint,
    figureurl: text,
    username: text,
}
 */
var gUserInfoCache = {};


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.push = push;
exports.cache = cache;
exports.length = length;
exports.getUserInfo = getUserInfo;
exports.loadAll = loadAll;
exports.query = query;
exports.queryOrInsert = queryOrInsert;


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 检测gUserInfoCache长度, 超过11000条数据时将前面的10000条写入数据库中
 */
function push(data) {
    var uid = data.id;
    data.username = ObjUtil.getPlayerName(data);
    gUserInfoCache[uid] = data;
}

/**
 * 将gUserInfoCache全部写入数据库中
 */
function cache() {
    return gUserInfoCache;
}

/**
 * 将gUserInfoCache全部写入数据库中
 */
function length() {
    return gUserInfoCache.length;
}

/**
 * 获取玩家信息
 */
function getUserInfo(uid) {
    return gUserInfoCache[uid];
}

/**
 * 加载数据库中所有用户的头像和昵称.
 */
function loadAll(rows) {
    const FUNC = TAG + "loadAll() --- ";

    // 清空
    gUserInfoCache = [];
    // 赋值
    for (var i = 0; i < rows.length; i++) {
        var userinfo = rows[i];
        if(userinfo) {
            var uid = userinfo.id;
            userinfo.username = userinfo.nickname;
            gUserInfoCache[uid] = userinfo;
        }
    }
    // logger.info(FUNC + "共加载玩家信息:", rows.length);
}

/**
 * 查询用户信息.
 */
function query(uid) {
    return gUserInfoCache[uid];
}

/**
 * 查询用户信息, 如果不存在则查询数据库插入一条.
 */
function queryOrInsert(req, uid, cb) {
    const FUNC = TAG + "queryOrInsert() --- ";
    if (gUserInfoCache[uid]) {
        cb();
    }
    else {
        let fields = ["id", "nickname", "figure_url"];
        redisSync.getAccount(uid, fields, function (err, account) {
            push(account.toJSON());
        });
    }
}

