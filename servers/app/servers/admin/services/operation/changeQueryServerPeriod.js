const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;

const MAP = {
    extractExpect: REDISKEY.PLATFORM_DATA.EXPECT_EXTRACT,
    durationExpect: REDISKEY.PLATFORM_DATA.TOTAL_CYCLE,
    giveCatchRateExpect: REDISKEY.PLATFORM_DATA.ADD_BUFF_RATE,
    giveDurationExpect: REDISKEY.PLATFORM_DATA.ADD_CYCLE,
    gainCatchRateExpect: REDISKEY.PLATFORM_DATA.EAT_BUFF_RATE,
    gainDurationExpect: REDISKEY.PLATFORM_DATA.EAT_CYCLE
};

/**
 * 获取玩家提现统计数据
 * @param {*} data {uid:100} 
 */
exports.get = async function (data, ctx) {
    console.log('data:', data);
    try {
        let ret = await changeData(data.key, data.value);
        console.log('ret:', ret);

        return {
            result: true,
        };
    }
    catch (err) {
        logger.error(err);
        return {
            result: false,
            err: err
        };
    }
};

async function changeData(key, value) {
    await tools.RedisUtil.set(MAP[key], value);
}
