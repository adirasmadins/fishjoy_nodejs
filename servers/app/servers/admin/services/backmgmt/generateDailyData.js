const tools = require('../../../../utils/tools');
const DailyTask = require('../../services/task/DailyTask');

exports.get = async function (data, ctx) {
    logger.error('data:', data);
    try {
        await generate(data.startDate, data.endDate);
        return {
            result: true,
        };
    } catch (err) {
        logger.error(`[Error] err:`, err);
        return {
            result: false,
            err: err,
        };
    }
};

async function generate(startDate, endDate) {
    let dateList = tools.DateUtil.getDateList(startDate, endDate, tools.DateUtil.FMT.D);
    logger.error(`dateList:`, dateList);
    for(let i = 0; i < dateList.length; i++) {
        let logDate = dateList[i];
        await DailyTask.sumUpSomeDay(logDate, 5, true);
    }
}
