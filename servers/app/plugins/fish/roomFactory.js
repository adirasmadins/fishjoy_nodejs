const FishRoom = require('./fishRoom');
const GoddessRoom = require('./goddess/goddessRoom');
const RankMatchRoom = require('./rankMatch/rankMatchRoom');
const ArenaRoom = require('./arena/arenaRoom');
const consts = require('./consts');
const ERROR_OBJ =require('../../consts/fish_error').ERROR_OBJ;
class RoomFactory{
    constructor(){

    }

    _genRoomId(roomMap) {
        let rid = global.SERVER_ID + utils.random_int_str(4);
        while (roomMap.has(rid)) {
            rid = global.SERVER_ID + utils.random_int_str(4);
        }
        return rid;
    }

    createRoom(opts){
        let CLASS = this.getRoomClass(opts.roomType);
        if(null == CLASS){
            throw ERROR_OBJ.NOT_SUPPORT_ROOMMODE;
        }

        let room = new CLASS({
            roomId: this._genRoomId(opts.roomMap),
            roomType: opts.roomType,
            sceneId: opts.sceneId,
            playerMax: opts.playerMax,
        });
        room.start();
        return room;
    }

    getRoomClass (roomType) {
        switch (roomType) {
            case consts.ROOM_TYPE.GODDESS:
                return GoddessRoom;
            case consts.ROOM_TYPE.SINGLE:
            case consts.ROOM_TYPE.MULTI_FREE:
                return FishRoom;
            case consts.ROOM_TYPE.RANK_MATCH:
                return RankMatchRoom;
            case consts.ROOM_TYPE.ARENA_MATCH:
                return ArenaRoom;
            default:
                break;
        }
        return null;
    }
}

module.exports = RoomFactory;

