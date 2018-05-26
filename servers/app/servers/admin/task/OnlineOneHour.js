const Task = require('../../../utils/task/task');
const async = require('async');
const utils = require('../../../utils/utils');
const tools = require('../../../utils/tools');
const REDISKEY = require('../../../models/index').REDISKEY;
const HourTask = require('../services/task/HourTask');

/**
 * 用户数据重置
 */
class OnlineOneHourTask extends Task {
    constructor(conf) {
        super(conf);
    }

    async _exeTask(cb) {
        logger.info('统计1小时在线人数开始执行');

        // TODO: 每小时数据统计
        setTimeout(async function() {
            await HourTask.sumUpLastHour();
            logger.info('统计1小时在线人数执行完成');
            utils.invokeCallback(cb, null);
        }.bind(this), 5000);

    }
}

module.exports = OnlineOneHourTask;