const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取登录日志接口需要的返回值
 * @param {*} data {date:'YYYY-MM-DD', start:1, length:100, uid:'1,2,3'} 
 */
exports.get = async function (data, ctx) {
    logger.error('------data:', data);
    const rows = await fetchRows(data.date, data.uid);
    const pages = Math.ceil(rows / data.length);
    let chart = makeChart(await fetchData(data.date, Number(data.start), Number(data.length), data.uid), data);

    await fillChart(chart);

    return {
        rows: rows,
        pages: pages,
        chart: chart
    };
};

/**
 * 填充tbl_login_log缺失的数据如: nickname, recharge, deviceId, loginTimesToday, loginTimesTotal
 * @param {*} chart 
 */
async function fillChart(chart) {
    // 统计UID
    let uid_list = [];
    let loginTimes = {};// 登录次数统计
    for (let i = 0; i < chart.length; i++) {
        let uid = chart[i].uid;
        uid_list.push(uid);
        undefined == loginTimes[uid] ? loginTimes[uid] = 1 : loginTimes[uid]++;
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
                chart[i].recharge = account.rmb;
                if (tools.BuzzUtil.isVersionChina()) {
                    chart[i].recharge /= 100;
                }
                chart[i].deviceId = account.deviceId || 'TODO';
                chart[i].loginTimesToday = loginTimes[uid];
                chart[i].loginTimesTotal = account.login_count;
            }
            else {
                chart[i].nickname = 'ERROR:' + i;
                chart[i].recharge = 'ERROR:' + i;
                chart[i].deviceId = 'ERROR:' + i;
                chart[i].loginTimesToday = 'ERROR:' + i;
                chart[i].loginTimesTotal = 'ERROR:' + i;
            }
        }
    }
}

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
function makeChart(list, data) {
    let start = data.start;
    let length = data.length;
    logger.error('list:', list.length);
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let loginData = list[i];
        let time = tools.DateUtil.format(loginData.log_at, tools.DateUtil.FMT.DT);
        ret.push({
            time: time,
            id: loginData.id,
            uid: loginData.account_id,
            nickname: 'TODO',
            playerLevel: loginData.level || 'TODO',//登录时等级
            recharge: 'TODO',
            deviceId: loginData.deviceId || 'TODO',
            ip: loginData.ip || 'TODO',
            loginTimesToday: 'TODO',
            loginTimesTotal: 'TODO'
        });
    }
    return ret;
}

/**
 * 获取指定日期的数据.
 * @param {*} date 指定的日期, 格式为YYYY-MM-DD
 * @param {*} start 开始索引
 * @param {*} length 数据长度
 * @param {*} uid 玩家ID列表, 如果不为空表示查询指定玩家数据
 */
async function fetchData(date, start, length, uid) {
    let sql_data = tools.ObjUtil.makeSqlDataFromTo(date, date);
    sql_data.push(start == 1 ? 0 : start);
    sql_data.push(length);
    let sql = SQL_CONFIG.getLoginLog;
    if (uid) {
        sql = SQL_CONFIG.getPlayerLoginLog.replace('uid_list', uid);
    }
    logger.info('sql:\n', sql);
    logger.info('sql_data:\n', sql_data);
    return await tools.SqlUtil.query(sql, sql_data);
}

/**
 * 获取日志数量总数.
 * @param {*} date 指定的日期, 格式为YYYY-MM-DD
 * @param {*} uid 玩家ID列表, 如果不为空表示查询指定玩家数据
 */
async function fetchRows(date, uid) {
    let sql_data = tools.ObjUtil.makeSqlDataFromTo(date, date);
    let sql = SQL_CONFIG.loginLogCount;
    if (uid) {
        sql = SQL_CONFIG.playerLoginLogCount.replace('uid_list', uid);
    }
    logger.info('sql:\n', sql);
    logger.info('sql_data:\n', sql_data);
    let ret = await tools.SqlUtil.query(sql, sql_data);
    return ret[0].rows;
}