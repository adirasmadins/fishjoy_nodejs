const ERROR_OBJ = require('../../../../../../consts/fish_error').ERROR_OBJ;
const ObjUtil = require('../../../../src/buzz/ObjUtil');
const http = require('http');
const CryptoJS = require("crypto-js");
const _ = require('underscore');

class WanbaApi {
    constructor(config) {
        this._config = config;
    }

    async callBuy(data) {
        let paramsData = this._getCommonData(data);
        paramsData.itemid = data["channelItemId"];
        let options = this._getOptions(paramsData);
        return await this._httpRequest(options);
    }

    _getCommonContent(data) {
        let content = '';
        content += '?openid=' + data.openid;
        content += '&openkey=' + data.openkey;
        content += '&appid=' + data.appid;
        content += '&pf=' + data.pf;
        content += '&format='+data.format;
        content += '&userip='+data.userip;
        return content;
    }

    _contentBuy(data) {
        data = ObjUtil.str2Data(data);
        let content = this._getCommonContent(data);
        content += '&zoneid=' + data.zoneid;
        content += '&itemid=' + data.itemid;
        content += '&sig=' + this._sig(data, this._config.PATH);
        return content;
    }

    /**
     * 平台相关的签名.
     */
    _sig(data, _path) {
        let uri = encodeURIComponent(_path);
        let sortData = this._sort(data);
        let params = '';
        for (let i = 0; i < sortData.length; ++i) {
            if (i > 0) params += "&";
            params += sortData[i][0] + '=' + sortData[i][1];
        }
        params = encodeURIComponent(params);

        let signing_data = `GET&${uri}&${params}`;
        let signed_key = this._config.APP_KEY + '&';
        let signed_data = CryptoJS.HmacSHA1(signing_data, signed_key);
        return encodeURIComponent(this._base64(signed_data.toString()));
    }

    _base64(input) {
        let b = new Buffer(input, "hex");
        return b.toString('base64');
    }

    _hmac_sha1(to_be_signed, private_key) {
        let CryptoJS = require("crypto-js");
        return CryptoJS.HmacSHA1(to_be_signed, private_key);
    }

    _sort(data) {
        // 对象转数组(_.pairs)
        // 数组排序(_.sortBy)
        return _.sortBy(_.pairs(data), function (item) {
            return item[0];
        });
    }

    async _httpRequest(options) {
        return new Promise(function (resolve, reject) {
            let req= http.request(options, function (res) {
                logger.info('STATUS:' + res.statusCode);
                logger.info('HEADERS:' + JSON.stringify(res.headers));
                res.setEncoding('utf8');
                let response = '';
                res.on('data', (chunk) => {
                    response += chunk;
                });
                res.on('end', function () {
                    response = ObjUtil.str2Data(response);
                    logger.info("response:", response);
                    if (response.ret != null) {
                        response.code = response.ret;
                        response.message = response.msg;
                        resolve(response);
                    }
                    else if (response.code != null) {
                        resolve(response);
                    }
                });
            });
            req.end();
        }.bind(this));
    }

    _getOptions(data) {
        let params = this._contentBuy(data);
        return {
            hostname: this._config.DOMAIN,
            port: 80,
            path: this._config.PATH + params,
            method: 'GET'
        };
    }


    _getCommonData(data) {
        return {
            openid: data["openid"],
            openkey: data["openkey"],
            zoneid: data["zoneid"],
            appid: this._config.APP_ID,
            pf: this._config.GLOBAL_PF,
            format: "json",
            userip:data.userIp
        };
    }
}

module.exports = WanbaApi;