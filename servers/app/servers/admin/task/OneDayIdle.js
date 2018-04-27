const Task = require('../../../utils/task/task');
const async = require('async');
const utils = require('../../../utils/utils');
const DailyTask = require('../services/task/DailyTask');

/**
 * 不及时数据更新
 */
class OneDayIdleTask extends Task {
    constructor(conf) {
        super(conf);
    }

    async _exeTask(cb) {
        const TAG = '统计每日最大并发数';
        logger.error(`${TAG}开始执行`);

        await DailyTask.getMaxOnlineLastDay();

        logger.info(`${TAG}执行完成`);
        utils.invokeCallback(cb, null);

    }
}

module.exports = OneDayIdleTask;