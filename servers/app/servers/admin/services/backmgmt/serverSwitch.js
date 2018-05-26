const ServerSwitch = require('../../configs/consts/ServerSwitch');
const REDISKEY = require('../../../../models/index').REDISKEY;
const payApi = require('../../../api/pay/payClientApiConfig');
const hallApi = require('../../../api/hall/hallClientApiConfig');
const tools = require('../../../../utils/tools');

const CDKEY_SWITCH_MAP = {
    apiConfig: payApi,
    apiList: [
        'use_cdkey',
    ]
};

const CIK_SWITCH_MAP = {
    apiConfig: payApi,
    apiList: [
        'change_in_kind',
        'get_cik_info',
        'get_cik_log',
        'cancel_cik',
    ]
};

const ACTIVE_SWITCH_MAP = {
    apiConfig: hallApi,
    apiList: [
        'get_activity_reward',
    ]
};

/**
 * 获取留存数据接口需要的返回值
 * @param {*} data { username: 'vip_guest', auth: 'true'|'false' }
 */
exports.get = async function (data, ctx) {
    logger.info('data:', data);
    try {
        await switchServer(+data.type, data.value, data.msg);

        return {
            result: true
        };
    } catch (err) {
        logger.error('修改服务器开关错误:', err);
        return {
            result: false,
            err: err
        };
    }
};

async function switchServer(type, status, msg) {
    switch (type) {
        case ServerSwitch.PLATFORM_SERVICE_SWITCH:
            {
                let value = { status: status, msg: msg || 'no msg' };
                await tools.RedisUtil.set(REDISKEY.SWITCH.SERVICE, value);
                await redisConnector.pub(REDISKEY.DATA_EVENT_SYNC.PLATFORM_SERVICE_SWITCH, value);
                break;
            }
        case ServerSwitch.PLATFORM_CDKEY_SWITCH:
            {
                await tools.RedisUtil.set(REDISKEY.SWITCH.CDKEY, status);
                await switchApi(CDKEY_SWITCH_MAP, status);
                break;
            }
        case ServerSwitch.PLATFORM_CIK_SWITCH:
            {
                await tools.RedisUtil.set(REDISKEY.SWITCH.CIK, status);
                await switchApi(CIK_SWITCH_MAP, status);
                break;
            }
        case ServerSwitch.PLATFORM_ACTIVE_SWITCH:
            {
                await tools.RedisUtil.set(REDISKEY.SWITCH.ACTIVE, status);
                await switchApi(ACTIVE_SWITCH_MAP, status);
                break;
            }
    }
}

async function switchApi(map, status) {
    let apiConfig = map.apiConfig;
    for (let i in map.apiList) {
        let api = apiConfig.PREFIX + apiConfig.apiCfgs[map.apiList[i]].route;
        await tools.RedisUtil.hset(REDISKEY.SWITCH.API, api, status);
        let value = { api: api, switch: status };
        await redisConnector.pub(REDISKEY.DATA_EVENT_SYNC.PLATFORM_API_SWITCH, value);
        // hgetall global:switch:api
    }
}