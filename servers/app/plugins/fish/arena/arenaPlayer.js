const MatchPlayer = require('../entity/matchPlayer');
const config = require('../config');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const rankMatchCmd = require('../../../cmd/rankMatchCmd');
const ACCOUNTKEY = require('../../../models').ACCOUNTKEY;
const designCfgUtils = require('../../../utils/designCfg/designCfgUtils');
let childSelf = [
    ACCOUNTKEY.ARENA_WIN,
    ACCOUNTKEY.ARENA_FAIL,
    ACCOUNTKEY.ARENA_STAR,
    ACCOUNTKEY.ARENA_MATCHID,
    ACCOUNTKEY.MATCH_RANK,
    ACCOUNTKEY.ARENA_MATCHID_LIST,
];
childSelf = childSelf.concat(MatchPlayer.sBaseField());

class ArenaPlayer extends MatchPlayer{
    constructor(opts){
        super(opts);
        this._fireData = []; //开炮信息 [{皮肤，等级，开炮间隔，得分}...], 下标即开炮顺序
        this._lastFireTimestamp = 0; //上一次开炮时间
        this._fireUpdateFunc = null; //开炮数据更新到上层回调
        this._bullets = []; //子弹标识
    }

    static sBaseField() {
        return childSelf;
    }

    getBaseField() {
        return ArenaPlayer.sBaseField();
    }

    async continueMatch(data, cb) {
        logger.error('1v1赛继续比赛');
        try {
            this._generateRmHelper({});
            await this.matchEventCall(rankMatchCmd.remote.query_playerInfo.route, {cb: function (matchInfo) {
                if (!matchInfo) {
                    throw ERROR_OBJ.MATCH_ROOM_GAMEOVER;
                }
                let playersInfos = matchInfo.players;
                for (let i = 0; i < playersInfos.length; i++) {
                    let p = playersInfos[i];
                    if (p.uid == this.uid) {
                        this._rmHelper.resetWithContinue(p.status.fire, p.status.score);
                        this.startMatch({
                            nbomb_cost: p.nbomb_cost,
                            serverId: data.serverId,
                            roomId: data.roomId,
                        });
                        break;
                    }
                }
                utils.invokeCallback(cb, null, {
                    players: playersInfos,
                    countdown: matchInfo.countdown
                });
        
                logger.error('继续比赛信息=', {
                    players: playersInfos,
                    countdown: matchInfo.countdown
                });
            }.bind(this)});
        } catch (e) {
            logger.error('c_continue_match_1v1 继续比赛失败', e);
            //1v1赛结束
            this.stopMatch();
            utils.invokeCallback(cb, null, {});
        }
    }

    startMatch(evtData){
        super.startMatch(evtData);
        this._rmHelper.maxfireC = config.ARENA.FIRE;
    }

    //发往对战玩家所在的房间进行统计和广播
    async matchEventCall(method, data) {
        data = data || {};
        this.emit(method, {
            player:this,
            data:data,
        });
    }

    //PK玩家金币不足1000则自动补足1000
    reset_gold(){
        let nowValue = this._account.gold;
        if(nowValue < 1000){
            let incrValue = 1000 - nowValue;
            this._account.gold = incrValue;
        }
    }

    isOver() {
        return this._over && this.statistics.fire === 0;
    }

    //武器最大可用倍率 = 拥有金币 / 子弹总数
    _getWpMaxLv(){
        let own_max = this._cost.getWpLevelMax(this._curEnergy);
        return Math.min(this._account.gold/config.ARENA.FIRE, own_max);
    }

    c_rmatch_provocative(data, cb) {
        utils.invokeCallback(cb, null);
    }

    c_turn_weapon(data, cb) {
        logger.error('1v1对战武器切换');
        let {err, newWp} = this._turn_new_weapon_level(data.up);
        if (err) {
            return utils.invokeCallback(cb, err);
        }

        if(newWp > this._getWpMaxLv()){
            return utils.invokeCallback(cb, ERROR_OBJ.WEAPON_TURN_GOLD_TOO_LOW);
        }

        this._curWeapon = newWp;
        utils.invokeCallback(cb, null, {
            wp_level: newWp,
        });

        this._notify_weapon_level(newWp);
    }

    genWinRate() {
        let rate = (this.account.arena_win/Math.max(this.account.arena_fail + this.account.arena_win, 1));
        return rate;
    }

    /**
     * 计算核弹消耗
     * 来自配置
     */
    genNbombCost() {
        let rank = this.account.match_rank;
        let ret = designCfgUtils.getCfgValue('rank_rankgame_cfg', rank, 'id');
        return ret.nbgold;
    }

     /**
     * 开炮
     */
    c_fire(data, cb) {
        let wpBk = data.wp_bk;
        let bullet = this._cost.parseBulletKey(wpBk);
        if (bullet && bullet.rmatching) {
            let now = new Date().getTime();
            let interval = 0;
            if (this._lastFireTimestamp) {
                interval = now - this._lastFireTimestamp;
            }
            this._lastFireTimestamp = now;
            this._fireData.push({
                a: bullet.wpLv, //武器等级
                b: interval, //和上一炮的间隔，单位毫秒
                c: 0, //当前炮得分
                d: bullet.skin, //皮肤
            });
            this._bullets.push(wpBk);
            this._fireUpdateFunc && this._fireUpdateFunc(this._fireData);
        }
        super.c_fire(data, cb);
    }

     //打鱼分数计
     _catch_fish_count(bks, ret){
        let scoreGet = super._catch_fish_count(bks, ret);
        let fds = this._fireData;
        let i = fds.length - 1;
        while(i > 0 && i --) {
            let wpBk = this._bullets[i];
            if (wpBk && bks.indexOf(wpBk) >= 0) {
                fds[i].c = scoreGet;
                this._fireUpdateFunc && this._fireUpdateFunc(this._fireData);
                break;
            }
        }
    }

    registeFireUpdate(func) {
        this._fireUpdateFunc = func;
    }

}

module.exports = ArenaPlayer;

