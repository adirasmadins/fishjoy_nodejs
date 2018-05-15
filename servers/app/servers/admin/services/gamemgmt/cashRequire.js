const SQL_CONFIG = require('../../configs/sql');
const CASH_CONFIG = require('../../configs/cashControl');
const tools = require('../../../../utils/tools');

/**
 * 改变提现限制参数
 * @param {*} data { key: '101', value: '6'} 
 */
exports.get = async function (data, ctx) {
    logger.error('data:', data);

    try {
        await change(data.key, data.value);
        return {
            result: true
        };
    }
    catch(err) {
        logger.error('err:', err);
        return {
            result: false
        };
    }

};

async function change(key, value) {
    let redisKey = getRedisKey(key);
    if (redisKey) {
        await tools.RedisUtil.set(redisKey, value);
    }
    else {
        throw new Error(`错误的key:${key}, 无法查找到Redis对应的键`);
    }
}

function getRedisKey(key) {
    for (let i = 0; i < CASH_CONFIG.length; i++) {
        if (key == CASH_CONFIG[i].key) {
            return CASH_CONFIG[i].redis;
        }
    }
    return null;
}

