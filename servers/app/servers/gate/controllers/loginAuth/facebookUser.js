const https = require('https');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const User = require('./user');

class FacebookUser extends User {
    constructor(config) {
        super();
        this._sdkConfig = config;
    }

    loginStatus(data) {
        let self = this;

        return new Promise(function (resolve, reject) {
            https.get(`${self._sdkConfig.url}/me?access_token=${data.accessToken}`, function (err, resp) {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp);
                }
            });
        }.bind(this));
    }

    getUserInfo(data) {
        let ext = data.ext || {
            picture: {
                type: 'normal'
            }
        };
        let self = this;
        return new Promise(function (resolve, reject) {
            let req = https.get(`${self._sdkConfig.url}/me?fields=id,gender,name,location,picture.type(${ext.picture.type})&access_token=${data.accessToken}`, function (res) {
                if (res.statusCode !== 200) {
                    reject(res.statusMessage);
                    return;
                }
                let bufCache = '';
                res.setEncoding('utf-8');
                res.on('data', function (chunk) {
                    bufCache += chunk;
                });
                res.on('end', function () {
                    try {
                        let sdkInfo = JSON.parse(bufCache);
                        let info = null;
                        if (sdkInfo) {
                            info = {};
                            info.nickname = sdkInfo.name;
                            info.sex = 'male' == sdkInfo.gender ? 0 : 1;
                            info.city = sdkInfo.location && sdkInfo.location.name || 'secret';
                            info.figure_url = sdkInfo.picture.data.url;
                            info.openid = sdkInfo.id;
                        } else {
                            logger.error('facebook sdkInfo empty');
                            reject('facebook sdkInfo empty');
                        }
                        resolve(info);

                    } catch (e) {
                        logger.error(e);
                        reject(ERROR_OBJ.CALL_SDK_FAIL);
                    }
                });
            });
            req.on('error', function (err) {
                logger.error(err);
                reject(err);
            });
        });
    }

    /**
     * 获取朋友列表
     * @param data
     */
    getFriends(data, ext) {
        ext = ext || {
            picture: {
                type: 'normal'
            }
        };
        let self = this;
        return new Promise(function (resolve, reject) {
            https.get(`${self._sdkConfig.url}/me?fields=friends.limit(10){id,gender,name,picture.type(${ext.picture.type})}&access_token=${data.accessToken}`, function (err, resp) {
                if (err) {
                    reject(err);
                } else {
                    let info = {};
                    resolve(info);
                }
            });
        });
    }
}

module.exports = FacebookUser;