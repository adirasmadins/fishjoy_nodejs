const omelo = require('omelo');
const path = require('path');
const redirect_https = require('../common/redirect_https');
const RedisConnector = require('../../database/dbclient').RedisConnector;
const serviceCtrl = require('../common/serviceCtrl');
const HotUpdate = require('../../utils/hotUpdate');
const cluster = require('cluster');
const GameEventBroadcast = require('../../common/broadcast/GameEventBroadcast');

class ResourceApp {
    constructor() {

    }

    async start() {
        this._redisConnector = new RedisConnector();
        let result = await this._redisConnector.start(omelo.app.get('redis'));
        if (!result) {
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
                //发公告，供客户端拉取
                new GameEventBroadcast({
                    type: GameEventBroadcast.TYPE.GAME_EVENT.CFGS_CHANGED,
                }).add();
                logger.error('客户端可以更新配置了');
            });
        }

    }

    stop() {
        logger.info('资源服关闭');
    }

}

module.exports = ResourceApp;