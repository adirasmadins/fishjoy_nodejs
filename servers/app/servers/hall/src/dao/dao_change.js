////////////////////////////////////////////////////////////
// 运营设置参数的数据库读写逻辑
////////////////////////////////////////////////////////////

//==============================================================================
// import
//==============================================================================

//------------------------------------------------------------------------------
// 工具
//------------------------------------------------------------------------------
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
var CacheChange = require('../buzz/cache/CacheChange');

//------------------------------------------------------------------------------
// 配置表
//------------------------------------------------------------------------------

//==============================================================================
// const
//==============================================================================
var DEBUG = 0;
var ERROR = 1;
var TAG = "【dao_change】";

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.reload = reload;
exports.loadAll = loadAll;
exports.insert = insert;
exports.cancelCik = cancelCik;
exports.updateShipTime = updateShipTime;
exports.updateStutus = updateStutus;
exports.updateWay = updateWay;

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
 * 加载所有的日志信息.
 */
function loadAll(pool, cb) {
    const FUNC = TAG + "read() --- ";
    //----------------------------------

    _didRead(pool, function(err, results) {
        CacheChange.init(results);
        cb();
    });
}

/**
 * 插入一条记录
 */
function insert(pool, data, cb) {
    const FUNC = TAG + "insert() --- ";
    //----------------------------------

    _didInsert(pool, data, function(err, results) {
        cb();
    });
}

function cancelCik(pool, orderid, cb) {
    const FUNC = TAG + "cancelCik() --- ";
    //----------------------------------
    var sql = "";
    sql += "UPDATE `tbl_change_log` ";
    sql += "SET `status`=3 ";
    sql += "WHERE orderid=? ";

    var sql_data = [orderid];

    handleQuery(pool, sql, sql_data, cb);
}

function updateShipTime(pool, params, cb) {
    const FUNC = TAG + "updateShipTime() --- ";
    //----------------------------------
    var orderid = params.orderid;
    var ship_at = params.ship_at;

    var sql = "";
    sql += "UPDATE `tbl_change_log` ";
    sql += "SET `ship_at`=? ";
    sql += "WHERE orderid=? ";

    var sql_data = [new Date(ship_at), orderid];

    handleQuery(pool, sql, sql_data, cb);

}

function updateStutus(pool, params, cb) {
    const FUNC = TAG + "updateStutus() --- ";
    //----------------------------------
    var orderid = params.orderid;
    var status = params.status;

    var sql = "";
    sql += "UPDATE `tbl_change_log` ";
    sql += "SET `status`=? ";
    sql += "WHERE orderid=? ";

    var sql_data = [status, orderid];

    handleQuery(pool, sql, sql_data, cb);

}

function updateWay(pool, params, cb) {
    const FUNC = TAG + "updateWay() --- ";
    //----------------------------------
    var orderid = params.orderid;
    var way = params.way;
    var thingnum = params.thingnum;

    var sql = "";
    sql += "UPDATE `tbl_change_log` ";
    sql += "SET `way`=? ";
    sql += ",`thingnum`=? ";
    sql += "WHERE orderid=? ";

    var sql_data = [way, thingnum, orderid];

    handleQuery(pool, sql, sql_data, cb);

}

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
        DEBUG = 0;
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
    DEBUG = 0;
    //----------------------------------
    var sql = "";
    sql += "SELECT *, unix_timestamp(created_at) * 1000 AS created_at ";
    sql += ", unix_timestamp(ship_at) * 1000 AS ship_at ";
    sql += "FROM `tbl_change_log` ";

    var sql_data = [];

    if (DEBUG) logger.info(FUNC + 'sql:\n', sql);
    if (DEBUG) logger.info(FUNC + 'sql_data:\n', sql_data);
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            if (ERROR) logger.error(FUNC + "err:\n", err);
            if (ERROR) logger.error(FUNC + 'sql:\n', sql);
            if (ERROR) logger.error(FUNC + 'sql_data:\n', sql_data);
        } else {
            DEBUG = 0;
            if (DEBUG) logger.info(FUNC + 'result: ', result);
        }
        cb(err, result);
        DEBUG = 0;
    });
}

/**
 * 读取对应类型的运营配置
 */
function _didInsert(pool, data, cb) {
    const FUNC = TAG + "_didInsert() --- ";
    DEBUG = 0;
    //----------------------------------
    var sql = "";
    sql += "INSERT INTO tbl_change_log ";
    sql += "(orderid, sn, uid, name, phone, address, created_at, cid, catalog, count, cost, itemname, status, icon) ";
    sql += "VALUES ";
    sql += "(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ";

    var sql_data = [
        data.orderid,
        data.sn,
        data.uid,
        data.name,
        data.phone,
        data.address,
        new Date(data.created_at),
        data.cid,
        data.catalog,
        data.count,
        data.cost,
        data.itemname,
        data.status,
        data.icon,
    ];

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



//==============================================================================
// 需要转移
//==============================================================================

