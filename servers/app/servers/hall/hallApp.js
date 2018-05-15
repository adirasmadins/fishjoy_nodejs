const buzz_redis = require('./src/buzz/buzz_redis');
const buzz_broadcast = require('../../common/broadcast/buzz_broadcast');
const RedisUtil = require('./src/utils/RedisUtil');
const rankCache = require('./src/rankCache/rankCache');
const DaoMail = require('./src/dao/dao_mail');
const DaoOperation = require('./src/dao/dao_operation');
const DaoChange = require('./src/dao/dao_change');
const CacheOperation = require('./src/buzz/cache/CacheOperation');
const CacheChange = require('./src/buzz/cache/CacheChange');
const CacheMail = require('./src/buzz/cache/CacheMail');
const dao_activity = require('./src/dao/dao_activity');
const common_mathadjust_const_cfg = require('../../utils/imports').DESIGN_CFG.common_mathadjust_const_cfg;
const Global = require('./src/buzz/pojo/Global');

const dao = require('./src/dao/dao');
const omelo = require('omelo');
const { RedisConnector, MysqlConnector } = require('../../database/dbclient');
const dropManager = require('../../utils/DropManager');
const serviceCtrl = require('../common/serviceCtrl');

class HallApp {

    async start() {
        this._redisConnector = new RedisConnector();
        let result = await this._redisConnector.start(omelo.app.get('redis'));
        if (!result) {
            process.exit(0);
            return;
        }
        this._mysqlConnector = new MysqlConnector();
        result = await this._mysqlConnector.start(omelo.app.get('mysql'));
        if (!result) {
            process.exit(0);
            return;
        }
        serviceCtrl.enableSysShutdow();
        this._loadInitData();
        logger.info('大厅服务启动成功');
    }

    stop() {
        redisConnector.stop();
        mysqlConnector.stop();
        logger.info('大厅服务关闭');
    }

    _loadInitData() {
        global.myDao = dao.withDbPool();
        buzz_redis.addListener();
        rankCache.run();
        DaoMail.loadMail(mysqlConnector, function () {
            logger.info('[MYSQL] 邮件数据从数据库加载到缓存成功, 共加载邮件数据%d条', CacheMail.length());
        });

        DaoOperation.loadAll(mysqlConnector, function () {
            logger.info('[MYSQL] 共加载%d条运营配置数据', CacheOperation.length());
        });

        DaoChange.loadAll(mysqlConnector, function () {
            logger.info('[MYSQL] 共加载%d条实物兑换数据', CacheChange.length());
        });
        dao_activity.updateGift(mysqlConnector, function () {
            logger.info('updateGift');
        });
        dropManager.start();

        Global.pumpBegin(
            mysqlConnector,
            common_mathadjust_const_cfg.time1 * 1000,
            common_mathadjust_const_cfg.time2 * 1000,
            common_mathadjust_const_cfg.time3 * 1000,
            common_mathadjust_const_cfg.extract,
            common_mathadjust_const_cfg.addvalue,
            common_mathadjust_const_cfg.reducevalue
        );
    }

    remoteRpc(method, data, cb) {
        this[method](data, cb);
    }

    /**
     * 玩家登录通知
     * @param data
     * @param cb
     */
    rpc_player_login(data, cb) {
        let account = data;
        utils.invokeCallback(cb, null, buzz_broadcast.addFamousOnlineBroadcast(account));
    }
}

module.exports = HallApp;