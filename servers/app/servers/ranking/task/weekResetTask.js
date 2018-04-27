const Task = require('../../../utils/task/task');
const async = require('async');
const utils = require('../../../utils/utils');
const SUBTASK_TYPE = require('../src/consts').SUBTASK_TYPE;

/**
 * 用户数据重置
 */
class WeekResetTask extends Task {
    constructor(conf) {
        super(conf);
    }

    _setSpecial(task, cb){
        utils.invokeCallback(cb, null);
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

    _exeTask(cb) {
        logger.info('按周任务重置开始');
        let tasks = this.taskConf.subTask;
        async.mapSeries(tasks, this._reset.bind(this), function (err, results) {
            logger.info('按周任务重置完成');
            utils.invokeCallback(cb, null);
        });
    }
}

module.exports = WeekResetTask;