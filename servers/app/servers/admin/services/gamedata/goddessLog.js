const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

const TYPE_STRING = {
    1: '进入',
    2: '过关',
    3: '结算',
    4: '跳关',
};

/**
 * 获取女神日志接口的返回值
 * @param {*} data {startDate:'YYYY-MM-DD', endDate:'YYYY-MM-DD', start:1, length:100, uid:'1,2,3', type:'1,2,3'} 
 */
exports.get = async function (data, ctx) {
    logger.error('------data:', data);
    const rows = await fetchRows(data.startDate, data.endDate, data.uid, data.type);
    const pages = Math.ceil(rows / data.length);
    let list = await fetchData(data.startDate, data.endDate, +data.start, +data.length, data.uid, data.type);
    let chart = makeChart(list);

    return {
        rows: rows,
        pages: pages,
        chart: chart
    };
};

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
function makeChart(list) {
    logger.error('list:', list.length);
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let rowData = list[i];
        let time = tools.DateUtil.format(rowData.log_at, tools.DateUtil.FMT.DT);
        ret.push({
            time: time,//记录日期
            id: rowData.id,//日志ID
            uid: rowData.account_id,//UID
            nickname: 'TODO',//玩家昵称
            wave: rowData.wave,//过关数
            type: rowData.type,//类型(不显示)
            typeString: `${rowData.type}-${TYPE_STRING[rowData.type]}`, //类型(前端显示)
        });
    }
    return ret;
}

/**
 * 获取指定日期的数据.
 * @param {*} startDate 开始日期, 格式为YYYY-MM-DD
 * @param {*} endDate 结束日期, 格式为YYYY-MM-DD
 * @param {*} start 开始索引
 * @param {*} length 数据长度
 * @param {*} uid 玩家ID列表, 如果不为空表示查询指定玩家数据
 * @param {*} type 过滤类型(1,2,3)
 */
async function fetchData(startDate, endDate, start, length, uid, type) {
    let sql = SQL_CONFIG.getCommonLog;
    sql = handleSql(sql, 'tbl_goddess_log', uid, type);

    let sql_data = tools.ObjUtil.makeSqlDataFromTo(startDate, endDate);
    sql_data.push(start == 1 ? 0 : start);
    sql_data.push(length);

    // logger.info('sql:\n', sql);
    // logger.info('sql_data:\n', sql_data);

    return await tools.SqlUtil.query(sql, sql_data);
}

/**
 * 获取日志数量总数.
 * @param {*} startDate 开始日期, 格式为YYYY-MM-DD
 * @param {*} endDate 结束日期, 格式为YYYY-MM-DD
 * @param {*} uid 过滤玩家列表
 * @param {*} type 过滤类型
 */
async function fetchRows(startDate, endDate, uid, type) {
    let sql = SQL_CONFIG.getCommonLogCount;
    sql = handleSql(sql, 'tbl_goddess_log', uid, type);

    let sql_data = tools.ObjUtil.makeSqlDataFromTo(startDate, endDate);

    // logger.info('sql:\n', sql);
    // logger.info('sql_data:\n', sql_data);

    let ret = await tools.SqlUtil.query(sql, sql_data);
    return ret[0].rows;
}

function handleSql(sql, tableName, uid, type) {
    return sql
    .replace('|table_name|', tableName)
    .replace('|extra_condition|', getExtraCondition(uid, type));
}

function getExtraCondition(uid, type) {
    let extra_condition = '';
    if (uid && uid.length > 0) {
        extra_condition += ` AND account_id in (${uid})`;
    }
    if (type && type.length > 0) {
        extra_condition += ` AND type in (${type})`;
    }
    return extra_condition;
}