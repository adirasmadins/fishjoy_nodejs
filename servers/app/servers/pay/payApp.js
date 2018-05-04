const RedisUtil = require('./src/utils/RedisUtil');
const dao = require('./src/dao/dao');
const omelo = require('omelo');
const redisClient = require('../../utils/dbclients').redisClient;
const mysqlClient = require('../../utils/dbclients').mysqlClient;
const DaoOperation = require('./src/dao/dao_operation');
const DaoChange = require('./src/dao/dao_change');
const CacheOperation = require('./src/buzz/cache/CacheOperation');
const CacheChange = require('./src/buzz/cache/CacheChange');
const serviceCtrl = require('../common/serviceCtrl');
const paySdk = require('./controllers/recharge/paySdk');
class PayApp {
    constructor(){
        logger.error('PayApp ================================== ');
    }
    async start() {
        let result = await redisClient.start(omelo.app.get('redis'));
        if (!result) {
            process.exit(0);
            return;
        }
        result = await mysqlClient.start(omelo.app.get('mysql'));
        if (!result) {
            process.exit(0);
            return;
        }

        serviceCtrl.enableSysShutdow();

        DaoOperation.loadAll(mysqlClient, function () {
            let len = CacheOperation.length();
            logger.info('[MYSQL] 共加载%d条运营配置数据', len);
        });
        
        DaoChange.loadAll(mysqlClient, function () {
            let len = CacheChange.length();
            logger.info('[MYSQL] 共加载%d条实物兑换数据', len);
        });

        paySdk.init();
        logger.info('支付服务启动成功');

        this._loadInitData();
    }

    stop() {
        redisClient.stop();
        mysqlClient.stop();
        logger.info('支付服务关闭');
    }

    _loadInitData() {
        global.myDao = dao.withDbPool();
        RedisUtil.init(redisConnector.cmd);
    }
}

module.exports = new PayApp();