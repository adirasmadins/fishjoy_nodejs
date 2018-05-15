const SQL_CONFIG = require('../../configs/sql');
const CASH_CONFIG = require('../../configs/cashControl');
const tools = require('../../../../utils/tools');

/**
 * 获取提现限制参数
 * @param {*} data {id:123} 
 */
exports.get = async function (data, ctx) {
    logger.error('data:', data);

    try {
        let oriData = fetch();
        let chart = makeChart(oriData);
        return chart;
    }
    catch(err) {
        logger.error('err:', err);
        return {
            result: false
        };
    }

};

function fetch() {
    return CASH_CONFIG;
}

async function makeChart(oriData) {
    let chart = [];
    for (let i = 0; i < oriData.length; i++) {
        let info = oriData[i];
        let value = await tools.RedisUtil.get(info.redis) || info.value;
        chart.push({
            key : info.key,//--ID
            type : info.type,//--类型1值2选项
            value : value,//--参数值
            desc : info.desc,//--描述
        });
    }
    return chart;
}

