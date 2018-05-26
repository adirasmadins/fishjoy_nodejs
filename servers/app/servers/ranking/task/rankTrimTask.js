const Task = require('../../../utils/task/task');
const RANK_TRIM = require('../src/consts').RANK_TRIM;
const async = require('async');
const REDISKEY = require('../../../models/index').REDISKEY;

class RankTrimTask extends Task {
    constructor(conf) {
        super(conf);
    }

    async _exeTask(cb) {
        logger.info('排行榜剪切开始');
        let tasks = this.taskConf.subTask;
        try {
            for (let i in tasks) {
                let task = tasks[i];
                let key = task.redisKey;
                let limit = task.limit;
                let position = task.position;
                if (RANK_TRIM.BOTTOM == position) {
                    for (let platform of Object.values(REDISKEY.PLATFORM_TYPE)) {
                        await redisConnector.zremrangebyrank(`${key}:${platform}`, limit, -1);
                    }
                    cb();
                }
                else {
                    for (let platform of Object.values(REDISKEY.PLATFORM_TYPE)) {
                        let count = await redisConnector.zcard(`${key}:${platform}`);
                        logger.info('COUNT:', count);
                        if (count > limit) {
                            await redisConnector.zremrangebyrank(`${key}:${platform}`, 0, count - limit - 1);
                        }
                    }
                    cb();
                }
            }
            logger.info('排行榜剪切结束');
        }
        catch (err) {
            logger.error(`${this.taskId}执行_trim异常`, err);
            cb();
        }
    }
}

module.exports = RankTrimTask;