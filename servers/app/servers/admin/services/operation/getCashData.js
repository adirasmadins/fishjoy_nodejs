const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取玩家提现统计数据
 * @param {*} data {start:1, length:20} 
 */
exports.get = async function (data, ctx) {
    // logger.info('data:', data);

    try {
        let start = (+data.start - 1) * +data.length;
        let length = +data.length;

        let oriData = await fetchData(start, length);
        let chart = await makeChart(oriData);
        return {
            rows: 100,
            pages: 5,
            chart: chart
        };
    }
    catch (err) {
        logger.error('err:', err);
        return {
            result: false,
            err: err
        };
    }
};

async function fetchData(start, length) {
    let ret = [];

    let targetStartDate = tools.DateUtil.getDateBefore(start);

    logger.error('start:', start);
    logger.error('targetStartDate:', targetStartDate);

    let dateList = tools.DateUtil.getDateListFrom(targetStartDate, length, 'decr');
    // logger.error('dateList:\n', dateList);
    // logger.error('length:\n', dateList.length);
    let startDate = dateList[dateList.length - 1];
    let endDate = dateList[0];
    logger.error('startDate:\n', startDate);
    logger.error('endDate:\n', endDate);
    ret = await tools.SqlUtil.query(SQL_CONFIG.getDailyDataDesc, [startDate, endDate]);

    return ret;
}

async function makeChart(oriData) {
    let chart = [];

    for (let i = 0; i < oriData.length; i++) {
        let dayData = oriData[i];
        let date = tools.DateUtil.format(dayData.log_date, tools.DateUtil.FMT.D);
        chart.push({
            date: date,
            cashCount: dayData.cash_count,
            cashAccount: dayData.cash_account,
            cashVndSum: dayData.cash_vnd_sum,
            cashVndAvg: dayData.cash_vnd_avg,
        });
    }

    return chart;
}