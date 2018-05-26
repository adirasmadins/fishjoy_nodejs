const REDISKEY = require('../../../../models/index').REDISKEY;

module.exports = {
    DATA_MAP: {
        fightServerPlayerCount: REDISKEY.REALTIME_FIGHT_SERVER_PLAYER_COUNT,
        fightServerRoomCount: REDISKEY.REALTIME_FIGHT_SERVER_ROOM_COUNT,
        rankMatchPlayerCount: REDISKEY.REALTIME_RANK_MATCH_PLAYER_COUNT,
        rankMatchRoomCount: REDISKEY.REALTIME_RANK_MATCH_ROOM_COUNT,
    }
};

