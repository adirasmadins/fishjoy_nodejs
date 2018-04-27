const https = require('https');
const ERROR_OBJ = require('../../../../../consts/fish_error').ERROR_OBJ;

class Api {
    _httpsGet(data) {
        return new Promise(function (resolve, reject) {
            let req = https.get(data, (res) => {
                logger.info('状态码：', res.statusCode);
                let bufCache = '';
                res.setEncoding('utf-8');
                res.on('data', (chunk) => {
                    bufCache += chunk;
                });
                res.on('end', () => {
                    bufCache = JSON.parse(bufCache);
                    if (bufCache) {
                        logger.info("sdk result:", bufCache);
                        resolve(bufCache);
                    } else {
                        logger.error('sdkInfo empty');
                        reject('sdkInfo empty');
                    }
                });
            });
            req.on('error', (err) => {
                logger.error(err);
                reject(err);
            });
        });
    }

    _httpsPost(data, url, path) {
        let datastr = '';
        let n = 0;
        for (let key in data) {
            if (n > 0) datastr += '&';
            datastr += `${key}=${data[key]}`;
            n++;
        }
        let options = {
            host: url,
            path: path,
            port: 443,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': datastr.length
            }
        };
        return new Promise(function (resolve, reject) {
            let req = https.request(options, (res) => {
                logger.info('状态码：', res.statusCode);
                logger.info('请求头：', res.headers);
                res.setEncoding('utf-8');
                let resp = "";
                res.on('data', (d) => {
                    resp += d;
                });
                res.on('end', () => {
                    logger.info('https request：', resp);
                    resolve(resp);
                });

            }).on('error', () => {
                logger.error('请求失败', data, url, path);
                reject(ERROR_OBJ.CALL_SDK_FAIL);
            });
            req.setTimeout(120000, () => {
                logger.error('请求超时', data, url, path);
                reject(ERROR_OBJ.CALL_SDK_FAIL);
            });
            req.write(datastr);
            req.end();
        });
    }
}

module.exports = Api;