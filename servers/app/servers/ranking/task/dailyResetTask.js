const Task = require('../../../utils/task/task');
const REDISKEY = require('../../../database/consts').REDISKEY;
const redisAccountSync = require('../../../utils/redisAccountSync');
const redisClient = require('../../../utils/dbclients').redisClient;
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

    _resetMysqlKey() {

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
                redisClient.cmd.multi(cmds1).exec(function (err, res) {
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
                        redisClient.cmd.multi(cmds).exec(cb);
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

    _exeTask(cb) {
        logger.info('按天任务重置开始');
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