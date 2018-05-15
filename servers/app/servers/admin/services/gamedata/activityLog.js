const tools = require('../../../../utils/tools');
const queryLog = require('./common/queryLog');

/**
 * 获取留存数据接口需要的返回值
 * @param {*} data {startDate:'YYYY-MM-DD', endDate:'YYYY-MM-DD', start:1, length:100, uid:[1,2,3]} 
 */
exports.get = async function (data, ctx) {
    // logger.error('data:', data);
    try {

        data.bak_table = 'tbl_activity_log';
        let rawData = await queryLog.get(data, ctx);
        let chart = makeChart(rawData.chart);
        // chart = await queryLog.queryAccountTopupAndCash(chart);

        return {
            rows: rawData.rows,
            pages: rawData.pages,
            chart: chart
        };
    } catch (err) {
        logger.error(`[Error] err:`, err);
        return {
            result: false,
            err: err,
        };
    }
};

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
function makeChart(list) {
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let activityData = list[i];
        let time = tools.DateUtil.format(activityData.log_at, tools.DateUtil.FMT.DT);
        ret.push({
            time: time,
            id: activityData.id,
            uid: activityData.account_id,
            nickname: 'TODO',
            itemId: activityData.itemId,
            itemNum: activityData.itemNum,
            itemTotal: activityData.itemTotal,
            activityName: activityData.activityName,
            missionId: activityData.missionId
        });
    }
    return ret;
}