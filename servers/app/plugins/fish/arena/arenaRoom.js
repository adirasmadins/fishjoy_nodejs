const Room = require('../fishRoom');
const rankMatchCmd = require('../../../cmd/rankMatchCmd');
const arenaCmd = require('../../../cmd/arenaCmd');
const Countdown = require('../../../utils/countdown');
const config = require('../config');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const ArenaStore =require('./arenaStore');

class ArenaRoom extends Room{
    constructor(opts){
        super(opts);
        this._canRun = true;
        this._match_started = false;  //比赛是否开始
        this._challengerUid = -1;
        this._countdown = new Countdown(this._countdown_notify.bind(this), config.ARENA.START_COUNTDOWN);
        this._arenaStore = null;
    }

    _broadcast(route, data, player) {
        if (!this._checkBroadcast()) {
            return;
        }
        if(this._sync){
            super.roomBroadcast(route, data);
        }else {
            player.send(route, data);
        }

    }

    _countdown_notify(dt) {
        logger.error('PK倒计时=', dt);
        this._broadcast(rankMatchCmd.push.timer.route, {
            countdown: dt
        });
    }

    //开始异步对战
    _startAsyncMatch(uid){
        this._arenaStore = new ArenaStore();
        let player = this._playerMap.get(uid);
        player.startAsyncMatch();

        let data = {};
        this._broadcast(arenaCmd.remote.arenaAsyncStart.route, data);
    }

    _loadChallengerPKInfo(uid){
        logger.error('加载敌人PK信息=', uid);
    }

    //发送通知玩家实时对战
    _start_match_notify(){
        logger.error('发送通知玩家实时对战');
        let data = {};
        this._broadcast(arenaCmd.remote.arenaSyncStart.route, data);
    }

    update(){
    }

    _runWaitTask() {
        if (!this._canRun) return;
        setTimeout(async function () {
            await this._countdown.tick();
            if(this._sync){
                this._countdown = new Countdown(this._countdown_notify.bind(this), config.ARENA.PK_DURATION);
                this._start_match_notify();
                this._runPKTask();
                return;
            }else if(this._countdown == 0){
                this._match_started = true;
                this._startAsyncMatch(this._challengerUid);
                return;
            }
            this._runWaitTask();
        }.bind(this), 100);
    }

    _runPKTask() {
        if (!this._canRun) return;
        setTimeout(async function () {
            await this._countdown.tick();
            this.update();
            this._runPKTask();
        }.bind(this), 100);
    }

    start() {
        this._runWaitTask();
    }

    stop(){
        this._canRun = false;
    }

    join(player){
        if(this.isFull()){
            return ERROR_OBJ.OTHER_PLAYER_MATCHING;
        }

        let uid = player.uid;
        if(this.isInRoom(uid)){
            return;
        }

        player.reset_gold();
        super.join(player);

        if(player.isAsync){
            this._challengerUid = player.challengerUid;
            this._startAsyncMatch(player.uid);
            this._sync = true;
            return;
        }

        if(player.isChallenger){
            this._challengerUid = player.uid;
        }else{
            if(this._match_started){
                return new Error('比赛已经开始了,只能异步对战了，自己创建房间吧');
            }
        }

        if(this.isFull()){
            if(this._countdown > 0){
                this._sync = true;
                //TODO 广播PK开始
            }else {
                //TODO 启动玩家游戏倒计时,读取先前玩家游戏记录。
                this._loadChallengerPKInfo(this._challengerUid);
                this._startAsyncMatch(player.uid);
            }
        }
    }

    //加入比赛事件通知
    _addPlayerEvent(player){
        super._addPlayerEvent(player);
        player.on(rankMatchCmd.remote.cancelNbomb.route, function (event) {
            this._broadcast(rankMatchCmd.remote.cancelNbomb.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.rmatchChat.route, function (event) {
            this._broadcast(rankMatchCmd.remote.rmatchChat.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.weaponChange.route, function (event) {
            this._broadcast(rankMatchCmd.remote.weaponChange.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.query_playerInfo.route, function (event) {
            this._broadcast(rankMatchCmd.remote.query_playerInfo.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.useNbomb.route, function (event) {
            this._broadcast(rankMatchCmd.remote.useNbomb.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.fightInfo.route, function (event) {
            this._broadcast(rankMatchCmd.remote.fightInfo.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.timer.route, function (event) {
            this._broadcast(rankMatchCmd.push.timer.route, event.data, event.player);
        }.bind(this));
    }
}

module.exports = ArenaRoom;