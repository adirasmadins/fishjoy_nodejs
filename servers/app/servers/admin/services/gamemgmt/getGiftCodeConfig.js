const tools = require('../../../../utils/tools');

/**
 * 获取礼品码配置列表
 * @param {*} data  {} 
 */
exports.get = async function (data, ctx) {
    console.log('data:', data);

    try {
        let chart = makeChart();
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
function makeChart() {
    let chart = [];
    for (let i = 0; i < tools.BuzzUtil.CDKEY_LIST.length; i++) {
        let info = tools.BuzzUtil.CDKEY_LIST[i];
        let content = getItemDesc(info.reward);
        starttime = tools.DateUtil.format(info.starttime, tools.DateUtil.FMT.DT);
        endtime = tools.DateUtil.format(info.endtime, tools.DateUtil.FMT.DT);
        chart.push({
            id: info.id,
            title: info.description,
            content: content,
            startTime: starttime,
            endTime: endtime
        });
    }
    return chart;
}

function getItemDesc(itemList) {
    let content = '';
    for (let i = 0; i < itemList.length; i++) {
        if (i > 0) {
            content += '、';
        }
        let item = itemList[i];
        let itemId = item[0];
        let itemNum = item[1];
        let itemName = tools.BuzzUtil.getNameFromItemId(itemId);
        content += `${itemName}x${itemNum}`;
    }
    return content;
}