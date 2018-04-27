const omelo = require('omelo');
const async = require('async');
const plugins = require('../../plugins');
const cache = require('../../cache/cache');
const redisClient = require('../../utils/dbclients').redisClient;
const mysqlClient = require('../../utils/dbclients').mysqlClient;
const matchingCmd = require('../../cmd/matchingCmd');
const constDef = require('../../consts/constDef');
const GAME_TYPE = require('../../utils/imports').sysConfig.GAME_TYPE;
const dropManager = require('../../utils/DropManager');
const rpcSender = require('../../net/rpcSender');
const globalStatusData = require('../../utils/globalStatusData');
const fishCmd = require('../../cmd/fishCmd');
const serviceCtrl = require('../common/serviceCtrl');

let gCount = 0;
let gRoomId = '';

class GameApp {
    constructor() {
        this._instance = new plugins[GAME_TYPE].Instance();
        this._maxLoad = 200;
    }

    async start() {
        let result = await redisClient.start(omelo.app.get('redis'));
        if (!result) {
            process.exit(0);
            return;
        }
        result = await mysqlClient.start(omelo.app.get('mysql'));
        if (!result) {
            process.exit(0);
            return;
        }
        omelo.app.game = this;
        await cache.start();
        this._instance.start();

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
        redisClient.stop();
        mysqlClient.stop();
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

    async c_enter_room(msg, session, cb) {
        //TODO 临时测试
        // gCount++;
        // if (gCount > 1) {
        //     msg.roomId = gRoomId;
        // }

        msg.sid = session.frontendId;
        let recoverRoomId = null;
        let gamePos = await globalStatusData.queryData(constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_GAME_POS, rpcSender.serverType.game, msg.uid);
        if (gamePos) {
            if (gamePos.sid != msg.sid) {
                await rpcSender.invoke(rpcSender.serverType.game, rpcSender.serverModule.playerRemote, fishCmd.remote.leaveGame.route, {uid: msg.uid});
            } else {
                recoverRoomId = gamePos.roomId;
            }
        }

        //加入指定房间
        let _respose = [null, null];
        if (msg.roomId) {
            _respose = await this._instance.enterInviteGame(msg);
        } else {
            if (!recoverRoomId) {
                _respose = await this._instance.enterGame(msg);
            } else {
                msg.roomId = recoverRoomId;
                _respose = await this._reconnectGame(msg);
            }
        }
        if (!_respose[0]) {
            gRoomId = _respose[1].roomId;
            session.set('roomId', _respose[1].roomId);
            session.set(rpcSender.serverIdKey.game, session.frontendId);
            session.pushAll(function () {
                logger.info(`用户[${msg.uid}]加入游戏成功`, _respose[1]);
                utils.invokeCallback(cb, null, _respose[1]);
            });
        } else {
            logger.error(`用户[${msg.uid}]加入游戏失败`, _respose[0]);
            utils.invokeCallback(cb, _respose[0]);
        }
    }

    c_leave_room(msg, session, cb) {
        logger.info(`用户[${msg.uid}]主动退出房间`);
        this._instance.leaveGame(msg, function (err, result) {
            logger.info(`用户[${msg.uid}]退出游戏服务`, result);
            utils.invokeCallback(cb, null, CONSTS.SYS_CODE.OK);
        });
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

module.exports = new GameApp();