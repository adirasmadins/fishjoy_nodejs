const crypto = require('crypto');
const https = require('https');
const ERROR_OBJ = require('../../../../../../consts/fish_error').ERROR_OBJ;

class IOSApi {
    constructor(config) {
        this._config = config;
    }

    async send(url, path, param) {
        let response = await this._request(url, path, param);
        logger.info(`ios 订单返回结果:${response}`);
        response = JSON.parse(response);
        if (response.status == 21007) {
            return await this.send(this._config.TEST_URL, path, param);
        }

        let receipt_data = param['receipt-data'];
        let md5 = crypto.createHash("md5");
        let billno = md5.update(receipt_data).digest('hex').toString('utf-8');

        return {
            code: response.status,
            billno: billno,
            bundle_id: response.receipt.bundle_id,
            product_id:response.receipt.in_app[0].product_id
        };
    }

    _request(url, path, data) {
        let datastr = JSON.stringify(data);
        let options = {
            host: url,
            path: path,
            port: 443,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': datastr.length
            }
        };

        return new Promise(function (resolve, reject) {
            let req = https.request(options, function (res) {
                res.setEncoding('utf-8');
                let resp = "";
                res.on('data', function (d) {
                    resp += d;
                });
                res.on('end', function () {
                    logger.info('ios https request：', resp);
                    resolve(resp);
                });

            }).on('error', function (e) {
                logger.error('ios支付请求失败', e);
                reject(ERROR_OBJ.CALL_SDK_FAIL);
            });
            req.write(datastr);
            req.end();
        });
    }

    async getOrder(receipt) {
        return await this.send(this._config.PRODUCTION_URL, this._config.PATH, this._buildParam(receipt));
    }

    checkChannelName(bundle_id) {
        if (bundle_id !== this._config.BUNDLE_ID) {
            logger.error("非法订单,bundle_id:", bundle_id);
            throw ERROR_OBJ.ORDER_ILLEGAL;
        }
    }

    _buildParam(receipt) {
        return {'receipt-data': receipt};
    }

}

module.exports = IOSApi;