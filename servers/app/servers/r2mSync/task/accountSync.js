const async = require('async');
const redisAccountSync = require('../../../utils/redisAccountSync');
const mysqlAccountSync = require('../../../utils/mysqlAccountSync');
const Task = require('../../../utils/task/task');
const REDISKEY = require('../../../database/consts').REDISKEY;
const utils = require('../../../utils/utils');

// const deleteAllKey = require('../../tools/deleteAllKey').deleteAllKey;

/**
 * redis数据定时同步到mysql
 */
class AccountSync extends Task {
    constructor(conf) {
        super(conf);
    }

    async _sync(syncCount, syncDatas, finish) {

        // syncDatas [{uid:uid, fields:[]}];
        let subSyncDatas = syncDatas.slice(syncCount, syncCount + this.taskConf.writeLimit);
        if (subSyncDatas.length === 0) {
            // logger.info('redis数据同步到mysql成功');
            utils.invokeCallback(finish, null);
            return;
        }

        let self = this;
        let synced = syncCount + this.taskConf.writeLimit;
        // console.time('----------------redis');
        // logger.info('-------------subUids', subSyncDatas.length);
        async.mapSeries(subSyncDatas, function (syncData, cb) {
            redisAccountSync.getAccount(syncData.uid, syncData.fields, function (err, account) {
                cb(err, account);
            });
        }, function (err, accounts) {
            if (err) {
                logger.error('获取account信息失败');
            }
            // console.timeEnd('----------------redis');
            //
            // console.time('----------------mysql');
            let account_filter = redisAccountSync.Util.filterInvalidAccount(accounts);
            if (account_filter.length > 0) {

                mysqlAccountSync.setAccount(account_filter, function (err, results) {
                    if (err) {
                        logger.error('redis数据同步到mysql存在异常，请注意检查数据', err);
                    }
                    // console.timeEnd('----------------mysql');
                    self._sync(synced, subSyncDatas, finish);
                });
            }
            else {
                self._sync(synced, subSyncDatas, finish);
            }

        });
    }

    /**
     * 执行定时任务
     * @private
     */
    _exeTask(cb) {
        logger.info('---玩家数据同步开始');
        // console.time('accountSyncFull');
        this._syncFullData(function () {
            // console.timeEnd('accountSyncFull');
            // console.time('accountSync');
            this._syncDeltaData(function () {
                // console.timeEnd('accountSync');
                utils.invokeCallback(cb, null);
                logger.info('----玩家数据同步完成');
            });
        }.bind(this));
    }

    _syncFullData(cb) {
        let self = this;
        redisAccountSync.getSetValueLimit(REDISKEY.UPDATED_UIDS, 0, this.taskConf.readLimit, (res, next) => {
            if (!!res && res.length > 0) {
                let uids = redisAccountSync.Util.parseHashKey(res);
                redisAccountSync.remSetValues(REDISKEY.UPDATED_UIDS, uids, function (err, results) {
                    // logger.error('---fullll-----------uids', uids.length);

                    self._sync(0, uids, function () {
                        // logger.info('next -------');
                        next();
                    });
                });
            } else {
                next();
            }
        }, function (err) {
            utils.invokeCallback(cb, err);
        });
    }

    _syncDeltaData(cb) {
        let self = this;
        redisAccountSync.getSetValueLimit(REDISKEY.UPDATED_DELTA_UIDS, 0, this.taskConf.readLimit, (res, next) => {
            if (!!res && res.length > 0) {
                let uids = redisAccountSync.Util.parseHashKey(res);
                redisAccountSync.remSetValues(REDISKEY.UPDATED_DELTA_UIDS, uids, async function (err, results) {
  
                    let cmds = [];
                    let del_cmds = [];
                    for (let i = 0; i < uids.length; i++) {
                        let key = `${REDISKEY.UPDATED_DELTA_FIELDS}:${uids[i].uid}`;
                        cmds.push(["sscan", key, 0, 'COUNT', 1000]);
                        del_cmds.push(["del", key]);
                    }
                    let result = await redisAccountSync.multiAsync(cmds);
                    for (let i = 0; i < uids.length; i++) {
                        let fields = result[i][1];
                        uids[i].fields = fields;
                    }

                    // logger.error('-------_syncDeltaData-------uids', JSON.stringify(uids));
                    await redisAccountSync.multiAsync(del_cmds);
                    self._sync(0, uids, function () {
                        // logger.info('next -------');
                        next();
                    });
                });
            } else {
                next();
            }
        }, function (err) {
            utils.invokeCallback(cb, err);
        });
    }

}

module.exports = AccountSync;




