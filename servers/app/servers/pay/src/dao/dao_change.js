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
const tools = require('../../../../utils/tools');

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
 * TODO: 订单的数据需要及时更新到数据库
 * 订单数据会有更新，也会有插入, 需要研究如何在一个SQL语句中完成
 * 两种方法: INSERT, REPLACE
 * INSERT: 先尝试插入, 若主键存在则更新
 * REPLACE: 先尝试插入, 若主键存在删除原有记录再INSERT
 * 综合考虑, 建立订单时就在数据库插入, 这里需要做的就是更新操作
 * 可以更新的字段如下
 * ship_at: 发货时间
 * status: 订单状态
 * thingnum: 物流单号
 * way: 物流渠道
 * card_num: 充值卡卡号
 * card_pwd: 充值卡卡密
 * 
 */
function _updateAll(pool, list, cb) {
    const FUNC = TAG + "_updateAll() --- ";
    var keys = _.keys(list);
    DEBUG = 0;
    if (DEBUG) logger.info(FUNC + "keys:", keys);
    if (DEBUG) logger.info(FUNC + "list:", list);
    DEBUG = 0;
    const ALTERABLE_FIELD = [
        { field: 'ship_at', type: 'timestamp'}, 
        { field: 'status', type: 'number'},  
        { field: 'thingnum', type: 'string'}, 
        { field: 'way', type: 'string'}, 
        { field: 'card_num', type: 'card_num'}, 
        { field: 'card_pwd', type: 'card_pwd'}, 
    ];
    //----------------------------------
    var sql = "";
    sql += "UPDATE `tbl_change_log` ";
    sql += "SET ";
    for (var i = 0; i < ALTERABLE_FIELD.length; i++) {
        var field_info = ALTERABLE_FIELD[i];
        var field = field_info.field;
        var type = field_info.type;
        sql += "`" + field + "` = CASE orderid ";
        for (var idx in keys) {
            if (keys[idx]) {
                var value = list["" + keys[idx]][field];
                if (type == 'timestamp' && value != null) {
                    value = "'" + DateUtil.format(new Date(value), "yyyy-MM-dd hh:mm:ss") + "'";
                }
                else if (type == 'string' && value != null) {
                    value = "'" + value + "'";
                }
                if (value == undefined) {
                    value = null;
                }
                sql += "    WHEN '" + keys[idx] + "' THEN " + value + " ";
            }
        }
        sql += "END";
        if (i < ALTERABLE_FIELD.length - 1) {
            sql += ", ";
        }
    }

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

async function cancelCik(orderid, cb) {
    const FUNC = TAG + "cancelCik() --- ";
    //----------------------------------
    var sql = "";
    sql += "UPDATE `tbl_change_log` ";
    sql += "SET `status`=3 ";
    sql += "WHERE orderid=? ";

    var sql_data = [orderid];

    let ret = await tools.SqlUtil.query(sql, sql_data);

    cb && cb(null, ret);
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

