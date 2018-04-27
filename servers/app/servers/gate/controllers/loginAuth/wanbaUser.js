const http = require('http');
const _ = require('underscore');
const CryptoJS = require("crypto-js");
const User = require('./user');

class WanbaUser extends User {
    constructor(config) {
        super();
        this._sdkConfig = config;
    }

    /**
     * 检查登录状态
     * @param data
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

                if (!resp) {
                    reject('网络异常');
                    return;
                }

                if (resp.ret != 0) {
                    reject(resp.msg);
                    return;
                }
                resolve(resp.ret);
            });
        }.bind(this));
    }

    /**
     * 获取用户信息
     * @param data
     */
    getUserInfo(data) {
        let appId = this._sdkConfig.appId;
        let pf = data.pf || 'wanba_ts';
        let filterData = {
            openid: data.openid,
            openkey: data.openkey,
            appid: appId,
            pf: pf,
            format: '',
            userip: ''
        };
        let uri = this._sdkConfig.uri.get_info;
        let sig = this._sig(filterData, uri);

        return new Promise(function (resolve, reject) {
            let str = `${this._sdkConfig.host}${uri}?openid=${data.openid}&openkey=${data.openkey}&appid=${appId}&sig=${sig}&pf=${pf}&format=&userip=`;
            http.get(str, function (resp) {
                let result = "";
                resp.on("data", function (data) {
                    result += data.toString();
                });
                resp.on("end", function () {
                    if (!result) {
                        reject('网络异常');
                        return;
                    }
                    logger.info('sdk get user info result:', result);
                    result = JSON.parse(result);
                    if (result.ret !== 0) {
                        reject(resp.msg);
                        return;
                    }
                    let info = {
                        nickname: result.nickname,
                        sex: result.gender === '男' ? 0 : 1, // 'male' == resp.gender ? 0 : 1;
                        city: result.city,
                        figure_url: result.figureurl,
                        openid: data.openid,
                    };
                    resolve(info);
                });
            });
        }.bind(this));
    }

    /**
     * 获取朋友列表
     * @param data
     * @param ext
     */
    getFriends(data, ext) {
        let appId = this._sdkConfig.appId;
        let pf = data.pf || 'wanba_ts';
        let filterData = {
            openid: data.openid,
            openkey: data.openkey,
            appid: appId,
            pf: pf
        };

        let uri = this._sdkConfig.uri.get_app_friends;
        let sig = this._sig(filterData, uri);

        return new Promise(function (resolve, reject) {
            http.get(`${this._sdkConfig.host}${uri}?openid=${data.openid}&openkey=${data.openkey}&appid=${appId}&sig=${sig}&pf=${pf}`, function (resp) {

                let result = "";
                resp.on("data", function (data) {
                    result += data.toString();
                });
                resp.on("end", function () {
                    if (!result) {
                        reject('网络异常');
                    }
                    logger.info('sdk get friend info result:', result);
                    result = JSON.parse(result);
                    if (result.ret !== 0) {
                        reject(resp.msg);
                        return;
                    }
                    result.code = result.ret;
                    resolve(result);
                });
            });
        }.bind(this));
    }

    /**
     * 用户游戏成就上报
     * @param data
     */
    reportUserAchievement(data) {
        let appId = this._sdkConfig.appId;
        let pf = data.pf || 'wanba_ts';
        let ach_type = 3;
        let ach_des = encodeURIComponent("魅力");
        let filterData = {
            openid: data.openid,
            openkey: data.openkey,
            appid: appId,
            pf: pf,
            ach_type: 3,//成就数据类型，1：等级类，2：财富类，3：战力类
            ach_des: "魅力",//成就数据描述，如“等级”“关卡”“金币”等，不得为空，且类型对应描述第一次上传之后不得更改
            ach_value: data.charm_point,//成就数值
        };
        let uri = this._sdkConfig.uri.report_user_achievement;
        let sig = this._sig(filterData, uri);
        http.get(`${this._sdkConfig.host}${uri}?openid=${data.openid}&openkey=${data.openkey}&appid=${appId}&sig=${sig}&pf=${pf}&ach_type=${ach_type}&ach_des=${ach_des}&ach_value=${data.charm_point}`,
            function (resp) {
                let result = "";
                resp.on("data", function (data) {
                    result += data.toString();
                });
                resp.on("end", function () {
                    logger.info('sdk reportUserAchievement:', result);
                });
            });
    }

    sendGamebarMsg(data) {
        let appId = this._sdkConfig.appId;
        let pf = data.pf || 'wanba_ts';
        data.content = '的剑距你只有0.01公分';
        data.msgtype = 2;
        let filterData = {
            openid: data.openid,
            openkey: data.openkey,
            zoneid: data.zoneid,
            qua: data.qua,
            frd: data.frd,
            content: data.content,
            msgtype: data.msgtype,
            appid: appId,
            pf: pf,
            format: 'json',
            userip: ''
        };
        let uri = this._sdkConfig.uri.send_gamebar_msg;
        let sig = this._sig(filterData, uri);
        let options = `${this._sdkConfig.host}${uri}?openid=${data.openid}&openkey=${data.openkey}&appid=${appId}&sig=${sig}&pf=${pf}&zoneid=${data.zoneid}&qua=${data.qua}&frd=${data.frd}&content=${encodeURIComponent(data.content)}&msgtype=${data.msgtype}&format=json&userip=`;
        http.get(options, function (resp) {
            let result = "";
            resp.on("data", function (data) {
                result += data.toString();
            });
            resp.on("end", function () {
                console.info('sdk sendGamebarMsg:', result);
            });
        });
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

module.exports = WanbaUser;