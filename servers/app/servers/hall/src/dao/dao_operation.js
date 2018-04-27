////////////////////////////////////////////////////////////
// 运营设置参数的数据库读写逻辑
////////////////////////////////////////////////////////////

//==============================================================================
// import
//==============================================================================

//------------------------------------------------------------------------------
// 工具
//------------------------------------------------------------------------------
var _ = require('underscore');
var ObjUtil = require('../buzz/ObjUtil');
var ArrayUtil = require('../utils/ArrayUtil');
var buzz_cst_error = require('../../../../consts/fish_error');

var ERROR_OBJ = buzz_cst_error.ERROR_OBJ;

//------------------------------------------------------------------------------
// 业务
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// 缓存
//------------------------------------------------------------------------------
var CacheOperation = require('../buzz/cache/CacheOperation');

//------------------------------------------------------------------------------
// 配置表
//------------------------------------------------------------------------------

//==============================================================================
// const
//==============================================================================
var DEBUG = 0;
var ERROR = 1;
var TAG = "【dao_operation】";

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.reload = reload;
exports.loadAll = loadAll;
exports.read = read;
exports.update = update;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 重置数据.
 */
function reload(pool, cb) {
    const FUNC = TAG + "read() --- ";
    //----------------------------------

    // TODO
}

/**
 * 批量插入连接日志.
 */
function loadAll(pool, cb) {
    const FUNC = TAG + "read() --- ";
    //----------------------------------

    _didRead(pool, function(err, results) {
        CacheOperation.init(results);
        cb();
    });
}

/**
 * 批量插入连接日志.
 */
function read(pool, cb) {
    const FUNC = TAG + "read() --- ";
    //----------------------------------

    _didRead(pool, function(err, results) {

    });
}

/**
 * 
 */
function update(pool, data, cb) {
    const FUNC = TAG + "update() --- ";
    //----------------------------------

    _didUpdate(pool, data, cb);
}


//==============================================================================
// private
//==============================================================================

/**
 * 读取对应类型的运营配置
 */
function _didRead(pool, cb) {
    const FUNC = TAG + "_didRead() --- ";
    DEBUG = 0;
    //----------------------------------
    var sql = "";
    sql += "SELECT * ";
    sql += "FROM `tbl_operation` ";

    var sql_data = [];

    if (DEBUG) logger.info(FUNC + 'sql:\n', sql);
    if (DEBUG) logger.info(FUNC + 'sql_data:\n', sql_data);
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            if (ERROR) logger.error(FUNC + "err:\n", err);
            if (ERROR) logger.error(FUNC + 'sql:\n', sql);
            if (ERROR) logger.error(FUNC + 'sql_data:\n', sql_data);
        } else {
            if (DEBUG) logger.info(FUNC + 'result: ', result);
        }
        cb(err, result);
        DEBUG = 0;
    });
}

function _didWrite(pool, new_operation_list, cb) {
    const FUNC = TAG + "_didWrite() --- ";
    DEBUG = 0;
    //----------------------------------
    var count = new_operation_list.length;
    var sql = "";
    sql += "INSERT `tbl_operation` ";
    sql += '(`desc`,`value`,`type`) ';
    sql += 'VALUES ';
    for (var i = 0; i < count; i++) {
        if (i > 0) sql += ',';
        sql += '(?,?,?)';
    }

    var sql_data = [];
    for (var i = 0; i < count; i++) {
        var one_operation = new_operation_list.shift();
        sql_data.push(one_operation.desc);
        sql_data.push(one_operation.value);
        sql_data.push(one_operation.type);
    }

    if (DEBUG) logger.info(FUNC + 'sql:\n', sql);
    if (DEBUG) logger.info(FUNC + 'sql_data:\n', sql_data);
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            if (ERROR) logger.error(FUNC + "err:\n", err);
            if (ERROR) logger.error(FUNC + 'sql:\n', sql);
            if (ERROR) logger.error(FUNC + 'sql_data:\n', sql_data);
        } else {
            if (DEBUG) logger.info(FUNC + 'result: ', result);
        }
        cb(err, result);
        DEBUG = 0;
    });
}

function _didUpdate(pool, data, cb) {
    const FUNC = TAG + "_didUpdate() --- ";
    DEBUG = 0;
    //----------------------------------
    var sql = "";
    sql += "UPDATE `tbl_operation` ";
    sql += 'SET `value`=`value`-1 ';
    sql += 'WHERE `cfg_id`=? ';

    var sql_data = [data.cfg_id];

    if (DEBUG) logger.info(FUNC + 'sql:\n', sql);
    if (DEBUG) logger.info(FUNC + 'sql_data:\n', sql_data);
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            if (ERROR) logger.error(FUNC + "err:\n", err);
            if (ERROR) logger.error(FUNC + 'sql:\n', sql);
            if (ERROR) logger.error(FUNC + 'sql_data:\n', sql_data);
        } else {
            if (DEBUG) logger.info(FUNC + 'result: ', result);
        }
        cb(err, result);
        DEBUG = 0;
    });
}

function _updateAll(pool, list, cb) {
    const FUNC = TAG + "_updateAll() --- ";
    var keys = _.keys(list);
    if (DEBUG) logger.info(FUNC + "keys:", keys);
    if (DEBUG) logger.info(FUNC + "list:", list);
    DEBUG = 0;
    //----------------------------------
    var sql = "";
    sql += "UPDATE `tbl_operation` ";
    sql += "SET `cfg_id` = CASE id ";
    for (var idx in keys) {
        sql += "    WHEN " + keys[idx] + " THEN " + list["" + keys[idx]]['cfg_id'] + " ";
    }
    sql += "END, ";
    sql += "`desc` = CASE id ";
    for (var idx in keys) {
        sql += "    WHEN " + keys[idx] + " THEN '" + list["" + keys[idx]]['desc'] + "' ";
    }
    sql += "END, ";
    sql += "`value` = CASE id ";
    for (var idx in keys) {
        sql += "    WHEN " + keys[idx] + " THEN " + list["" + keys[idx]]['value'] + " ";
    }
    sql += "END ";

    var sql_data = [];

    // DEBUG = 0;
    if (DEBUG) logger.info(FUNC + 'sql:\n', sql);
    if (DEBUG) logger.info(FUNC + 'sql_data:\n', sql_data);
    // DEBUG = 0;
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            if (ERROR) logger.error(FUNC + "err:\n", err);
            if (ERROR) logger.error(FUNC + 'sql:\n', sql);
            if (ERROR) logger.error(FUNC + 'sql_data:\n', sql_data);
        } else {
            if (DEBUG) logger.info(FUNC + 'result: ', result);
        }
        cb(err, result);
        DEBUG = 0;
    });
}


//==============================================================================
// 需要转移
//==============================================================================

