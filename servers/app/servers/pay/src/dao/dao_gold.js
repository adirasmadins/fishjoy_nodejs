
const CstError = require('../../../../consts/fish_error');
const CacheUserException = require('../buzz/cache/CacheUserException');
const common_log_const_cfg = require('../../../../utils/imports').DESIGN_CFG.common_log_const_cfg;
const ERROR_OBJ = CstError.ERROR_OBJ;

let DEBUG = 0;
let ERROR = 1;

const TAG = "【dao_gold】";
exports.writeUserException = writeUserException;
exports.getOnlineTime = getOnlineTime;


function writeUserException(pool, cb) {
    let count = CacheUserException.length();
    if (count > 0) {
        insertMassiveUserException(pool, CacheUserException.cache(), count, cb);
    }
    else {
        cb && cb(ERROR_OBJ.CACHE_EMPTY);
    }
}


/**
 * 获取当前玩家当日在线的总时间.
 */
function getOnlineTime(pool, data, cb) {

    let token = data['token'];
    // 验证用户有效性
    DaoCommon.checkAccount(pool, token, function (error) {
        if (error) {
            cb(error);
            return;
        }
        
        _didGetOnlineTime(pool, data, cb);
    });
}


/**
 * 插入大量的日志数据(用户异常).
 * @param group 插入数据的来源(队列)
 * @param num 插入数据的数目
 */
function insertMassiveUserException(pool, group, num, cb) {
    const FUNC = TAG + "insertMassiveUserException() --- ";

    logger.info(FUNC + "CALL...");
    
    if (group.length > 0) {
        
        let sql = '';
        sql += 'INSERT INTO `tbl_user_exception` ';
        sql += '(`uid`,`log_at`,`type`, `exception`) ';
        sql += 'VALUES ';
        sql += '(?,?,?,?)';
        if (group.length > 1) {
            for (let i = 0; i < group.length - 1; i++) {
                sql += ',(?,?,?,?)';
            }
        }
        
        let sql_data = [];
        for (let i = 0; i < num; i++) {
            let record = group.shift();
            
            sql_data.push(record.uid);
            sql_data.push(record.log_at);
            sql_data.push(record.type);
            sql_data.push(record.exception);
        }
        
        if (DEBUG) logger.info(FUNC + 'sql(' + sql.length + '):\n', sql);
        if (DEBUG) logger.info(FUNC + 'sql_data(' + sql_data.length + '):\n', sql_data);
        
        pool.query(sql, sql_data, function (err, result) {
            if (err && ERROR) {
                logger.error('------------------------------------------------------');
                logger.error(FUNC + 'err:', err);
                logger.info(FUNC + 'sql(' + sql.length + '):\n', sql);
                logger.info(FUNC + 'sql_data(' + sql_data.length + '):\n', sql_data);
                logger.error('------------------------------------------------------');
                cb && cb(err);
            }
            cb && cb(null, result);
        });

    }
    else {
        cb && cb(ERROR_OBJ.CACHE_EMPTY);
    }
}


// 获取在线时间的实现
function _didGetOnlineTime(pool, data, cb) {

    // TODO: 特别注意! 需要从缓存中计算在线时间

    cb(null, [{online_time:1000}]);
}