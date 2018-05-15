const moment = require('moment');
const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;

/**
 * 获取充值排名接口需要的返回值
 * @param {*} data {start:1, length:100, uid:'1,2,3'} 
 */
exports.get = async function (data, ctx) {
    // logger.error('data:', data);

    try {
        let start = (+data.start - 1) * +data.length;
        let length = +data.length;
        let rows = 0;
        let pages = 0;
        let chart = [];
        if (data.uid) {
            let uidList = data.uid.split(',');
            rows = uidList.length;
            chart = await makeChart(uidList, start, length);
        }
        else {
            rows = await getRows();
            chart = await gainChart(start, length);
        }
        pages = Math.ceil(rows / data.length);

        return {
            rows: rows,
            pages: pages,
            chart: chart
        };
    }
    catch (err) {
        logger.error('err:', err);
        return {
            result: false,
            err: err
        };
    }
};

async function getRows() {
    const RANK = REDISKEY.RANK;
    return await tools.RedisUtil.zcard(RANK.GAIN);
}

async function makeChart(uidList) {
    let result = [];
    let accountSet = await getAccountData(uidList);
    for (let i = 0; i < uidList.length; i++) {
        let uid = uidList[i];
        let account = accountSet[uid];
        // let credit = Math.max((account.recharge * 3 - account.cash * 3.75), 100000);
        if (account) {
            let created_at = tools.DateUtil.format(account.created_at, tools.DateUtil.FMT.DT);
            let last_online_time = tools.DateUtil.format(account.last_online_time, tools.DateUtil.FMT.DT);

            let rmb = account.rmb;
            if (tools.BuzzUtil.isVersionChina()) {
                rmb /= 100;
            }

            let profitInfo = await tools.BuzzUtil.getProfitInfoRecentHourForPlayer(uid);

            let gain_data = {
                signupTime: created_at,
                lastLoginTime: last_online_time,
                uid: uid,
                phoneNumber: 'TODO',
                nickname: account.nickname,
                playerLevel: account.level,
                vipLevel: account.vip,
                rechargeTotal: rmb,
                cashTotal: account.cash,
                gold: account.gold,
                profitTotal: 'TODO',//1000,
                profitRateTotal: 'TODO',//'-0.21%',
                profitLastHour: profitInfo.profitRecentHour,//100,
                profitRateLastHour: profitInfo.profitRateRecentHour,//'-0.21%',
                isFreeze: account.test < 0,
                freezeTime: 'TODO',//'2018-03-15 00:00:00',
                freezeReason: account.test
            };
            result.push(gain_data);
        }
    }

    return result;
}

async function gainChart(start, length) {
    const RANK = REDISKEY.RANK;
    let end = start + length;
    let uidList = await tools.RedisUtil.zrevrange(RANK.GAIN, start, end);

    return makeChart(uidList);
}

async function getAccountData(list) {
    let accountSet = {};
    if (list.length > 0) {
        let accountArray = await tools.SqlUtil.query(SQL_CONFIG.queryAccount.replace('uid_list', list.toString()), []);
        for (let i = 0; i < accountArray.length; i++) {
            accountSet[accountArray[i].id] = accountArray[i];
        }
    }
    return accountSet;
}
