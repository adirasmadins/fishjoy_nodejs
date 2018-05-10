const omelo = require('omelo');
const dispatcher = require('../../../utils/dispatcher');
const httpCfg = omelo.app.get('http');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const logicResponse = require('../../common/logicResponse');
const queryGameEntry = require('../internal/queryGameEntry');
const rpcDefs = require('../../../net/rpcDefs');

function _getServerCfgTypeId(lists, serverId) {
    for (let i = 0; i < lists.length; i++) {
        if (lists[i].id == serverId) {
            return lists[i];
        }
    }
}

function _getList(uid, protocol) {
    const serverInfo = {};
    let enable = protocol == 'https' ? true : false;

    serverInfo.PROTOCOL = protocol;

    let resource = dispatcher.dispatchEx(uid, httpCfg.resource);
    serverInfo.RESOURCE = {
        address: enable ? resource.https.publicHost:resource.http.publicHost,
        port: enable ? resource.https.port : resource.http.port,
    };

    let onlineHalls = omelo.app.getServersByType(rpcDefs.serverType.hall);
    let hall = null;
    if (onlineHalls && onlineHalls.length > 0) {
        let onlineHall = dispatcher.dispatchEx(uid, onlineHalls);
        hall = _getServerCfgTypeId(httpCfg.hall, onlineHall.id);
    } else {
        hall = dispatcher.dispatchEx(uid, httpCfg.hall);
    }

    if (hall) {
        serverInfo.HALL = {
            address: enable ? hall.https.publicHost : hall.http.publicHost,
            port: enable ? hall.https.port : hall.http.port,
        };
    }

    let chat = dispatcher.dispatchEx(uid, httpCfg.chat);
    serverInfo.CHAT = {
        address: enable ? chat.https.publicHost : chat.http.publicHost,
        port: enable ? chat.https.port : chat.http.port,
    };

    let pay = dispatcher.dispatchEx(uid, httpCfg.pay);
    serverInfo.PAY = {
        address: enable ? pay.https.publicHost : pay.http.publicHost,
        port: enable ? pay.https.port : pay.http.port,
    };

    let gates = omelo.app.getServersByType('gate');
    let gate = dispatcher.dispatchEx(uid, gates);
    serverInfo.ROOM = {
        address: gate.host,
        port: gate.clientPort,
    };

    return serverInfo;
}

async function lists(data) {
    if (!data.token || !data.protocol) {
        throw ERROR_OBJ.PARAM_MISSING;
    }
    let result = _getList(data.uid, data.protocol);
    return logicResponse.ask(result);
}

async function query_game_entry(data) {
    let entry = await queryGameEntry.getEntry(data);
    return logicResponse.ask(entry);
}


module.exports.lists = lists;
module.exports.query_game_entry = query_game_entry;