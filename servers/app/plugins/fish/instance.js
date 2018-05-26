const RobotController = require('./robot/robotController');
const config = require('./config');
const PlayerFactory = require('./entity/playerFactory');
const RoomFactory = require('./roomFactory');
const omelo = require('omelo');
const consts = require('./consts');
const fishCmd = require('../../cmd/fishCmd');
const FishCode = CONSTS.SYS_CODE;
const ROBOT_EVENT = new Set([fishCmd.request.robot_catch_fish.route.split('.')[2]]);
const DESIGN_CFG = require('../../utils/imports').DESIGN_CFG;
const redisAccountSync = require('../../utils/redisAccountSync');
const redisArenaSync = require('../../utils/redisArenaSync');
const ACCOUNTKEY = require('../../models').ACCOUNTKEY;
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const constDef = require('../../consts/constDef');
const RobotEvent = require('./entity/robotEvent');
const MatchPlayer = require('./entity/matchPlayer');
const Player = require('./entity/player');
const GamePlay = require('./gamePlay/gamePlay');
const PlayerEvent = require('./cache/playerEvent');
const Cache = require('./cache/cache');
const CacheReader = require('./cache/cacheReader');

class Instance {
    constructor() {
        this._entities = new Map();
        this._roomMap = new Map();
        this._assignRobotTimer = null;
        this._kickOfflineTimer = null;
        this._robotEventEmitter = new RobotEvent();
        this._robotEventEmitter.setMaxListeners(0);
        this._playerEventEmitter = new PlayerEvent();
        this._playerEventEmitter.setMaxListeners(0);
        this._cache = new Cache();
        this._cacheReader = new CacheReader(this._cache);
        this._gamePlay = new GamePlay();
        this._playerFactory = new PlayerFactory();
        this._roomFactory = new RoomFactory();
        logger.error('-----------------fish Instance');
    }

    get gamePlay() {
        return this._gamePlay;
    }

    get playerEventEmitter() {
        return this._playerEventEmitter;
    }

    get cache() {
        return this._cache;
    }

    get cacheReader() {
        return this._cacheReader;
    }

    async start() {
        await this._cache.start();

        // if (!this._assignRobotTimer) {
        //     this._assignRobotTimer = setInterval(this._assignRobot.bind(this), config.ROBOT.VACANCY_QUERY_TIMEOUT);
        // }
        // this._robotController = new RobotController(this._robotEventEmitter);
        // this._robotController.run();

        if (!this._kickOfflineTimer) {
            this._kickOfflineTimer = setInterval(this._kickOfflinePlayer.bind(this), config.PLAYER.KICK_OFFLINE_CHECK_TIMEOUT);
        }
    }

    stop() {
        if (this._assignRobotTimer) {
            clearInterval(this._assignRobotTimer);
            this._assignRobotTimer = null;
        }

        if (this._kickOfflineTimer) {
            clearInterval(this._kickOfflineTimer);
            this._kickOfflineTimer = null;
        }

        this._robotEventEmitter.removeAllListeners();
        this._playerEventEmitter.removeAllListeners();
        // robotController.stop();
    }

    /**
     * 定时分配机器人
     * @return {Promise.<void>}
     * @private
     */
    async _assignRobot() {
        // let rooms = this._searchMultiRoom(null, true);
        // await robotController.addRobot(rooms);
    }

    getLoadStatistics() {
        return {
            playerCount: this._entities.size,
            roomCount: this._roomMap.size
        };
    }

    hasInRoom(uid) {
        return this._entities.get(uid);
    }

    request(route, msg, session, cb) {
        if (!this[route]) {
            utils.invokeCallback(cb, CONSTS.SYS_CODE.NOT_SUPPORT_SERVICE);
            return;
        }

        this[route](route, session.uid, msg, function (err, result) {
            utils.invokeCallback(cb, err, result);
        });
    }

    remoteRpc(method, data, cb) {
        if (!this[method]) {
            utils.invokeCallback(cb, CONSTS.SYS_CODE.NOT_SUPPORT_SERVICE);
            return;
        }
        this[method](data, function (err, result) {
            utils.invokeCallback(cb, err, result);
        });
    }

    async enter1V1RoomByRoomId(data) {
        if (!data.roomId || !data.uid || !data.sid) {
            throw CONSTS.SYS_CODE.ARGS_INVALID;
        }

        let room = this._roomMap.get(data.roomId);
        if (!room) {
            data.asyncMatch = true;
            return await this.enterGame(data);
        }

        let playerType = this._playerFactory.roomType2PlayerType(data.roomType);
        if (null == playerType) {
            throw CONSTS.SYS_CODE.NOT_SUPPORT_MODE_PLAYER;
        }

        let player = await this._playerFactory.createPlayer(data, playerType);

        let err = this._access(player.account, room.sceneId);
        if (err) {
            logger.error('进入邀请游戏场景条件不满足, err=', err);
            throw err;
        }

        err = await room.join(player, data);
        if (err) {
            if (err == CONSTS.SYS_CODE.MATCH_WAIT_TIMEOUT) {
                data.asyncMatch = true;
                return await this.enterGame(data);
            }
            logger.error('加入邀请游戏房间失败, err=', err);
            throw err;
        }

        this._roomMap.set(room.roomId, room);
        this._entities.set(player.uid, room);

        return {
            roomId: room.roomId,
            players: room.genAllPlayers(player.uid)
        };
    }

    //通过房间号加入游戏
    async enterGameByRoomId(data) {
        if (!data.roomId || !data.uid || !data.sid) {
            throw CONSTS.SYS_CODE.ARGS_INVALID;
        }

        if (this._entities.has(data.uid)) {
            this.leaveGame(data);
        }

        let room = this._roomMap.get(data.roomId);
        if (!room) {
            throw CONSTS.SYS_CODE.PALYER_GAME_ROOM_DISMISS;
        }

        let playerType = this._playerFactory.roomType2PlayerType(data.roomType);
        if (null == playerType) {
            throw CONSTS.SYS_CODE.NOT_SUPPORT_MODE_PLAYER;
        }

        let player = await this._playerFactory.createPlayer(data, playerType);

        let err = this._access(player.account, room.sceneId);
        if (err) {
            logger.error('进入邀请游戏场景条件不满足, err=', err);
            throw err;
        }

        err = await room.join(player, data);
        if (err) {
            if (err == CONSTS.SYS_CODE.MATCH_WAIT_TIMEOUT) {
                data.asyncMatch = true;
                return await this.enterGame(data);
            }
            logger.error('加入邀请游戏房间失败, err=', err);
            throw err;
        }

        this._roomMap.set(room.roomId, room);
        this._entities.set(player.uid, room);

        return {
            roomId: room.roomId,
            players: room.genAllPlayers(player.uid)
        };
    }

    is1v1Match(roomType) {
        return roomType == consts.ROOM_TYPE.ARENA_MATCH;
    }

    async isHas1v1Match(uid) {
        try {
            let account = await redisAccountSync.getAccountAsync(uid, [ACCOUNTKEY.ARENA_MATCHID]);
            if (account.matchId) {
                let arena = await redisArenaSync.getArena(account.matchId);
                if (arena) {
                    return true;
                }
            }
        } catch (err) {
            return false;
        }
        return false;
    }


    async match_1v1_check(uid) {
        try {
            let account = await redisAccountSync.getAccountAsync(uid, [ACCOUNTKEY.ARENA_MATCHID]);
            if (account.arena_matchid) {
                let [err, {
                    roomId,
                    serverId
                }] = redisArenaSync.parseMatchId(account.arena_matchid);
                if (err) {
                    throw err;
                }
                let arena = await redisArenaSync.getArena(account.arena_matchid);
                if (arena.arena_state == constDef.ARENA_MATCH_STATE.FINISHED) {
                    account.arena_matchid = '';
                    await account.commitSync();
                    return;
                }

                let pk_pos = {
                    roomId: roomId,
                    serverId: serverId,
                    matchId: account.arena_matchid
                };
                
                if (arena.arena_inviter.uid == uid) {
                    if (arena.arena_state != config.ARENA.MATCH_STATE.FINISHED) {
                        if (serverId != global.SERVER_ID) {
                            throw ERROR_OBJ.ARENA_NOT_FINISHED;
                        } else {
                            return pk_pos;
                        }
                    }
                } else if (arena.arena_invitee.uid == uid) {
                    if (arena.arena_invitee.state != config.ARENA.MATCH_STATE.FINISHED) {
                        if (serverId != global.SERVER_ID) {
                            throw ERROR_OBJ.ARENA_NOT_FINISHED;
                        } else {
                            return pk_pos;
                        }
                    }
                }
            }
        } catch (err) {
            throw err;
        }
    }

    async match_1v1_check_inviteMatchId(matchId, uid) {
        try {
            let [err, {
                roomId,
                serverId
            }] = redisArenaSync.parseMatchId(matchId);
            if (err) {
                throw err;
            }
            let arena = await redisArenaSync.getArena(matchId);
            let pk_pos = {
                roomId: roomId,
                serverId: serverId,
                matchId: matchId
            };
            if (arena.arena_inviter.uid == uid) {
                if (arena.arena_state == config.ARENA.MATCH_STATE.FINISHED) {
                    throw ERROR_OBJ.ARENA_MATCH_FINISH;
                }
            } else if (arena.arena_invitee.uid == uid) {
                if (arena.arena_invitee.state == config.ARENA.MATCH_STATE.FINISHED) {
                    throw ERROR_OBJ.ARENA_MATCH_FINISH;
                }
            }
            return [err, {
                roomId,
                serverId
            }];
        } catch (err) {
            throw err;
        }
    }

    async enterGame(data) {
        if (data.roomType == null || !data.sceneId || !data.uid || !data.sid) {
            throw CONSTS.SYS_CODE.ROOM;
        }

        if (this._entities.has(data.uid)) {
            this.leaveGame(data);
        }

        let playerType = this._playerFactory.roomType2PlayerType(data.roomType);
        if (null == playerType) {
            throw CONSTS.SYS_CODE.NOT_SUPPORT_MODE_PLAYER;
        }

        let player = await this._playerFactory.createPlayer(data, playerType);
        let err = this._access(player.account, data.sceneId);
        if (err) {
            logger.error('进入游戏场景条件不满足, err=', err);
            throw err;
        }

        let room = null;
        if (consts.ROOM_TYPE.MULTI_FREE == data.roomType) {
            room = this._searchMultiRoom(data.sceneId);
        }

        if (null == room) {
            room = this._roomFactory.createRoom({
                roomMap: this._roomMap,
                roomType: data.roomType,
                sceneId: data.sceneId,
                playerMax: consts.ROOM_PLAYER_MAX[data.roomType]
            });
        }

        err = await room.join(player, data);
        if (err) {
            logger.error('加入游戏房间失败, err=', err);
            throw err;
        }

        this._roomMap.set(room.roomId, room);
        this._entities.set(player.uid, room);

        return {
            roomId: room.roomId,
            players: room.genAllPlayers(player.uid)
        };
    }

    /**
     * 离开游戏
     * @param data
     * @return {*}
     */
    leaveGame(data) {
        let resData = null;
        let room = this._entities.get(data.uid);
        if (room) {
            resData = room.leave(data.uid);
            if (room.isDestroy()) {
                room.stop();
                this._roomMap.delete(room.roomId);
            }
            logger.error('玩家离开游戏房间', resData);
        }
        this._entities.delete(data.uid);
        return resData;
    }

    async continue_rmatch(data, cb) {
        logger.error('排位赛继续比赛');
        let room = this._entities.get(data.uid);
        if (room) {
            let player = room.getPlayer(data.uid);
            player.prototypeObj = Player.prototype;
            MatchPlayer.attach(player);
            await player.continueMatch(data, cb);
        } else {
            throw CONSTS.SYS_CODE.PALYER_GAME_ROOM_DISMISS;
        }
    }

    async continue_match_1v1(data, cb) {
        logger.error('1v1赛继续比赛');
        let room = this._entities.get(data.uid);
        if (room) {
            let player = room.getPlayer(data.uid);
            await player.continueMatch(data, cb);
        } else {
            throw CONSTS.SYS_CODE.PALYER_GAME_ROOM_DISMISS;
        }
    }

    /**
     * 设置玩家状态
     * @param {uid:10010,state: 0,sid:'game-server-1',sceneId:'scene-type-1'} data
     * @param {*} cb
     */
    setPlayerState(data) {
        if (!data.uid || !data.sid) {
            return [CONSTS.SYS_CODE.ARGS_INVALID];
        }
        let room = this._entities.get(data.uid);
        if (!!room && room.setPlayerState(data.uid, data.state, data.sid)) {
            return [null, {
                roomId: room.roomId,
                players: room.genAllPlayers(data.uid)
            }];
        } else {
            return [CONSTS.SYS_CODE.PALYER_GAME_ROOM_DISMISS];
        }
    }

    async rpc_match_start(data, cb) {
        logger.error('rpc_match_start排位赛开始比赛', data);
        if (!data.uid) {
            utils.invokeCallback(cb, CONSTS.SYS_CODE.ARGS_INVALID);
            return;
        }

        let room = this._entities.get(data.uid);
        if (room) {
            //TODO create a matchPlayer
            let player = room.getPlayer(data.uid);
            player.prototypeObj = Player.prototype;
            MatchPlayer.attach(player);
            player && player.startMatch(data);
        }
        utils.invokeCallback(cb, null);
    }

    rpc_match_finish(data, cb) {
        logger.error('rpc_match_finish排位赛结束', data);
        if (!data.uid) {
            utils.invokeCallback(cb, CONSTS.SYS_CODE.ARGS_INVALID);
            return;
        }

        let room = this._entities.get(data.uid);
        if (room) {
            //TODO create a matchPlayer
            let player = room.getPlayer(data.uid);
            player && player.stopMatch && player.stopMatch() && MatchPlayer.dettach(player, Player.prototype);
        }
        utils.invokeCallback(cb, null);
    }

    rpc_player_data_change(data, cb) {
        if (!data.uid) {
            utils.invokeCallback(cb, CONSTS.SYS_CODE.ARGS_INVALID);
            return;
        }

        let room = this._entities.get(data.uid);
        if (room) {
            let player = room.getPlayer(data.uid);
            //玩家进行数据同步
            player.syncData();
        }
        utils.invokeCallback(cb, null);
    }

    rpc_leave_game(data, cb) {
        let room = this._entities.get(data.uid);
        if (room) {
            room.leave(data.uid);
            if (room.isDestroy()) {
                room.stop();
                this._roomMap.delete(room.roomId);
            }
        }
        this._entities.delete(data.uid);
        utils.invokeCallback(cb, null);
    }

    _searchMultiRoom(sceneId, robot = false) {
        for (let room of this._roomMap.values()) {
            if (sceneId == room.sceneId && room.roomType === consts.ROOM_TYPE.MULTI_FREE && (room.playerCount < room.roomPlayerMaxCount ||
                    !robot && room.kickRobot())) {
                return room;
            }
        }
        return null;
    }

    //场景进入条件
    _access(account, sceneId) {
        let sceneCfg = DESIGN_CFG.scene_scenes_cfg[sceneId];
        if (!sceneCfg) {
            return FishCode.NOT_SUPPORT_SCENETYPE;
        }

        //注意，玩家金币若是为负数，也允许其进入房间，方便其领取破产基金
        if (account.gold >= 0 && account.gold < sceneCfg.needgold) {
            return FishCode.GOLD_NOT_ENOUTH;
        }

        //取玩家的最大武器等级
        let curMaxWpLv = this._gamePlay.cost.getWpLevelMax(account.weapon_energy);
        if (curMaxWpLv < sceneCfg.min_level) {
            return FishCode.WEAPON_LEVEL_LOW;
        }
        return null;
    }


    //场景限制
    _limit(route, uid, data) {

        // if(route === fishCmd.request.fire.route.split('.')[2]){
        //     return true;
        // }

        return false;
    }

    _robotEvent(route, data, cb) {
        if (!ROBOT_EVENT.has(route)) {
            return false;
        }
        this._robotEventEmitter.emit(route, data, cb);
        return true;
    }

    _roomEvent(roomId, route, data, cb) {
        let room = this._roomMap.get(roomId);
        let func = room[route];
        if (typeof func != 'function') {
            return false;
        }
        func.apply(room, Array.prototype.slice.call(arguments, 2));
        return true;
    }

    static registe(route) {
        let prototype = Instance.prototype;
        prototype[route] = function (route, uid, data, cb) {
            if (this._limit(route, uid, data)) {
                utils.invokeCallback(cb, FishCode.NOT_SUPPORT_OPERATE);
                return;
            }

            let room = data.room;
            let player = room.getPlayer(data.uid);
            if (!player) {
                utils.invokeCallback(cb, FishCode.PLAYER_NOT_EXIST);
                return;
            }

            let cheatData = player.getCheatingData();
            if (cheatData) {
                utils.invokeCallback(cb, {
                    code: FishCode.PLAYER_CHEATING.code,
                    msg: cheatData.msg || FishCode.PLAYER_CHEATING.msg
                });
                this.leaveGame(uid);
                return;
            }

            player.updateActiveTime();
            if (this._robotEvent(route, data, cb)) {
                return;
            }
            if (this._roomEvent(player.roomId, route, data, cb)) {
                return;
            }

            if (player.ready && route != 'c_heartbeat') {
                logger.error('玩家准备中，无法开炮等操作', route);
                utils.invokeCallback(cb, FishCode.PLAYER_READYING);
                return;
            }

            let func = player[route];
            if (typeof func != 'function') {
                utils.invokeCallback(cb, FishCode.INTERFACE_DEVELOPPING);
                return;
            }
            func.apply(player, Array.prototype.slice.call(arguments, 2));
        };
    }

    /**
     * 移除离线玩家
     * @private
     */
    _kickOfflinePlayer() {
        for (let room of this._roomMap.values()) {
            let uids = room.kickOffline();
            if (room.isDestroy()) {
                room.stop();
                this._roomMap.delete(room.roomId);
            }

            for (let uid of uids) {
                this._entities.delete(uid);
                let sessionService = omelo.app.get('sessionService');
                sessionService && sessionService.kick(uid);
            }
        }
    }
}

function attach() {
    let req = fishCmd.request;
    for (let k of Object.keys(req)) {
        Instance.registe(req[k].route.split('.')[2]);
    }
}

attach();

module.exports = Instance;