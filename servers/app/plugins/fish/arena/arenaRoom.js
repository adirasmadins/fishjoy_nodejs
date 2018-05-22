const Room = require('../fishRoom');
const rankMatchCmd = require('../../../cmd/rankMatchCmd');
const arenaCmd = require('../../../cmd/arenaCmd');
const Countdown = require('../../../utils/countdown');
const config = require('../config');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;

class ArenaRoom extends Room {
    constructor(opts) {
        super(opts);
        this._canRun = true;
        this._match_state = config.ARENA.MATCH_STATE.CREATED;
        this._isRealtime = false; //是否为实时对战
        this._isSingle = false; //异步对战则为单人模式
        this._runSettlementDt = 10 * 1000; //结算超时时间,毫秒
        this._runSettlement = false;
        this._countdown = new Countdown(this._countdown_notify.bind(this), config.ARENA.START_COUNTDOWN);
    }

    _countdown_notify(dt) {
        logger.error('PK倒计时=', dt);
        this._broadcast(rankMatchCmd.push.timer.route, {
            countdown: dt
        });
    }


    //开始对战
    _startMatch() {
        logger.error('arena room start ...');
        super.start();
        this.setReady(false);

        for(let player of this._playerMap.values()){
            player.startMatch(this._isRealtime);
        }

        let data = {};
        this._broadcast(this._isRealtime ? arenaCmd.push.arenaSyncStart.route:arenaCmd.push.arenaAsyncStart.route, data);
    }

    _stopMatch(){

    }

    kickOffline() {
        let uids = [];
        if(this._canOVer()){

            for (let player of this._playerMap.values()) {
                this.leave(player.uid);
                logger.error('玩家离线时间超时，被踢出游戏房间', player.uid);
                uids.push(player.uid);
            }
        }
        return uids;
    }

    async _try2Settlement() {
        if (this._canOVer()) {
            try{
                await this._settlement();
            }catch (err){
                logger.error('排位赛结算异常, err=', err);
            }

            this.stop();
        }
    }

    //PK结算
    async _settlement() {
        if (this._runSettlement) {
            return;
        }
        this._runSettlement = true;
        this._broadcast(rankMatchCmd.push.pkResult.route, {});
    }

    _canOVer() {
        if (this._countdown.isZero() === 0) {
            return true;
        }
        for (let player of this._playerMap.values()) {
            if (!player.isOver()) {
                return false;
            }
        }
        return true;
    }

    async update() {
        await this._try2Settlement();
        //比赛结算超时强制结算
        if (this._runSettlement) {
            this._runSettlementDt -= 100;
            if (this._runSettlementDt <= 0) {
                this.roomBroadcast(rankMatchCmd.push.pkResult.route, {settlementTimeout: 1});
                this.stop();
                logger.error('结算超时');
            }
        }
    }

    _runWaitTask() {
        if (!this._canRun) return;
        setTimeout(async function () {
            await this._countdown.tick();
            if (this._countdown.isZero()) {
                this._match_state = config.ARENA.MATCH_STATE.GOING;
                this._startMatch();
                this._countdown.reset(config.ARENA.PK_DURATION);
                this._runPKTask();
                return;
            }
            this._runWaitTask();
        }.bind(this), 100);
    }

    _runPKTask() {
        if (!this._canRun) return;
        setTimeout(async function () {
            await this._countdown.tick();
            await this.update();
            this._runPKTask();
        }.bind(this), 100);
    }

    start() {
        this._runWaitTask();
    }

    stop() {
        this._canRun = false;
        this._stopMatch();
    }

    join(player, opts) {
        if (this.isFull() || this._isSingle) {
            return ERROR_OBJ.OTHER_PLAYER_MATCHING;
        }

        let uid = player.uid;
        if (this.isInRoom(uid)) {
            return;
        }

        //创建比赛
        if (opts.matchId == null) {
            //TODO 检查是否有比赛未结束
            //存在则提示邀请好友继续完成比赛
            player.createMatch(this.roomId);
        }else {
            if(opts.asyncMatch){
                this._isSingle = true;
                this._countdown.reset(0);
                player.loadMatch(opts.matchId);
                //TODO 加载对手比赛信息
            }else if(this._match_state == config.ARENA.MATCH_STATE.CREATED){  //invitee 受邀者
                this._countdown.reset(0);
                this._isRealtime = true;
            }else {
                //如果比赛等待时间已经结束，则受邀者自己创建房间进行异步对战
                return ERROR_OBJ.MATCH_WAIT_TIMEOUT;
            }
        }

        player.ready = true;
        player.reset_gold();
        return super.join(player);
    }

    //加入比赛事件通知
    _addPlayerEvent(player) {
        super._addPlayerEvent(player);
        player.on(rankMatchCmd.remote.rmatchChat.route, function (event) {
            logger.error('rmatchChat=',event.data);
            this._broadcast(rankMatchCmd.remote.rmatchChat.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.weaponChange.route, function (event) {
            logger.error('weaponChange=',event.data);
            this._broadcast(rankMatchCmd.remote.weaponChange.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.query_playerInfo.route, function (event) {
            logger.error('query_playerInfo=',event.data);
            this._broadcast(rankMatchCmd.remote.query_playerInfo.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.useNbomb.route, function (event) {
            logger.error('useNbomb=',event.data);
            this._broadcast(rankMatchCmd.remote.useNbomb.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.cancelNbomb.route, function (event) {
            logger.error('cancelNbomb=',event.data);
            this._broadcast(rankMatchCmd.remote.cancelNbomb.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.fightInfo.route, function (event) {
            logger.error('fightInfo=',event.data);
            this._broadcast(rankMatchCmd.remote.fightInfo.route, event.data, event.player);
        }.bind(this));

    }
}

module.exports = ArenaRoom;