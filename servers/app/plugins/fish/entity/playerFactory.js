const ChannelPlayer =  require('./channelPlayer');
const MatchPlayer =  require('./matchPlayer');
const GoddessPlayer = require('../goddess/goddessPlayer');
const RankMatchPlayer = require('../rankMatch/rankMatchPlayer');
const ArenaPlayer = require('../arena/arenaPlayer');
const redisAccountSync = require('../../../utils/redisAccountSync');
const consts = require('../consts');

class PlayerFactory{
    constructor(){
        logger.error('-----------------PlayerFactory');
    }

    /**
     * 创建一个真实玩家
     * @param {*} data 
     */
    async createPlayer(data, playerType){
        let classObj = this._getPlayerClass(playerType);
        if (!classObj) {
            return null;
        }
        return await this._allocPlayer(data, classObj);
    }

    async _allocPlayer(data, classObj){
        let account = await redisAccountSync.getAccountAsync(data.uid, classObj.sBaseField());
        let player = new classObj({
            uid: data.uid,
            sid: data.sid,
            account: account,
            kindId: consts.ENTITY_TYPE.PLAYER,
        });
        return player;
    }

    roomType2PlayerType(roomType){
        switch (roomType) {
            case consts.ROOM_TYPE.GODDESS:
                return consts.PLAYER_TYPE.GODDESS;
            case consts.ROOM_TYPE.SINGLE:
            case consts.ROOM_TYPE.MULTI_FREE:
                return consts.PLAYER_TYPE.FISH;
            case consts.ROOM_TYPE.RANK_MATCH:
                return consts.PLAYER_TYPE.RANK_MATCH;
            case consts.ROOM_TYPE.ARENA_MATCH:
                return consts.PLAYER_TYPE.ARENA_MATCH;
            default:
                break;
        }
        return null;
    }

    _getPlayerClass (type) {
        switch (type) {
            case consts.PLAYER_TYPE.GODDESS:
                return GoddessPlayer;
            case consts.PLAYER_TYPE.FISH:
                return ChannelPlayer;
            case consts.PLAYER_TYPE.MATCH_FISH:
                return MatchPlayer;
            case consts.PLAYER_TYPE.RANK_MATCH:
                return RankMatchPlayer;
            case consts.PLAYER_TYPE.ARENA_MATCH:
                return ArenaPlayer;
            default:
            break;
        }
        return null;
    }
}

module.exports = PlayerFactory;