const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取付费数据接口需要的返回值
 * @param {*} data {startDate:'YYYY-MM-DD', endDate:'YYYY-MM-DD'} 
 */
exports.get = async function (data, ctx) {
    // logger.info('data:', data);
    let chart = makeChart(await fetchData(data.startDate, data.endDate));
    let cashTotal = (await tools.SqlUtil.query(SQL_CONFIG.getCashSumAll, []))[0].sum;
    let rechargeTotal = (await tools.SqlUtil.query(SQL_CONFIG.getRechargeAll, []))[0].sum;

    if (tools.BuzzUtil.isVersionVietnam()) {
        cashTotal /= 3.75;
    }
    else if (tools.BuzzUtil.isVersionChina()) {
        cashTotal /= 100;
    }

    if (tools.BuzzUtil.isVersionChina()) {
        rechargeTotal /= 10;
    }

    return {
        sum: {
            rechargeTotal: rechargeTotal,
            cashTotal: cashTotal,
            profitTotal: 40000,
            profitHistory: 40000000,
        },
        chart: chart
    };
};

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
function makeChart(list) {
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let dailyData = list[i];
        let time = tools.DateUtil.format(dailyData.log_date, tools.DateUtil.FMT.D);
        let topupSum = dailyData.shop_tpa;
        if (tools.BuzzUtil.isVersionChina()) {
            // 中文版除以100获得元为单位
            topupSum /= 100;
        }
        let cashSum = dailyData.cash_vnd_sum;
        let shop_pta = dailyData.shop_pta;
        shop_pta = tools.MathUtil.makePercent(shop_pta, 2);
        ret.push({
            time: time,
            activeAccount: dailyData.active_count,
            newAccount: dailyData.new_account,
            newPayer: dailyData.shop_pafft,
            topupTime: dailyData.shop_time_count,
            topupPeople: dailyData.shop_account_count,
            topupSum: topupSum,
            cashSum: cashSum,
            payRate: shop_pta,
            ARPU: dailyData.shop_arpu,
            ARPPU: dailyData.shop_arrpu
        });
    }
    return ret;
}

/**
 * 获取指定日期的数据.
 * @param {*} date 指定的日期, 格式为YYYY-MM-DD
 */
async function fetchData(startDate, endDate) {
    return await tools.SqlUtil.query(SQL_CONFIG.getDailyData, tools.ObjUtil.makeSqlDataFromTo(startDate, endDate));
}
