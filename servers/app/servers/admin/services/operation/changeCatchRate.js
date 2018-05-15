const CATCH_RATE = require('../../configs/consts/CatchRate');
const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;

/**
 * 修改全服捕获率
 * @param {*} data {orderId:100}
 */
exports.get = async function (data, ctx) {
    logger.error('data:', data);

    try {
        await change(data.type, data.rate, data.leftSecond, data.uid);
        return {
            result: true
        };
    }
    catch (err) {
        logger.error(err);
        return {
            result: false,
            err: err
        };
    }
};

async function change(type, rate, leftSecond, uid) {
    switch (Number(type)) {
        case CATCH_RATE.TYPE.SERVER:
            logger.error('全服捕获率修正');

            const KEYS = REDISKEY.PLATFORM_DATA;
            await tools.RedisUtil.set(KEYS.G_GPCT_OUT_TIMESTAMP, new Date().getTime());
            await tools.RedisUtil.set(KEYS.G_GPCT_OUT, leftSecond);
            await tools.RedisUtil.set(KEYS.PLATFORM_CATCHRATE, rate);
            await redisConnector.pub(REDISKEY.DATA_EVENT_SYNC.PLATFORM_CATCHRATE, JSON.stringify({ value: rate }));

            await tools.RedisUtil.expire(KEYS.G_GPCT_OUT, leftSecond); //注意过期
            await tools.RedisUtil.expire(KEYS.PLATFORM_CATCHRATE, leftSecond);
            await tools.RedisUtil.expire(KEYS.G_GPCT_OUT_TIMESTAMP, leftSecond);
            break;

        case CATCH_RATE.TYPE.PLAYER:
            // 客户端没有把玩家的UID上传过来
            logger.error('玩家捕获率修正');
            if (!uid) {
                let errMsg = `[Error]修正玩家捕获率时需要上传uid`;
                logger.error(errMsg);
                throw new Error(errMsg);
            }

            await tools.RedisUtil.hset(REDISKEY.GAIN_LOSS_LIMIT, uid, leftSecond);
            await redisConnector.pub(REDISKEY.DATA_EVENT_SYNC.PLAYER_GAIN_LOSS_LIMIT, JSON.stringify({ uid: uid, value: leftSecond }));
            await tools.RedisUtil.hset(REDISKEY.PLAYER_CATCH_RATE, uid, rate);
            await redisConnector.pub(REDISKEY.DATA_EVENT_SYNC.PLAYER_CATCH_RATE, JSON.stringify({ uid: uid, value: rate }));
            break;

        default:
            let errMsg = `[Error]type取值错误:${type}`;
            logger.error(errMsg);
            throw new Error(errMsg);
    }
}