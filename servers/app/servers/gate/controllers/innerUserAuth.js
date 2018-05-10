const constDef = require('../../../consts/constDef');
const authSdk = require('./loginAuth/authSdk');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const logger = require('omelo-logger').getLogger('gate', __filename);
const logicResponse = require('../../common/logicResponse');

class InnerUserAuth {
    /**
     * {
     *  username:'zhansan',
     *  password:'213321',
     *  device:0
     * }
     */
    async register(data) {
        if (!data.username || !data.password) {
            throw ERROR_OBJ.PARAM_MISSING;
        }

        let sdkApi = authSdk.sdk(constDef.AUTH_CHANNEL_ID.INNER);
        if (!sdkApi) {
            throw ERROR_OBJ.NOT_SUPPORT_CHANNEL_LOGIN;
        }

        try {
            let uid = await sdkApi.isRegiste(data.username);
            if (uid != null) {
                throw ERROR_OBJ.USERNAME_EXIST;
            } else {
                let uid = await sdkApi.registe(data);
                data.uid = uid;
                let account = await sdkApi.login(data);
                account.commit();
                logger.info(`注册新用户${uid}`);
                return logicResponse.ask(account.toJSON());
            }
        } catch (err) {
            logger.error('用户注册失败', err);
            throw err;
        }
    }

    async login(data) {
        if (!data.username || !data.password) {
            throw ERROR_OBJ.PARAM_MISSING;
        }

        let sdkApi = authSdk.sdk(constDef.AUTH_CHANNEL_ID.INNER);
        if (!sdkApi) {
            throw ERROR_OBJ.NOT_SUPPORT_CHANNEL_LOGIN;
        }

        try {
            let uid = await sdkApi.isRegiste(data.username);
            if(uid == null){
                throw ERROR_OBJ.USER_NOT_EXIST;
            }

            data.uid = uid;
            let account = await sdkApi.login(data);
            return logicResponse.ask(account.toJSON());
        } catch (err) {
            logger.error('用户登录失败', err);
            throw err;
        }
    }

    async modifyPassword(data) {
        if (!data.username || !data.oldPassword || !data.newPassword) {
            throw ERROR_OBJ.PARAM_MISSING;
        }

        let sdkApi = authSdk.sdk(constDef.AUTH_CHANNEL_ID.INNER);
        if (!sdkApi) {
            throw ERROR_OBJ.NOT_SUPPORT_CHANNEL_LOGIN;
        }

        try {
            let uid = await sdkApi.isRegiste(data.username);
            if(uid == null){
                throw ERROR_OBJ.USER_NOT_EXIST;
            }
            data.uid = uid;
            let account = await sdkApi.modifyPassword(data);
            return logicResponse.ask(account);
        } catch (err) {
            logger.error('用户密码修改失败', err);
            throw ERROR_OBJ.OLD_PASSWORD_ERROR;
        }
    }

    async bindPhone(data) {
        let sdkApi = authSdk.sdk(constDef.AUTH_CHANNEL_ID.INNER);
        if (!sdkApi) {
            throw ERROR_OBJ.NOT_SUPPORT_CHANNEL_LOGIN;
        }

        try {
            let uid = await sdkApi.isRegiste(data.username);
            if(uid == null){
                throw ERROR_OBJ.USER_NOT_EXIST;
            }
            data.uid = uid;
            await sdkApi.bindPhone(data);
        } catch (err) {
            logger.error('用户手机号绑定失败', err);
            throw ERROR_OBJ.OLD_PASSWORD_ERROR;
        }
    }

    async logout(){
        try{
            return logicResponse.ask({status: 1, msg: "成功退出"});
        }catch (err){
            logger.error("退出账户失败", err);
            throw ERROR_OBJ.LOGINOUT_FAIL;
        }
    }

}

module.exports = new InnerUserAuth();