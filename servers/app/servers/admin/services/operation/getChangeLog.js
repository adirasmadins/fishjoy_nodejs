const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../models/index').REDISKEY;

const STATUS = {
    0: "待确认",
    1: "失败",
    2: "成功",
    3: "取消",
};

/**
 * 获取CIK日志
 * @param {*} data 
 * { startDate: '2018-03-19',
  endDate: '2018-03-19',
  start: '1',
  length: '500',
  filter:
   { orderCatalog: [ '1', '2', '3' ],
     orderStatus: [ '1', '2', '3', '4' ] } }
可选参数uid
 */
exports.get = async function (data, ctx) {
    console.log('data:', data);

    let blacklist = await getBlackList();

    const rows = await fetchRows(data.startDate, data.endDate, data.filter, data.uid);
    const pages = Math.ceil(rows / data.length);

    let start = (+data.start - 1) * +data.length;
    let length = +data.length;
    let rawData = await findChangeLogByTimeRangeAndFilter(data.startDate, data.endDate, data.filter, start, length, data.uid);

    let chart = await makeChart(rawData, blacklist);

    // 手动发货设置为1
    editable = tools.BuzzUtil.isVersionCikByHand() ? 1 : 0;

    return {
        rows: rows,
        pages: pages,
        chart: chart,
        editable: editable
    };
};

async function getBlackList() {
    let blacklist = await tools.RedisUtil.smembers(REDISKEY.GLOBAL_DATA.BLACKLIST);
    logger.error('blacklist:', blacklist);
    return blacklist;
}

/**
 * 获取日志数量总数.
 * @param {String} startDate YYYY-MM-DD
 * @param {String} endDate YYYY-MM-DD
 * @param {String} filter 
 * @param {String} uid 玩家ID列表
 */
async function fetchRows(startDate, endDate, filter, uid) {
    let catalog = filter.orderCatalog;
    let status = filter.orderStatus;
    let sql = '';
    if (uid) {
        sql = SQL_CONFIG.getChangeLogOfUserCount.replace('|uid_list|', uid);
    }
    else {
        sql = SQL_CONFIG.getChangeLogCount;
    }
    sql = sql.replace('|catalog|', catalog).replace('|status|', status);
    let sql_data = tools.ObjUtil.makeSqlDataFromTo(startDate, endDate);

    logger.error('sql:', sql);
    return (await tools.SqlUtil.query(sql, sql_data))[0].rows || 0;
}

async function findChangeLogByTimeRangeAndFilter(startDate, endDate, filter, start, length, uid) {
    let catalog = filter.orderCatalog;
    let status = filter.orderStatus;

    let sql = '';
    if (uid) {
        sql = SQL_CONFIG.getChangeLogOfUser.replace('|uid_list|', uid);
    }
    else {
        sql = SQL_CONFIG.getChangeLog;
    }
    sql = sql.replace('|catalog|', catalog).replace('|status|', status);

    let sql_data = tools.ObjUtil.makeSqlDataFromTo(startDate, endDate);
    sql_data.push(start);
    sql_data.push(length);

    logger.error('sql:', sql);
    logger.error('sql_data:', sql_data);

    return await tools.SqlUtil.query(sql, sql_data);
}


/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
async function makeChart(list, blacklist) {
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let changeData = list[i];
        let createTime = tools.DateUtil.format(changeData.created_at, tools.DateUtil.FMT.DT);
        let confirmTime = tools.DateUtil.format(changeData.ship_at, tools.DateUtil.FMT.DT);
        let test = +await tools.RedisUtil.hget(REDISKEY.TEST, changeData.uid);
        let inBlacklist = tools.ArrayUtil.contain(blacklist, '' + changeData.uid);
        let isCheater = inBlacklist || (test < 0);
        ret.push({
            orderId: changeData.orderid,
            uid: changeData.uid,
            createTime: createTime,
            confirmTime: confirmTime,
            phoneNumber: changeData.phone,
            itemId: changeData.itemname,
            receiver: changeData.name,
            address: changeData.address,
            serial: changeData.card_num,
            password: '******',
            way: changeData.way,
            thingnum: changeData.thingnum,
            catalog: changeData.catalog,
            status: changeData.status,
            statusText: STATUS[changeData.status],
            confirmBy: 'TODO',
            isCheater: isCheater,
        });
    }
    return ret;
}
