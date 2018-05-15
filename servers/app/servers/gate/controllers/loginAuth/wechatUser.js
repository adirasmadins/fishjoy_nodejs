const util = require('util');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const SEX = require('../../../../consts/constDef').SEX;
const User = require('./user');
const httpClient = require('../../../../net/httpclient');
const logger = console;
const crypto = require('crypto');

class WechatUser extends User {
    constructor(config) {
        super();
        this._sdkConfig = config;
    }

    _sdkSexToPlatformSex(value) {
        switch (value) {
            case 1:
                return SEX.MALE;
            case 2:
            case 0:
                return SEX.FEMALE;
        }
    }

    _decryptData(encryptedData, iv, _sessionKey) {
        let sessionKey = new Buffer(_sessionKey, 'base64');
        encryptedData = new Buffer(encryptedData, 'base64');
        iv = new Buffer(iv, 'base64');
        let decoded = null;
        try {
            // 解密
            let decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv);
            // 设置自动 padding 为 true，删除填充补位
            decipher.setAutoPadding(true);
            decoded = decipher.update(encryptedData, 'binary', 'utf8');
            decoded += decipher.final('utf8');

            decoded = JSON.parse(decoded);

        } catch (err) {
            throw new Error('Illegal Buffer');
        }

        if (decoded.watermark.appid !== this._sdkConfig.appid) {
            throw new Error('Illegal Buffer');
        }

        return decoded;
    }

    async getUserInfo(data) {
        if (data.code == null) {
            throw ERROR_OBJ.PARAM_MISSING;
        }
        let reqUrl = util.format(this._sdkConfig.url, this._sdkConfig.appid, this._sdkConfig.secret, data.code);
        logger.error('reqUrl=', reqUrl);

        try {
            let resp = await httpClient.getData(reqUrl);
            logger.error('resp=', resp.toString());
            resp = JSON.parse(resp);
            if (resp.errcode) {
                logger.error('微信登录授权请求失败, err=', resp);
                throw ERROR_OBJ.THIRDPARTY_AUTH_FAILED;
            }

            let sha1 = crypto.createHash('sha1');
            sha1.update(data.rawData + resp.session_key);
            let signData = sha1.digest('hex');
            logger.error('signData=', signData);
            logger.error('data.signature=', data.signature);
            if (signData != data.signature) {
                logger.error('微信登录数据被非法篡改，拒绝登录');
                throw ERROR_OBJ.THIRDPARTY_AUTH_FAILED;
            }

            let info = {
                nickname: data.userInfo.nickName,
                sex: this._sdkSexToPlatformSex(data.userInfo.gender),
                city: data.userInfo.city,
                figure_url: data.userInfo.avatarUrl,
                openid: resp.openid,
                extend:{
                    session_key:resp.session_key
                }
            };
            logger.error('info=', info);
            return info;

        } catch (err) {
            logger.error('微信登录授权失败, err=', err);
            throw err;
        }
    }

    getFriends(data, ext) {

    }
}

module.exports = WechatUser;
