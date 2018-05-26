const schedule = require('node-schedule');
const os = require('os');
const redisAccountSync = require('../redisAccountSync');
const utils = require('../utils');
const async = require('async');
const REDISKEY = require('../../models/index').REDISKEY;

class Task {
    constructor(conf) {
        this.taskConf = conf;
        this.schedule = null;
        this.busy = false;
        this._taskId = null;
    }

    set taskId(value) {
        this._taskId = value;
    }

    get taskId() {
        return this._taskId;
    }

    _exeTask() { }

    /**
     * 启动定时任务
     * @param cfg 任务配置信息
     */
    run() {
        let _time = this.taskConf.time.split(',');
        let cron_time = `${_time[0]} ${_time[1]} ${_time[2]} ${_time[3]} ${_time[4]} ${_time[5]}`;

        let self = this;
        this.schedule = schedule.scheduleJob(cron_time, function () {
            if (self.busy) {
                logger.warn(self.taskId + '任务繁忙');
                return;
            }
            self.busy = true;
            self._exeTask(function (err) {
                self.busy = false;
            });
        }.bind(this));
    }

    /**
     * 取消定时任务
     */
    cancle() {
        if (this.schedule) {
            this.schedule.cancel();
            this.schedule = null;
        }
        this._exeTask();
    }

    get config() {
        return this.taskConf;
    }

    _delKey(task, cb) {
        redisConnector.cmd.del(task.redisKey, function (err, res) {
            if (err) {
                logger.error(`执行删除${task.redisKey}异常`, err);
            }
            utils.invokeCallback(cb, null);
        });
    }

    _setSpecial(){}

    async _setDefault(task, cb) {
        let value = task.value;
        if (typeof value == 'function') {
            value = value();
        }
        redisAccountSync.getHashValueLimit(REDISKEY.PLATFORM, 0, task.limit, async (res, next) => {
            let uids = redisAccountSync.Util.parseHashKeyArray(res);
            let cmds = [];
            uids.forEach(function (uid) {
                cmds.push(['hset', task.redisKey, uid, value]);
            });
            try {
                logger.info(cmds);
                await redisAccountSync.multiAsync(cmds);
            }
            catch (err) {
                logger.error(`执行${task.redisKey}重置异常:${err}`);
            }
            next();
        }, function (err) {
            logger.info(`执行${task.redisKey}重置完成`);
            utils.invokeCallback(cb, null);
        });
    }

}

module.exports = Task;