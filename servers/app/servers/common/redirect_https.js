const http = require('http');
const omelo = require('omelo');
const versions = require('../../utils/imports').versions;
const cluster = require('cluster');

class Redirect {
    genRedirectUrl(protocol, hostname, path) {
        return `${protocol}://${hostname}${path}`;
    }

    start() {
        if (versions.DEVELOPMENT == true || versions.REDIRECT_HTTPS.indexOf(versions.PUB) == -1) {
            return;
        }

        if (cluster.isWorker) {
            const resource = omelo.app.get('http').resource[0];
            logger.error(resource);
            const srv = http.createServer((req, res) => {
                logger.error(req.url);

                let url = this.genRedirectUrl('https', req.headers.host, req.url);
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
}

module.exports = new Redirect();