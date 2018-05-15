const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取礼品码数据.
 * @param {*} data  {giftCode: 'UUE38I21S2,UUE38I21S2' }
 */
exports.get = async function (data, ctx) {
    // logger.error('data:', data);

    try {
        let oriData = await fetch(data.giftCode);
        logger.error('oriData:', oriData);
        let chart = makeChart(oriData);
        return chart;
    }
    catch (err) {
        logger.error('err:', err);
        return {
            result: false,
            err: err
        };
    }
};

async function fetch(giftCode) {
    let list = giftCode.split(',');
    for (let i = 0;i < list.length; i++) {
        list[i] = "'" + list[i] + "'";
    }
    let sql = SQL_CONFIG.getGiftCodeData.replace('|giftCode|', list.toString());
    return await tools.SqlUtil.query(sql, []);
}

function makeChart(list) {
    let chart = [];
    for (let i = 0;i < list.length; i++) {
        let info = list[i];
        chart.push({
            giftCode: info.cd_key,
            giftId: tools.BuzzUtil.getGiftCodeTitleFromId(info.action_id),
            limit: info.limit,
            rewardCount: info.usedNum,
            rewardUid: 'DROP'
        });
    }
    return chart;
}