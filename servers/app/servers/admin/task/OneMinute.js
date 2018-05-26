const Task = require('../../../utils/task/task');
const async = require('async');
const utils = require('../../../utils/utils');
const tools = require('../../../utils/tools');
const REDISKEY = require('../../../models/index').REDISKEY;

const RealTimeHandler = require('../services/operation/getSceneCatchRateList');
const RealTime = require('../configs/consts/RealTime');
const DailyTask = require('../services/task/DailyTask');
const addBroadcast = require('../services/gamemgmt/addBroadcast');
let count = 0;

/**
 * 每分钟任务
 * 1.获取并发数
 */
class OneMinuteTask extends Task {
    constructor(conf) {
        super(conf);
    }

    async _exeTask(cb) {
        const TAG = '获取并发数';
        logger.info(`${TAG}开始执行`);

        let ret = await RealTimeHandler.getFightStatus();
        let date = tools.DateUtil.format(new Date(), tools.DateUtil.FMT.DB);
        let time = tools.DateUtil.format(new Date(), tools.DateUtil.FMT.THM);
        for (let key in RealTime.DATA_MAP) {
            let redisKey = RealTime.DATA_MAP[key];
            let value = ret[key].value;
            // logger.error(`${key}:${value}`);
            await tools.RedisUtil.hset(`${redisKey}:${date}`, time, value);
            await tools.RedisUtil.expire(`${redisKey}:${date}`, 3600 * 24 * 7);
        }
        // Redis数据监测:
        // hgetall pair:realtime:fight_server_player_count:20180423

        await DailyTask.getMaxOnlineLastDay();
        
        logger.info(`${TAG}执行完成`);
        utils.invokeCallback(cb, null);

        // 1分钟更新一次公告
        // await addBroadcast.set(count++);
    }
}

module.exports = OneMinuteTask;