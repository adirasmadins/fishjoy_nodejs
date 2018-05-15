const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取充值排名接口需要的返回值
 * @param {*} data {start:1, length:100} 
 */
exports.get = async function (data, ctx) {
    // logger.info('data:', data);
    const rows = await fetchRows(data.uid);
    const pages = Math.ceil(rows / data.length);
    let chart = makeChart(await fetchData(Number(data.start), Number(data.length)), data);

    return {
        rows: rows,
        pages: pages,
        chart:chart
    };
};

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
function makeChart(list, data) {
    let start = data.start;
    let length = data.length;
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let account = list[i];
        let signupTime = tools.DateUtil.format(account.created_at, tools.DateUtil.FMT.DT);
        let recentLoginTime = tools.DateUtil.format(account.last_online_time, tools.DateUtil.FMT.DT);
        let rechargeAmount = account.rmb;
        if (tools.BuzzUtil.isVersionChina()) {
            rechargeAmount /= 100;
        }

        ret.push({
            rank: i + 1 + (start - 1) * length,
            uid: account.id,
            nickname: account.nickname,
            channelId: account.channel_account_id,
            accountType: 'TODO',
            platformId: account.channel,
            playerLevel: account.level,
            vipLevel: account.vip,
            rechargeAmount: rechargeAmount,
            cashAmount: account.cash || 'TODO',
            gold: account.gold,
            signupTime: signupTime,
            recentLoginTime: recentLoginTime,
        });
    }
    return ret;
}

/**
 * 获取充值排名.
 * @param {*} start 开始索引
 * @param {*} length 数据长度
 */
async function fetchData(start, length) {
    return await tools.SqlUtil.query(SQL_CONFIG.topupChart, [start, length]);
}

/**
 * 获取充值玩家总数.
 */
async function fetchRows() {
    let ret = await tools.SqlUtil.query(SQL_CONFIG.topupPlayerCount, []);
    return ret[0].rows;
}
