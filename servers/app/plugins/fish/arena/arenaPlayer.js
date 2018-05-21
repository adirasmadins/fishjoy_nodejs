const MatchPlayer = require('../entity/matchPlayer');
const config = require('../config');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const Countdown = require('../../../utils/countdown');
const rankMatchCmd = require('../../../cmd/rankMatchCmd');

class ArenaPlayer extends MatchPlayer{
    constructor(opts){
        super(opts);
        this._canRun = true;
    }

    update(){

    }

    _countdown_notify(dt) {
        logger.error('PK倒计时=', dt);
        this.emit(rankMatchCmd.push.timer.route, {
            player:this,
            data:{
                countdown: dt
            }
        });
    }

    _runPKTask() {
        if (!this._canRun) return;
        setTimeout(async function () {
            await this._countdown.tick();
            this.update();
            this._runPKTask();
        }.bind(this), 100);
    }

    startAsyncMatch(){
        this._countdown = new Countdown(this._countdown_notify.bind(this), config.ARENA.PK_DURATION);
        this._runPKTask();
    }

    stopAsyncMatch(){
        this._canRun = false;
    }

    //发往对战玩家所在的房间进行统计和广播
    async matchEventCall(method, data) {
        data = data || {};
        this.emit(method, {
            player:this,
            data:data,
        });
    }

    //如果玩家金币不足1000则自动补足
    reset_gold(){
        let nowValue = this._account.gold;
        if(nowValue < 1000){
            let incrValue = 1000 - nowValue;
            this._account.gold = incrValue;

        }
    }

    //武器最大可用倍率 = 拥有金币 / 子弹总数
    _getWpMaxLv(){
        let own_max = this._cost.getWpLevelMax(this._curEnergy);
        return Math.min(this._account.gold/config.ARENA.FIRE, own_max);
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
}

module.exports = ArenaPlayer;

