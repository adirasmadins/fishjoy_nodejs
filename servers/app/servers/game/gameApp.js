const omelo = require('omelo');
const async = require('async');
const plugins = require('../../plugins');
const {RedisConnector, MysqlConnector} = require('../../database/dbclient');
const matchingCmd = require('../../cmd/matchingCmd');
const constDef = require('../../consts/constDef');
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const GAME_TYPE = require('../../utils/imports').sysConfig.GAME_TYPE;
const redisArenaSync = require('../../utils/redisArenaSync');
const dropManager = require('../../utils/DropManager');
const rpcSender = require('../../net/rpcSender');
const globalStatusData = require('../../utils/globalStatusData');
const fishCmd = require('../../cmd/fishCmd');
const serviceCtrl = require('../common/serviceCtrl');

class GameApp {
    constructor() {
        this._instance = new plugins[GAME_TYPE].Instance();
        this._maxLoad = 200;
        logger.error('-----------------GameApp'); 
    }

    get instance(){
        return this._instance;
    }

    async start() {
        this._redisConnector = new RedisConnector();
        let result = await this._redisConnector.start(omelo.app.get('redis'));
        if (!result) {
            process.exit(0);
            return;
        }
        this._mysqlConnector = new MysqlConnector();
        result = await this._mysqlConnector.start(omelo.app.get('mysql'));
        if (!result) {
            process.exit(0);
            return;
        }

        omelo.app.game = this;
        await this._instance.start();

        dropManager.start();

        serviceCtrl.enableSysShutdow();

        let cfg = omelo.app.getCurServer();
        this._maxLoad = cfg.maxLoad;
        let serverId = omelo.app.getServerId();
        let splits = serverId.split('-');

        global.SERVER_ID = `${splits[1]}${splits[2]}`;

        globalStatusData.clean();
        logger.error('游戏战斗服启动成功');
    }

    stop() {
        this._instance.stop();
        redisConnector.stop();
        mysqlConnector.stop();
        globalStatusData.clean();
    }

    hasInRoom(uid) {
        return this._instance.hasInRoom(uid);
    }

    remoteRpc(method, data, cb) {
        this._instance.remoteRpc(method, data, cb);
    }

    request(route, msg, session, cb) {
        if (this._interceptReq(route, msg, session, cb)) {
            return;
        }
        this._instance.request(route, msg, session, cb);
    }

    _interceptReq(route, msg, session, cb) {
        if (!this[route]) return false;
        this[route](msg, session, cb);
        return true;
    }

    c_login(msg, session, cb) {
        let {playerCount} = this.getLoadInfo();
        if (playerCount >= this._maxLoad) {
            utils.invokeCallback(cb, CONSTS.SYS_CODE.SERVER_RESOURCE_NOT_ENOUGHT);
            return;
        }

        let self = this;
        let _uid = msg.uid;
        let sessionService = omelo.app.get('sessionService');
        async.waterfall([
            function (cb) {
                sessionService.kick(_uid, function (err) {
                    if (err) {
                        cb(CONSTS.SYS_CODE.SYSTEM_ERROR);
                    } else {
                        cb();
                    }
                });
            },
            function (cb) {
                session.bind(_uid, function (err) {
                    if (err) {
                        cb(CONSTS.SYS_CODE.SYSTEM_ERROR);
                    } else {
                        session.on('closed', self._socketClose.bind(self));
                        cb();
                    }
                });
            }
        ], function (err) {
            utils.invokeCallback(cb, err);
            logger.info(`用户[${_uid}]登陆成功`);
        });
    }

    c_logout(msg, session, cb) {
        let sessionService = omelo.app.get('sessionService');
        sessionService && sessionService.kick(msg.uid);
        utils.invokeCallback(cb, null);
    }

    async _enter_1v1_room(msg, session, cb){
        let resp = await this.instance.match_1v1_check(msg.uid);
        if(resp){
            //已经存在比赛的玩家
            msg.hasMatch = true;
            let {roomId, matchId} = resp;
            msg.roomId = roomId;
            msg.matchId = matchId;
        }else {
            //受邀请加入1V1,解析其matchId，得到roomId
            if(msg.roomId){
                msg.matchId = msg.roomId;
                let [err, {roomId}] = await this.instance.match_1v1_check_inviteMatchId(msg.roomId, msg.uid)
                if(err){
                    throw err;
                }
                msg.roomId = roomId;
            }
        }

        //加入指定房间
        let _respose = null;
        if (msg.roomId) {
            _respose = await this._instance.enter1V1RoomByRoomId(msg);
        } else {
            _respose = await this._instance.enterGame(msg);
        }

        session.set('roomId', _respose.roomId);
        session.set(rpcSender.serverIdKey.game, session.frontendId);
        session.pushAll(function () {
            logger.info(`用户[${msg.uid}]加入游戏成功`, _respose);
            utils.invokeCallback(cb, null, _respose);
        });
    }

    async c_enter_room(msg, session, cb) {
        msg.sid = session.frontendId;

        try {
            //检查1V1对战是否存在
            msg.isMatch = this.instance.is1v1Match(msg.roomType);
            if(msg.isMatch){
                await this._enter_1v1_room(msg, session, cb);
                return;
            }else {
                if(await this.instance.isHas1v1Match(msg.uid)){
                    utils.invokeCallback(cb, ERROR_OBJ.ARENA_NOT_FINISHED);
                    return;
                }
            }


            let recoverRoomId = null;
            let gamePos = await globalStatusData.queryData(constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_GAME_POS, rpcSender.serverType.game, msg.uid);
            if (gamePos) {
                if (gamePos.sid != msg.sid) {
                    await rpcSender.invoke(rpcSender.serverType.game, rpcSender.serverModule.playerRemote, fishCmd.remote.leaveGame.route, {uid: msg.uid});
                } else {
                    if(msg.roomType && gamePos.roomType != msg.roomType){
                        await this._instance.leaveGame(msg);
                    }else {
                        recoverRoomId = gamePos.roomId;
                    }
                }
            }

            //加入指定房间
            let _respose = null;
            if (msg.roomId) {
                _respose = await this._instance.enterGameByRoomId(msg);
            } else {
                if (!recoverRoomId) {
                    _respose = await this._instance.enterGame(msg);
                } else {
                    msg.roomId = recoverRoomId;
                    _respose = await this._reconnectGame(msg);
                }
            }

            session.set('roomId', _respose.roomId);
            session.set(rpcSender.serverIdKey.game, session.frontendId);
            session.pushAll(function () {
                logger.info(`用户[${msg.uid}]加入游戏成功`, _respose);
                utils.invokeCallback(cb, null, _respose);
            });

        }catch(err){
            logger.error(`用户[${msg.uid}]加入游戏失败`, err);
            utils.invokeCallback(cb, err);
        }
    }

    c_leave_room(msg, session, cb) {
        logger.error(`用户[${msg.uid}]主动退出房间`);
        this._instance.leaveGame(msg);
        utils.invokeCallback(cb, null, CONSTS.SYS_CODE.OK);
    }

    async c_continue_rmatch(data, session, cb) {
        await this._instance.continue_rmatch(data, cb);
    }

    async c_continue_match_1v1(data, session, cb) {
        await this._instance.continue_match_1v1(data, cb);
    }

    async _reconnectGame(msg) {
        let [err, result] = this._instance.setPlayerState({
            uid: msg.uid,
            sid: msg.sid,
            state: constDef.PALYER_STATE.ONLINE,
            roomId: msg.roomId
        });
        if (err) {
            return await this._instance.enterGame(msg);
        }
        return [err, result];
    }

    async _socketClose(session, reason) {
        if (!session || !session.uid) {
            return;
        }

        let uid = session.uid;
        let matching_state = session.get('matching');
        if (matching_state) {
            await rpcSender.invoke(rpcSender.serverType.matching, rpcSender.serverModule.matching.matchingRemote,
                matchingCmd.remote.cancleSigup.route, {uid: uid});
            logger.info(`用户[${uid}] 离开报名服`);
        }

        let serverId = session.get(rpcSender.serverIdKey.game);
        if (serverId) {
            this._instance.setPlayerState({
                uid: uid,
                state: constDef.PALYER_STATE.OFFLINE,
                sid: session.frontendId,
            });
            logger.info(`用户[${uid}] 网络连接断开`, serverId);
        }
    }

    //获取玩家负载信息
    getLoadInfo() {
        return this._instance.getLoadStatistics();
    }
}

module.exports = GameApp;