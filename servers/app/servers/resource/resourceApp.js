const omelo = require('omelo');
const redirect_https = require('../common/redirect_https');
const redisClient = require('../../utils/dbclients').redisClient;
const serviceCtrl = require('../common/serviceCtrl');
class ResourceApp {
    constructor(){

    }
    async start() {
        if (!await await redisClient.start(omelo.app.get('redis'))) {
            process.exit(0);
            return;
        }
        redirect_https.start();
        serviceCtrl.enableSysShutdow();
        logger.info('资源服启动成功');
    }

    stop() {
        logger.info('资源服关闭');
    }

}

module.exports = new ResourceApp();