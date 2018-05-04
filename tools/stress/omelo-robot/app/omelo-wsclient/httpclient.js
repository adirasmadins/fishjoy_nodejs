const http = require('http');
const https = require('https');
const querystring = require('querystring');
const URL = require('url');

const httpclient = module.exports;

httpclient.postData = function (data, url) {
    // let postData = querystring.stringify(data);
    let postData = JSON.stringify(data);
    let url_fileds = URL.parse(url);
    let enableHttps = url_fileds.protocol === 'https:';
    const options = {
        method: "POST",
        host: url_fileds.hostname,
        port: url_fileds.port,
        path: url_fileds.path,
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    let net = enableHttps ? https : http;
    return new Promise(function (resolve, reject) {
        let req = net.request(options, function (res) {
            res.setEncoding('utf-8');
            let response = "";
            res.on('data', (chunk) => {
                response += chunk;
            });
            res.on('end', () => {
                resolve(JSON.parse(response));
            });
        });
        req.on('error', function (err) {
            logger.error('postData error:', err);
            reject(err);
        });
        req.write(postData);
        req.end();
    });

};

httpclient.getData = function (url) {
    let url_fileds = URL.parse(url);
    let enableHttps = url_fileds.protocol === 'https:';
    return new Promise(function (resolve, reject) {
        let net = enableHttps ? https : http;
        let req = net.request(url, function (res) {
            let bufCache = null;
            res.on('data', function (chunk) {
                if (!bufCache) {
                    bufCache = Buffer.from(chunk);
                } else {
                    bufCache = Buffer.concat([bufCache, chunk], bufCache.byteLength + chunk.byteLength);
                }
            });
            res.on('end', function () {
                resolve({
                    data: bufCache,
                    headers: res.headers
                });
            });
        });

        req.on('error', function (err) {
            logger.error('getData error:', err);
            reject(err);
        });
        req.end();

    });
};