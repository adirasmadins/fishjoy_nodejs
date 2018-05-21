const Room = require('../fishRoom');
const rankMatchCmd = require('../../../cmd/rankMatchCmd');
const arenaCmd = require('../../../cmd/arenaCmd');
const Countdown = require('../../../utils/countdown');
const config = require('../config');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const ArenaStore = require('./arenaStore');

class ArenaRoom extends Room {
    constructor(opts) {
        super(opts);
        this._canRun = true;
        this._match_state = config.ARENA.MATCH_STATE.READY;
        this._inviter = -1;
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
        let data = {};
        this._broadcast(arenaCmd.remote.arenaAsyncStart.route, data);
    }

    _stopMatch(){

    }

    update() {
        await this._try2Settlement();

        //比赛结算超时强制结算
        if (this._runSettlement) {
            this._runSettlementDt -= dt;
            if (this._runSettlementDt <= 0) {
                this.roomBroadcast(rankMatchCmd.push.pkResult.route, {settlementTimeout: 1});
                this._matchFinish();
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
            this.update();
            this._runPKTask();
        }.bind(this), 100);
    }

    start() {
        this._runWaitTask();
    }

    stop() {
        this._canRun = false;
    }

    join(player, opts) {
        if (this.isFull()) {
            return ERROR_OBJ.OTHER_PLAYER_MATCHING;
        }

        let uid = player.uid;
        if (this.isInRoom(uid)) {
            return;
        }
        this._inviter = opts.inviter;

        if (opts.inviter == player.uid) {

            //TODO 检查是否有比赛未结束
            //存在则邀请好友继续完成比赛
        }else {
            if(opts.asyncMatch){
                this._countdown.reset(0);
                //TODO 加载对手比赛信息
            }else {
                //invitee 受邀者
                if (this._match_state == config.ARENA.MATCH_STATE.READY) {
                    this._countdown.reset(0);
                    //开始实时对战
                } else {
                    //如果比赛等待时间已经结束，则受邀者自己创建房间进行异步对战
                    return -1;//new Error('比赛已经开始了,只能异步对战了，自己创建房间吧');
                }
            }
        }
        player.reset_gold();
        return super.join(player);
    }

    //加入比赛事件通知
    _addPlayerEvent(player) {
        super._addPlayerEvent(player);
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

        player.on(rankMatchCmd.remote.cancelNbomb.route, function (event) {
            this._broadcast(rankMatchCmd.remote.cancelNbomb.route, event.data, event.player);
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