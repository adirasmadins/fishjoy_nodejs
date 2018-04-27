const RedisConnector = require('../database/dbclient').RedisConnector;
const MysqlConnector = require('../database/dbclient').MysqlConnector;

module.exports = {
    redisClient: new RedisConnector(),
    mysqlClient: new MysqlConnector()
};