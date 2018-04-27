const Task = require('../task/task');
const mysqlLogInsert = require('./mysqlLogInsert');
const redisLogInsert = require('./redisLogInsert');
const LogSource = require('./logSource');
const consts = require('../../database/consts/consts');
const errorCode = require('../task').errorCode;
const utils = require('../utils');

/**
 * 定时写入日志到mysql
 */
class LogInsertTask extends Task{
    constructor(conf){
        super(conf);
        this.logSource = new LogSource();
        this.dbInsert = mysqlLogInsert;
    }

    /**
     * 设置log存储数据库类型
     * @param value
     */
    setDBtype(value){
        if(consts.DBType.checkValid(value)){
            switch (value){
                case consts.DBType.MYSQL:
                    this.dbInsert = mysqlLogInsert;
                    break;
                case consts.DBType.REDIS:
                    this.dbInsert = redisLogInsert;
                    break;
                case consts.DBType.MONGO:
                default:
                    return errorCode.NOT_SUPPORT;
            }
        }
        return errorCode.OK;
    }

    pushData(type, data){
        return this.logSource.add(type, data);
    }

    /**
     * 执行定时任务
     * @private
     */
    _exeTask(cb){
        let data = this.logSource.data;
        this.dbInsert.flush(data, this.taskConf, function (err, result) {
            if(err){
                logger.error('定时写入LOG失败', err);
            }
            utils.invokeCallback(cb, err, result);
        });
    }
}

module.exports = LogInsertTask;




