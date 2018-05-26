const async = require('async');
const redisAccountSync = require('../../../utils/redisAccountSync');
const mysqlAccountSync = require('../../../utils/mysqlAccountSync');
const Task = require('../../../utils/task/task');
const REDISKEY = require('../../../models/index').REDISKEY;
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

    /**
     * 执行定时任务
     * @private
     */
    _exeTask(cb) {
        logger.info('---玩家数据同步开始');
        this._syncFullData(function () {
            this._syncDeltaData(function () {
                utils.invokeCallback(cb, null);
                logger.info('----玩家数据同步完成');
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
        let _cursor = 0;
        do {
            let {cursor, result} = await redisConnector.sscan(REDISKEY.UPDATED_UIDS, _cursor, this.taskConf.readLimit);
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
            _cursor = cursor;
            if (_cursor == 0) {
                utils.invokeCallback(cb);
                break;
            }
        } while (1);
    }

    async _syncDeltaData(cb) {
        let _cursor = 0;
        do {
            let {cursor, result} = await redisConnector.sscan(REDISKEY.UPDATED_DELTA_UIDS, _cursor, this.taskConf.readLimit);
            let uids = this._parseUids(result);
            for (let i = 0; i < uids.length; i++) {
                let key = `${REDISKEY.UPDATED_DELTA_FIELDS}:${uids[i]}`;
                try {
                    let result = await redisConnector.smembers(key);
                    if(result && result.length > 0){
                        await this._toMysql(uids[i], result);
                    }
                    await redisConnector.srem(REDISKEY.UPDATED_DELTA_UIDS, uids[i]);
                    await redisConnector.del(key);
                    logger.info(`玩家${uids[i]}数据增量同步成功`);
                } catch (err) {
                    logger.error(`玩家${uids[i]}数据增量同步失败`, err);
                    if (ERROR_CODE.USER_NOT_EXIST == err.code) {
                        // 从增量任务列表中删除玩家
                        await redisConnector.del(key);
                        await redisConnector.srem(REDISKEY.UPDATED_DELTA_UIDS, uids[i]);
                    }
                }
            }
            _cursor = cursor;
            if (_cursor == 0) {
                utils.invokeCallback(cb);
                break;
            }
        } while (1);
    }

}

module.exports = AccountSync;




