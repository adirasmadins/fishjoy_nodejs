const MatchPlayer = require('../entity/matchPlayer');
const config = require('../config');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;

class ArenaPlayer extends MatchPlayer{
    constructor(opts){
        super(opts);
        this._statistics = {
            score: 0, //当前总得分
            fire: config.MATCH.FIRE, //剩余子弹数
            fish_account: {}, //普通开炮打死什么鱼，得多少分
            nuclear_fish_count: -1, //核弹打死条数,-1默认取消核弹，核弹可能存在打不死鱼
            nuclear_score: -1, //核弹打死鱼总得分
            firetime: 0, //统计时间戳
            provocativeVal: 0, //被魅惑的分值
        };
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

