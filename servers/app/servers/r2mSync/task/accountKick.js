const Task = require('../../../utils/task/task');
const moment = require('moment');
const redisAccountSync = require('../../../utils/redisAccountSync');
const mysqlAccountSync = require('../../../utils/mysqlAccountSync');
const REDISKEY = require('../../../models/index').REDISKEY;
const utils = require('../../../utils/utils');
const tools = require('../../../utils/tools');
const RewardModel = require('../../../utils/account/RewardModel');

/**
 * 踢出redis缓存中不活跃玩家数据
 */
class AccountKick extends Task {
    constructor(conf) {
        super(conf);
    }

    /**
     * 踢出非活跃玩家
     * @param kicked 已经踢出的非活跃玩家
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

            let succUids = [];
            for (let i = 0; i < subUids.length; i++) {
                let uid = subUids[i];
                try {
                    let account = await redisAccountSync.getAccountAsync(uid);
                    if (account) {
                        await mysqlAccountSync.setAccountSync([account]);
                    }

                    let mission_task_once = await RewardModel.syncMissionTaskOnce(uid);
                    mission_task_once = JSON.stringify(mission_task_once);
                    // logger.error('保存成就任务信息 mission_task_once=', mission_task_once);
                    await tools.SqlUtil.query(
                        `INSERT INTO tbl_mission (id, mission_task_once) VALUES (?, ?)
                        ON DUPLICATE KEY UPDATE id=VALUES(id),mission_task_once=VALUES(mission_task_once)`,
                        [uid, mission_task_once]
                    );
                    await RewardModel.delUserMissionInfo(uid);
                    await redisConnector.hdel(REDISKEY.MAP_OPENID_UID, account.channel_account_id);

                    succUids.push(uid);

                } catch (err) {
                    logger.error(`非活跃玩家${uid}移除REDIS异常:`, err);

                }
            }

            let next_kick = kicked + this.taskConf.writeLimit;
            await redisAccountSync.delAccount(succUids);
            await redisAccountSync.delRank(succUids);
            await this._kickAccount(next_kick, kickUids, finish);
        } catch (err) {
            logger.error("非活跃玩家移除REDIS异常:", err);
        }
    }

    /**
     * 执行定时任务
     * @private
     */
    _exeTask(cb) {
        logger.error("执行定时任务accountKick:");
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