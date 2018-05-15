const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;

/**
 * 获取服务器通告列表
 * @param {*} data {} 
 */
exports.get = async function (data, ctx) {
    // logger.error('data:', data);

    let broadcastList = await fetchData();
    // logger.error('broadcastList:', broadcastList);

    return makeChart(broadcastList);
};

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
function makeChart(list) {
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let info = JSON.parse(list[i]);
        ret.push({
            id: info.id,
            content: info.content.txt,
            endTime: info.content.endTime,
            gap: info.content.gap,
            repeat: info.content.repeat,
        });
    }
    return ret;
}

async function fetchData() {
    let broadCastObj = await tools.RedisUtil.hgetall(REDISKEY.PLATFORM_DATA.SERVER_BROADCAST);
    let ret = [];
    for (let id in broadCastObj) {
        ret.push(broadCastObj[id]);
    }
    return ret;
}
