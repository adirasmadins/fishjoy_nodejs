const Task = require('../../../utils/task/task');
const async = require('async');
const utils = require('../../../utils/utils');
const tools = require('../../../utils/tools');
const REDISKEY = require('../../../database/consts').REDISKEY;

/**
 * 用户数据重置
 */
class OnlineTask extends Task {
    constructor(conf) {
        super(conf);
    }

    async _exeTask(cb) {
        logger.info('统计10分钟在线人数开始执行');

        let count = await tools.RedisUtil.scard(REDISKEY.ONLINE_UID_10_MINUTES);
        let beforeFiveMinutes = tools.DateUtil.getTimeBefoe(new Date(), 1000 * 60 * 5);
        let idx = tools.DateUtil.getIdxOfHour(beforeFiveMinutes);
        await tools.RedisUtil.hset(REDISKEY.PAIR_IDX_ONLINE_COUNT, idx, count);
        tools.RedisUtil.del(REDISKEY.ONLINE_UID_10_MINUTES);
        logger.info(`上一个10分钟(idx=${idx})在线人数为${count}`);

        logger.info('统计10分钟在线人数执行完成');
        utils.invokeCallback(cb, null);
    }
}

module.exports = OnlineTask;