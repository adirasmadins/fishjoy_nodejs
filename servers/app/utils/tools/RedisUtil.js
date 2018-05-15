exports.multi = multi;
exports.set = set;
exports.get = get;
exports.hset = hset;
exports.hget = hget;
exports.hdel = hdel;
exports.del = del;
exports.hgetall = hgetall;
exports.hincrby = hincrby;
exports.zrevrange = zrevrange;
exports.zrevrangewithscores = zrevrangewithscores;
exports.zrangewithscores = zrangewithscores;
exports.zcard = zcard;
exports.expire = expire;
exports.sadd = sadd;
exports.srem = srem;
exports.scard = scard;
exports.smembers = smembers;
exports.setbit = setbit;
exports.getbit = getbit;
exports.bitop = bitop;
exports.bitcount = bitcount;

/**
 * hash表中field键对应的值自增num.
 * @param {*} hashkey
 * @param {*} field 
 * @param {*} num 增加的数量
 */
function hincrby(hashkey, field, num) { 
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.hincrby(hashkey, field, num, function (err, res) {
            if (err) {
                logger.error('[ERROR] hincrby() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * 查找key值为bit的bit位为1的个数
 * @param {*} key
 */
function bitcount(key) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.bitcount(key, function (err, res) {
            if (err) {
                logger.error('[ERROR] bitcount() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * 操作BIT位
 * @param {*} operation AND, OR, NOT, XOR
 * @param {*} destkey 结果保存到 destkey
 * @param {*} key1 
 * @param {*} key2 
 */
function bitop(operation, destkey, key1, key2) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.bitop(operation, destkey, key1, key2, function (err, res) {
            if (err) {
                logger.error('[ERROR] bitop() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * 获取BIT位
 * @param {*} key 
 * @param {*} offset 
 */
function getbit(key, offset) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.getbit(key, offset, function (err, res) {
            if (err) {
                logger.error('[ERROR] getbit() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * 设置BIT位
 * @param {*} key 
 * @param {*} offset 
 * @param {*} value 
 */
function setbit(key, offset, value) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.setbit(key, offset, value, function (err, res) {
            if (err) {
                logger.error('[ERROR] setbit() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * 获取集合中元素的个数
 * @param {*} key 
 */
function scard(key) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.scard(key, function (err, res) {
            if (err) {
                logger.error('[ERROR] scard() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * 获取集合中所有元素列表
 * @param {*} key 
 */
function smembers(key) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.smembers(key, function (err, res) {
            if (err) {
                logger.error('[ERROR] scard() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * set add(集合中加入新的元素).
 * @param {*} key 
 * @param {*} member 
 */
function sadd(key, member) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.sadd(key, member, function (err, res) {
            if (err) {
                logger.error('[ERROR] sadd() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * set remove(集合中移除元素).
 * @param {*} key 
 * @param {*} member 
 */
function srem(key, member) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.srem(key, member, function (err, res) {
            if (err) {
                logger.error('[ERROR] srem() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}


/**
 * 设置key过期.
 * @param {*} key 
 */
function expire(key, time) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.expire(key, time, function (err, res) {
            if (err) {
                logger.error('[ERROR] expire() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}


/**
 * 获取有序集合中元素的个数.
 * @param {*} key 
 */
function zcard(key) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.zcard(key, function (err, res) {
            if (err) {
                logger.error('[ERROR] zcard() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}


/**
 * 
 * @param {*} key 
 * @param {*} start 
 * @param {*} end 
 */
function zrevrange(key, start, end) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.zrevrange(key, start, end, function (err, res) {
            if (err) {
                logger.error('[ERROR] zrevrange() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}


/**
 * 
 * @param {*} key 
 * @param {*} start 
 * @param {*} end 
 */
async function zrevrangewithscores(key, start, end) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.zrevrange(key, start, end, 'withscores', function (err, res) {
            if (err) {
                logger.error('[ERROR] zrevrangewithscores() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}


/**
 * 
 * @param {*} key 
 * @param {*} start 
 * @param {*} end 
 */
async function zrangewithscores(key, start, end) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.zrange(key, start, end, 'withscores', function (err, res) {
            if (err) {
                logger.error('[ERROR] zrangewithscores() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * 
 * @param {*} hashkey 
 * @param {*} field 
 * @param {*} num 
 */
function hincrby(hashkey, field, num) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.hincrby(hashkey, field, num, function (err, res) {
            if (err) {
                logger.error('[ERROR] hincrby() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}


/**
 * Redis执行批量处理(Promise包装)
 * @param {Array} data 
 */
function multi(data) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.multi(data).exec(function (err, res) {
            if (err) {
                logger.error('[ERROR] multi() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * Redis执行get(Promise包装)
 * @param {String} key 
 */
function set(key, field) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.set(key, field, function (err, res) {
            if (err) {
                logger.error('[ERROR] set() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * Redis执行get(Promise包装)
 * @param {String} key 
 */
function get(key) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.get(key, function (err, res) {
            if (err) {
                logger.error('[ERROR] get() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * Redis执行hget(Promise包装)
 * @param {String} hashkey 
 */
function hget(hashkey, field) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.hget(hashkey, field, function (err, res) {
            if (err) {
                logger.error('[ERROR] hget() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * 删除一个键
 * @param {*} hashkey 
 * @param {*} field 
 */
function del(key) {
    redisConnector.cmd.del(key, function (err, res) {
        if (err) {
            logger.error('[ERROR] del() err:\n', err);
        }
    });
}

/**
 * 删除Hash表中的一个键
 * @param {*} hashkey 
 * @param {*} field 
 */
function hdel(hashkey, field) {
    redisConnector.cmd.hdel(hashkey, field, function (err, res) {
        if (err) {
            logger.error('[ERROR] hdel() err:\n', err);
        }
    });
}

/**
 * Redis执行hgetall(Promise包装)
 * @param {String} hashkey 
 */
function hgetall(hashkey) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.hgetall(hashkey, function (err, res) {
            if (err) {
                logger.error('[ERROR] hgetall() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

/**
 * Redis执行hset(Promise包装)
 * @param {String} hashkey 
 */
function hset(hashkey, field, value) {
    return new Promise(function (resolve, reject) {
        redisConnector.cmd.hset(hashkey, field, value, function (err, res) {
            if (err) {
                logger.error('[ERROR] hset() err:\n', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}