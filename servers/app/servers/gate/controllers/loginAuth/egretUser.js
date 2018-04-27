const http = require('http');
const _ = require('underscore');
const CryptoJS = require("crypto-js");

class EgretUser {
    constructor(config) {
        this._sdkConfig = config;
    }

    /**
     * 检查登录状态
     * @param token
     * @param ext
     */
    loginStatus(data, ext) {
        let filterData = {
            openid: data.openid,
            openkey: data.openkey,
            appId: data.appId,
            pf: data.pf
        };

        let uri = this._sdkConfig.uri.is_login;
        let sig = this._sig(filterData, uri);

        return new Promise(function (resolve, reject) {
            http.get(`${this._sdkConfig.host}${uri}?
            openid=${data.openid}&
            openkey=${data.openkey}&
            appid=${data.appId}&
            sig=${sig}&
            pf=${data.pf}`, function (err, resp) {
                if (err) {
                    reject(err);
                    return;
                } 
                
                if(!resp){
                    reject('网络异常');
                    return;    
                }
                
                if(resp.ret != 0){
                    reject(resp.msg);
                    return;
                }
                resolve(resp.ret);
            });
        }.bind(this));
    }

    /**
     * 获取用户信息
     * @param token
     * @param ext
     */
    getUserInfo(data) {

        let filterData = {
            openid: data.openid,
            openkey: data.openkey,
            appId: data.appId,
            pf: data.pf
        };
        let uri = this._sdkConfig.uri.get_info;
        let sig = this._sig(filterData, uri);

        return new Promise(function (resolve, reject) {
            http.get(`${this._sdkConfig.host}${uri}?
            openid=${data.openid}&
            openkey=${data.openkey}&
            appid=${data.appId}&
            sig=${sig}&
            pf=${data.pf}`, function (err, resp) {
                if (err) {
                    reject(err);
                    return;
                } 
                
                if(!resp){
                    reject('网络异常');
                    return;    
                }
                
                if(resp.ret != 0){
                    reject(resp.msg);
                    return;
                }

                let info = {
                    nickname:resp.nickname,
                    sex:resp.gender, //todo 'male' == resp.gender ? 0 : 1;
                    city:resp.city,
                    figure_url:resp.figureurl,
                    openid:resp.openid
                };

                resolve(info);
            });
        }.bind(this));
    }

    /**
     * 获取朋友列表
     * @param token
     * @param ext
     */
    getFriends(data, ext) {
        let filterData = {
            openid: data.openid,
            openkey: data.openkey,
            appId: data.appId,
            pf: data.pf
        };

        let uri = this._sdkConfig.uri.get_app_friends;
        let sig = this._sig(filterData, uri);

        return new Promise(function (resolve, reject) {
            http.get(`${this._sdkConfig.host}${uri}?
            openid=${data.openid}&
            openkey=${data.openkey}&
            appid=${data.appId}&
            sig=${sig}&
            pf=${data.pf}`, function (err, resp) {
                if (err) {
                    reject(err);
                    return;
                } 
                
                if(!resp){
                    reject('网络异常');
                    return;    
                }
                
                if(resp.ret != 0){
                    reject(resp.msg);
                    return;
                }
                resolve(resp.ret);
            });
        }.bind(this));
    }

    _des_sort(data) {
        // 对象转数组(_.pairs)
        // 数组排序(_.sortBy)
        return _.sortBy(_.pairs(data), function (item) {
            return item[0];
        });
    }

    _hmac_sha1(signed_data, signed_key) {
        return CryptoJS.HmacSHA1(signed_data, signed_key);
    }

    _base64(inputData) {
        let buf = new Buffer(inputData, "hex");
        return buf.toString('base64');
    }

    _sig(data, _uri) {
        let uri = encodeURIComponent(_uri);
        let sortData = this._des_sort(data);
        let params = '';
        for (let i = 0; i < sortData.length; ++i) {
            if (i > 0) params += "&";
            params += sortData[i][0] + '=' + sortData[i][1];
        }
        params = encodeURIComponent(params);

        let signing_data = `GET&${uri}&${params}`;
        let signed_key = this._sdkConfig.appSecret + '&';
        let signed_data = CryptoJS.HmacSHA1(signing_data, signed_key);
        return encodeURIComponent(this._base64(signed_data.toString()));
    }
}

module.exports = EgretUser;