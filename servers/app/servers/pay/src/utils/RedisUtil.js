const StringUtil = require("./StringUtil");
const ArrayUtil = require("./ArrayUtil");
const EVENT = require("../buzz/cst/buzz_cst_event").EVENT;
const redisKeys = require('../../../../database').dbConsts.REDISKEY;


let TAG = "【RedisUtil】";
let client = null;
let isReady = true;
let isConnect = true;

exports.set = set;
exports.mset = mset;
exports.get = get;
exports.mget = mget;
exports.hset = hset;
exports.hmset = hmset;
exports.hget = hget;
exports.hmget = hmget;
exports.hgetall = hgetall;
exports.hkeys = hkeys;

exports.lpush = lpush;
exports.lrange = lrange;
exports.rpush = rpush;
exports.blpop = blpop;
exports.brpop = brpop;
exports.expire = expire;
exports.expireP = expireP;

exports.sadd = sadd;
exports.scard = scard;
exports.spop = spop;
exports.srandmember = srandmember;

exports.zadd = zadd;
exports.zaddbatch = zaddbatch;
exports.zcount = zcount;
exports.zcard = zcard;
exports.zrange = zrange;
exports.zrevrange = zrevrange;
exports.zrangewithscores = zrangewithscores;
exports.zrevrangewithscores = zrevrangewithscores;
exports.zscore = zscore;
exports.zrank = zrank;
exports.zrevrank = zrevrank;
exports.zrem = zrem;
exports.zremrangebyrank = zremrangebyrank;
exports.zrevremrangebyrank = zrevremrangebyrank;

// 排行榜
exports.initRank = initRank;
exports.updateRank = updateRank;
exports.getRank = getRank;
exports.getRankEx = getRankEx;

exports.ltrim = ltrim;
exports.del = del;
exports.hdel = hdel;
exports.multi = multi;
exports.getClient = getClient;
exports.sismember = sismember;
exports.smembers = smembers;
exports.lrem = lrem;
exports.zrangebyscore = zrangebyscore;

exports.scan = scan;
exports.hscan = hscan;
exports.zscan = zscan;
exports.hincr = hincr;
exports.hincrby = hincrby;
exports.incrby = incrby;
exports.incrP = incrP;

exports.repeatHscan = repeatHscan;
exports.repeatZscan = repeatZscan;
exports.tco = tco;
exports.init = init;

function init(redis_client) {
    client = redis_client;
}

/**
 * ZSCAN 遍历有序集合
 */
function zscan(hashkey, start, count, cb) {
    const FUNC = TAG + "zscan() --- ";
    if (isReadyAndConnected(cb)) {
        client.zscan(hashkey, start, 'COUNT', count, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 嵌套执行zscan操作, 直到将有序集合中所有玩家遍历完.
 */
function repeatZscan(hashkey, start, count, op, next) {
    zscan(hashkey, start, count, function (err, res) {
        let cursor = res[0];
        let data = res[1];
        op(res, function nextCursor() {
            if (0 == cursor) {
                next();
            }
            else {
                repeatZscan(hashkey, cursor, count, op, next);
            }
        });
    });

}

/**
 * id递增计数器
 */
exports.generateNewId = function (cb) {
    client.incr(redisKeys.KEY_ACC_COUNTER, function (err, count) {
        cb && cb(count);
    });
};

/**
 * 增量地迭代（incrementally iterate）一集元素.
 */
function scan(key, cb) {

}


function incr(key, cb) {
    const FUNC = TAG + "hscan() --- ";
    if (isReadyAndConnected(cb)) {
        client.incr(key, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }

}

function hkeys(key, cb) {
    const FUNC = TAG + "hscan() --- ";
    if (isReadyAndConnected(cb)) {
        client.hkeys(key, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}


/**
 * HSCAN 命令用于迭代哈希键中的键值对
 */
function hscan(hashkey, start, count, cb) {
    const FUNC = TAG + "hscan() --- ";
    if (isReadyAndConnected(cb)) {
        client.hscan(hashkey, start, 'COUNT', count, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * hash表中field键对应的值自增1.
 */
function hincr(hashkey, field, cb) {
    const FUNC = TAG + "hincr() --- ";
    if (isReadyAndConnected(cb)) {
        client.hincrby(hashkey, field, 1, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * hash表中field键对应的值自增num.
 */
function hincrby(hashkey, field, num, cb) {
    const FUNC = TAG + "hincrby() --- ";
    if (!hashkey) {
        logInfo();
        throw new Error(FUNC + "!hashkey");
    }
    if (!field) {
        logInfo();
        throw new Error(FUNC + "!field");
    }
    if (undefined == num) {
        logInfo();
        throw new Error(FUNC + "!num");
    }
    if (isReadyAndConnected(cb)) {
        client.hincrby(hashkey, field, num, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }

    function logInfo() {
        logger.error(FUNC + "hashkey:", hashkey);
        logger.error(FUNC + "field:", field);
        logger.error(FUNC + "num:", num);
    }
}

/**
 * 键对应的值自增num.
 */
function incrby(key, num, cb) {
    const FUNC = TAG + "incrby() --- ";
    if (isReadyAndConnected(cb)) {
        client.incrby(key, num, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

function incrP(key) {
    const FUNC = TAG + "incrP() --- ";
    return new Promise(function (resolve, reject) {
        incr(key, function (err, res) {
            if (err) {
                reject(err);
            }
            else {
                resolve(res);
            }
        });
    });
}

/**
 * 嵌套执行hscan操作, 直到将hash表中所有玩家遍历完.
 */
function repeatHscan(hashkey, start, count, op, next) {
    hscan(hashkey, start, count, function (err, res) {
        let cursor = res[0];
        let data = res[1];
        op(res, function nextCursor() {
            if (0 == cursor) {
                next();
            }
            else {
                repeatHscan(hashkey, cursor, count, op, next);
            }
        });
    });
}


//==============================================================================
// implement
//==============================================================================

function getClient() {
    return client;
}

/**
 * client.set(key,value,callback),callback 函数有2个回调参数,error和response, error表示操作过程中的错误提示值为null表示没有错误,response为布尔值
 * Set Value for Key.
 * client must be ready and connected.
 * @param cb callback(err, res) res usually will return "OK".
 */
function set(key, value, cb) {
    const FUNC = TAG + "set() --- ";
    if (isReadyAndConnected(cb)) {
        client.set(key, value, cb);
    }
}

/**
 * 批量设置键值对
 let key_value = [
 "test_key1", "test_value1",
 "test_key2", "test_value2",
 "test_key3", "test_value3",
 ];
 */
function mset(key_value, cb) {
    const FUNC = TAG + "set() --- ";
    if (isReadyAndConnected(cb)) {
        client.mset(key_value, cb);
    }
}

/**
 * client.get(key,callback),callback 函数有2个回调参数,error和response, error表示操作过程中的错误提示值为null表示没有错误,response为获取到的值,null表示没有获取到数据
 * Get Value from Key.
 * client must be ready and connected.
 * @param cb callback(err, value) value will be returned.
 */
function get(key, cb) {
    const FUNC = TAG + "get() --- ";
    if (isReadyAndConnected(cb)) {
        client.get(key, cb);
    }
}

/**
 * 批量获取键对应的值
 let key_list = [
 "test_key1",
 "test_key2",
 "test_key3",
 ];
 * return
 [ 'test_value1', 'test_value2', 'test_value3' ]
 */
function mget(key_list, cb) {
    const FUNC = TAG + "mget() --- ";
    if (isReadyAndConnected(cb)) {
        client.mget(key_list, cb);
    }
}

/**
 * client.hset(hashkey,field,value,callback) 哈希数据类型, 第一个参数为KEY名称,第二个为需要设置的字段KEY,第三个为值,第四个参数为回调参数,内容和set一致
 * Set Hash Value for Key.
 * client must be ready and connected.
 */
function hset(hashkey, field, value, cb) {
    const FUNC = TAG + "hset() --- ";
    if (typeof(value) == "undefined" || (typeof(value) == 'number' && isNaN(value))) {
        logger.error(FUNC + "hashkey:", hashkey);
        logger.error(FUNC + "field:", field);
        logger.error(FUNC + "value:", value);
        throw new Error('value is invalid.');
    }

    if (typeof(hashkey) != 'string') {
        logger.error(FUNC + "typeof(hashkey):", typeof(hashkey));
        logInfo();
    }
    if (typeof(field) != 'number' && typeof(field) != 'string') {
        logger.error(FUNC + "typeof(field):", typeof(field));
        logInfo();
        throw new Error("field == ", field);
    }
    if (typeof(value) != 'number' && typeof(value) != 'string') {
        logger.error(FUNC + "typeof(value):", typeof(value));
        logInfo();
    }

    if (ArrayUtil.isArray(value)) {
        logger.error(FUNC + "输入是数组");
        logInfo();
    }

    if (!ArrayUtil.isArray(value) && !StringUtil.isString(value) && typeof(value) != 'number') {
        logger.error(FUNC + "输入是对象");
        logInfo();
    }

    if (isReadyAndConnected(cb)) {
        if (cb) {
            client.hset(hashkey, field, value, cb);
        }
        else {
            client.hset(hashkey, field, value);
        }
    }

    function logInfo() {
        logger.error(FUNC + "hashkey:", hashkey);
        logger.error(FUNC + "field:", field);
        logger.error(FUNC + "value:", value);
    }
}

/**
 * client.hmset(hashkey,field,value,field,value ….. callback) 哈希数据类型, 第一个参数为KEY名称,后面的参数为不固定参数,数据格式是 key,value ,key, value
 * Set Multi Value for Key.
 * client must be ready and connected.
 */
function hmset(hashkey, map, cb) {
    const FUNC = TAG + "hmset() --- ";
    if (isReadyAndConnected(cb)) {
        client.hmset(hashkey, map, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * client.hget(hashkey,field,callback) 获取hash数据中的某一个字段值
 * Set Hash Value from Key.
 * client must be ready and connected.
 */
function hget(hashkey, field, cb) {
    const FUNC = TAG + "hget() --- ";
    if (isReadyAndConnected(cb)) {
        client.hget(hashkey, field, cb);
    }
}

/**
 * 批量获取hmset设置的值
 * hashkey = "list2"
 * field_list = ["key1", "key2"]
 */
function hmget(hashkey, field_list, cb) {
    const FUNC = TAG + "hmget() --- ";
    if (isReadyAndConnected(cb)) {
        client.hmget(hashkey, field_list, cb);
    }
}

/**
 * 注意: 产品中不可使用
 * client.hgetall(hashkey,callback) 获取hash数据种所有的数据,包括字段与值
 * Get Multi Value from Key.
 * client must be ready and connected.
 * cb(err, res)
 */
function hgetall(hashkey, cb) {
    const FUNC = TAG + "hgetall() --- ";
    if (isReadyAndConnected(cb)) {
        client.hgetall(hashkey, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * client.lpush(key, value, callback) 队列操作, 左推进入队列
 * 示例:
 * lpush("alist", "1")
 * lpush("alist", "2")
 * lpush("alist", "3")
 * alist:["3","2","1"]
 */
function lpush(key, value, cb) {
    const FUNC = TAG + "lpush() --- ";
    if (isReadyAndConnected(cb)) {
        client.lpush(key, value, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * client.lrange(key, min, max, callback) 队列操作, 从左边开始获取队列的元素
 * 示例:
 * alist:["3","2","1"]
 * lrange("alist", 0, 1) = ["3","2"]
 * lrange("alist", 1, 2) = ["2","1"]
 */
function lrange(key, min, max, cb) {
    const FUNC = TAG + "lrange() --- ";
    if (isReadyAndConnected(cb)) {
        client.lrange(key, min, max, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * client.rpush(key, value, callback) 队列操作, 右推进入队列
 * 示例:
 * rpush("alist", "1")
 * rpush("alist", "2")
 * rpush("alist", "3")
 * alist:["1","2","3"]
 */
function rpush(key, value, cb) {
    const FUNC = TAG + "rpush() --- ";
    if (isReadyAndConnected(cb)) {
        client.rpush(key, value, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * Block Left Pop.
 * 阻塞式弹出队列数据, 从数据顶部(左侧)弹出,
 * 当 BLPOP 被调用时, 如果给定 key 内至少有一个非空列表，那么弹出遇到的第一个非空列表的头元素，
 * 并和被弹出元素所属的列表的名字一起，组成结果返回给调用者。
 * 当存在多个给定 key 时， BLPOP 按给定 key 参数排列的先后顺序，依次检查各个列表。
 */
function blpop(key, timeout, cb) {
    const FUNC = TAG + "blpop() --- ";
    if (isReadyAndConnected(cb)) {
        client.blpop(key, timeout, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * Block Right Pop.
 * 阻塞式弹出队列数据,从数据尾部(右侧)弹出,当给定多个 key 参数时，
 * 按参数 key 的先后顺序依次检查各个列表，弹出第一个非空列表的尾部元素。
 * 使用方法同 BLPOP一致,只是数据弹出的方式不一样
 */
function brpop(key, timeout, cb) {
    const FUNC = TAG + "brpop() --- ";
    if (isReadyAndConnected(cb)) {
        client.brpop(key, timeout, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 将一个或多个 member 元素加入到集合 key 当中，已经存在于集合的 member 元素将被忽略。
 * 假如 key 不存在，则创建一个只包含 member 元素作成员的集合。
 * 当 key 不是集合类型时，返回一个错误。
 */
function sadd(key, member, cb) {
    const FUNC = TAG + "sadd() --- ";
    if (isReadyAndConnected(cb)) {
        client.sadd(key, member, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 返回集合 key 的基数(集合中元素的数量)。
 */
function scard(key, cb) {
    const FUNC = TAG + "scard() --- ";
    if (isReadyAndConnected(cb)) {
        client.scard(key, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 移除并返回集合中的一个随机元素。
 * 如果只想获取一个随机元素，但不想该元素从集合中被移除的话，可以使用 SRANDMEMBER 命令。
 */
function spop(key, cb) {
    const FUNC = TAG + "spop() --- ";
    if (isReadyAndConnected(cb)) {
        client.spop(key, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 如果命令执行时，只提供了 key 参数，那么返回集合中的一个随机元素。
 */
function srandmember(key, cb) {
    const FUNC = TAG + "srandmember() --- ";
    if (isReadyAndConnected(cb)) {
        client.srandmember(key, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 添加一个或多个成员到有序集合，或者如果它已经存在更新其分数
 */
function zadd(key, score, member, cb) {
    const FUNC = TAG + "zadd() --- ";
    if (isReadyAndConnected(cb)) {
        client.zadd(key, score, member, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 批量添加成员到有序集合中.
 map = [
 score1, member1,
 score2, member2,
 ]
 */
function zaddbatch(key, map, cb) {
    const FUNC = TAG + "zaddbatch() --- ";
    if (isReadyAndConnected(cb)) {
        client.zadd(key, map, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 计算在有序集合中指定区间分数的成员数.
 */
function zcount(key, cb) {
    const FUNC = TAG + "zcount() --- ";
    if (isReadyAndConnected(cb)) {
        client.zcount(key, -Infinity, Infinity, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 获取有序集合的成员数
 */
function zcard(key, cb) {
    const FUNC = TAG + "zcard() --- ";
    if (isReadyAndConnected(cb)) {
        client.zcard(key, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 由索引返回一个成员范围的有序集合。
 * 升序
 */
function zrange(key, start, stop, cb) {
    const FUNC = TAG + "zrange() --- ";
    if (isReadyAndConnected(cb)) {
        client.zrange(key, start, stop, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 由索引返回一个成员范围的有序集合。
 * 升序带分数
 */
function zrangewithscores(key, start, stop, cb) {
    const FUNC = TAG + "zrangewithscores() --- ";
    if (isReadyAndConnected(cb)) {
        client.zrange(key, start, stop, 'withscores', function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 由索引返回一个成员范围的有序集合。
 * 降序
 */
function zrevrange(key, start, stop, cb) {
    const FUNC = TAG + "zrevrange() --- ";
    if (isReadyAndConnected(cb)) {
        client.zrevrange(key, start, stop, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 由索引返回一个成员范围的有序集合。
 * 降序带分数
 */
function zrevrangewithscores(key, start, stop, cb) {
    const FUNC = TAG + "zrevrangewithscores() --- ";
    if (isReadyAndConnected(cb)) {
        // const GAP = 1000;// 每次只取1000个玩家
        const GAP = 100;// 每次只取100个玩家
        let data = [];
        // 需要获取的排名玩家数量
        let count = stop - start;
        // 每次只取1000个玩家
        for (let i = start; i < count;) {
            let temp_stop = i + GAP - 1;
            let one_stop = temp_stop > count ? count : temp_stop;
            data.push(['zrevrange', key, i, one_stop, 'withscores']);
            i += GAP;
        }
        logger.info("data:\n", data);
        multi(data, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            let ret = [];
            logger.info("res:\n", res);
            for (let i = 0; i < res.length; i++) {
                if (res[i] && res[i].length > 0)
                    for (let j = 0; j < res[i].length; j++) {
                        ret.push(res[i][j]);
                    }
            }
            cb && cb(null, ret);
        });
        // client.zrevrange(key, start, stop, 'withscores', function(err, res) {
        //     if (!handleErr(FUNC, err, cb)) return;
        //     cb && cb(null, res);
        // });
    }
}

/**
 * 获取给定成员相关联的分数在一个有序集合。
 */
function zscore(key, member, cb) {
    const FUNC = TAG + "zscore() --- ";
    if (isReadyAndConnected(cb)) {
        client.zscore(key, member, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 确定成员的索引中有序集合。
 * 升序排名
 */
function zrank(key, member, cb) {
    const FUNC = TAG + "zrank() --- ";
    if (isReadyAndConnected(cb)) {
        client.zrank(key, member, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 确定成员的索引中有序集合。
 * 降序排名
 */
function zrevrank(key, member, cb) {
    const FUNC = TAG + "zrevrank() --- ";
    if (isReadyAndConnected(cb)) {
        client.zrevrank(key, member, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

function zrem(key, member, cb) {
    const FUNC = TAG + "zrem() --- ";
    if (isReadyAndConnected(cb)) {
        client.zrem(key, member, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * Redis Zremrangebyrank 命令用于移除有序集中，指定排名(rank)区间内的所有成员。
 * ZREMRANGEBYRANK salary 0 1       # 移除下标 0 至 1 区间内的成员
 *
 */
function zremrangebyrank(key, start, stop, cb) {
    const FUNC = TAG + "zremrangebyrank() --- ";
    if (isReadyAndConnected(cb)) {
        client.zremrangebyrank(key, start, stop, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * zremrangebyrank只能按升序移除, 需要自定义一个方法按降序移除
 *
 */
function zrevremrangebyrank(key, start, stop, cb) {
    const FUNC = TAG + "zrevremrangebyrank() --- ";
    if (isReadyAndConnected(cb)) {
        client.zcard(key, function (err, count) {
            if (!handleErr(FUNC, err, cb)) return;
            if (count <= start) {
                return cb && cb(null, 0);
            }
            else {
                stop = count - start - 1;
                start = 0;
                client.zremrangebyrank(key, start, stop, function (err, res) {
                    if (!handleErr(FUNC, err, cb)) return;
                    cb && cb(null, res);
                });
            }
        });
    }
}

function initRank(rank_name, score, member) {
    const FUNC = TAG + "initRank() --- ";
}

/**
 * 更新一个玩家member在排行榜rank_name上的分数.
 */
function updateRank(rank_name, platform, score, member) {
    const FUNC = TAG + "updateRank() --- ";
    if (!platform) {
        throw new Error('platform is invalid.');
    }
    zadd(rank_name + ":" + platform, score, member);
    hset(rank_name + ":timestamp", member, new Date().getTime());
}

/**
 * 获取排行榜rank_name的前面1000个玩家排行纪录.
 * 获取后缓存到服务器缓存中并进行时间排序, 每隔1秒执行一次
 */
function getRank(rank_name, platform, cb) {
    const FUNC = TAG + "getRank() --- ";
    zrevrangewithscores(rank_name + ":" + platform, 0, 9999, cb);
}


function getRankEx(rank_name, platform, start, stop, cb) {
    const FUNC = TAG + "getRank() --- ";
    zrevrangewithscores(rank_name + ":" + platform, start, stop, cb);
}

/**
 * ltrim命令，对一个列表进行修剪
 */
function ltrim(key, start, end, cb) {
    const FUNC = TAG + "ltrim() --- ";
    if (isReadyAndConnected(cb)) {
        client.ltrim(key, start, end, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 删除一个键.
 */
function del(key, cb) {
    const FUNC = TAG + "del() --- ";
    if (isReadyAndConnected(cb)) {
        client.del(key, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 删除一个键.
 */
function hdel(key, field, cb) {
    const FUNC = TAG + "hdel() --- ";
    if (isReadyAndConnected(cb)) {
        client.hdel(key, field, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/** multi() 多个语句查询
 * // command, hashkey, params
 * // hmget, hashkey, [uid1, uid2,...]
 let data = [
 ['hmget', PAIR.UID_NAME, ids],
 ['hmget', PAIR.UID_RANK, ids],
 ['hmget', PAIR.UID_VIP, ids],
 ]
 */
function multi(data, cb) {
    const FUNC = TAG + "multi() --- ";
    for (let i = 0; i < data.length; i++) {
        if ('hset' == data[i][0]) {
            let val = data[i][3];
            if ('number' != typeof(val) && 'string' != typeof(val)) {
                if (Object == val.constructor || Array == val.constructor) {
                    data[i][3] = JSON.stringify(val);
                }
                if (Date == val.constructor) {
                    data[i][3] = new Date(val).getTime();
                }

                // throw new Error('请在multi调用时检查数据格式.');
            }
        }
    }
    if (isReadyAndConnected(cb)) {
        client.multi(data).exec(function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(err, res);
        });
    }
}


//==============================================================================
// private
//==============================================================================

function isReadyAndConnected(cb) {
    if (isReady && isConnect) {
        return 1;
    }
    else {
        cb && cb(new Error("Redis is not ready!"));
        return 0;
    }
}

function handleErr(FUNC, err, cb) {
    if (err) {
        logger.error(FUNC + "err:", err);
        cb && cb(err);
        return 0;
    }
    return 1;
}

/**
 * 设置过期时间expire
 */
function expire(key, time, cb) {
    const FUNC = TAG + "expire() --- ";
    if (isReadyAndConnected(cb)) {
        client.expire(key, time, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 设置过期时间expireP
 */
function expireP(key, time) {
    const FUNC = TAG + "expireP() --- ";
    return new Promise(function(resolve, reject) {
        expire(key, time, function(err, res) {
            if (err) {
                reject(err);
            }
            else {
                resolve(res);
            }
        });
    });
}


/**
 * sismember() 查看member是否在集合key中
 */
function sismember(key, member, cb) {
    const FUNC = TAG + "sismember() --- ";
    if (isReadyAndConnected(cb)) {
        client.sismember(key, member, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * smembers() 返回一个集合中的所有元素
 */
function smembers(key, cb) {
    const FUNC = TAG + "smembers() --- ";
    if (isReadyAndConnected(cb)) {
        client.smembers(key, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * lrem(key,count,value,cb) 从存于 key 的列表里移除前 count 次出现的值为 value 的元素。 这个 count 参数通过下面几种方式影响这个操作：
 * count > 0: 从头往尾移除值为 value 的元素。
 * count < 0: 从尾往头移除值为 value 的元素。
 * count = 0: 移除所有值为 value 的元素。
 * 比如， LREM list -2 “hello” 会从存于 list 的列表里移除最后两个出现的 “hello”。
 * 需要注意的是，如果list里没有存在key就会被当作空list处理，所以当 key 不存在的时候，这个命令会返回 0。
 */
function lrem(key, count, value, cb) {
    const FUNC = TAG + "lrem() --- ";
    if (isReadyAndConnected(cb)) {
        client.lrem(key, count, value, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * ZRANGEBYSCORE zrangebyscore 通过score区间返回member
 * @param key
 * @param count
 * @param value
 * @param cb
 * @constructor
 */
function zrangebyscore(key, min, max, cb) {
    const FUNC = TAG + "zrangebyscore() --- ";
    if (isReadyAndConnected(cb)) {
        client.zrangebyscore(key, min, max, function (err, res) {
            if (!handleErr(FUNC, err, cb)) return;
            cb && cb(null, res);
        });
    }
}

/**
 * 递归优化函数
 */
function tco(f) {
    let value;
    let active = false;
    let accumulated = [];
    return function accumulator() {
        accumulated.push(arguments);
        if (!active) {
            active = true;
            while (accumulated.length) {
                value = f.apply(this, accumulated.shift());
            }
            active = false;
            return value;
        }
    };
}