const Task = require('../../../utils/task/task');
const async = require('async');
const utils = require('../../../utils/utils');
const DailyTask = require('../services/task/DailyTask');

/**
 * 用户数据重置
 */
class OneDayTask extends Task {
    constructor(conf) {
        super(conf);
    }

    async _exeTask(cb) {
        logger.info('统计每日数据开始执行');

        // 每天数据统计
        // 下面是测试代码, 需要提供一个后台功能手动生成历史的统计数据
        // await DailyTask.sumUpSomeDay('2018-02-01', 5, true);
        await DailyTask.sumUpLastDay();
        logger.info('统计每日数据执行完成');
        utils.invokeCallback(cb, null);

    }
}

module.exports = OneDayTask;