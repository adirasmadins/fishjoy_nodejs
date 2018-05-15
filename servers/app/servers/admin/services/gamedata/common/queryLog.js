const SQL_CONFIG = require('../../../configs/sql');
const tools = require('../../../../../utils/tools');

let tableList = [];
let dateTodayTable = null;
let dateTodayQuery = null;

/**
 * 查询日志(从备份日志查询的通用方法)
 * @param {*} data {startDate:'YYYY-MM-DD', endDate:'YYYY-MM-DD', start:1, length:100, uid:[1,2,3]} 
 */
exports.get = async function (data, ctx) {
    let dateList = tools.DateUtil.getDateList(data.startDate, data.endDate, tools.DateUtil.FMT.DB);
    let dateNow = new Date();
    dateTodayTable = tools.DateUtil.format(dateNow, tools.DateUtil.FMT.DB);
    dateTodayQuery = tools.DateUtil.format(dateNow, tools.DateUtil.FMT.D);
    tableList = await tools.SqlUtil.showTablesFrom('fishjoy_bak');
    let queryTableList = getQueryTableList(dateList, data.bak_table);

    const countList = await fetchRows(queryTableList, data.bak_table, data.uid, data.sceneId, data.itemId);
    const rows = tools.ArrayUtil.sum(countList);
    const pages = Math.ceil(rows / data.length);
    let start = (+data.start - 1) * +data.length;
    let length = +data.length;

    let rawData = await fetchData(queryTableList, countList, start, length, data.bak_table, data.uid, data.sceneId, data.itemId);
    return {
        rows: rows,
        pages: pages,
        chart: rawData
    };
};

function getQueryTableList(dateList, bak_table) {
    let ret = [];

    for (let i = 0; i < dateList.length; i++) {
        let date = dateList[i];

        let tablePattern = `${bak_table}_${date}`;
        let dateTableList = getDateTableList(tableList, tablePattern);

        for (let i = 0; i < dateTableList.length; i++) {
            // 如果顺序有问题, 请使用下面的语句
            // ret.push(`${tablePattern}_${i + 1}`);
            ret.push(dateTableList[i]);
        }

        if (date == dateTodayTable) {
            ret.push(bak_table);
        }
        else {
            if (0 == dateTableList.length) {
                logger.error(`日志表不存在${tablePattern}`);
            }
        }
    }

    return ret;
}

function getDateTableList(tableList, tablePattern) {
    let ret = [];
    for (let i = 0; i < tableList.length; i++) {
        let tableName = tableList[i];
        if (tools.StringUtil.startsWith(tableName, tablePattern)) {
            ret.push(tableName);
        }
    }
    return ret;
}

/**
 * 获取日志数量总数.
 * @param {Array} queryTableList 需要查询的数据表列表 [] 每一个元素为一个表名
 * @param {String} bak_table 备份的表名(tbl_gold_log)
 * @param {String} uid 玩家ID列表, 如果不为空表示查询指定玩家数据
 * @param {String} scene 场景过滤
 * @param {*} itemId 物品列表(仅在有物品列表的表中有用如activity_log,item_log)
 */
async function fetchRows(queryTableList, bak_table, uid, scene, itemId) {
    let ret = [];
    for (let i = 0; i < queryTableList.length; i++) {
        let sql = null;
        let sql_data = [];
        let tableName = queryTableList[i];
        let extraCondition = '';
        if (bak_table == tableName) {
            sql = SQL_CONFIG.getCommonLogCount;
            sql = sql.replace('|table_name|', tableName);
            sql_data = tools.ObjUtil.makeSqlDataFromTo(dateTodayQuery, dateTodayQuery);
        }
        else {
            sql = SQL_CONFIG.getCommonLogCountHistory;
            sql = sql.replace('|table_name|', `fishjoy_bak.${tableName}`);
        }
        if (uid) extraCondition += `and account_id in (${uid})`;
        if (scene) extraCondition += `and scene in (${scene}) `;
        extraCondition += getExtraCondition(itemId);
        sql = sql.replace('|extra_condition|', extraCondition);
        let count = await tools.SqlUtil.query(sql, sql_data);
        ret.push(count[0].rows);
    }
    return ret;
}

/**
 * 获取指定日期的数据.
 * @param {Array} dateList 日期范围 [] 每一个元素日期格式为YYYYMMDD
 * @param {Array} countList 查询日期范围内的每天会查到的数据条数
 * @param {*} start 开始索引
 * @param {*} length 数据长度
 * @param {String} bak_table 备份的表名(tbl_gold_log)
 * @param {String} uid 玩家ID列表, 如果不为空表示查询指定玩家数据
 * @param {String} scene 场景过滤
 * @param {*} itemId 物品列表(仅在有物品列表的表中有用如activity_log,item_log)
 */
async function fetchData(queryTableList, countList, start, length, bak_table, uid, scene, itemId) {
    let end = start + length;
    let ret = [];
    let queryTable = tools.ObjUtil.getQueryTableParams(queryTableList, countList, start, end, length);
    for (let i = 0; i < queryTable.length; i++) {
        let params = queryTable[i];
        let tableName = params.tableName;
        let start = params.start;
        let length = params.length;
        // 表中没有需要的数据则不做查表操作
        if (0 == length) {
            continue;
        }
        let sql = null;
        let sql_data = [];

        let extraCondition = '';
        if (bak_table == tableName) {
            sql = SQL_CONFIG.getCommonLog;
            sql = sql.replace('|table_name|', tableName);
            sql_data = tools.ObjUtil.makeSqlDataFromTo(dateTodayQuery, dateTodayQuery);
        }
        else {
            sql = SQL_CONFIG.getCommonLogHistory;
            sql = sql.replace('|table_name|', `fishjoy_bak.${tableName}`);
        }
        if (uid) extraCondition += `and account_id in (${uid})`;
        if (scene) extraCondition += `and scene in (${scene}) `;
        extraCondition += getExtraCondition(itemId);
        sql = sql.replace('|extra_condition|', extraCondition);

        sql_data.push(start);
        sql_data.push(length);
        // logger.error('sql:\n', sql);
        // logger.error('sql_data:\n', sql_data);
        ret = ret.concat(await tools.SqlUtil.query(sql, sql_data));
    }
    return ret;
}

/**
 * 获取额外条件语句
 * @param {*} itemId 
 */
function getExtraCondition(itemId) {
    let extraCondition = "";
    if (itemId) {
        extraCondition = "AND itemId IN (" + itemId + ")";
    }
    return extraCondition;
}

exports.queryAccountTopupAndCash = async function(chart) {
    let uidList = getUidList(chart);
    if (uidList.length > 0) {
        let ret = await tools.SqlUtil.query(SQL_CONFIG.queryAccount.replace('uid_list', uidList.toString()), []);
        let accountSet = {};
        for (let i = 0; i < ret.length; i++) {
            let account = ret[i];
            accountSet[account.id] = {
                recharge: account.rmb,
                cash: account.cash,
            };
        }
        for (let i = 0; i < chart.length; i++) {
            let uid = chart[i].uid;
            if (accountSet[uid]) {
                chart[i].recharge = accountSet[uid].recharge;
                chart[i].cash = accountSet[uid].cash;
            }
            else {
                logger.error(`[Error]用户的信息没有查找到:uid=${uid}`);
                chart[i].recharge = 0;
                chart[i].cash = 0;
            }
            if (tools.BuzzUtil.isVersionChina()) {
                chart[i].recharge /= 100;
                chart[i].cash /= 100;
            }
        }
    }
    return chart;
};

function getUidList(list) {
    let uidSet = {};
    let uidList = [];
    for (let i = 0; i < list.length; i++) {
        uidSet[list[i].uid] = 1;
    }
    for (let uid in uidSet) {
        uidList.push(uid);
    }
    return uidList;
}
