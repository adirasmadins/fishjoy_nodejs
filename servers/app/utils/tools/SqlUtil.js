const ArrayUtil = require('./ArrayUtil');

exports.insert = insert;
exports.query = query;
exports.existTable = existTable;
exports.showTablesFrom = showTablesFrom;

/**
 * 数据库查询操作
 * @param {*} sql 
 * @param {*} fields 
 */
async function query(sql, fields) {
    return await mysqlConnector.query(sql, fields);
}

/**
 * 数据库插入操作
 * @param {*} data 
 */
function insert(table, rows) {
    return new Promise(function (resolve, reject) {
        mysqlConnector.insert(table, rows, function (err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * 获取指定数据库database中所有的表名.
 * @param {String} database 
 */
async function showTablesFrom(database) {
    let sql = `show tables from ${database}`;
    let list = await query(sql, []);
    // logger.error(`list:`, list);
    ret = [];
    for (let i = 0; i < list.length; i++) {
        ret.push(list[i][`Tables_in_${database}`]);
    }
    return ret;
}

/**
 * 查询表table是否存在
 * @param {Array} list 所有表名
 * @param {String} table 表名
 */
function existTable(list, table) {
    return ArrayUtil.contain(list, table);
}