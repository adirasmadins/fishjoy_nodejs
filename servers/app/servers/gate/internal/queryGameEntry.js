const omelo = require('omelo');
const rpcSender = require('../../../net/rpcSender');
const modules = require('../../../modules');
const loadManagerCmd = require('../../../cmd/loadManagerCmd');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const globalStatusData = require('../../../utils/globalStatusData');
const constDef = require('../../../consts/constDef');
const redisArenaSync = require('../../../utils/redisArenaSync');


class QueryGameEntry {

    async getEntry(data) {
        let _roomId = data.roomId;
        let serverInfo = null;
        if (_roomId) {
            let [err, {roomId}] = redisArenaSync.parseMatchId(_roomId);
            if(!err){
                _roomId  = roomId;
            }
            serverInfo = this._getEntryByRoomId(_roomId);
            if (!serverInfo) {
                throw ERROR_OBJ.ROOMID_INVALID;
            }
        } else {

            let gamePos = await globalStatusData.queryData(constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_GAME_POS, rpcSender.serverType.game, data.uid);
            if (gamePos) {
                serverInfo = this._getEntryByRoomId(gamePos.roomId);
            } else {
                serverInfo = await rpcSender.invoke(rpcSender.serverType.loadManager, rpcSender.serverModule.loadManager.loadRemote,
                    loadManagerCmd.remote.allock_server.route, {
                        moduleId: modules.game.moduleId,
                        serverType: rpcSender.serverType.game,
                        uid:data.uid
                    });
            }
        }

        if (serverInfo) {
            return {host: serverInfo.clientHost, port: serverInfo.clientPort};
        } else {
            throw ERROR_OBJ.GET_GAME_ENTRY_FAIL;
        }
    }

    _getEntryByRoomId(roomId) {
        let sid = roomId.toString().substr(0, 2);
        let nums = sid.split('');
        return omelo.app.getServerById(`game-${nums[0]}-${nums[1]}`);
    }
}

module.exports = new QueryGameEntry();