const http = require('http');
const https = require('https');
const redirect_https = require('../../common/redirect_https');
const URL = require('url');
const versionsUtil = require('../../../utils/imports').versionsUtil;

class DownloadRes {

    getRemoteResource(headers, url) {
        let req_headers = {};
        for (let k in headers) {
            if (k !== 'host') {
                req_headers[k] = headers[k];
            }
        }

        return new Promise(function (resolve, reject) {
            let url_fileds = URL.parse(url);

            let enableHttps = url_fileds.protocol === 'https:';
            const options = {
                method: "GET",
                host: url_fileds.hostname,
                port: url_fileds.port || enableHttps ? 443 : 80,
                path: url_fileds.path,
                headers: req_headers
            };

            let net = enableHttps ? https : http;
            let req = net.request(options, function (res) {
                if (res.statusCode === 304) {
                    reject(304);
                }
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

            req.on('error', function (error) {
                logger.error('getRemoteResource error:', error);
                reject(error);
            });
            req.end();

        });
    }

    async download(ctx) {
        let params = ctx.query;
        if (!params || !params.figure_url) {
            ctx.status = 400;
            return;
        }

        let figure_url = params.figure_url;
        if (figure_url == 'default.png' || figure_url == 'jiaodie.png' || figure_url.indexOf('upload/boys/') > -1 ||
            figure_url.indexOf('upload/girls/') > -1) {
            ctx.status = 302;
            let url = redirect_https.genRedirectUrl(ctx.protocol, versionsUtil.getCDNDomain() || ctx.host, '/' + figure_url);
            ctx.redirect(url);
        } else {

            if(!versionsUtil.getImgDispatcher()){
                ctx.status = 302;
                ctx.redirect(decodeURIComponent(figure_url));
                return;
            }

            try {
                let {
                    data,
                    headers
                } = await this.getRemoteResource(ctx.request.headers, figure_url);
                headers["Access-Control-Allow-Origin"] = "*";
                for (let key in headers) {
                    ctx.response.set(key, headers[key]);
                }
                ctx.body = data;
            } catch (error) {
                if (error === 304) {
                    ctx.status = 304;
                } else {
                    ctx.status = 400;
                }
            }

        }
    }


}

module.exports = new DownloadRes;