const omelo = require('omelo');
const rpcDefs = require('./rpcDefs');
const globalUserStatus = require('./globalUserStatus');
const versions = require('../../config/versions');

class RpcSender {
    constructor() {
        logger.error('-----------------RpcSender');
    }

    get serverType() {
        return rpcDefs.serverType;
    }

    get serverIdKey(){
        return rpcDefs.serverIdKey;
    }

    get serverModule() {
        return rpcDefs.serverModule;
    }

    async invoke(serverType, serverModule, route, data, sid = null) {
        if(!serverType || !serverModule || !route){
            logger.error('invoke 参数缺失:', serverType, serverModule, route);
            return;
        }
        try {
            let target = this._getRPCTarget(serverType, serverModule, route);
            if(!target){
                return;
            }
            versions.PUB == versions.GAMEPLAY.LOCAL && logger.error('invoke = ', serverType, serverModule, route, data, sid);
            return await this._invokeRpc(target, this._getSession(serverType, sid), data);
        } catch (err) {
            logger.warn('rpc invoke err=', err);
            throw err;
        }
    }

    /**
     * RPC调用前端服务器
     * @param serverType
     * @param serverRemote
     * @param route
     * @param uid
     * @param data
     * @return {Promise}
     */
    async invokeFront(serverType, serverModule, route, uid, data) {
        if(!serverType || !serverModule || !route || !uid){
            logger.error('invokeBackend 参数缺失:', serverType, serverModule, route, uid);
            return;
        }

        try {
            let online = await globalUserStatus.getUserStatus(uid);
            if (!online) {
                return;
            }
            let sid = await globalUserStatus.getUserSid(uid);
            let target = this._getRPCTarget(serverType, serverModule, route);
            if(!target){
                return;
            }
            versions.PUB == versions.GAMEPLAY.LOCAL && logger.error('invokeFront = ', serverType, serverModule, route, uid, sid, data);
            return await this._invokeRpc(target, this._getSession(serverType, sid), data);
        } catch (e) {
            logger.warn('rpc invokeFront e=', e);
            throw e;
        }
    }

    _invokeRpc(target, session, data){
        return new Promise(function (resolve, reject) {
            target(session, data, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    _getRPCTarget(serverType, serverModule, method) {
        let target = omelo.app.rpc[serverType] && omelo.app.rpc[serverType][serverModule] && omelo.app.rpc[serverType][serverModule][method];
        return target;
    }

    /**
     * 获取rpc调用session
     * @param {服务类型} serverType
     * @param {服务ID} sid
     */
    _getSession(serverType, sid) {
        let session = {};
        if(this.serverIdKey[serverType] && sid){
            session[this.serverIdKey[serverType]] = sid;
        }
        return session;
    }
}

module.exports = new RpcSender();