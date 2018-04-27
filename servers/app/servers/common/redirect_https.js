const http = require('http');
const omelo = require('omelo');
const versions = require('../../utils/imports').versions;

class Redirect {
    genRedirectUrl(protocol, hostname, path) {
        return `${protocol}://${hostname}${path}`;
    }

    start() {
        if(versions.PUB == 0){
            return;
        }
        const httpCfg = omelo.app.get('http');
        const resource = omelo.app.get('http').resource[0];
        logger.error(resource);
        const srv = http.createServer((req, res) => {
            logger.error(req.url);

            let url = this.genRedirectUrl('https', req.headers.host, req.url);
            // logger.error(req.connection.remoteAddress);
            // logger.error(r);
            // logger.error('req=', util.inspect(req));
            // logger.error('res=', res);

            // res.statusCode = 301;
            // res.redirect()

            res.writeHead(301, {
                'Location': url
            });
            res.end();

        });

        srv.listen(80, resource.http.host, () => {
            logger.error('redirect service running...', resource.http.publicHost);
        });

    }
}

module.exports = new Redirect();