const fishCmd = require('../../cmd/fishCmd');
const consts = require('./consts');
const config = require('./config');
const FishModel = require('./fishModel');
const EventEmitter = require('events').EventEmitter;
const configReader = require('../../utils/configReader');
const constDef = require('../../consts/constDef');
const GAMECFG = require('../../utils/imports').DESIGN_CFG;
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const Room = require('./entity/room');

class FishRoom extends Room{
    constructor(opts) {
        opts.gamePosType = constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_GAME_POS;
        super(opts);
        this._evtor = new EventEmitter();
        this.createFishModel();
        this._logicTimer = -1;
        this._playerMap = new Map();
        this._seatState = {};
        for (let i = 0; i < opts.playerMax; i++) {
            this._seatState[i] = 0;
        }
        this._robotJoinTimestamp = 0;
        this._lastFishTimestamp = new Date().getTime();
    }

    createFishModel() {
        let fishModel = new FishModel(this._evtor, this._sceneId);
        fishModel.setRoomId(this._roomId);
        this._fishModel = fishModel;
    }


    /**
     * 机器人是否可以加入
     */
    isRobotJoinEnabled() {
        let tc = this.getEmptiyCount();
        if (tc === 0) {
            return false;
        }
        let tick = 8 * Math.pow(3, tc) * (1.5 - Math.random());
        let now = new Date().getTime();
        //logger.error('robot tick = ', tick, tc, now - this._robotJoinTimestamp, now, this._robotJoinTimestamp);
        if (now - this._robotJoinTimestamp >= tick * 1000) {
            //  logger.error('---can join---')
            return true;
        }
        return false;
    }

    /**
     * 房间空位数量
     */
    getEmptiyCount() {
        let tc = 0;
        for (let k in this._seatState) {
            if (this._seatState[k] === 0) {
                tc++;
            }
        }
        return tc;
    }

    /**
     * 分配一个座位号
     */
    generateSeatId() {
        for (let k in this._seatState) {
            if (this._seatState[k] === 0) {
                this._seatState[k] = 1;
                return parseInt(k);
            }
        }
        return -1;
    }


    /**
     * 获取房间内玩家金币
     * @returns {number}
     */
    get avgGold() {
        if (this._playerMap.size == 0) {
            return config.ROBOT.GOLD_DEFAULT;
        }

        let total = [...this._playerMap.values()].reduce(function (prev, next) {
            return prev + next.account.gold;
        }, 0);

        return Math.ceil(total / this._playerMap.size);
    }

    /**
     * 获取房间内玩家钻石
     * @returns {number}
     */
    get avgPearl() {
        if (this._playerMap.size == 0) {
            return config.ROBOT.PEARL_DEFAULT;
        }

        let total = [...this._playerMap.values()].reduce(function (prev, next) {
            return prev + next.account.pearl;
        }, 0);

        return Math.ceil(total / this._playerMap.size);
    }

    get avgExp() {
        if (this._playerMap.size == 0) {
            return config.ROBOT.EXP_DEFAULT;
        }

        let total = [...this._playerMap.values()].reduce(function (prev, next) {
            return prev + next.account.exp;
        }, 0);

        return Math.ceil(total / this._playerMap.size);
    }

    get avgVIP() {
        if (this._playerMap.size == 0) {
            return config.ROBOT.EXP_DEFAULT;
        }

        let total = [...this._playerMap.values()].reduce(function (prev, next) {
            return prev + next.account.vip;
        }, 0);

        return Math.ceil(total / this._playerMap.size);
    }

    /**
     * 获取房间内玩家角色平均等级
     * @returns {number}
     */
    get avgLevel() {
        if (this._playerMap.size == 0) {
            return 1;
        }

        let total = [...this._playerMap.values()].reduce(function (prev, next) {
            return prev + next.account.level;
        }, 0);

        return Math.ceil(total / this._playerMap.size);
    }

    /**
     * 获取房间内玩家武器平均等级
     * @returns {number}
     */
    get avgWeaponLevel() {
        if (this._playerMap.size == 0) {
            return 1;
        }
        let total = [...this._playerMap.values()].reduce(function (prev, next) {
            return prev + next.DIY.weapon;
        }, 0);

        return Math.ceil(total / this._playerMap.size);
    }

    /**
     * 获取房间内玩家段位平均等级
     * @returns {number}
     */
    get avgRankLevel() {
        if (this._playerMap.size == 0) {
            return 1;
        }
        let total = [...this._playerMap.values()].reduce(function (prev, next) {
            return prev + next.account.rank;
        }, 0);

        return Math.ceil(total / this._playerMap.size);
    }

    isNewFishEnabled() {
        if (this._skillIceTicker) {
            return false;
        }
        return true;
    }

    start() {
        super.start();
        logger.error('========fish room start');
        this._evtor.on(consts.FLUSH_EVENT, this.onFlushFish.bind(this));
        this._logicTimer = setInterval(this._logicUpdate.bind(this), 1000);
        this._startBroadcashTimer();
    }

    stop() {
        logger.error('=========fish room stop');
        for (let player of this._playerMap.values()) {
            this._clearPlayerResource(player);
            this._playerMap.delete(player.uid);
        }
        this._fishModel = null;

        this._clearSkillIceTicker();
        clearInterval(this._logicTimer);
        this._logicTimer = null;

        clearInterval(this._broadCashTimer);
        this._broadCashTimer = null;
        this._bcash = null;
        this._evtor.removeAllListeners();
        this._evtor = null;
        super.stop();
    }

    /**
     * 定时更新逻辑
     */
    _logicUpdate() {
        //前后两次时间差，单位秒,注意向下取整
        let now = new Date().getTime();
        let dt = now - this._lastFishTimestamp;
        dt /= 1000;
        dt = Math.floor(dt);
        this._lastFishTimestamp = now;

        for (let v of this._playerMap.values()) {
            v.update(dt);
        }

        if (!this.isNewFishEnabled()) {
            return;
        }
        this._fishModel && this._fishModel.checkNewFish(dt);
    }

    _genPlayerProcolInfo(player, isPlayerSelf) {
        let wpLv = player.DIY.weapon;
        let curWpEnergy = 0;
        let te = player.DIY.weapon_energy;
        if (te) {
            curWpEnergy = te[wpLv] || 0;
        }
        let data = {
            id: player.uid,
            seatId: player.seatId,
            nickname: player.account.nickname,
            wp_skin: player.DIY.weapon_skin,
            wp_level: wpLv,
            wp_energy: curWpEnergy, //当前等级的能量值，不再是全部等级的能量值
            gold: player.account.gold,
            pearl: player.account.pearl,
            figure_url: player.account.figure_url,
            kindId: player.kindId,
            sex: player.account.sex,
            wp_star: player.getSkinStar()
        };
        isPlayerSelf && (data.cData = player.getContinueData());
        return data;
    }

    genAllPlayers(uid) {
        let players = [];
        for (let v of this._playerMap.values()) {
            players.push(this._genPlayerProcolInfo(v, v.uid === uid));
        }
        return players;
    }

    /**
     * 玩家加入房间
     * @param player
     */
    join(player) {
        let uid = player.uid;
        if(this.isInRoom(uid)){
            return;
        }

        let seatId = this.generateSeatId();
        if (seatId === -1) {
            logger.error('座位分配失败，无法加入');
            return ERROR_OBJ.ROOM_PLAYER_FULL;
        }

        logger.info('&&&&&&&&&&&&&&&&&&&&& 玩家坐下', uid, 'seat:', seatId);
        let sceneCfg = GAMECFG.scene_scenes_cfg[this.sceneId];
        let tmps = this.sceneId.split('_');
        let sceneIdx = -1;
        if (tmps.length > 0) {
            sceneIdx = Number(tmps[tmps.length - 1]);
        }
        player.joinRoom({
            sceneCfg: sceneCfg,
            fishModel: this._fishModel,
            roomId: this._roomId,
            seatId: seatId,
            sceneIdx: sceneIdx,
        });
        this._playerMap.set(uid, player);
        this._addChannel(player);
        this._addPlayerEvent(player);

        let players = this.genAllPlayers(uid);
        logger.info('room 玩家加入', player.account.nickname);
        this.broadcastSomeoneEnter(players);

        let isRobot = !player.isRealPlayer();
        isRobot && (this._robotJoinTimestamp = new Date().getTime());
    }

    /**
     * 广播有人进入
     */
    broadcastSomeoneEnter(players) {
        this._broadcast(fishCmd.push.enter_room.route, {
            players: players
        });
    }

    /**
     * 玩家离开房间
     * @param uid
     */
    leave(uid) {
        let player = this._playerMap.get(uid);
        let data = null;
        if (player) {
            data = {
                gold: player.account.gold,
                pearl: player.account.pearl,
            };
            this._clearPlayerResource(player);
            this._playerMap.delete(uid);
        }
        return data;
    }

    c_query_players(data, cb) {
        logger.error('&&&&&&&&&&&&&&&&&&&&& 玩家未收到s_enter_room，主动查询玩家信息,uid=', data.uid);
        let players = this.genAllPlayers(data.uid);
        utils.invokeCallback(cb, null, {
            players: players
        });
        logger.error('&&&&&&&&&&&&&&&&&&&&& 玩家未收到s_enter_room，主动查询玩家信息,players=', players);
    }


    kickRobot() {
        for (let player of this._playerMap.values()) {
            if (!player.isPlayer()) {
                this._clearPlayerResource(player);
                this._playerMap.delete(player.uid);
                logger.error('机器人被玩家抢占位置', player.uid);
                return player.uid;
            }
        }
    }

    kickOffline() {
        let now = Date.now();
        let uids = [];
        for (let player of this._playerMap.values()) {
            if (player.isPlayer() &&
                (now - player.activeTime > config.PLAYER.OFFLINE_TIMEOUT)) {
                this.leave(player.uid);
                logger.error('玩家离线时间超时，被踢出游戏房间', player.uid);
                uids.push(player.uid);
            }
        }
        return uids;
    }

    _checkBroadcast() {
        for (let player of this._playerMap.values()) {
            if (player.isPlayer() && player.connectState == constDef.PALYER_STATE.ONLINE) {
                return true;
            }
        }
        return false;
    }

    setPlayerState(uid, state, sid) {

        let player = this._playerMap.get(uid);
        if (player) {
            logger.error('-----------玩家网络断开:', uid, state, sid);
            logger.error('-----------玩家网络断开roomId:', player.roomId);

            player.connectState = state;
            player.updateActiveTime();

            if (CONSTS.constDef.PALYER_STATE.OFFLINE == state) {
                logger.debug('-----------玩家网络断开:', uid);
                this._removeChannel(player, true);
            } else {
                player.sid = sid;
                this._addChannel(player, true);
                let players = this.genAllPlayers(uid);
                player.send(fishCmd.push.enter_room.route, {
                    players: players
                });
            }

            this._broadcast(fishCmd.push.playerState.route, {
                state: state,
                uid: uid
            });

            return true;
        }
        logger.debug('------not found-----玩家网络断开:', uid);
        return false;
    }

    getPlayer(uid) {
        return this._playerMap.get(uid);
    }

    /**
     * 房间内玩家数量
     * @returns {number}
     */
    get playerCount() {
        return this._playerMap.size;
    }

    get roomPlayerMaxCount(){
        return consts.ROOM_PLAYER_MAX[this.roomType];
    }

    //是否已满
    isFull(){
        return this.playerCount >= this.roomPlayerMaxCount;
    }

    isInRoom(uid){
        if (this._playerMap.has(uid)) {
            return true;
        }
        return false;
    }

    /**
     * 判断房间是否需要销毁
     */
    isDestroy() {
        if (this._playerMap.size == 0) {
            return true;
        }

        for (let player of this._playerMap.values()) {
            if (player.kindId === consts.ENTITY_TYPE.PLAYER) {
                return false;
            }
        }
        return true;
    }

    _clearPlayerResource(player) {
        player.emit('kick', {
            player: player,
            data: {}
        });

        this._removeChannel(player);
        this._seatState[player.seatId] = 0;
        logger.debug('&&&&&&&&&&&&&&&&&&&&& 玩家离开', player.uid, 'seat:', player.seatId);
        this._broadcast(fishCmd.push.leave_room.route, {
            seatId: player.seatId
        });

        player.clear();
    }

    _addChannel(player, isNet = false) {
        switch (player.kindId) {
            case consts.ENTITY_TYPE.PLAYER:
                super.addMsgChannel(player.uid, player.sid);
                super.addWorldChannel(player.uid, player.sid, constDef.WORLD_CHANNEL_NAME.BARRAGE);
                if(!isNet){
                    this.addGamePos(player.uid, player.sid, {sid:player.sid, roomId:player.roomId, roomType:this.roomType, time:Date.now()});
                }

                break;
            case consts.ENTITY_TYPE.ROBOT:
            default:
                break;
        }
    }

    _removeChannel(player, isNet = false) {
        switch (player.kindId) {
            case consts.ENTITY_TYPE.PLAYER:
                super.leaveMsgChannel(player.uid, player.sid);
                super.leaveWorldChannel(player.uid, player.sid, constDef.WORLD_CHANNEL_NAME.BARRAGE);
                if(!isNet){
                    super.delGamePos(player.uid, player.sid);
                }

                break;
            case consts.ENTITY_TYPE.ROBOT:
            default:
                break;
        }
    }

    _broadcast(route, data) {
        if (!this._checkBroadcast()) {
            return;
        }
        super.roomBroadcast(route, data);
    }

    _globalBroadcast(route, data, channelName){
        super.worldBroadcast(route, data, channelName);
    }

    /**
     * 高频率广播消息轮序处理
     */
    _startBroadcashTimer() {
        this._broadCashTimer = setInterval(function () {
            if (this._bcash) {
                let rks = Object.keys(this._bcash);
                for (let i = 0; i < rks.length; i++) {
                    let route = rks[i];
                    let temp = this._bcash[route];
                    let data = temp.data;
                    let td = {};
                    td[temp.name] = data;
                    this._broadcast(route, td);
                    //logger.debug('data.length = ', data.length);
                }
                this._bcash = null;
            }
        }.bind(this), 500);
    }

    /**
     * 缓存频率较高的广播消息，定时轮询广播
     * @param {*} route 
     * @param {*} data 
     */
    _addBroadcastCache(route, data, name) {
        if (!this._bcash) {
            this._bcash = {};
        }
        if (!this._bcash[route]) {
            this._bcash[route] = {
                data: [],
                name: name,
            };
        }
        this._bcash[route].name = name;
        this._bcash[route].data.push(data);
    }
    _addPlayerEvent(player) {
        player.on(fishCmd.push.player_notify.route, function (event) {
            this._broadcast(fishCmd.push.player_notify.route, event.data);
        }.bind(this));

        player.on(fishCmd.push.fire.route, function (event) {
            this._addBroadcastCache(fishCmd.push.fire.route, event.data, 'fire');
        }.bind(this));

        player.on(fishCmd.push.catch_fish.route, function (event) {
            let data = event.data;
            let isAnyDead = false;
            let cfishes = [];
            let fd = {};
            for (let fk in data.catch_fishes) {
                let ret = data.catch_fishes[fk];
                if (ret && ret.floor >= 0) {
                    this._fishModel.updateLifeState(fk, ret.floor);
                    if (ret.floor == 0) {
                        isAnyDead = true;
                    }
                    let ff = ret.fireFlag;
                    if (!fd[ff]) {
                        fd[ff] = [];
                    }
                    let td = fk.split('#');
                    let fidx = parseInt(td[1]);
                    let oneFish = {
                        fidx: fidx,
                        gold: ret.gold,
                    };
                    ret.drops && (oneFish.drops = ret.drops);
                    fd[ff].push(oneFish);
                }
            }
            for (let k in fd) {
                cfishes.push({
                    fireFlag: k,
                    fishes: fd[k]
                });
            }
            let sdata = {
                seatId: data.seatId,
                gold: data.gold,
                catch_fishes: cfishes,
                pearl: data.pearl,
            };

            //有鱼被打死，则立即广播，反之缓存等待轮询处理
            if (isAnyDead) {
                let temp = {
                    catch: [sdata],
                };
                let fireData = null;
                let fireName = fishCmd.push.fire.route;
                if (this._bcash && this._bcash[fireName]) {
                    temp.fire = this._bcash[fireName].data;
                }
                //logger.error('catch_fish temp = ', temp);
                this._broadcast(fishCmd.push.catch_fish.route, temp);
                this._bcash && (delete this._bcash[fireName]);
            } else {
                this._addBroadcastCache(fishCmd.push.catch_fish.route, sdata, 'catch');
            }
            //this._broadcast(fishCmd.push.catch_fish.route, sdata);
        }.bind(this));

        player.on(fishCmd.push.use_skill.route, function (event) {
            let player = event.player;
            let data = event.data;
            let common = data.common;
            if (common) {
                let skillId = common.skill_id;
                if (skillId === consts.SKILL_ID.SK_FREEZ) {
                    this.pauseWithSkillIce(skillId, function () {
                        this._broadcast(fishCmd.push.use_skill_end.route, {
                            ice_all_over: 1
                        });
                    }.bind(this));
                }
            }

            if (data.skill_call) {
                let call = data.skill_call;
                this._fishModel.callAnSpecialFish(call.fish_key, call.fish_path);
            }
            data.seatId = player.seatId;
            this._broadcast(fishCmd.push.use_skill.route, data);
        }.bind(this));

        player.on(fishCmd.push.use_skill_end.route, function (event) {
            this._broadcast(fishCmd.push.use_skill_end.route, event.data);
        }.bind(this));

        player.on(fishCmd.push.fighting_notify.route, function (event) {
            this._broadcast(fishCmd.push.fighting_notify.route, event.data);
        }.bind(this));

        player.on(fishCmd.push.turn_weapon.route, function (event) {
            this._broadcast(fishCmd.push.turn_weapon.route, event.data);
        }.bind(this));

    }

    onFlushFish(evtName, evtData) {
        let sdata = {
            evtName: evtName,
        };
        evtData && (sdata.evtData = evtData);
        this._broadcast(fishCmd.push.flush_fish.route, sdata);
    }

    /**
     * 玩家使用冰冻，暂定刷新鱼、暂停生命计时器
     * 上一个玩家正在使用冰冻，下一个玩家有开始使用，则重置冰冻为当前玩家冰冻技能持续时间
     */
    pauseWithSkillIce(skillId, allOverDoneFunc) {
        let skillCfg = configReader.getValue('skill_skill_cfg', skillId);
        let dt = skillCfg.skill_duration;
        this._clearSkillIceTicker();
        this._skillIceTicker = setTimeout(function () {
            this._clearSkillIceTicker();
            allOverDoneFunc && allOverDoneFunc();
        }.bind(this), dt * 1000);
        return dt;
    }

    /**
     * 清除冰冻计时器
     */
    _clearSkillIceTicker() {
        if (this._skillIceTicker) {
            clearTimeout(this._skillIceTicker);
            this._skillIceTicker = null;
        }
    }

}

module.exports = FishRoom;