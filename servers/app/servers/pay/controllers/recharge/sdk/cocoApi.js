const http = require('http');
const _ = require('underscore');
const CryptoJS = require("crypto-js");

class CocoApi {
    constructor(config) {
        this._config = config;
    }

    _httpRequest(options) {
        return new Promise(function (resolve, reject) {
            let req = http.get(options, (res) => {
                console.info('状态码：', res.statusCode);
                let bufCache = '';
                res.setEncoding('utf-8');
                res.on('data', (chunk) => {
                    bufCache += chunk;
                });
                res.on('end', () => {
                    if (bufCache) {
                        console.info("coco sdk result:", bufCache);
                        resolve(bufCache);
                    } else {
                        console.info('coco sdkInfo empty');
                        reject('coco sdkInfo empty');
                    }
                });
            });
            req.on('error', (err) => {
                console.info(err);
                reject(err);
            });
        });
    }

    async paymentVerify(data) {
        let sign = data.sign;
        if (sign != this._sig(data)) throw '签名检查失败';
        let resp = await this._httpRequest(this._getUrl(data));
        if (resp != CocoApi.SUCCESS) {
            throw `coco回调订单检查失败${resp}`;
        }
        return resp;
    }

    _sig(params) {
        delete params.sign;
        let data = this._sort(params);
        let len = data.length;
        let str = '';
        for (let i = 0; i < len; i++) {
            if (data[i][1] != null && data[i][1] != '') {
                str += `${data[i][0]}=${data[i][1]}&`;
            }
        }
        str += `key=${this._config.key}`;
        return CryptoJS.MD5(str).toString().toUpperCase();
    }

    _getUrl(data) {
        let params = {
            gameid: this._config.gameid,
            notify_id: data.notify_id
        };
        return `${this._config.url}?gameid=${this._config.gameid}&notify_id=${data.notify_id}&sign=${this._sig(params)}`;
    }

    _sort(data) {
        // 对象转数组(_.pairs)
        // 数组排序(_.sortBy)
        return _.sortBy(_.pairs(data), function (item) {
            return item[0];
        });
    }
}

CocoApi.SUCCESS = 'SUCCESS';
CocoApi.FAIL = 'FAIL';

module.exports = CocoApi;