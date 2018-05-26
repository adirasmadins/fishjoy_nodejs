const Task = require('../../../utils/task/task');
const REDISKEY = require('../../../models/index').REDISKEY;
const redisAccountSync = require('../../../utils/redisAccountSync');
const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const EXPORT_TOOLS = require('../../../utils/account/RewardModel').EXPORT_TOOLS;
const async = require('async');
const utils = require('../../../utils/utils');
const SUBTASK_TYPE = require('../src/consts').SUBTASK_TYPE;
const dropManager = require('../../../utils/DropManager');
const RedisUtil = require('../../../utils/tools/RedisUtil');

/**
 * 用户数据重置
 */
class DailyTask extends Task {
    constructor(conf) {
        super(conf);
    }

    async _resetTaskProcess() {
        const active_activequest_cfg = DESIGN_CFG.active_activequest_cfg;
        let cmds = [];
        for (let i = 0; i < active_activequest_cfg.length; i++) {
            let item = active_activequest_cfg[i];
            if (item.repeat == EXPORT_TOOLS.TASK_MAIN_TYPE.DAILY) {
                let taskKey = EXPORT_TOOLS.getTaskKey(EXPORT_TOOLS.TASK_PREFIX.ACTIVE_TASK_DAILY, item.repeat, item.condition, item.value1);
                cmds.push(['DEL', taskKey]);
            }
        }

        const daily_quest_cfg = DESIGN_CFG.daily_quest_cfg;
        for (let i = 0; i < daily_quest_cfg.length; i++) {
            let item = daily_quest_cfg[i];
            if (item.type == EXPORT_TOOLS.TASK_MAIN_TYPE.DAILY) {
                let taskKey = EXPORT_TOOLS.getTaskKey(EXPORT_TOOLS.TASK_PREFIX.MISSION_TASK_DAILY, item.type, item.condition, item.value1);
                cmds.push(['DEL', taskKey]);
            }
        }

        try {
            await redisConnector.multi(cmds);
        } catch (err) {
            logger.error('每日重置活动和成就任务异常,err=', err);
        }

    }

    _setSpecial(task, cb) {
        redisAccountSync.getHashValueLimit(REDISKEY.PLATFORM, 0, task.limit, (res, next) => {
            let uids = redisAccountSync.Util.parseHashKeyArray(res);
            let cmds = [];
            let cmds1 = [];//条件性重置goddess_free
            uids.forEach(function (uid) {
                cmds1.push(['hget', REDISKEY.GODDESS_ONGOING, uid]);
            });

            async.waterfall([function (cb) {
                redisConnector.cmd.multi(cmds1).exec(function (err, res) {
                    if (err) {
                        logger.info(`执行GODDESS重置::`, err);
                        cb();
                    } else {
                        for (let i in res) {
                            if (0 == Number(res[i])) {
                                cmds.push(['hset', REDISKEY.GODDESS_FREE, uids[i], task.value]);
                            } else if (1 == Number(res[i])) {
                                cmds.push(['hincrby', REDISKEY.GODDESS_CROSSOVER, uids[i], task.value]);
                            }
                        }
                        redisConnector.cmd.multi(cmds).exec(cb);
                    }
                });
            }], function (err, result) {
                next();
            });

        }, function (err) {
            logger.info(`执行${task.redisKey}重置完成`);
            utils.invokeCallback(cb, null);
        });
    }

    _reset(task, cb) {
        if (SUBTASK_TYPE.DEL == task.type) {
            this._delKey(task, cb);
        } else if (SUBTASK_TYPE.SPECIAL == task.type) {
            this._setSpecial(task, cb);
        } else if (SUBTASK_TYPE.MODIFY == task.type) {
            this._setDefault(task, cb);
        }
        else {
            utils.invokeCallback(cb, null);
        }
    }

    async _exeTask(cb) {
        logger.info('按天任务重置开始');
        await this._resetTaskProcess();
        let tasks = this.taskConf.subTask;
        async.mapSeries(tasks, this._reset.bind(this), function (err, results) {
            logger.info('按天任务重置完成');
            redisConnector.pub(REDISKEY.CH.DROP_RELOAD, JSON.stringify({
                typeKey: REDISKEY.LOG.G_DAY_DROP,
            }));
            utils.invokeCallback(cb, null);
        });
    }
}

module.exports = DailyTask;