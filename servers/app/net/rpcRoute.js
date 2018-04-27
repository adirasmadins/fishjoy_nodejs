const rpcSender = require('./rpcSender');
const utils = require('../utils/utils');

class RpcRoute{
    gameRoute(session, msg, app, cb) {
        let routeId = null;
        if(typeof session.get === 'function'){
            routeId = session.get(rpcSender.serverIdKey.game);
        }
        else{
            routeId = session[rpcSender.serverIdKey.game];
        }
        utils.invokeCallback(cb, null, routeId);
    }

    rankMatchRoute(session, msg, app, cb) {
        let routeId = null;
        if(typeof session.get === 'function'){
            routeId = session.get(rpcSender.serverIdKey.rankMatch);
        }
        else{
            routeId = session[rpcSender.serverIdKey.rankMatch];
        }
        utils.invokeCallback(cb, null, routeId);
    }
}

module.exports = new RpcRoute();