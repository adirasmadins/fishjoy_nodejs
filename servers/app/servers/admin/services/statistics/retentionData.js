const SQL_CONFIG = require('../../configs/sql');
const REDISKEY = require('../../../../models/index').REDISKEY;
const tools = require('../../../../utils/tools');

/**
 * 获取留存数据接口需要的返回值
 * @param {*} data {startDate:'YYYY-MM-DD', endDate:'YYYY-MM-DD'} 
 */
exports.get = async function (data, ctx) {
    // console.log('data:', data);
    let chart = await makeChart(await fetchData(data.startDate, data.endDate));

    return chart;
};

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
async function makeChart(list) {
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let dailyData = list[i];
        let date = tools.DateUtil.format(dailyData.log_date, tools.DateUtil.FMT.D);
        let r2 = tools.MathUtil.makePercent(dailyData.drr, 2);
        let r3 = tools.MathUtil.makePercent(dailyData.r3, 2);
        let r7 = tools.MathUtil.makePercent(dailyData.wrr, 2);
        let r14 = tools.MathUtil.makePercent(dailyData.r14, 2);
        let r30 = tools.MathUtil.makePercent(dailyData.mrr, 2);
        let fightServerPlayerCountMax = await getRealMax(`${REDISKEY.REALTIME_FIGHT_SERVER_PLAYER_COUNT}:max`, date);
        let fightServerPlayerCountAvg = await getRealAvg(`${REDISKEY.REALTIME_FIGHT_SERVER_PLAYER_COUNT}:avg`, date);
        let rankMatchPlayerCountMax = await getRealMax(`${REDISKEY.REALTIME_RANK_MATCH_PLAYER_COUNT}:max`, date);
        let rankMatchPlayerCountAvg = await getRealAvg(`${REDISKEY.REALTIME_RANK_MATCH_PLAYER_COUNT}:avg`, date);
        ret.push({
            time: date,
            avgHourOnline: dailyData.avgHourOnline,
            maxHourOnline: dailyData.maxHourOnline,
            fightServerPlayerCountMax: fightServerPlayerCountMax,
            fightServerPlayerCountAvg: fightServerPlayerCountAvg,
            rankMatchPlayerCountMax: rankMatchPlayerCountMax,
            rankMatchPlayerCountAvg: rankMatchPlayerCountAvg,
            activeAccount: dailyData.active_count,
            newAccount: dailyData.new_account,
            retention1: r2,
            retention3: r3,
            retention7: r7,
            retention14: r14,
            retention30: r30,
        });
    }
    return ret;
}

async function getRealMax(key, date) {
    let ret = await tools.RedisUtil.hget(key, date);
    if (ret) {
        ret = JSON.parse(ret);
        return ret.value;
    }
    return 0;
}

async function getRealAvg(key, date) {
    let ret = await tools.RedisUtil.hget(key, date);
    if (ret) {
        return Math.round(+ret);
    }
    return 0;
}

/**
 * 获取指定日期的数据.
 * @param {*} date 指定的日期, 格式为YYYY-MM-DD
 */
async function fetchData(startDate, endDate) {
    return await tools.SqlUtil.query(SQL_CONFIG.getDailyData, tools.ObjUtil.makeSqlDataFromTo(startDate, endDate));
}
