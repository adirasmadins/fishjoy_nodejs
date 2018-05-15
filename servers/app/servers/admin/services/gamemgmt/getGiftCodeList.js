const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取礼品码批次列表
 * @param {*} data {}
 */
exports.get = async function (data, ctx) {
    // logger.error('data:', data);

    try {
        let oriData = await fetchData();
        // logger.error('ret:', oriData);
        let chart = await makeChart(oriData);
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

async function fetchData() {
    return await tools.SqlUtil.query(SQL_CONFIG.getGiftCodeList, []);
}

async function makeChart(oriData) {
    let chart = [];
    let addByWho = null;
    // TODO: 获取一个管理员uid:uname的配对
    for (let i = 0; i < oriData.length; i++) {
        let info = oriData[i];
        let time = tools.DateUtil.format(info.created_at, tools.DateUtil.FMT.DT);
        let title = tools.BuzzUtil.getGiftCodeTitleFromId(info.action_id);
        let addByWho = await tools.BuzzUtil.getNameOfAdmin(info.addByWho);
        chart.push({
            time: time,//创建时间
            num: info.num,//创建个数
            usedCount: info.usedCount,//已使用个数
            limit: info.limit,//使用次数限制
            title: title,//礼包类型
            prefix: getPrefixOfGiftCode(info.cd_key),//前缀
            addByWho: addByWho,//由哪个操作员生成的礼品码
        });
    }
    return chart;
}

function getPrefixOfGiftCode(giftCode) {
    return giftCode.substring(0, 2);
}

