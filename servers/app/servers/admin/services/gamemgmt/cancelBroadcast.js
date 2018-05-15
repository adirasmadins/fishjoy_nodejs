const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;

/**
 * 获取实时数据接口需要的返回值
 * @param {*} data {id:102} 
 */
exports.get = async function (data, ctx) {
    console.log('data:', data);

    try {
        cancelBroadcast(data.id);
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
};

function cancelBroadcast(id) {
    // 从Hash表中删除公告
    tools.RedisUtil.hdel(REDISKEY.PLATFORM_DATA.SERVER_BROADCAST, id);
    // 广播消息取消公告
    let data = {
        id: id,
        op: 'cancel',
    };
    let message = JSON.stringify(data);
    redisConnector.pub(REDISKEY.CH.BROADCAST_SERVER, message);
}
