const moment = require('moment');
const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;
const SERVER_PERIOD = require('../../../../consts/constDef').SERVER_PERIOD;

/**
 * 获取服务器周期数据
 * @param {*} data
 */
exports.get = async function (data, ctx) {
    console.log('data:', data);
    try {
        let ret = await fetchData();
        console.log('ret:', ret);

        return ret;
    }
    catch (err) {
        logger.error(err);
        return {
            result: false,
            err: err
        };
    }
};

async function fetchData() {
    let pumpInfo = await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.PUMPWATER);
    console.log('pumpInfo:', pumpInfo);
    pumpInfo = JSON.parse(pumpInfo);

    let cfgs = tools.CfgUtil.common.getMathAdjustConsts();

    let extractExpect = await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.EXPECT_EXTRACT) || cfgs.extract;
    let durationExpect = await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.TOTAL_CYCLE) || cfgs.time1;
    let giveCatchRateExpect = await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.ADD_BUFF_RATE) || cfgs.addvalue;
    let giveDurationExpect = await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.ADD_CYCLE) || cfgs.time2;
    let gainCatchRateExpect = await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.EAT_BUFF_RATE) || cfgs.reducevalue;
    let gainDurationExpect = await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.EAT_CYCLE) || cfgs.time3;

    startTime = tools.DateUtil.format(pumpInfo.start_time, tools.DateUtil.FMT.DT);
    return {
        currentPeriod: getPeriodName(pumpInfo.server_period),
        startTime: startTime,
        duration: pumpInfo.duration / 1000,//本次周期持续时长(存储的是毫秒，替换为秒)
        catchRate: pumpInfo.pumpWater,
        extractRecentDay: pumpInfo.extract,
        extractExpect: extractExpect,
        durationExpect: durationExpect,//总周期期望时长
        giveCatchRateExpect: giveCatchRateExpect,
        giveDurationExpect: giveDurationExpect,
        gainCatchRateExpect: gainCatchRateExpect,
        gainDurationExpect: gainDurationExpect
    };
}

// TODO: 多语言设置
function getPeriodName(period) {
    switch (period) {
        case SERVER_PERIOD.GENERAL:
            {
                return '正常周期';
            }
        case SERVER_PERIOD.EATE_SCORE:
            {
                return '吃分周期';
            }
        case SERVER_PERIOD.OUT_SCORE:
            {
                return '出分周期';
            }
    }
}