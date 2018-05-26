const fishCode = CONSTS.SYS_CODE;
const config = require('../config');
const TICK_DT = 100; //定时器轮询周期，单位毫秒
const PlayerFactory = require('../entity/playerFactory');
const RoomFactory = require('../roomFactory');
const consts = require('../consts');

class RankMatchInstance {
    constructor() {
        this._roomMap = new Map();
        this._canRun = true;
        this._playerFactory = new PlayerFactory();
        this._roomFactory = new RoomFactory();
    }

    start() {
        this._runTask();
    }

    stop() {
        this._canRun = false;
    }

    getLoadStatistics() {
        return {
            roomCount: this._roomMap.size,
            playerCount: this._roomMap.size * 2
        };
    }

    remoteRpc(method, data, cb) {
        if (!this[method]) {
            cb(CONSTS.SYS_CODE.NOT_SUPPORT_SERVICE);
            return;
        }
        this[method](data, cb);
    }

    async _tick() {
        for (let room of this._roomMap.values()) {
            await room.update(TICK_DT);
            if (room.isGameOver()) {
                this._roomMap.delete(room.roomId);
                logger.info('比赛结束，移除房间');
            }
        }
    }

    _runTask() {
        if (!this._canRun) return;
        setTimeout(async function () {
            await this._tick();
            this._runTask();
        }.bind(this), TICK_DT);
    }

    rpc_join(data, cb) {
        try {
            let room = this._roomFactory.createRoom({
                roomMap: this._roomMap,
                roomType: consts.ROOM_TYPE.RANK_MATCH,
                playerMax: consts.ROOM_PLAYER_MAX[consts.ROOM_TYPE.RANK_MATCH]
            });

            room.init(data.users, this._playerFactory);
            this._roomMap.set(room.roomId, room);
            utils.invokeCallback(cb, null, {
                roomId: room.roomId,
                countdown: room.countdown,
                bulletNum: this._maxFireC,
            });
        } catch (err) {
            utils.invokeCallback(cb, err);
        }
    }

    rpc_query_playerInfo(data, cb) {
        this._rpcInfo(data, function (code, room) {
            if (code != 0) {
                cb && cb();
                return;
            }
            cb && cb(null, room.getRamtchInfo());
        });
    }

    _rpcInfo(data, cb) {
        let room = this._roomMap.get(data.roomId);
        if (!room) {
            cb(fishCode.MATCH_ROOM_NOT_EXIST);
            return;
        }

        if (room.isGameOver()) {
            cb(fishCode.MATCH_ROOM_GAMEOVER);
            return;
        }
        cb && cb(0, room);
    }

    rpc_fight_info(data, cb) {
        this._rpcInfo(data, function (code, room) {
            code === 0 && room.setFightInfo(data);
            cb && cb(null);
        });
    }

    rpc_weapon_change(data, cb) {
        this._rpcInfo(data, function (code, room) {
            code === 0 && room.weaponChange(data);
            cb && cb(null);
        });
    }

    rpc_use_nbomb(data, cb) {
        this._rpcInfo(data, function (code, room) {
            code === 0 && room.useNbomb(data);
            cb && cb(null);
        });
    }

    rpc_cancel_nbomb(data, cb) {
        this._rpcInfo(data, function (code, room) {
            code === 0 && room.cancelNbomb(data);
            cb && cb(null);
        });
    }

    rpc_rank_match_chat(data, cb) {
        this._rpcInfo(data, function (code, room) {
            code === 0 && room.rmatchChat(data);
            cb && cb(null);
        });
    }

    rpc_rank_match_provocative(data, cb){
        this._rpcInfo(data, function(code, room) {
            code === 0 && room.provocative(data);
            cb && cb(null);
        });
    }

}

module.exports = RankMatchInstance;