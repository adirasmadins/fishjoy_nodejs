const Task = require('../../../utils/task/task');
const moment = require('moment');
const redisAccountSync = require('../../../utils/redisAccountSync');
const mysqlAccountSync = require('../../../utils/mysqlAccountSync');
const REDISKEY = require('../../../database/consts').REDISKEY;
const utils = require('../../../utils/utils');

/**
 * 踢出redis缓存中不活跃玩家数据
 */
class AccountKick extends Task {
    constructor(conf) {
        super(conf);
    }

    /**
     * 踢出非活跃玩家
     * @param kicked 已经提出的非活跃玩家
     * @param kickUids
     * @param finish
     * @private
     */
    async _kickAccount(kicked, kickUids, finish) {
        try{
            let subUids = kickUids.slice(kicked, kicked + this.taskConf.writeLimit);
            logger.info('_kickAccount:', subUids);
            if (subUids.length === 0) {
                logger.info('剔除非活跃玩家成功');
                utils.invokeCallback(finish, null);
                return;
            }

            for (let i = 0; i < subUids.length; i++) {
                let account = await redisAccountSync.getAccountAsync(subUids[i]);
                if (account) {
                    await mysqlAccountSync.setAccountSync([account]);
                }
            }

            let next_kick = kicked + this.taskConf.writeLimit;
            await redisAccountSync.delAccount(subUids);
            await redisAccountSync.delRank(subUids);
            await this._kickAccount(next_kick, kickUids, finish);
        }catch (err){
            logger.error("踢人异常:",err);
        }
    }

    /**
     * 执行定时任务
     * @private
     */
    _exeTask(cb) {
        logger.info("执行定时任务accountKick:");
        redisAccountSync.getHashValueLimit(REDISKEY.LAST_ONLINE_TIME, 0, this.taskConf.readLimit, (res, next) => {
            if (!!res && res.length > 0) {
                let kickUids = [];

                for (let i = 0; i < res.length; i += 2) {
                    let uid = res[i];
                    let active_time = res[i + 1];
                    if (active_time === '') {
                        kickUids.push(uid);
                        continue;
                    }
                    //时间兼容处理
                    active_time = isNaN(+active_time) ? active_time : +active_time;
                    if (moment().diff(moment(active_time), 'days') >= this.taskConf.active_timeout) {
                        kickUids.push(uid);
                    }
                }
                this._kickAccount(0, kickUids, function () {
                    next();
                });
            } else {
                next();
            }
        }, function (err) {
            utils.invokeCallback(cb, err);
        });
    }
}

module.exports = AccountKick;