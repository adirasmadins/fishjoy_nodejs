const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取充值日志接口需要的返回值
 * @param {*} data 
 * {
 * startDate:'YYYY-MM-DD', 
 * endDate:'YYYY-MM-DD', 
 * start:1, 
 * length:500, 
 * status:0|1,
 * uid:'123,234,345',
 * } 
 */
exports.get = async function (data, ctx) {
    logger.info('data:', data);

    let start = (+data.start - 1) * +data.length;
    let length = +data.length;

    const rows = await fetchRows(data.status, data.uid, data.startDate, data.endDate);
    const pages = Math.ceil(rows / length);

    let chart = makeChart(await fetchData(data.status, data.uid, data.startDate, data.endDate, start, length));

    await fillChart(chart);

    logger.error('rows:', rows);

    return {
        rows: rows,
        pages: pages,
        chart: chart
    };
};


/**
 * 填充缺失的数据如: nickname, itemName
 * @param {*} chart 
 */
async function fillChart(chart) {
    // 统计UID
    let uid_list = [];
    for (let i = 0; i < chart.length; i++) {
        uid_list.push(chart[i].uid);
    }
    if (uid_list.length > 0) {
        uid_list = tools.ObjUtil.unique(uid_list);
        let sql = SQL_CONFIG.queryAccount.replace('uid_list', uid_list);
        let accountArray = await tools.SqlUtil.query(sql, []);

        let accountList = {};
        for (let i = 0; i < accountArray.length; i++) {
            accountList[accountArray[i].id] = accountArray[i];
        }

        for (let i = 0; i < chart.length; i++) {
            let uid = chart[i].uid;
            let account = accountList[uid];
            if (account) {
                chart[i].nickname = account.nickname;
            }
            else {
                chart[i].nickname = 'ERROR:' + i;
            }
        }
    }

    // 获取itemName(提供一个配置表)
    // 数据库中增加一个新的字段goods_name表示购买物品的名字
}

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
function makeChart(list) {
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let order = list[i];
        let date = tools.DateUtil.format(order.created_at, tools.DateUtil.FMT.D);
        let time = tools.DateUtil.format(order.created_at, tools.DateUtil.FMT.T);
        let itemPrice = order.money;
        if (tools.BuzzUtil.isVersionChina()) {
            itemPrice /= 10;// 转换为元
        }
        ret.push({
            date: date,
            time: time,
            uid: order.game_account_id,
            nickname: 'LATER',
            orderId: order.game_order_id,
            platformId: order.channel,
            platformOrder: order.channel_order_id,
            itemId: order.goods_id,
            itemName: order.goods_name,
            itemPrice: itemPrice,
            status: getStatus(order.status),
            detail: order.channel_cb,
        });
    }
    return ret;
}

/**
 * 获取订单状态描述文字
 * @param {*} status 
 */
function getStatus(status) {
    switch (status) {
        case 0:
            return 'Succ';
        case 1:
            return 'Fail';
        default:
            return 'Unknown';
    }
}

/**
 * 获取时间段内的数据.
 * @param {Number} status 订单状态: 0-成功, 1-失败
 * @param {String} uidList 玩家uid列表
 * @param {*} startDate 开始日期, 格式为YYYY-MM-DD
 * @param {*} endDate 结束日期, 格式为YYYY-MM-DD
 * @param {*} start 分页索引
 * @param {*} length 每页显示记录条数
 */
async function fetchData(status, uidList, startDate, endDate, start, length) {
    let sql = SQL_CONFIG.getOrderList;
    if (uidList) {
        sql = SQL_CONFIG.getOrderListForUsers;
        sql = sql.replace('|uid_list|', uidList);
    }
    sql = sql.replace('|status|', status);
    let fields = tools.ObjUtil.makeSqlDataFromTo(startDate, endDate);
    fields.push(start);
    fields.push(length);
    return await tools.SqlUtil.query(sql, fields);
}

/**
 * 获取日志数量总数.
 * @param {Number} status 订单状态: 0-成功, 1-失败
 * @param {String} uidList 玩家uid列表
 * @param {*} startDate 开始日期, 格式为YYYY-MM-DD
 * @param {*} endDate 结束日期, 格式为YYYY-MM-DD
 */
async function fetchRows(status, uidList, startDate, endDate) {
    let sql = SQL_CONFIG.orderCount;
    if (uidList) {
        sql = SQL_CONFIG.orderCountForUsers;
        sql = sql.replace('|uid_list|', uidList);
    }
    sql = sql.replace('|status|', status);
    let fields = tools.ObjUtil.makeSqlDataFromTo(startDate, endDate);
    let ret = await tools.SqlUtil.query(sql, fields);
    return ret[0].sum;
}
