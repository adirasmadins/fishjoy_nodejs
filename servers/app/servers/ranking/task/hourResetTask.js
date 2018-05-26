const Task = require('../../../utils/task/task');
const async = require('async');
const utils = require('../../../utils/utils');
const SUBTASK_TYPE = require('../src/consts').SUBTASK_TYPE;
const dropManager = require('../../../utils/DropManager');
const RedisUtil = require('../../../utils/tools/RedisUtil');
const REDISKEY = require('../../../models/index').REDISKEY;

class HourTask extends Task{
    constructor(conf){
        super(conf);
    }

    _reset(task, cb){
        if (SUBTASK_TYPE.DEL == task.type) {
            this._delKey(task, cb);
        } else if (SUBTASK_TYPE.SPECIAL == task.type) {
            this._setSpecial(task, cb);
        }else if(SUBTASK_TYPE.MODIFY==task.type){
            this._setDefault(task,cb);
        }
        else {
            utils.invokeCallback(cb, null);
        }
    }

    _exeTask(cb){
        logger.info('按小时任务重置开始');
        let tasks = this.taskConf.subTask;
        async.mapSeries(tasks, this._reset.bind(this), function (err, results) {
            logger.info('按小时任务重置完成');
            redisConnector.pub(REDISKEY.CH.DROP_RELOAD, JSON.stringify({
                typeKey: REDISKEY.LOG.G_HOUR_DROP,
            }));
            utils.invokeCallback(cb, null);
        });
    }
}

module.exports = HourTask;