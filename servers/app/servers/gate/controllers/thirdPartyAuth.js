const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const authSdk = require('./loginAuth/authSdk');
const versionsUtil = require('../../../utils/imports').versionsUtil;
const logger = require('omelo-logger').getLogger('gate', __filename);
const logicResponse = require('../../common/logicResponse');
const RedisUtil = require('../../../utils/tools/RedisUtil');
const REDISKEY = require('../../../models/index').REDISKEY;

class ThirdPartyAuth {
    async login(data) {
        if (!data.channel || !data.sdkAuthResponse || !data.device) {
            throw ERROR_OBJ.PARAM_MISSING;
        }

        let sdkApi = authSdk.sdk(data.channel);
        if (!sdkApi) {
            throw ERROR_OBJ.NOT_SUPPORT_CHANNEL_LOGIN;
        }

        try {
            let sdkAuthResponse = data.sdkAuthResponse;

            let userInfo = await sdkApi.getUserInfo(sdkAuthResponse);
            userInfo.channel = data.channel;
            userInfo.openid = versionsUtil.getOpenid(userInfo.openid, data.device);
            userInfo.deviceId = data.deviceId;
            let uid = await sdkApi.isRegiste(userInfo.openid);
            let isNew = 0;
            if (null == uid) {
                uid = await sdkApi.registe(userInfo);
                logger.info(`新用户${uid}注册`, userInfo);
                isNew = 1;
            } else {
                logger.info(`用户${uid}登录`, userInfo);
            }
            let account = await sdkApi.login({
                uid: uid,
                device: data.device,
                ip: data.ip
            });
            account.extend = userInfo.extend || {};
            account.figure_url = userInfo.figure_url;
            account.nickname = userInfo.nickname;
            account.commit();
            account.is_register = isNew;
            sdkAuthResponse.charm_point = account.charm_point;
            sdkApi.reportUserAchievement(sdkAuthResponse);

            // let globalSwitchCdkey = await RedisUtil.get(REDISKEY.SWITCH.CDKEY);
            // globalSwitchCdkey = +globalSwitchCdkey;
            // account.cdkey_on &= globalSwitchCdkey;
            
            return logicResponse.ask(account.toJSON());
        } catch (err) {
            logger.error(`第三方渠道${data.channel}登录授权失败`,err);
            throw err;
        }
    }

    async callSdkApi(data){
        if(!data.action || !data.channel) {
            throw ERROR_OBJ.PARAM_MISSING;
        }
        let sdkApi = authSdk.sdk(data.channel);
        if (!sdkApi) {
            throw ERROR_OBJ.NOT_SUPPORT_CHANNEL_LOGIN;
        }

        try {
            switch (data.action) {
                case "relation.getAppFriends": {
                    let result = await sdkApi.getFriends(data);
                    return logicResponse.ask(result);
                }
                case "user.sendGamebarMsg": {
                    let result = await sdkApi.sendGamebarMsg(data);
                    return logicResponse.ask(result);
                }
            }
        } catch (err) {
            logger.error(`渠道${data.channel}调用skd 失败`, err);
            throw ERROR_OBJ.CALL_SDK_FAIL;
        }
    }
}

module.exports = new ThirdPartyAuth();