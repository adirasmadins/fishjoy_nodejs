const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;
const sysConfig = require('../../../../../config/sysConfig');

/**
 * 修改场景捕获率
 * @param {*} data {key:'scene_mutiple_1', value:'0.5'} 
 */
exports.get = async function (data, ctx) {
    // logger.error('data:', data);
    try {
        checkRange(data.value);
        await modifyData(data.key, Number(data.value));
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

/**
 * 场景捕获率设置范围检测.
 * @param {*} value 
 */
function checkRange(value) {
    if (value < sysConfig.PLATFORM_DATA_CONF.SCENE_CATCHRATE.RANGE[0]) {
        throw ERROR_OBJ.RANGE_SCENE_CATCHRATE_LOW;
    }
    if (value > sysConfig.PLATFORM_DATA_CONF.SCENE_CATCHRATE.RANGE[1]) {
        throw ERROR_OBJ.RANGE_SCENE_CATCHRATE_HIGH;
    }
}

/**
 * 修改场景捕获率.
 * @param {*} key 需要修改的场景键
 * @param {*} value 需要修改的场景捕获率
 */
async function modifyData(key, value) {
    let message = {sceneId:key, value:value};
    redisConnector.pub(REDISKEY.DATA_EVENT_SYNC.SCENE_CATCHRATE, JSON.stringify(message));
    return await tools.RedisUtil.hset(REDISKEY.PLATFORM_DATA.SCENE_CATCHRATE, key, value);
}