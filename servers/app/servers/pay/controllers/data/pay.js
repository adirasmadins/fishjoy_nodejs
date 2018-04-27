const paySdk = require('../recharge/paySdk');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const logicResponse = require('../../../common/logicResponse');
const constDef = require('../../../../consts/constDef');
const versions = require('../../../../utils/imports').versions;

const VER_CHANNEL_ID = constDef.PAY_CHANNEL_ID[`${versions.VER_KEY[versions.PUB].toUpperCase()}PAY`];

exports.buy = _buy;
exports.getPayorder = _getPayorder;
exports.callback = _callback;

/**
 * 添加商城记录
 */
async function _buy(data) {
    data.channelid = VER_CHANNEL_ID;
    let sdkApi = paySdk.sdk(data.channelid);
    if (!sdkApi) {
        throw ERROR_OBJ.NOT_SUPPORT_CHANNEL_PAY;
    }
    let result = await sdkApi.buy(data);
    return logicResponse.ask(result);
}

/**
 * 添加商城记录
 */
async function _callback(data) {
    let sdkApi = paySdk.sdk(VER_CHANNEL_ID);
    if (!sdkApi) {
        throw ERROR_OBJ.NOT_SUPPORT_CHANNEL_PAY;
    }
    return await sdkApi.callback(data);
}


/**
 * 获取游戏订单号.
 */
async function _getPayorder(data) {
    data.channelid = VER_CHANNEL_ID;
    let sdkApi = paySdk.sdk(data.channelid);
    if (!sdkApi) {
        throw ERROR_OBJ.NOT_SUPPORT_CHANNEL_PAY;
    }

    try {
        let result = await sdkApi.createPayOrder(data);
        return logicResponse.ask(result);
    } catch (err) {
        logger.error('获取订单号 err:', err);
        throw err;
    }

}