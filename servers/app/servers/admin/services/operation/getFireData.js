const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取玩家开火数据
 * @param {*} data {date:'2018-03-20'} 
 */
exports.get = async function (data, ctx) {
    console.log('data:', data);

    try {
        let hours = tools.DateUtil.make24Hour(data.date);
        let oriData = await fetchData(data.date, hours);
        let ret = await makeChart(oriData);
        return ret;
    }
    catch (err) {
        logger.error('err:', err);
        return {
            result: false,
            err: err
        };
    }
};

async function fetchData(date, hours) {
    let ret = [];
    let dateTargetTable = tools.DateUtil.format(new Date(date), tools.DateUtil.FMT.DB);
    let dateTodayTable = tools.DateUtil.format(new Date(), tools.DateUtil.FMT.DB);
    // TODO: 需要将每小时的数据进行即时统计, 只有当前这个小时的数据才进行实时查询
    if (dateTargetTable == dateTodayTable) {
        // TODO: 今日数据查询
    }
    else {
        ret = await tools.SqlUtil.query(SQL_CONFIG.getGoldDataHistory, tools.ObjUtil.makeSqlDataFromTo(date, date));
    }
    return ret;
}

async function makeChart(oriData) {
    let chart = [];
    let dayGain = 0;
    let dayCost = 0;
    for (let i = 0; i < oriData.length; i++) {
        let hourData = oriData[i];

        // TODO: 需要确认每日盈亏需要计算的字段
        // let hourGain = hourData.totalGain;
        // let hourCost = hourData.totalCost;
        let hourGain = hourData.fishingWin + hourData.nuclearGain + hourData.goldenFish;//TODO:需要加上激光所得
        let hourCost = hourData.fishingCost + hourData.buyNuclear;

        let hourProfit = hourGain - hourCost;
        let hourProfitRate = hourProfit / tools.MathUtil.getDenominator(hourCost);
        hourProfitRate = tools.MathUtil.makePercent(hourProfitRate, 2);
        chart.push({
            time: tools.DateUtil.getHourRange(hourData.time),
            fire: hourData.fire,
            gain: hourGain,
            cost: hourCost,
            profitRate: hourProfitRate
        });
        dayGain += hourGain;
        dayCost += hourCost;
    }
    let dayProfit = dayGain - dayCost;
    let dayProfitRate = dayProfit / tools.MathUtil.getDenominator(dayCost);
    dayProfitRate = tools.MathUtil.makePercent(dayProfitRate, 2);

    let historyProfitRate = 0;
    let gainCost = await tools.SqlUtil.query(SQL_CONFIG.getGoldGainCostAll, []);
    if (gainCost && gainCost.length > 0) {
        let info = gainCost[0];
        let historyProfit = info.gain - info.cost;
        historyProfitRate = historyProfit / tools.MathUtil.getDenominator(info.cost);
        historyProfitRate = tools.MathUtil.makePercent(historyProfitRate, 2);
    }

    return {
        profitRateToday: dayProfitRate,
        profitRateHistory: historyProfitRate,
        chart: chart
    };
}
