const Task = require('../../../utils/task/task');
const utils = require('../../../utils/utils');
const moment = require('moment');
const omelo = require('omelo');

class LogRemove extends Task {
    constructor(conf) {
        super(conf);
    }

    /**
     * 导出备份数据
     * @param tname
     * @param cb
     * @private
     */
    // _exportBakData(tname, cb){
    //     let path = `./data/${tname}_${Date.now()}.txt`;
    //     let sql = `SELECT * FROM ${tname} INTO OUTFILE ${path} lines terminated by '\\r\\n'`;
    //     logger.info('-----_exportBakData:', path, '       ', sql);
    //     mysqlConnector.query(sql, function (err) {
    //         if(err){
    //             // console.gameLogSync('-----_exportBakData:', err);
    //         }
    //         mysqlConnector.query(`TRUNCATE ${tname}`, function (err, result) {
    //             logger.info('-----_exportBakData truncate result:', result);
    //             utils.invokeCallback(cb, null, tname);
    //         });
    //     });
    // }


    // 删除过期表
    async removeExpireTable(task) {
        let tab = await mysqlConnector.query(`SHOW TABLES FROM ${this.bakDBName}`);
        let beforeDay = moment().subtract(task.expiryTime, 'day');
        beforeDay = Number(beforeDay.format('YYYYMMDD'));

        for (let k in tab) {
            let tablename = tab[k][`Tables_in_${this.bakDBName}`];
            let parts = tablename.split('_');
            let timestamp = parts[parts.length - 2];
            if(Number(timestamp) <= beforeDay){
                await mysqlConnector.query(`DROP TABLE ${this.bakDBName}.${tablename}`);
            }
        }
    }

    /**
     * 执行日志移除任务
     * @private
     */
    async _exeTask(cb) {
        if (!this.bakDBName) {
            this.bakDBName = `${omelo.app.get('mysql').server.database}_bak`;
        }

        logger.info('过期日志清理开始');
        let tasks = this.taskConf.subTask;
        for (let i = 0; i < tasks.length; i++) {
            let task = tasks[i];
            await this.removeExpireTable(task);
        }

        utils.invokeCallback(cb, null);
        logger.info('过期日志清理结束');

    }
}

module.exports = LogRemove;