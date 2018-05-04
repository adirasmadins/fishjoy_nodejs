const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;

/**
 * 添加公告
 * @param {*} data 
{ 
    content: '这是一个公告',
    gap: '3',
    repeat: '2',
    startTime: '2018-03-22 19:15:23',
    endTime: '2018-03-22 19:25:23'
} 
 */
exports.get = async function (data, ctx) {
    // logger.error('data:', data);

    try {
        addBroadcast(data.content, +data.gap, +data.repeat, data.startTime, data.endTime);
        return {
            result: true,
        };
    }
    catch (err) {
        logger.error('err:', err);
        return {
            result: false,
            err: err
        };
    }
}

function addBroadcast(content, gap, repeat, startTime, endTime) {
    let data = {
        id: tools.ObjUtil.createSalt(),
        timestamp: new Date().getTime(),
        content: {
            txt: content,
            times: repeat,
            repeat: repeat,//新增:连播次数
            gap: gap,//新增:循环间隔时间(秒)
            startTime: startTime,//新增:开始时间
            endTime: endTime,//新增:结束时间
        }
    };
    let message = JSON.stringify(data);

    redisConnector.pub(REDISKEY.CH.BROADCAST_SERVER, message);
    // 将历史的服务器公告存储在一个Hash表中
    tools.RedisUtil.hset(REDISKEY.PLATFORM_DATA.SERVER_BROADCAST, data.id, message);
}

exports.set = async function (count) {
    // logger.error('data:', data);
    let broadCastObj = await tools.RedisUtil.hgetall(REDISKEY.PLATFORM_DATA.SERVER_BROADCAST);
    let ret = [];
    for (let id in broadCastObj) {
        ret.push(broadCastObj[id]);
    }

    if (ret.length > 0) {
        let idx = count % ret.length;
        logger.error('------------------idx:', idx);
        let message = ret[idx];
        let data = JSON.parse(message);
        data.timestamp = new Date().getTime();
        message = JSON.stringify(data);
        // logger.error('------------------message:', message);
        // logger.error('typeof message:', typeof message);
        redisConnector.pub(REDISKEY.CH.BROADCAST_SERVER, message);
        tools.RedisUtil.hset(REDISKEY.PLATFORM_DATA.SERVER_BROADCAST, data.id, message);
    }
    else {
        logger.error('没有服务器公告');
    }

}
