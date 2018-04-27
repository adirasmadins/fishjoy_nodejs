////////////////////////////////////////////////////////////
// 运营设置参数的数据库读写逻辑
////////////////////////////////////////////////////////////

//==============================================================================
// import
//==============================================================================

//------------------------------------------------------------------------------
// 工具
//------------------------------------------------------------------------------
// var ObjUtil = require('../buzz/ObjUtil');
// var ArrayUtil = require('../utils/ArrayUtil');
// var buzz_cst_error = require('../../../../consts/fish_error');

// var ERROR_OBJ = buzz_cst_error.ERROR_OBJ;

//------------------------------------------------------------------------------
// 业务
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// 缓存
//------------------------------------------------------------------------------
// var CacheChange = require('../buzz/cache/CacheChange');

//------------------------------------------------------------------------------
// 配置表
//------------------------------------------------------------------------------

//==============================================================================
// const
//==============================================================================
var DEBUG = 0;
var ERROR = 1;
var TAG = "【dao_drop】";


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.loadAll = loadAll;
exports.insert = insert;
exports.insertMassive = insertMassive;
exports.cutServerDrop = cutServerDrop;
exports.resetEveryHour = resetEveryHour;
exports.getDropLeft = getDropLeft;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 加载所有的服务器掉落数据.
 */
function loadAll(pool, cb) {
    const FUNC = TAG + "read() --- ";
    //----------------------------------
    // cb(null, null);

    _didRead(pool, function(err, results) {
        cb(err, results);
    });
}

/**
 * 插入一条记录
 */
function insert(pool, data, cb) {
    const FUNC = TAG + "insert() --- ";
    //----------------------------------

    _didInsert(pool, data, function(err, results) {
        cb(err, results);
    });
}

/**
 * 批量插入多条记录
 */
function insertMassive(pool, list, cb) {
    const FUNC = TAG + "insert() --- ";
    //----------------------------------

    _didInsertMassive(pool, list, function(err, results) {
        cb(err, results);
    });
}

function cutServerDrop(pool, key, cb) {
    const FUNC = TAG + "insert() --- ";
    //----------------------------------

    _cutServerDrop(pool, key, function(err, results) {
        cb(err, results);
    });
}

function resetEveryHour(pool, cb) {
    const FUNC = TAG + "resetEveryHour() --- ";
    //----------------------------------

    _resetEveryHour(pool, function(err, results) {
        cb(err, results);
    });
}

function getDropLeft(pool, params, cb) {
    const FUNC = TAG + "getDropLeft() --- ";
    //----------------------------------

    _getDropLeft(pool, params, function(err, results) {
        cb(err, results);
    });
}

//==============================================================================
// private
//==============================================================================

/**
 * 读取对应类型的运营配置
 */
function _didRead(pool, cb) {
    const FUNC = TAG + "_didRead() --- ";
    //----------------------------------
    var sql = "";
    sql += "SELECT * ";
    sql += "FROM `tbl_drop_serverlimit` ";

    var sql_data = [];

    handleQuery(pool, sql, sql_data, cb);
}

/**
 * 读取对应类型的运营配置
 */
function _didInsert(pool, data, cb) {
    const FUNC = TAG + "_didInsert() --- ";
    //----------------------------------
    var sql = "";
    sql += "INSERT INTO tbl_drop_serverlimit ";
    sql += "(`key`, `limit_type`, `limit_count`, `current_value`, `platform`) ";
    sql += "VALUES ";
    sql += "(?,?,?,?,?) ";

    var sql_data = [
        data.key,
        data.limit_type,
        data.limit_count,
        data.current_value,
        data.platform,
    ];

    handleQuery(pool, sql, sql_data, cb);
}

/**
 * 批量插入多条记录
 */
function _didInsertMassive(pool, list, cb) {
    const FUNC = TAG + "_didInsertMassive() --- ";
    //----------------------------------
    var sql = "";
    sql += "INSERT INTO tbl_drop_serverlimit ";
    sql += "(`key`, `limit_type`, `limit_count`, `current_value`, `platform`) ";
    sql += "VALUES ";
    for (var i = 0; i < list.length; i++) {
        var data = list[i];
        if (i > 0) {
            sql += ",";
        }
        sql += "('";
        sql += (data.drop_key + "_" + data.time_idx + "_" + data.platform) + "',";
        sql += data.limit_type + ",";
        sql += data.limit_count + ",";
        sql += data.current_value + ",";
        sql += data.platform;
        sql += ")";
    }

    var sql_data = [];

    handleQuery(pool, sql, sql_data, cb);
}

/**
 * 减少服务器限制数量
 */
function _cutServerDrop(pool, key, cb) {
    const FUNC = TAG + "_didInsertMassive() --- ";
    //----------------------------------
    var sql = "";
    sql += "UPDATE tbl_drop_serverlimit ";
    sql += "SET current_value=current_value-1 ";
    sql += "WHERE `key`=? ";

    var sql_data = [key];

    handleQuery(pool, sql, sql_data, cb);
}

function _resetEveryHour(pool, cb) {
    const FUNC = TAG + "_resetEveryHour() --- ";
    //----------------------------------
    var sql = "";
    sql += "UPDATE tbl_drop_serverlimit ";
    sql += "SET current_value=limit_count ";
    sql += "WHERE `limit_type`=2 ";

    var sql_data = [];

    handleQuery(pool, sql, sql_data, cb);
}

/**
 * 获取当前这个小时的剩余数据(注意Android和IOS都是需要的).
 */
function _getDropLeft(pool, params, cb) {
    const FUNC = TAG + "_getDropLeft() --- ";
    //----------------------------------
    var keys = params.keys;
    var condition = "";
    for (var i = 0; i < keys.length; i++) {
        if (i > 0) {
            condition += ",";
        }
        condition += "'" + keys[i] + "'";
    }

    var sql = "";
    sql += "SELECT * ";
    sql += "FROM tbl_drop_serverlimit ";
    sql += "WHERE ";
    sql += "`key` IN (" + condition + ") ";

    var sql_data = [];

    handleQuery(pool, sql, sql_data, cb);
}

//==============================================================================
// 需要转移
//==============================================================================

function handleQuery(pool, sql, sql_data, cb) {
    const FUNC = TAG + "handleQuery() --- ";
    //----------------------------------
    if (DEBUG) logger.info(FUNC + 'sql:\n', sql);
    if (DEBUG) logger.info(FUNC + 'sql_data:\n', sql_data);
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            if (ERROR) logger.error(FUNC + "err:\n", err);
            if (ERROR) logger.error(FUNC + 'sql:\n', sql);
            if (ERROR) logger.error(FUNC + 'sql_data:\n', sql_data);
        } else {
            // DEBUG = 0;
            if (DEBUG) logger.info(FUNC + 'result: ', result);
        }
        cb(err, result);
    });
}