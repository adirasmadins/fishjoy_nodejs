const CachePropose = require('../buzz/cache/CachePropose');
const CacheUserInfo = require('../buzz/cache/CacheUserInfo');
const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../models/index').REDISKEY;


const TAG = "【dao_feedback】";

const fields = [
    // { name: "uid", type: "number", save: 1 },
    // { name: "text", type: "string", save: 1 },
    // { name: "time", type: "timestamp", save: 1 },
    {name: "like_uids", type: "array", save: 1},
    {name: "like_count", type: "number", save: 1},
];


//=======================================================================================
// public
//=======================================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.insertMsg = insertMsg;
exports.saveAll = saveAll;
exports.loadAll = loadAll;
exports.loadHot4 = loadHot4;
exports.loadUserInfo = loadUserInfo;
exports.loadAllUserInfo = loadAllUserInfo;
exports.del = del;
exports.update = update;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

function insertMsg(uid, text) {
    let sql = "";
    sql += "INSERT INTO `tbl_propose` ";
    sql += "(uid, text) ";
    sql += "VALUES (?, ?)";

    let sql_data = [uid, text];

    return new Promise(function (resole, reject) {
        mysqlConnector.query(sql, sql_data, function (err, rows) {
            if (err) {
                reject(err);
                return;
            }
            resole(rows.insertId);
        });
    });
}

function saveAll() {
    const FUNC = TAG + "saveAll() --- ";

    let keys = CachePropose.keys();

    let id_collection = keys.id_collection;
    let list = keys.list;

    if (id_collection.length > 0) {
        let sql = "";
        sql += "UPDATE `tbl_propose` ";
        for (let i = 0; i < fields.length; i++) {
            let field = fields[i];
            if (field.save) {
                sql += _case(list, field.name, field.type, i == 0, i == fields.length - 1);
            }
        }
        sql += "WHERE id IN (" + id_collection + ")";

        let sql_data = [];

        logger.info("sql: ", sql);
        logger.info("sql_data: ", sql_data);
        logger.info("sql.length: ", sql.length);

        mysqlConnector.query(sql, sql_data, function (err, rows) {
            logger.error("err: ", err);
            logger.info("rows: ", rows);
            logger.info(FUNC + "留言更新完毕, 共更新留言" + id_collection.length + "条");
        });
    }
}

function loadAll(len) {
    let sql = "SELECT id,uid,text,time,like_uids FROM `tbl_propose` ORDER BY id DESC limit ?";
    return new Promise(function (resole, reject) {
        mysqlConnector.query(sql, [len], async function (err, res) {
            if (err) {
                reject(err);
                return;
            }
            let testList = await getTestList(res);
            for (let i = 0; i < res.length; i++) {
                res[i].test = testList[i];
            }
            resole(res);
        });
    });
}

/**
 * 获取留言玩家的test字段(玩家没有在redis中test统一设置为-1)并设置到每一条留言者信息中.
 * @param {*} accountList 留言者信息列表
 */
async function getTestList(accountList) {
    let data = [];
    for (let i = 0; i < accountList.length; i++) {
        data.push(['hget', REDISKEY.TEST, accountList[i].uid]);
    }
    let testList = await tools.RedisUtil.multi(data);
    for (let i = 0; i < testList.length; i++) {
        testList[i] = parseInt(testList[i]);
        if (!(testList[i] >= 0)) {
            testList[i] = -1;
        }
    }
    return testList;
}

function loadHot4(HOT4LEN) {
    let sql = "SELECT id,uid,text,time,like_uids FROM `tbl_propose` ORDER BY like_count DESC limit ?";
    return new Promise(function (resole, reject) {
        mysqlConnector.query(sql, [HOT4LEN], async function (err, res) {
            if (err) {
                reject(err);
                return;
            }
            let testList = await getTestList(res);
            for (let i = 0; i < res.length; i++) {
                res[i].test = testList[i];
            }
            resole(res);
        });
    });
}

/**
 * 加载指定用户信息
 */
function loadUserInfo(pool, uid, cb) {
    const FUNC = TAG + "loadUserInfo() --- ";

    logger.info(FUNC + "CALL...");

    let sql = "";
    sql += "SELECT a.id AS uid";
    sql += ", a.tempname AS tempname";
    sql += ", a.nickname AS nickname";
    sql += ", a.channel_account_name AS channel_account_name";
    sql += ", i.web_url AS figure ";
    sql += ", a.figure AS figureid ";//20170925 add
    sql += "FROM `tbl_account` AS a, `tbl_img` AS i ";
    sql += "WHERE a.figure = i.id ";
    sql += "AND a.id IN (" + uid + ") ";

    let sql_data = [];


    pool.query(sql, sql_data, function (err, rows) {
        if (err) {
            cb();
            return;
        }
        if (rows && rows.length > 0) {
            CacheUserInfo.push(rows[0]);
        }
        cb();
    });
}

/**
 * 加载所有用户信息
 */
function loadAllUserInfo(uid_list, cb) {
    const FUNC = TAG + "loadAllUserInfo() --- ";

    logger.info(FUNC + "CALL...");

    if (uid_list.length == 0) {
        logger.info(FUNC + "加载了0个玩家数据到公告板缓存中");
        cb();
        return;
    }

    let sql = "";
    sql += "SELECT a.id AS uid";
    sql += ", a.tempname AS tempname";
    sql += ", a.nickname AS nickname";
    sql += ", a.channel_account_name AS channel_account_name";
    sql += ", i.web_url AS figure ";
    sql += ", a.figure AS figureid ";
    sql += "FROM `tbl_account` AS a, `tbl_img` AS i ";
    sql += "WHERE a.figure = i.id ";
    if (uid_list) {
        sql += "AND a.id IN (" + uid_list + ") ";
    }

    let sql_data = [];


    mysqlConnector.query(sql, sql_data, function (err, rows) {
        logger.info(FUNC + "加载了" + rows.length + "个玩家数据到公告板缓存中");
        if (rows && rows.length > 0) {
            for (let i = 0; i < rows.length; i++) {
                rows[i].figure = rows[i].figure;
            }
        }
        CacheUserInfo.loadAll(rows);
        cb();
    });
}

/**
 * 刪除留言.
 */
function del(mid) {
    const FUNC = TAG + "del() --- ";

    let sql = "";
    sql += "DELETE FROM tbl_propose ";
    sql += "WHERE id IN (" + mid + ")";

    let sql_data = [];

    logger.info(FUNC + "sql: ", sql);
    logger.info(FUNC + "sql_data: ", sql_data);

    mysqlConnector.query(sql, sql_data, function (err, rows) {
        err && logger.error(FUNC + "err: ", err);
        logger.info(FUNC + "rows: ", rows);
    });
}


//=======================================================================================
// private
//=======================================================================================

/**
 * 返回一个SET...END条件.
 * @param field 需要更新的字段名名(string类型).
 * @param isLast 是否最后一个SET...END子句(bool类型).
 * @param type 更新的数据类型，取值string, number, bool.
 */
function _case(list, field, type, isFirst, isLast) {
    let sql = "";
    if (isFirst) {
        sql += "SET ";
    }
    sql += field + " = CASE id ";
    for (let i = 0; i < list.length; i++) {
        let id = list[i].id;
        let field_value = list[i][field];
        sql += "WHEN " + id + " THEN ";
        switch (type) {
            case "string":
                sql += "'" + field_value + "' ";
                break;
            case "array":
                sql += "'" + field_value.toString() + "' ";
                break;
            case "number":
                sql += field_value + " ";
                break;
        }
    }
    if (isLast) {
        sql += "END ";
    }
    else {
        sql += "END, ";
    }
    return sql;
}

function update(mid, uids, uid, like_count) {
    uids.push(uid);
    let like_uids = JSON.stringify(uids).replace("[", "").replace("]", "");
    let sql = "update tbl_propose set like_uids=? ,like_count=? where id=?";
    let sql_data = [like_uids, like_count, mid];
    mysqlConnector.query(sql, sql_data, function (err) {
        if (err) {
            logger.error(err);
        }
    });
}