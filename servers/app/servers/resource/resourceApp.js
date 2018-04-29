const omelo = require('omelo');
const path = require('path');
const redirect_https = require('../common/redirect_https');
const redisClient = require('../../utils/dbclients').redisClient;
const serviceCtrl = require('../common/serviceCtrl');
const HotUpdate = require('../../utils/hotUpdate');
const cluster = require('cluster');

class ResourceApp {
    constructor() {

    }

    async start() {
        if (!await await redisClient.start(omelo.app.get('redis'))) {
            process.exit(0);
            return;
        }
        redirect_https.start();
        serviceCtrl.enableSysShutdow();
        logger.info('资源服启动成功');
        if (cluster.isMaster) {
            let hotUpdate = new HotUpdate(/.*?/, false);
            hotUpdate.watch(path.join(__dirname, 'public/cfgs/'), function (name) {
                logger.error('resource =====', name);
            });
        }

    }

    stop() {
        logger.info('资源服关闭');
    }

}

module.exports = new ResourceApp();