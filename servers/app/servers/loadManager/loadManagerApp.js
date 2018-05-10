const plugins = require('../../plugins');
const GAME_TYPE = require('../../utils/imports').sysConfig.GAME_TYPE;
const loadSync = require('./internal/loadSync');

/**
 * 负载管理服务
 * 提供业务服务负载信息
 */
class LoadManagerApp {
    constructor() {
    }

    async start() {
        loadSync.start();
        logger.info('负载服务启动成功');
    }

    stop() {
        loadSync.stop();
        logger.info('负载服务关闭');
    }

    remoteRpc(method, data, cb) {
        if (!plugins[GAME_TYPE]) {
            utils.invokeCallback(cb, CONSTS.SYS_CODE.NOT_SUPPORT_GAMETYPE);
            return;
        }

        if (!this[method]) {
            cb(CONSTS.SYS_CODE.NOT_SUPPORT_SERVICE);
            return;
        }
        this[method](data, cb);
    }

    /**
     * 分配服务器
     * @param param
     * @param cb
     */
    rpc_allock_server(data, cb) {
        let [err, serverInfo] = loadSync.alloc_server(data.moduleId, data.serverType, data.uid);
        utils.invokeCallback(cb, err, serverInfo);
    }

    /**
     * 获取服务器负载
     * @param data
     * @param cb
     */
    rpc_get_game_load(data, cb){
        utils.invokeCallback(cb, null, loadSync.getLoad(data.moduleId));
    }

}

module.exports = LoadManagerApp;