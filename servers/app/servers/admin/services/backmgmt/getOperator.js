const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取留存数据接口需要的返回值
 * @param {*} data {startDate:'YYYY-MM-DD', endDate:'YYYY-MM-DD', start:1, length:100, uid:[1,2,3]} 
 */
exports.get = async function (data, ctx) {
    // console.log('data:', data);
    const chart = makeChart(await fetchData());

    return chart;
};

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
function makeChart(list) {
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let operator = list[i];
        ret.push({
            id: operator.id,
            usrname: operator.uname,
            password: '******',
            auth: operator.valid
        });
    }
    return ret;
}

/**
 * 获取管理人员列表.
 */
async function fetchData() {
    return await tools.SqlUtil.query(SQL_CONFIG.getOperator, []);
}