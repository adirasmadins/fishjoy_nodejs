const omelo = require('omelo');
const Task = require('../../../utils/task/task');
const utils = require('../../../utils/utils');
const util = require('util');
const moment = require('moment');

class LogBackup extends Task {
    constructor(conf) {
        super(conf);
        this.bakDBName = null;
    }

    /**
     * 执行日志备份任务
     * @private
     */
    async _exeTask(cb) {
        if (!this.bakDBName) {
            this.bakDBName = `${omelo.app.get('mysql').server.database}_bak`;
        }

        let now = moment(new Date());
        logger.info('---日志备份开始', now.format('YYYY-MM-DD'), now.hour());
        let tasks = this.taskConf.subTask;
        for (let i = 0; i < tasks.length; i++) {
            let task = tasks[i];
            try {
                let needBackup = false;
                if (task.daily == true && now.hour() === task.dailyTime) {
                    needBackup = await this._isDailyNeedBak(task);
                }

                if(!needBackup){
                    needBackup = await this._isNeedBak(task);
                }

                if (!needBackup) {
                    logger.info(`暂时不需要备份该数据表${task.table}`);
                    continue;
                }

                let bakTablename = await this._getTableName(task);
                await this._createBakTable(task.structure, bakTablename);
                logger.info(`创建备份表${bakTablename}`);
                await this._backupData(task, bakTablename);

            } catch (e) {
                logger.error(`数据表${task.table}备份异常`, e);
            }
        }

        utils.invokeCallback(cb, null);
        logger.info('---日志备份结束');
    }

    /**
     * 检查是否需要备份数据
     * @param task
     * @private
     */
    async _isNeedBak(task) {
        try {

            let result = await mysqlConnector.query(`SELECT COUNT(*) as TOTAL FROM ${task.table}`);
            if (!result || !result[0]) {
                return false;
            }

            task.count = result[0].TOTAL;
            let needBak = task.count >= (task.retain + task.bak);
            logger.info('----------------_isNeedBak:', task.count, needBak, result);
            if (needBak) {
                result = await mysqlConnector.query(`SELECT id FROM ${task.table} ORDER BY ${task.orderby} DESC LIMIT ${task.count - 1},1`);
                logger.info('--------task.begin_id:', result[0].id);
                task.begin_id = result[0].id;
                result = await mysqlConnector.query(`SELECT id FROM ${task.table} ORDER BY ${task.orderby} DESC LIMIT ${task.retain},1`);
                task.end_id = result[0].id;
                return true;
            }
        } catch (e) {
            logger.error('logBackup _isNeedBak err ', e);
        }
        return false;
    }

    async _isDailyNeedBak(task) {
        try {
            let now = moment();
            now.date(now.date() + 1);
            now.hour(0);
            now.minute(0);
            now.second(0);
            logger.info('_isDailyNeedBak ', now.format('YYYY-MM-DD HH:mm:ss'));
            logger.info('------------------------------------', `SELECT COUNT(*) as TOTAL FROM ${task.table} WHERE ${task.timeRangeColumn} < '${now.format('YYYY-MM-DD HH:mm:ss')}'`);
            let result = await mysqlConnector.query(`SELECT COUNT(*) as TOTAL FROM ${task.table} WHERE ${task.timeRangeColumn} < '${now.format('YYYY-MM-DD HH:mm:ss')}'`);
            if (!result || !result[0]) {
                return false;
            }

            task.count = result[0].TOTAL;
            logger.info('----------------_isNeedBak:', task.count, result);
            if (task.count > 0) {
                result = await mysqlConnector.query(`SELECT id FROM ${task.table} ORDER BY ${task.orderby} DESC LIMIT ${task.count - 1},1`);
                logger.info('--------task.begin_id:', result[0].id);
                task.begin_id = result[0].id;
                result = await mysqlConnector.query(`SELECT id FROM ${task.table} ORDER BY ${task.orderby} DESC LIMIT ${task.retain},1`);
                task.end_id = result[0].id;
                return true;
            }
        } catch (e) {
            logger.error('logBackup _isNeedBak err ', e);
        }
        return false;
    }

    //获取备份表名
    async _getTableName(task) {
        let tab = await mysqlConnector.query(`SHOW TABLES FROM ${this.bakDBName}`);
        let yesterday = moment().subtract(1, "days").format('YYYYMMDD');
        let index = 1;
        for (let k in tab) {
            let tablename = tab[k][`Tables_in_${this.bakDBName}`];
            if (tablename.search(`${task.table}_${yesterday}`) >= 0) {
                index++;
            }
        }
        return `${task.table}_${yesterday}_${index}`;
    }

    //创建备份表
    async _createBakTable(structure, tablename, cb) {
        let sql = util.format(structure, `${this.bakDBName}.${tablename}`);
        await mysqlConnector.query(sql);
    }

    //拷贝数据到备份表
    async _moveData(task, tname, skip, limit, cb) {
        let sql = `INSERT INTO ${this.bakDBName}.${tname} SELECT * FROM ${task.table} WHERE id >= ${task.begin_id} AND id <= ${task.end_id} LIMIT ${skip}, ${limit}`;
        let result = await mysqlConnector.query(sql);
        logger.error('_moveData count', result.affectedRows);
        let affectedRows = !!result && result.affectedRows ? result.affectedRows : 0;
        return {
            dbSkip: skip + affectedRows,
            dbAffectedRows: affectedRows
        };
    }

    //移动数据到备份表
    async _backupData(task, tname, cb) {

        let skip = 0;
        while (true) {
            let {
                dbSkip,
                dbAffectedRows
            } = await this._moveData(task, tname, skip, task.limit);
            if (dbAffectedRows < task.limit) {
                await mysqlConnector.query(`DELETE FROM ${task.table} WHERE id >= ${task.begin_id} AND id <= ${task.end_id}`);
                break;
            } else {
                skip = dbSkip;
            }
        }
    }
}

module.exports = LogBackup;