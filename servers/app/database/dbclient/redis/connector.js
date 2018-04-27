const redis = require('redis');
const utils = require('../../../utils/utils');

class Connector {
    constructor() {
        this._cmdClient = null;
        this._subClient = null;
        this._pubClient = null;
        this.events = {};
        this.opts = null;
    }

    start(opts, cb) {
        return new Promise(function (resolve, reject) {
            if (!opts.enable) {
                utils.invokeCallback(cb, null);
                resolve(false);
                return;
            }

            this.opts = opts;
            this._cmdClient = redis.createClient({
                host: opts.server.host,
                port: opts.server.port,
                db: opts.server.db,
                prefix: opts.server.prefix
            });

            if (opts.server.auth) {
                this._cmdClient.auth(opts.server.password);
            }

            this._cmdClient.on('connect', function (err) {
                if (err) {
                    logger.error('redis 连接异常', err);
                    utils.invokeCallback(cb, err);
                    resolve(false);
                } else {
                    logger.info('redis 连接成功');
                }
            });

            this._cmdClient.on('ready', function (err) {
                if (err) {
                    logger.error('redis 数据库准备未就绪');
                    utils.invokeCallback(cb, err);
                    resolve(false);
                } else {
                    logger.info('redis 数据库准备就绪');
                    global.redisConnector = this;
                    utils.invokeCallback(cb, null, this);
                    resolve(true);
                }
            }.bind(this));

            this._cmdClient.on('error', function (err) {
                logger.error('redis 数据库错误' + err);
            });

            this._createSub();
            this._createPub();

        }.bind(this));
    }

    stop() {
        if (this._cmdClient) {
            this._cmdClient.end();
            this._cmdClient = null;
        }
        if (this._subClient) {
            this._subClient.end();
            this._subClient = null;
        }
        if (this._pubClient) {
            this._pubClient.end();
            this._pubClient = null;
        }
    }

    get cmd() {
        return this._cmdClient;
    }

    pub(event, msg) {
        if (!this._pubClient) {
            this._createPub();
        }

        msg = this._getDBWriteValue(msg);

        this._pubClient.publish(event, msg, function (err, result) {
            if(err){
                logger.error('消息发布失败, err', event, msg, err);
            }
        });

    }

    sub(event, cb) {
        if (!this._subClient) {
            this._createSub();
        }
        this._subClient.subscribe(event);
        this.events[event] = cb;
    }

    async incrP(key) {
        return new Promise(function (resolve, reject) {
            this._cmdClient.incr(key, function (err, res) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        }.bind(this));
    }

    async expireP(key, time) {
        return new Promise(function(resolve, reject) {
            this._cmdClient.expire(key, time, function (err, res) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        }.bind(this));

    }

    async get(key){
        let self = this;
        return new Promise(function(resolve, reject){
            self._cmdClient.get(key, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    if(!result){
                        resolve(null);
                        return;
                    }
                    result = self._getDBReadValue(result);
                    resolve(result);
                }
            });
        });
    }

    async set(key, value){
        if(!key || !value){
            return;
        }

        value = this._getDBWriteValue(value);
        let self = this;
        return new Promise(function(resolve, reject){
            self._cmdClient.set(key, value, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    async hget(key, member){
        let self = this;
        return new Promise(function(resolve, reject){
            self._cmdClient.hget(key, member, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    if(!result){
                        resolve(null);
                        return;
                    }
                    result = self._getDBReadValue(result);
                    resolve(result);
                }
            });
        });
    }

    async hgetall(key){
        let self = this;
        return new Promise(function(resolve, reject){
            self._cmdClient.hgetall(key, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    if(!result){
                        resolve(null);
                        return;
                    }
                    result = self._getDBReadValue(result);
                    resolve(result);
                }
            });
        });
    }

    async zremrangebyrank(key, start, stop){
        return new Promise(function (resolve, reject) {
            redisConnector.cmd.zremrangebyrank(key, start, stop, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    async zcard(key){
        return new Promise(function (resolve, reject) {
            redisConnector.cmd.zcard(key, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    async zrem(key, members){
        return new Promise(function (resolve, reject) {
            redisConnector.cmd.zrem(key, members, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    async sadd(key, members){
        return new Promise(function (resolve, reject) {
            redisConnector.cmd.sadd(key, members, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    async srem(key, members){
        return new Promise(function (resolve, reject) {
            redisConnector.cmd.srem(key, members, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    async smembers(key){
        return new Promise(function (resolve, reject) {
            redisConnector.cmd.smembers(key, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    _getDBWriteValue(value){
        if(typeof value == 'object'){
            value = JSON.stringify(value);
        }
        return value;
    }

    _getDBReadValue(value){
        try{
            if(typeof value == 'string'){
                value = JSON.parse(value);
            }

        }catch(err){
            err;
        }
        return value;
    }

    _createSub() {
        this._subClient = redis.createClient({
            host: this.opts.server.host,
            port: this.opts.server.port,
            db: this.opts.server.db + 1,
            prefix: this.opts.server.prefix
        });

        if (this.opts.server.auth) {
            this._subClient.auth(this.opts.server.password);
        }

        this._subClient.on('error', function (err) {
            logger.error('redis sub client connect err:', err);
        });

        this._subClient.on('message', function (event, msg) {
            try {
                utils.invokeCallback(this.events[event], this._getDBReadValue(msg));
            } catch (err) {
                logger.error(event, '订阅数据异常:', err);
            }

        }.bind(this));
    }

    _createPub() {
        this._pubClient = redis.createClient({
            host: this.opts.server.host,
            port: this.opts.server.port,
            db: this.opts.server.db + 1,
            prefix: this.opts.server.prefix
        });

        if (this.opts.server.auth) {
            this._pubClient.auth(this.opts.server.password);
        }

        this._pubClient.on('error', function (err) {
            logger.error('redis pub client connect err:', err);
        });
    }


}


module.exports = Connector;