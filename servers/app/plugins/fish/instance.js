const RobotController = require('./robot/robotController');
const config = require('./config');
const PlayerFactory = require('./entity/playerFactory');
const omelo = require('omelo');
const consts = require('./consts');
const fishCmd = require('../../cmd/fishCmd');
const FishCode = CONSTS.SYS_CODE;
const FishRoom = require('./fishRoom');
const GoddessRoom = require('./goddess/goddessRoom');
const ROBOT_EVENT = new Set([fishCmd.request.robot_catch_fish.route.split('.')[2]]);
const GAMECFG = require('../../utils/imports').DESIGN_CFG;
const RobotEvent = require('./entity/robotEvent');
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
        logger.error('-----------------fish Instance')
    }

    get gamePlay(){
        return this._gamePlay;
    }

    get playerEventEmitter(){
        return this._playerEventEmitter;
    }

    get cache(){
        return this._cache;
    }

    get cacheReader(){
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

    //加入邀请游戏
    async enterInviteGame(data) {
        if (!data.roomId || !data.uid || !data.sid) {
            return [CONSTS.SYS_CODE.ARGS_INVALID];
        }

        if (this._entities.has(data.uid)) {
            this.leaveGame(data);
        }

        let room = this._roomMap.get(data.roomId);
        if (!room) {
            return [CONSTS.SYS_CODE.PALYER_GAME_ROOM_DISMISS];
        }

        let player = null;
        try{
            player = await PlayerFactory.createPlayer(data);
        }catch(err){
            return [err];
        }

        let err = this._access(player.account, room.sceneId);
        if (err) {
            return [err];
        }

        err = room.join(player);
        if (err) {
            return [err];
        }
        this._roomMap.set(room.roomId, room);
        this._entities.set(player.uid, room);

        return [null,{
            roomId: room.roomId,
            players: room.genAllPlayers(player.uid)
        }];
    }

    async enterGame(data) {
        if (data.roomType == null || !data.sceneId || !data.uid || !data.sid) {
            return [CONSTS.SYS_CODE.ARGS_INVALID];
        }

        if (this._entities.has(data.uid)) {
            this.leaveGame(data);
        }

        let player = null;
        try{
            player = await PlayerFactory.createPlayer(data);
        }catch(err){
            return [err];
        }

        if (!player) {
            return [CONSTS.SYS_CODE.PLAYER_CREATE_FAILED];
        }

        let err = this._access(player.account, data.sceneId);
        if (err) {
            return [err];
        }

        let room = null;
        switch (data.roomType) {
            case consts.ROOM_TYPE.GODDESS:
                room = this._createRoom(data.roomType, data.sceneId, GoddessRoom, 1);
                break;
            case consts.ROOM_TYPE.SINGLE:
                room = this._createRoom(data.roomType, data.sceneId, FishRoom, 1);
                break;
            case consts.ROOM_TYPE.MULTI_FREE: {
                room = this._searchMultiRoom(data.sceneId);
                if (!room) {
                    room = this._createRoom(data.roomType, data.sceneId, FishRoom);
                }
            }
                break;
            case consts.ROOM_TYPE.MULTI_FRIENDS:
                room = this._createRoom(data.roomType, data.sceneId, FishRoom);
                break;
            default:
                err = FishCode.NOT_SUPPORT_ROOMMODE;
                break;
        }

        if (err) {
            return [err];
        }

        err = room.join(player);
        if (err) {
            return [err];
        }

        this._roomMap.set(room.roomId, room);
        this._entities.set(player.uid, room);

        let resp = {
            roomId: room.roomId,
            players: room.genAllPlayers(player.uid)
        };
        logger.error('玩家加入游戏房间', resp);
        return [null, resp];
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

    rpc_match_start(data, cb) {
        if (!data.uid) {
            utils.invokeCallback(cb, CONSTS.SYS_CODE.ARGS_INVALID);
            return;
        }

        let room = this._entities.get(data.uid);
        if (room) {
            let player = room.getPlayer(data.uid);
            player && player.startRmatch(data);
        }
        utils.invokeCallback(cb, null);
    }

    rpc_match_finish(data, cb) {
        if (!data.uid) {
            utils.invokeCallback(cb, CONSTS.SYS_CODE.ARGS_INVALID);
            return;
        }

        let room = this._entities.get(data.uid);
        if (room) {
            let player = room.getPlayer(data.uid);
            player && player.clearRmatch();
            utils.invokeCallback(cb, null);
        }
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
            utils.invokeCallback(cb, null);
        }
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

    _searchMultiRoom(sceneId, robot =false) {
        for (let room of this._roomMap.values()) {
            if (sceneId == room.sceneId && room.mode === consts.ROOM_TYPE.MULTI_FREE && (room.playerCount() < consts.ROOM_MAX_PLAYER
                    || !robot && room.kickRobot())) {
                return room;
            }
        }
        return null;
    }

    _matchRoom() {
        for (let room of this._roomMap.values()) {
            if (sceneId == room.sceneId && room.mode === consts.ROOM_TYPE.RANK_MATCH && room.playerCount() < 2) {

                return room;
            }
        }
        return null;
    }

    //场景进入条件
    _access(account, sceneId) {
        let sceneCfg = GAMECFG.scene_scenes_cfg[sceneId];
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
            logger.error('maxWp = ', maxWp, ' sceneConfig.min_level = ', sceneCfg.min_level)
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
        robotEvent.emit(route, data, cb);
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

    _genRoomId() {
        let rid = global.SERVER_ID + utils.random_int_str(4);
        while (this._roomMap.has(rid)) {
            rid = global.SERVER_ID + utils.random_int_str(4);
        }
        return rid;
    }

    _createRoom(mode, sceneId, className = FishRoom, playerMax = consts.ROOM_MAX_PLAYER) {
        let room = new className({
            roomId: this._genRoomId(),
            mode: mode,
            sceneId: sceneId,
            playerMax: playerMax,
        });
        room.start();
        return room;
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