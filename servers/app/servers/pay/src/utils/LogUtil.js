const DaoUtil = require('./DaoUtil');
const ArrayUtil = require('./ArrayUtil');
const DateUtil = require('./DateUtil');
const logger = require('log4js').getLogger(__filename);
exports.logDb = logDb;//结构化日志记录到数据库


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
/**
 * 结构化日志记录到数据库
 * @param logObj 日志对象, 针对每一种日志创建单一的日志对象. 记录时直接使用日志对象进行输出.
 */
function logDb(logObj, cb) {
    let cache = logObj.cache();
    let cacheLength = logObj.length();
    let valueList = [];
    for (let i = 0; i < cacheLength; i++) {
        let log = cache.shift();
        let record = [];
        for (let j = 0; j < logObj.fields.length; j++) {
            record[j] = log[logObj.fields[j]];
            // 处理时间类型的日志
            if (ArrayUtil.contain(logObj.timeFields, logObj.fields[j])) {
                record[j] = "'" + DateUtil.format(new Date(record[j]), 'yyyy-MM-dd hh:mm:ss') + "'";
            }
        }
        valueList.push(record);
    }
    if (valueList.length > 0) {
        DaoUtil.insertMassive(logObj.table, logObj.fields, valueList, function(err, results) {
            cb && cb(err, results);
        });
    }
    else {
        cb && cb(null, '没有数据可以插入');
    }
}

/**
 * 日志操作对象, 可以继承多个.
 */
exports.LogObj = class LogObj {

    /**
     * @param table 数据表的名字
     * @param fields 数据表需要存储的字段名列表
     * @param timeFields 数据表中时间戳类型的字段名列表
     */
    constructor(table, fields, timeFields) {
        /** 存入的数据表 */
        this.table = table;
        /** LOG的字段名列表 */
        this.fields = fields;
        /** 时间戳形式的字段列表 */
        this.timeFields = timeFields;
        /** 日志记录数组 */
        this.list = [];
    }

    /** 插入一条日志. */
    push(data) {
        logger.info( 'push data:', data);
        this.list.push(data);
    }

    /** 输出日志准备. */
	cache() {
        logger.info('get cache:', this.list);
        return this.list;
    }

    /** 返回日志总条数. */
    length() {
        logger.info('get cache length:', this.list.length);
        return this.list.length;
    }
};
