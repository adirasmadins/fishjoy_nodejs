const ServerSwitch = require('../../configs/consts/ServerSwitch');
const REDISKEY = require('../../../../models/index').REDISKEY;
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;

/**
 * 获取留存数据接口需要的返回值
 * @param {*} data { type: 1 }
 */
exports.get = async function (data, ctx) {
    logger.info('data:', data);
    try {
        let ret = await getSwitch(+data.type);

        return {
            result: true,
            switchStatus: ret.status,
            switchMsg: ret.msg,
        };
    } catch (err) {
        logger.error('获取服务器开关错误:', err);
        return {
            result: false,
            err: err
        };
    }
};

async function getSwitch(type) {
    switch (type) {
        case ServerSwitch.PLATFORM_SERVICE_SWITCH:
            {
                let values = (await redisConnector.get(REDISKEY.SWITCH.SERVICE)) || {};
                return { status: values.status || 0, msg: values.msg || '' };
            }
        case ServerSwitch.PLATFORM_CDKEY_SWITCH:
            {
                let status = (await redisConnector.get(REDISKEY.SWITCH.CDKEY)) || 0;
                return { status: status };
            }
        case ServerSwitch.PLATFORM_CIK_SWITCH:
            {
                let status = (await redisConnector.get(REDISKEY.SWITCH.CIK)) || 0;
                return { status: status };
            }
        case ServerSwitch.PLATFORM_ACTIVE_SWITCH:
            {
                let status = (await redisConnector.get(REDISKEY.SWITCH.ACTIVE)) || 0;
                return { status: status };
            }
    }
    logger.error('未知的服务器开关参数:', type);
    throw ERROR_OBJ.NOT_SUPPORT_SERVICE;
}