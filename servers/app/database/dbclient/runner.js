const RedisConnector = require('./redis/connector');
const MysqlConnector = require('./mysql/connector');
const utils = require('../../utils/utils');
// const Sequelize = require('sequelize');
const async = require('async');


global.DATABASE_TYPE = {
    REDIS: Symbol('redis'),
    MYSQL: Symbol('mysql')
};

module.exports.connectDB = function (dbTypes, dbCfg, cb) {

    let funcs = [];
    let dbClients = [];
    dbTypes.forEach(function (type) {
        switch (type) {
            case global.DATABASE_TYPE.REDIS: {
                let redisFunc = function (cb) {
                    module.exports.connectRedis(dbCfg.redis, function (err, redis) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        dbClients.push(redis);
                        cb();
                    });
                };
                funcs.push(redisFunc);
                break;
            }

            case global.DATABASE_TYPE.MYSQL: {
                let mysqlFunc = function (cb) {
                    module.exports.connectMysql(dbCfg.redis, function (err, mysql) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        dbClients.push(mysql);
                        cb();
                    });
                };
                funcs.push(mysqlFunc);
                break;
            }

            case global.DATABASE_TYPE.MONGO:
                break;
            default:
                break;
        }
    });

    async.waterfall(funcs, function (err, result) {
        utils.invokeCallback(cb, err, dbClients);
    });
};

module.exports.connectRedis = function (opts, cb) {
    return new Promise(function (resolve, reject) {
        let connector = new RedisConnector();
        connector.start(opts, function (err) {
            if (err) {
                logger.error('连接Redis数据库失败', err);
                utils.invokeCallback(cb, err);
                reject(err);
            } else {
                logger.info('连接Redis数据库成功');
                utils.invokeCallback(cb, null, connector);
                resolve(connector);
            }
        });
    });
};

module.exports.connectMysql = function (opts, cb) {
    return new Promise(function (resolve, reject) {
        let connector = new MysqlConnector();
        connector.start(opts, function (err) {
            if (err) {
                logger.error('连接mysql数据库失败', err);
                utils.invokeCallback(cb, err);
                reject(err);
            } else {
                logger.info('连接mysql数据库成功');
                utils.invokeCallback(cb, null, connector);
                resolve(connector);
            }
        });
    });
};

// module.exports.connectDBBySequelize = function (opts, cb) {

//     const sequelize = new Sequelize(opts.server.db, opts.server.user, opts.server.password, {
//         host: opts.server.host,
//         dialect: 'mysql',
//         pool: {
//             max: opts.ext.max,
//             min: opts.ext.min,
//             idle: 10000
//         }
//     });

//     sequelize.authenticate().then(() => {
//         logger.info('sequelize连接数据库成功');
//         global.sequelize = sequelize;
//         utils.invokeCallback(cb, null, sequelize);
//     }).catch(err => {
//         console.error('sequelize连接数据库失败', err);
//         utils.invokeCallback(cb, err);
//     });

// };