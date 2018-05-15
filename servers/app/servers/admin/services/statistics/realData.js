const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取实时数据接口需要的返回值
 * @param {*} data {date:'YYYY-MM-DD'} 
 */
exports.get = async function (data, ctx) {
    // logger.error('data:', data);
    let daily = await getDailyData();
    let chart = makeChart(await fetchOneDayData(data.date));

    return {
        daily: daily,
        chart: chart
    };
};

/**
 * 获取统计信息(今日, 历史最高, 历史平均)
 */
async function getDailyData() {
    let dateToday = tools.DateUtil.format(new Date(), tools.DateUtil.FMT.D);
    let todayDataList = await fetchOneDayData(dateToday);
    let newAccount = 0;
    let fields = tools.ObjUtil.makeSqlDataFromTo(dateToday, dateToday);
    let activeAccount = (await tools.SqlUtil.query(SQL_CONFIG.getLoginAccount, fields))[0].sum;
    for (let i = 0; i < todayDataList.length; i++) {
        let hourData = todayDataList[i];
        newAccount += hourData.new_account;
        // BUG: 这样算出来的不是对玩家数的统计，而是对每小时玩家登录操作的求和
        // activeAccount += hourData.account_count;
    }
    let newAccountMax = (await tools.SqlUtil.query(SQL_CONFIG.newAccountMax, []))[0].newAccountMax;
    let activeAccountMax = (await tools.SqlUtil.query(SQL_CONFIG.activeAccountMax, []))[0].activeAccountMax;
    let newAccountAvg = (await tools.SqlUtil.query(SQL_CONFIG.newAccountAvg, []))[0].newAccountAvg;
    let activeAccountAvg = (await tools.SqlUtil.query(SQL_CONFIG.activeAccountAvg, []))[0].activeAccountAvg;
    return {
        newAccount: newAccount,
        activeAccount: activeAccount,
        newAccountMax: newAccountMax,
        activeAccountMax: activeAccountMax,
        newAccountAvg: newAccountAvg,
        activeAccountAvg: activeAccountAvg,
    };
}

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
function makeChart(list) {
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let hourData = list[i];
        let timeStart = tools.DateUtil.format(hourData.created_at, 'HH:00');
        let timeEnd = tools.DateUtil.format(hourData.created_at, 'HH:59');
        let time = `${timeStart}~${timeEnd}`;
        ret.push({
            time: time,
            "0~10": hourData.o1 || 0,
            "11~20": hourData.o2 || 0,
            "21~30": hourData.o3 || 0,
            "31~40": hourData.o4 || 0,
            "41~50": hourData.o5 || 0,
            "51~60": hourData.o6 || 0,
            activeDevice: hourData.activeDevice || 0,
            activeAccount: hourData.account_count || 0,
            newDevice: hourData.newDevice || 0,
            newAccount: hourData.new_account || 0,
        });
    }
    return ret;
}

/**
 * 获取指定日期的数据.
 * @param {*} date 指定的日期, 格式为YYYY-MM-DD
 */
async function fetchOneDayData(date) {
    return await tools.SqlUtil.query(SQL_CONFIG.realData, tools.ObjUtil.makeSqlDataFromTo(date, date));
}
