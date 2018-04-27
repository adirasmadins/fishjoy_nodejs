var _ = require('underscore');

/**
UserException = 
{
    uid: bigint,
    type: smallint,
    log_at: timestamp,
    exception: text,
}
 */
var gUserExceptionCache = [];


exports.push = push;
exports.cache = cache;
exports.length = length;

/**
 * 检测gUserExceptionCache长度, 超过11000条数据时将前面的10000条写入数据库中
 */
function push(data) {
    gUserExceptionCache.push(data);
}

/**
 * 将gUserExceptionCache全部写入数据库中
 */
function cache() {
    return gUserExceptionCache;
}

/**
 * 将gUserExceptionCache全部写入数据库中
 */
function length() {
    return gUserExceptionCache.length;
}