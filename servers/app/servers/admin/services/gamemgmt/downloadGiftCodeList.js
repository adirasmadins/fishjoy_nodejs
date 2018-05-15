const nodeExcel = require('excel-export');
const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 下载礼包码列表(一次下载一个Excel文件, 列出该批次所有礼品码使用情况)
 * @param {*} data data: { time: '2018-03-23 11:00:00' }
 */
exports.get = async function (data, ctx) {
    // logger.error('data:', data);

    try {
        let fileName = 'GiftCode_' + tools.DateUtil.format(data.time, 'YYYYMMDD_HHmmss') + '.xlsx';
        let oriData = await fetch(data.time, ctx);
        // logger.error('oriData:', oriData);
        let excel = makeExcel(oriData);
        // logger.error('excel:', excel);
        return {
            fileName: fileName,
            excel: excel
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

async function fetch(time, ctx) {
    return await tools.SqlUtil.query(SQL_CONFIG.downloadGiftCodeList, [time]);
}

function makeExcel(oriData) {
    var conf = {};
    conf.cols = [
        {
            caption: 'Gift Code',
            type: 'string',
        },
        {
            caption: 'Limit',
            type: 'number',
        },
        {
            caption: 'Used Times',
            type: 'number',
        },
    ];
    conf.rows = [];
    for (let i = 0; i < oriData.length; i++) {
        let info = oriData[i];
        conf.rows.push([
            info.cd_key,
            info.limit,
            info.usedNum,
        ]);
    }
    return nodeExcel.execute(conf);
}
