
let http = require('http');
exports.post = post;
exports.get = get;

async function post(api, host, port, data) {
    return new Promise(function (resolve, reject) {
        logger.error('data:', data);

        data = require('querystring').stringify({
            data: JSON.stringify(data),
            aes: false
        });

        logger.error("api:", api);
        logger.error("data:", data);

        // 调用api
        let options = {
            hostname: host,
            port: port,
            path: api,
            method: 'POST',
            headers: {
                "Content-Type": 'application/x-www-form-urlencoded',
                "Content-Length": data.length
            }
        };

        let req = http.request(options, function (res) {
            let responseString = "";
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                responseString += chunk;
            });
            res.on('end', function () {
                resolve(responseString);
            });
        });
        req.on('error', function (e) {
            logger.error('problem with request:', e);
            logger.error('api:', api);
            logger.error('host:', host);
            logger.error('port:', port);
            reject(e);
        });
        req.write(data + "\n");
        req.end();
    });

}

async function get(api, host, port) {
    return new Promise(function (resolve, reject) {

        logger.error("api:", api);
        logger.error("host:", host);
        logger.error("port:", port);

        let url = `http://${host}:${port}${api}`;

        http.get(url, function (req, res) {
            let html = '';
            req.on('data', function (data) {
                html += data;
            });
            req.on('end', function () {
                console.info(html);
                resolve(html);
            });
            req.on('error', function (e) {
                reject(e);
            });
        });
    });

}