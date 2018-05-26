const Room = require('../fishRoom');
const rankMatchCmd = require('../../../cmd/rankMatchCmd');
const arenaCmd = require('../../../cmd/arenaCmd');
const Countdown = require('../../../utils/countdown');
const constDef = require('../../../consts/constDef');
const ACCOUNTKEY = require('../../../models').ACCOUNTKEY;
const REDISKEY = require('../../../models').REDISKEY;
const redisAccountSync = require('../../../utils/redisAccountSync');
const config = require('../config');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const MatchStore = require('./matchStore');

class ArenaRoom extends Room {
    constructor(opts) {
        super(opts);
        this._canRun = true;
        this._isRealtime = false; //是否为实时对战
        this._isSingle = false; //异步对战则为单人模式
        this._runSettlement = false;
        this._countdown = new Countdown(this._countdown_notify.bind(this), config.ARENA.PK_DURATION);
        this._matchStore = new MatchStore();
        this._homeownerUid = -1;
        this._matchStarted = false;

    }

    _countdown_notify(dt) {
        logger.error('PK倒计时=', dt);
        this._broadcast(rankMatchCmd.push.timer.route, {
            countdown: dt
        });
    }

    async _createMatch(uid) {
        let matchId = config.ARENA.GEN_MATCH_ID(this.roomId, uid);
        await this._matchStore.create(matchId, uid);
        this._runPKTask();
    }

    async _loadMatch(matchId) {
        await this._matchStore.load(matchId);
        if(!this._isRealtime){
            this._runPKTask();
        }
    }

    //开始对战
    async _startMatch(uid) {
        logger.error('arena room start ...');

        this._matchStore.isRealtime = this._isRealtime;
        await this._matchStore.setMatchState(uid, config.ARENA.MATCH_STATE.GOING);

        this._matchStarted = true;

        this._broadcast(rankMatchCmd.push.start.route, {countdown: this._countdown.duration});
    }

    async _stopMatch(uid) {
        await this._matchStore.setMatchState(uid, config.ARENA.MATCH_STATE.FINISHED);
    }

    kickOffline() {
        if(this._countdown.isZero()){
            return super.kickOffline();
        }
        return [];
    }

    isDestroy(){
        if(this._countdown.isZero() && super.isDestroy()){
            return true;
        }
        return false;
    }

    async _try2Settlement() {
        if (await this._canOVer()) {
            try {
                await this._settlement();
            } catch (err) {
                logger.error('排位赛结算异常, err=', err);
            }
        }
    }

    _getRankPoints(arean_win, win_rate){
        let p = arean_win.toString() + win_rate;
        return parseFloat(p);
    }

    _genWinRateEx(win, fail) {
        let rate = (win/Math.max(fail + fail, 1));
        return rate.toFixed(2);
    }

    async _setWinner(uid) {
        let account = null;
        let player = this._playerMap.get(uid);
        if (player) {
            account = player.account;
        } else {
            account = await redisAccountSync.getAccountAsync(uid, [ACCOUNTKEY.ARENA_WIN, ACCOUNTKEY.ARENA_FAIL,
                ACCOUNTKEY.ARENA_MATCHID, ACCOUNTKEY.ARENA_STAR,ACCOUNTKEY.PLATFORM]);
        }

        if (account) {
            account.arean_win = 1;
            account.arena_matchid = '';
            account.arena_star = Math.min(account.arena_star + 1, 3);
            account.commit();
            let rankPoints = this._getRankPoints(account.arean_win, this._genWinRateEx(account.arean_win, account.arena_fail));
            logger.error('玩家获得对战胜利uid=', uid, 'rankPoints = ', rankPoints);
            await redisConnector.zadd(`${REDISKEY.RANK.ARENA}:${account.platform}`, rankPoints, account.id);
        }
    }

    async _setLoser(uid) {
        let account = null;
        let player = this._playerMap.get(uid);
        if (player) {
            account = player.account;
        } else {
            account = await redisAccountSync.getAccountAsync(uid, [ACCOUNTKEY.ARENA_WIN, ACCOUNTKEY.ARENA_FAIL,
                ACCOUNTKEY.ARENA_MATCHID, ACCOUNTKEY.ARENA_STAR,ACCOUNTKEY.PLATFORM]);
        }

        if (account) {
            account.arena_fail = 1;
            account.arena_matchid = '';
            account.arena_star = Math.min(account.arena_star + 1, 3);
            account.commit();
            let rankPoints = this._getRankPoints(account.arean_win, this._genWinRateEx(account.arean_win, account.arena_fail));
            logger.error('玩家获得对战失败uid=', uid, 'rankPoints = ', rankPoints);
            await redisConnector.zadd(`${REDISKEY.RANK.ARENA}:${account.platform}`, rankPoints, account.id);
        }
    }


    //PK结算
    async _settlement() {
        if (this._runSettlement) {
            return;
        }
        this._runSettlement = true;
        let pkResult = await this._matchStore.getPKResult();
        if (pkResult.winnerUID != -1) {
            await this._setWinner(pkResult.winnerUID);
            await this._setLoser(pkResult.failUID);
            await this._matchStore.clearnArena();
        }else {
            let player = this._playerMap.get(this._homeownerUid);
            player.account.arena_matchid_list.push(this._matchStore.matchId);
            player.account.commit();
        }
        logger.error('pkResult=', pkResult);
        this._broadcast(rankMatchCmd.push.pkResult.route, pkResult);
    }

    async _canOVer() {
        if (await this._matchStore.isOver(this._homeownerUid)) {
            return true;
        }

        if (this._countdown.isZero()) {
            await this._matchStore.forceOverByTimeout(this._homeownerUid);
        }
        return false;
    }

    async update() {
        if (!this._matchStarted) {
            return;
        }
        await this._try2Settlement();
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
        super.start();
    }

    stop() {
        this._canRun = false;
        super.stop();
    }

    async join(player, opts) {
        logger.error('玩家进入PK场', player.uid, this.roomId);
        if (this.isFull() || this._isSingle) {
            return ERROR_OBJ.ARENA_OTHER_PLAYER_MATCHING;
        }

        let uid = player.uid;
        this.setPlayerState(uid, constDef.PALYER_STATE.ONLINE, opts.sid);
        if (this.isInRoom(uid)) {
            return;
        }

        //创建比赛
        if (!player.account.arena_matchid) {
            //TODO 检查是否有比赛未结束
            //存在则提示邀请好友继续完成比赛
            await this._createMatch(player.uid);
            this._homeownerUid = player.uid;

        } else {
            if (opts.asyncMatch) {
                this._isSingle = true;
                this._homeownerUid = player.uid;
                await this._loadMatch(opts.matchId);
                //TODO 加载对手比赛信息
            } else if (this._countdown.duration < config.ARENA.START_COUNTDOWN) {  //invitee 受邀者
                this._isRealtime = true;
            } else {
                //如果比赛等待时间已经结束，则受邀者自己创建房间进行异步对战
                return ERROR_OBJ.MATCH_WAIT_TIMEOUT;
            }

            await this._matchStore.bindInvitee(player.uid);
        }

        player.reset_gold();
        let err = super.join(player);
        if (err) {
            return err;
        }
        await this._startMatch(player.uid);
        player.account.arena_matchid = this._matchStore.matchId;
        player.account.commit();
        logger.error('玩家开始PK', player.uid, this.roomId);
    }

    leave(uid) {
        let player = this._playerMap.get(uid);
        if(!player){
            return;
        }
        //TODO 投降
        this._stopMatch(uid);
        super.leave(uid);
    }

    //加入比赛事件通知
    _addPlayerEvent(player) {
        super._addPlayerEvent(player);
        player.on(rankMatchCmd.remote.rmatchChat.route, function (event) {
            this._broadcast(rankMatchCmd.push.rmatchChat.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.weaponChange.route, function (event) {
            this._broadcast(rankMatchCmd.push.weaponChange.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.query_playerInfo.route, function (event) {
            let minfo = this.getMathtchInfo();
            let tcb = event.data.cb;
            tcb && tcb(minfo);
        }.bind(this));

        player.on(rankMatchCmd.remote.useNbomb.route, async function (event) {
            let res = await this._matchStore.recordPKInfo(player.uid, event.data, 3);
            this._broadcast(rankMatchCmd.push.useNbomb.route, res, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.cancelNbomb.route, async function (event) {
            let res = await this._matchStore.recordPKInfo(player.uid, event.data, 4);
            this._broadcast(rankMatchCmd.push.cancelNbomb.route, event.data, event.player);
        }.bind(this));

        player.on(rankMatchCmd.remote.fightInfo.route, async function (event) {
            let res = await  this._matchStore.recordPKInfo(player.uid, event.data, 2);
            this._broadcast(rankMatchCmd.push.fightInfo.route, res, event.player);
        }.bind(this));

        //注册统计比赛期间每一发子弹信息，供模拟所用
        player.registeFireUpdate(async function (fireData) {
            await this._matchStore.recordPKInfo(player.uid, fireData, 1);
        }.bind(this));
    }
    
    getMathtchInfo() {
        let players = [];
        for (let player of this._playerMap.values()) {
            let pkInfo = this._matchStore.getMatchInfo(player.uid);
            let info = {
                uid: player.uid,
                rank: player.account.match_rank,
                nickname: player.account.nickname,
                figure_url: player.account.figure_url,
                winning_rate: player.genWinRate(),
                wp_skin: player.account.weapon_skin.equip,
                nbomb_cost: player.genNbombCost(),
                status: {
                    fire: pkInfo.fire,
                    score: pkInfo.score,
                },
                vip: player.account.vip,
                winTimes: player.account.arena_win, //胜场
            };
            players.push(info);
        }
        return {
            players: players,
            countdown: this._countdown.duration,
        };
    }

    /**
     * 异步对战时拉取对手开炮信息，供客户端模拟
     * @param {*} data 
     * @param {*} cb 
     */
    c_query_1v1_record(data, cb) {
        let record = [];
        if (data.index === -1) {
            //TODO:返回对方所有开炮信息，包含核弹信息
           // this._matchStore.getAsyncPKInfo()
        }else{
            //TODO:按现有的记录，按10的倍数个返回给客户端，多余的放下一次返回，并注意标记，防止相同数据多次返回
        }
        utils.invokeCallback(cb, null, record);
    }

    /**
     * 广播有人进入
     */
    broadcastSomeoneEnter(players) {
        super.broadcastSomeoneEnter(players);
        this._broadcast(rankMatchCmd.push.enter_room_1v1.route, {
            match_1v1_players: this.getMathtchInfo().players,
        });
    }

}

module.exports = ArenaRoom;