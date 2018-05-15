const async = require('async');
const redisAccountSync = require('../../../utils/redisAccountSync');
const mysqlAccountSync = require('../../../utils/mysqlAccountSync');
const Task = require('../../../utils/task/task');
const REDISKEY = require('../../../database/consts').REDISKEY;
const utils = require('../../../utils/utils');
const ERROR_CODE = require('../../../consts/fish_error').ERROR_CODE;

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
        logger.error('---玩家数据同步开始');
        this._syncFullData(function () {
            this._syncDeltaData(function () {
                utils.invokeCallback(cb, null);
                logger.error('----玩家数据同步完成');
            });
        }.bind(this));
    }

    _parseUids(res) {
        let uids = [];
        for (let i = 0; i < res.length; i++) {
            let uid = Number(res[i]);
            if (!isNaN(uid) && uid != 0) {
                uids.push(uid);
            }
        }
        return uids;
    }

    async _toMysql(uid, fields) {
        let account = await redisAccountSync.getAccountAsync(uid, fields);
        if (account) {
            await mysqlAccountSync.setAccountSync(account);
        }
    }

    async _syncFullData(cb) {
        do {
            let {result} = await redisConnector.sscan(REDISKEY.UPDATED_UIDS, 0, this.taskConf.readLimit);
            logger.error('_syncFullData, result=', result);
            if (result.length == 0) {
                utils.invokeCallback(cb);
                return;
            }
            let uids = this._parseUids(result);
            for (let i = 0; i < uids.length; i++) {
                try {
                    await this._toMysql(uids[i]);
                    await redisConnector.srem(REDISKEY.UPDATED_UIDS, uids[i]);
                    logger.info(`玩家${uids[i]}数据完整同步成功`);
                } catch (err) {
                    logger.error(`玩家${uids[i]}数据完整同步失败`, err);
                }
            }
        } while (1);
    }

    async _syncDeltaData(cb) {
        do {
            let {result} = await redisConnector.sscan(REDISKEY.UPDATED_DELTA_UIDS, 0, this.taskConf.readLimit);
            logger.error('_syncDeltaData, result=', result);
            if (result.length == 0) {
                utils.invokeCallback(cb);
                return;
            }

            let uids = this._parseUids(result);
            for (let i = 0; i < uids.length; i++) {
                let key = `${REDISKEY.UPDATED_DELTA_FIELDS}:${uids[i]}`;
                try {
                    let {result} = await redisConnector.sscan(key, 0, this.taskConf.readLimit);
                    if(result && result.length > 0){
                        await this._toMysql(uids[i], result);
                    }
                    // await redisConnector.srem(REDISKEY.UPDATED_DELTA_UIDS, uids[i]);
                    await redisConnector.del(key);
                    logger.info(`玩家${uids[i]}数据增量同步成功`);
                } catch (err) {
                    logger.error(`玩家${uids[i]}数据增量同步失败`, err);
                    if (ERROR_CODE.USER_NOT_EXIST == err.code) {
                        // 从增量任务列表中删除玩家
                        await redisConnector.del(key);
                        // await redisConnector.srem(REDISKEY.UPDATED_DELTA_UIDS, uids[i]);
                    }
                }
            }

            try {
                await redisConnector.srem(REDISKEY.UPDATED_DELTA_UIDS, result);
            }catch(err){
                logger.error('_syncDeltaData, redisConnector.srem err=', err);
            }

        } while (1);
    }

}

module.exports = AccountSync;




