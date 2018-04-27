//==============================================================================
// global variable
//==============================================================================
// 使用说明: 最大长度为11000条记录, 如果超过则执行一次写入数据库的操作, 一次记录10000条
// 调用flush()后将所有数据写入数据库(此方法仅在重启服务器之前, 或服务器崩溃时调用一次)
// 写入操作都放置在另一个线程中进行, 不影响当前线程
var gGoldLogCache = [];

// 缓存金币日志相关
exports.push = push;
exports.cache = cache;
exports.length = length;
exports.getLogListByAccountId = getLogListByAccountId;


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 检测gGoldLogCache长度, 超过11000条数据时将前面的10000条写入数据库中
 */
function push(data) {
    gGoldLogCache.push(data);
}

/**
 * 将gGoldLogCache全部写入数据库中
 */
function cache() {
    return gGoldLogCache;
}

/**
 * 将gGoldLogCache全部写入数据库中
 */
function length() {
    return gGoldLogCache.length;
}

function getLogListByAccountId(account_id) {
    var ret = [];
    for (var i = 0; i < gGoldLogCache.length; i++) {
        // TODO: 添加与用户ID相关的条件
        // logger.info("record[" + i + "]:", gGoldLogCache[i]);
        if (gGoldLogCache[i].account_id == account_id) {
            ret.push(gGoldLogCache[i]);
        }
    }
    return ret;
}

