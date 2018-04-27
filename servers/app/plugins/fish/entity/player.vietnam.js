const FishPlayer = require('./player');
const ACCOUNTKEY = require('../../../database').dbConsts.ACCOUNTKEY;
const VietnamFishingLog = require('./vietnamFishingLog');

class VietnamPlayer extends FishPlayer{
    constructor(data){
        super(data);
    }

    initFishingLoger () {
        this._log = new VietnamFishingLog(this.account);
        this._log.setCheatProc(function (msg, cheatCode) {
            this._cheatOnce(msg, cheatCode);
        }.bind(this));
    }

    static sBaseField(){
        let baseField = FishPlayer.sBaseField();
        const self = [
            ACCOUNTKEY.COST,
            ACCOUNTKEY.CASH,
            ACCOUNTKEY.RECHARGE,
            ACCOUNTKEY.GAIN_LOSS,
            ACCOUNTKEY.GAIN_LOSS_LIMIT,
            ACCOUNTKEY.GAIN_LOSS_SNAPSHOT,
            ACCOUNTKEY.PLAYER_CATCH_RATE,
        ];
        return baseField.concat(self);
    }

    getBaseField(){
        return VietnamPlayer.baseField;
    }

    /**
     * 其他消耗:
     * 购买皮肤、购买月卡、购买VIP礼包、购买道具（提现功能内非实物类购买）、购买钻石、购买技能等各种其他非赌博消耗
     * 即未参于奖池和抽水
     */
    addCostOther (costVal) {
        if (!costVal || costVal < 0) return;
        this.account.cost = costVal;  //注意该变量为增量类型，下同
        this.account.commit();
    }

    /**
     * 个人捕获率修正失效检查
     */
    checkPersonalGpctOut () {
        let wl = this.account.gain_loss;
        let out = this.account.gain_loss_limit;
        let start = this.account.gain_loss_snapshot; //被设置时的盈亏值
        logger.error('wl = ', wl, ' out = ', out, ' start = ', start);
        out = Math.abs(out);
        start = Math.abs(start); 
        if (out && start) {
            let cc = Math.abs(wl) - start; 
            if (Math.abs(cc) >= out) {
                this.account.gain_loss_limit = 0;
                this.account.gain_loss_snapshot = 0;
                this.account.player_catch_rate = 1;
                this.account.commit();
            }    
        }
    }

    getCheatingData() {
        return this._isForbided || (this._cheat.count >= 3 ? this._cheat : 0);
    }
}

module.exports = VietnamPlayer;
