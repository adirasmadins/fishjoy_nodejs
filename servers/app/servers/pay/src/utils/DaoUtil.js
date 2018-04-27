////////////////////////////////////////
// DaoUtil
// 数据库(关系数据库)访问工具集
//--------------------------------------
// 如何使用
// var DaoUtil = require('src/utils/DaoUtil');
// DaoUtil.func(params...);
////////////////////////////////////////

var TAG = "【DaoUtil】";

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.insert = insert;//增
exports.insertMassive = insertMassive;//增

exports.del = del;//删
exports.query = query;//查
exports.update = update;//改


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
/**
 * 插入一条数据记录.
 * 参考SQL语句
 * INSERT INTO tbl_name (col1,col2) VALUES(15,col1*2);
 * 使用方法:
 * insert('tbl_gold_log', ['field1', 'field2'], [val1, val2], cb);
 */
function insert(table, field_list, value_list, cb) {
    const FUNC = TAG + "insert() --- ";

    let sql = "";
    sql += "INSERT INTO " + table + " (";
    if (_hasList(field_list)) {
        for (let i = 0; i < field_list.length; i++) {
            if (i > 0) sql += ", ";
            sql += field_list[i];
        }
    }
    sql += ") VALUES(";
    if (_hasList(value_list)) {
        for (let i = 0; i < value_list.length; i++) {
            if (i > 0) sql += ", ";
            sql += value_list[i];
        }
    }
    sql += ")";
    let sql_data = [];

    mysqlConnector.query(sql, sql_data, function(err, results) {
        const ERROR_HINT = "数据库插入错误";
        _handleResults(sql, sql_data, FUNC, ERROR_HINT, err, results, cb);
    });

}

/**
 * 批量增加数据
 * 参考SQL语句
INSERT INTO `tbl_gold_log` 
(col1,col2) 
VALUES 
(?,?),(?,?),(?,?),(?,?)
 * 使用方法:
 * insertMassive('tbl_gold_log', ['field1', 'field2'], [[val1, val2],[val1, val2]], cb);
 */
function insertMassive(table, field_list, value_list, cb) {
    const FUNC = TAG + "insertMassive() --- ";

    let sql = "";
    sql += "INSERT INTO " + table + " (";
    if (_hasList(field_list)) {
        for (let i = 0; i < field_list.length; i++) {
            if (i > 0) sql += ", ";
            sql += field_list[i];
        }
    }
    sql += ") VALUES";
    if (_hasList(value_list)) {
        for (let i = 0; i < value_list.length; i++) {
            let oneRecord = value_list[i];
            if (i > 0) sql += ", ";
            sql += "(";
            for (let j = 0; j < oneRecord.length; j++) {
                if (j > 0) sql += ", ";
                sql += oneRecord[j];
            }
            sql += ")";
        }
    }
    let sql_data = [];

    mysqlConnector.query(sql, sql_data, function(err, results) {
        const ERROR_HINT = "数据库批量插入错误";
        _handleResults(sql, sql_data, FUNC, ERROR_HINT, err, results, cb);
    });

}

/**
 * 删除数据表中的记录(可按条件删除).
 * 参考SQL语句
 * DELETE FROM tbl_name WHERE field=value;
 * 使用方法:
 * del('tbl_gold_log', [{field:'account_id', operator:'=', value:21}], cb);
 */
function del(table, where, cb) {
    const FUNC = TAG + "del() --- ";

    let sql = "";
    sql += "DELETE FROM " + table + " ";
    if (_hasList(where)) {
        sql += " WHERE ";
        for (let i = 0; i < where.length; i++) {
            if (i > 0) sql += " AND ";
            sql += where[i].field;
            sql += where[i].operator;
            sql += where[i].value;
        }
    }
    let sql_data = [];

    mysqlConnector.query(sql, sql_data, function(err, results) {
        const ERROR_HINT = "数据库删除错误";
        _handleResults(sql, sql_data, FUNC, ERROR_HINT, err, results, cb);
    });
}

/**
 * 查询数据库(可按条件查询).
 * 使用方法:
 * query('tbl_gold_log', [], [{field:'account_id', operator:'=', value:21}], cb);
 */
function query(table, field_list, where, cb) {
    const FUNC = TAG + "query() --- ";

    let sql = "";
    if (!_hasList(field_list)) sql += "SELECT * ";
    else {
        sql += "SELECT ";
        for (let i = 0; i < field_list.length; i++) {
            if (i > 0) sql += ", ";
            sql += field_list[i] + " ";
        }
    }
    sql += "FROM " + table;
    if (_hasList(where)) {
        sql += " WHERE ";
        for (let i = 0; i < where.length; i++) {
            if (i > 0) sql += " AND ";
            sql += where[i].field;
            sql += where[i].operator;
            sql += where[i].value;
        }
    }
    let sql_data = [];

    mysqlConnector.query(sql, sql_data, function(err, results) {
        const ERROR_HINT = "数据库查询错误";
        _handleResults(sql, sql_data, FUNC, ERROR_HINT, err, results, cb);
    });

}

/**
 * 更新数据库(可按条件更新).
 * 使用方法:
 * update('tbl_rankgame', ["field1='value1'", "field2='value2'"], [{field:'id', operator:'=', value:21}], cb);
 */
function update(table, update_list, where, cb) {
    const FUNC = TAG + "update() --- ";

    let sql = "";
    sql += "UPDATE " + table + " ";
    sql += "SET ";
    for (let i = 0; i < update_list.length; i++) {
        if (i > 0) sql += ", ";
        sql += update_list[i];
    }
    if (_hasList(where)) {
        sql += " WHERE ";
        for (let i = 0; i < where.length; i++) {
            if (i > 0) sql += " AND ";
            sql += where[i].field;
            sql += where[i].operator;
            sql += where[i].value;
        }
    }
    let sql_data = [];

    mysqlConnector.query(sql, sql_data, function(err, results) {
        const ERROR_HINT = "数据库更新错误";
        _handleResults(sql, sql_data, FUNC, ERROR_HINT, err, results, cb);
    });

}

//==============================================================================
// private
//==============================================================================
/** 传入的数组参数不为空且元素个数大于0 */
function _hasList(list) {
    return list && list.length > 0;
}

/** 处理SQL执行后的返回值 */
function _handleResults(sql, sql_data, FUNC, ERROR_HINT, err, results, cb) {
    if (err) {
        logger.error(FUNC + "err:", err);
        logger.error(FUNC + "sql:", sql);
        logger.error(FUNC + "sql_data:", sql_data);
        return cb && cb(new Error(ERROR_HINT));
    }
    cb && cb(null, results);
}
