var ObjUtil = require('../../../../hall/src/buzz/ObjUtil');

/**
UserInfo = 
{
    uid: bigint,
    figureurl: text,
    username: text,
}
 */
var gUserInfoCache = {};


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
    if (gUserInfoCache[uid]) {
        cb();
    }
    else {
        let fields = ["id", "nickname", "figure_url"];
        redisSync.getAccountById(uid, fields, function (err, account) {
            push(account.toJSON());
        });
    }
}

