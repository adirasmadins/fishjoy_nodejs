const omeloAdmin = require('omelo-admin');
const omelo = require('omelo');
const BALANCE_PERIOD = require('../../../utils/imports').sysConfig.BALANCE_PERIOD;
const modules = require('../../../modules');

class LoadSync {
    constructor() {
        this._timerHandle = null;
        this._adminClient = null;
        this._cache_servers = new Map();
    }

    start() {
        let adminUser = omelo.app.get('adminUser')[0];
        this._adminClient = new omeloAdmin.adminClient({
            username: adminUser.username,
            password: adminUser.password
        });

        let master = omelo.app.getMaster();
        this._adminClient.connect('loadManager-' + Date.now(), master.host, master.port, function (err) {
            if (err) {
                logger.error('负载管理服务连接master失败', err);
            } else {
                logger.info('负载管理服务连接master成功');
                this._runTick();
            }
        }.bind(this));
    }

    stop() {
        if (this._timerHandle) {
            clearInterval(this._timerHandle);
        }
    }

    getLoad(moduleId) {
        if (this[`_${moduleId}LoadMap`]) {
            return [...this[`_${moduleId}LoadMap`]];
        }
        return [];
    }

    alloc_server(moduleId, serverType, uid) {

        let serverInfo = this._getCacheServer(moduleId, serverType, uid);
        if (serverInfo) {
            return [null, serverInfo];
        }
        let gameServers = omelo.app.getServersByType(serverType);
        if (!gameServers || gameServers.length === 0) {
            return [CONSTS.SYS_CODE.SERVER_DEPLOY_ERROR];
        }

        let serverMap = this[`_${moduleId}LoadMap`];
        if (!serverMap || serverMap && serverMap.size === 0) {
            return [CONSTS.SYS_CODE.SERVER_NOT_RUNNING];
        }

        let _cfgGameMap = new Map();
        gameServers.forEach(function (item) {
            _cfgGameMap.set(item.id, item);
        });

        let [id, load] = this._getMinLoadServer(serverMap);
        // logger.error('@@@@@@@@@@@@@@@', id, load);
        let item = _cfgGameMap.get(id);
        if (item) {
            ++load.playerCount;
            // logger.error('@@@@@@@@@@@@@@@', item.maxLoad, load);
            if (item.maxLoad && load.playerCount > item.maxLoad) {
                return [CONSTS.SYS_CODE.SERVER_RESOURCE_NOT_ENOUGHT];
            }
            serverMap.set(id, load);
        } else {
            return [CONSTS.SYS_CODE.SERVER_ILLEGAL];
        }
        // this._cache_server.set(this._getCachKey(serverType, uid), item);
        this._setCacheServer(moduleId, serverType, uid, item);
        return [null, item];
    }

    _getCacheServer(moduleId, serverType, uid) {
        let moduleServers = this._cache_servers.get(moduleId);
        if (moduleServers) {
            let serverInfo = moduleServers.get(this._getCachKey(serverType, uid));
            if (serverInfo) {
                return serverInfo;
            }
        }
    }

    _setCacheServer(moduleId, serverType, uid, item) {
        let moduleServers = this._cache_servers.get(moduleId);
        if (!moduleServers) {
            moduleServers = new Map();
        }
        moduleServers.set(this._getCachKey(serverType, uid), item);
    }

    _clearCacheServer(moduleId) {
        let moduleServers = this._cache_servers.get(moduleId);
        if(moduleServers){
            moduleServers.clear();
        }
    }

    _getCachKey(serverType, uid) {
        return `${serverType}_${uid}`;
    }

    _getMinLoadServer(serverMap) {
        let id = null;
        let load = {};
        for (let [k, v] of serverMap) {
            if (!id) {
                id = k;
                load = v;
            }

            if (load.playerCount > 20 && load.playerCount > v.playerCount) {
                load = v;
                id = k;
            }
        }
        return [id, load];
    }

    _runTick() {
        let self = this;
        this._timerHandle = setInterval(function () {
            for (let moduleId in modules) {
                self._adminClient.request(moduleId, {}, function (err, data) {
                    if (!!err || data == null) {
                        return;
                    }

                    if (!self[`_${moduleId}LoadMap`]) {
                        self[`_${moduleId}LoadMap`] = new Map();
                    } else {
                        self[`_${moduleId}LoadMap`].clear();
                    }

                    for (let id in data) {
                        self[`_${moduleId}LoadMap`].set(id, data[id].load);
                        logger.info('服务器负载信息:', id, data[id].load);
                    }
                    self._clearCacheServer(moduleId);
                });
            }
        }, BALANCE_PERIOD);
    }
}

module.exports = new LoadSync();