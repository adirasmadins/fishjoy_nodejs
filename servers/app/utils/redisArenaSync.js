const Arena = require('./arena/arena');
const modelsUtil = require('../models/modelsUtil');
const redisDataParser = require('../models/redisDataParser');
const REDISKEY = require('../models/redisKey');
const ERROR_OBJ = require('../consts/fish_error').ERROR_OBJ;

/**
 * 竞技场比赛是否存在
 * @param uid
 * @param cb
 * @private
 */
async function _arenaMatchExist(matchId) {
    let exist = await redisConnector.hget(REDISKEY.ARENA_STATE, matchId);
    if(exist == null){
        return false;
    }
    return true;
}

async function _setArena(matchId, data) {
    if (!matchId || !data) {
        throw ERROR_OBJ.PARAM_MISSING;
    }

    let fields = [];
    if (data instanceof Array) {
        fields = data;
    } else {
        for (let key in data) {
            let item = {};
            item[key] = data[key];
            fields.push(item);
        }
    }

    if (fields.length === 0) {
        return;
    }

    let cmds = [];
    let fieldKeys = [];
    fields.forEach(function (item) {
        for (let key in item) {
            let cmd = Arena.getCmd(key);
            if (cmd) {
                fieldKeys.push(key);
                cmds.push([cmd, REDISKEY.getArenaKey(key), matchId, redisDataParser.serializeValue(key, item[key])]);
            }
        }
    });
    return await redisConnector.multi(cmds);
}

//获取对战信息
async function _getArena(matchId, fields) {
    if (matchId == null) {
        throw ERROR_OBJ.PARAM_MISSING;
    }

    let all = false;
    if (!fields || fields.length == 0) {
        all = true;
    }

    let isHave = await _arenaMatchExist(matchId);
    if(!isHave){
        throw ERROR_OBJ.ARENA_MATCH_NOT_EXIST;
    }

    if (all || !!fields && fields.length > 1) {
        let cmds = [];
        let _fileds = null;
        if (all) {
            _fileds = Array.from(modelsUtil.ArenaModelFields);
        } else {
            _fileds = fields;
        }

        _fileds.forEach(function (item) {
            cmds.push(['hget', REDISKEY.getArenaKey(item), matchId]);
        });

        let docs = await redisConnector.multi(cmds);
        let arena = new Arena(matchId);
        for (let i = 0; i < _fileds.length; ++i) {
            arena.appendValue(_fileds[i], docs[i]);
        }
        return arena;

    }else {
        let doc = await redisConnector.hget(REDISKEY.getArenaKey(fields[0]), matchId);
        let arena = new Arena(matchId);
        arena.appendValue(fields[0], doc);
        return arena;
    }
}

//对战完成，删除对战信息
async function _delArena(matchId) {
    let cmds = [];
    modelsUtil.ArenaModelFields.forEach(function (item) {
        cmds.push(['hdel', REDISKEY.getArenaKey(item), matchId]);
    });
    return await redisConnector.multi(cmds);
}

function _parseMatchId(matchId) {
    if(matchId == null){
        return [ERROR_OBJ.PARAM_ERROR];
    }

    let sp = matchId.split('-');
    if(sp.length != 3){
        return [ERROR_OBJ.ARENA_MATCHID_INVALID];
    }

    let roomId = sp[0];
    let serverId = roomId.substr(0,2);
    return [null, {serverId:serverId, roomId:roomId}];
}

async function _arenaMatchLocker(matchId, isLock = true) {
    let key = REDISKEY.getArenaKey(`lock:${matchId}`);
    if(isLock){
        let curVal = await redisConnector.incrP(key);
        await redisConnector.expireP(key, 2);
        return curVal == 1;
    }else {
        redisConnector.del(key);
    }
}

module.exports.getArena = _getArena;
module.exports.setArena = _setArena;
module.exports.delArena = _delArena;
module.exports.parseMatchId = _parseMatchId;
module.exports.arenaMatchLocker = _arenaMatchLocker;