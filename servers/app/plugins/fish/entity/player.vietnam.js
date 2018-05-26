const FishPlayer = require('./player');
const ACCOUNTKEY = require('../../../database').dbConsts.ACCOUNTKEY;
const VietnamFishingLog = require('./vietnamFishingLog');
const REDISKEY = require('../../../models/index').REDISKEY;
const CHEAT_MAX = 3;

let childSelf = [
    ACCOUNTKEY.COST,
    ACCOUNTKEY.CASH,
    ACCOUNTKEY.RECHARGE,
    ACCOUNTKEY.GAIN_LOSS,
    ACCOUNTKEY.GAIN_LOSS_LIMIT,
    ACCOUNTKEY.GAIN_LOSS_SNAPSHOT,
    ACCOUNTKEY.PLAYER_CATCH_RATE,
];
childSelf = childSelf.concat(FishPlayer.sBaseField());

class VietnamPlayer extends FishPlayer {
    constructor(data) {
        super(data);
        this._cheat = {
            count: 0,
            msg: ''
        };
    }

    initFishingLoger() {
        this._log = new VietnamFishingLog(this.account);
        this._log.setCheatProc(function (msg, cheatCode) {
            this._cheatOnce(msg, cheatCode);
        }.bind(this));
    }

    static sBaseField() {
        return childSelf;
    }

    getBaseField() {
        return VietnamPlayer.sBaseField();
    }

    /**
     * 子弹克隆：反弹或分裂
     */
    c_fire_clone(data, cb) {
        let msg = this._fire_clone(data);
        if (msg) {
            this._cheatOnce(msg);
        }
        utils.invokeCallback(cb, null);
    }

    /**
     * 其他消耗:
     * 购买皮肤、购买月卡、购买VIP礼包、购买道具（提现功能内非实物类购买）、购买钻石、购买技能等各种其他非赌博消耗
     * 即未参于奖池和抽水
     */
    addCostOther(costVal) {
        if (!costVal || costVal < 0) return;
        this.account.cost = costVal;  //注意该变量为增量类型，下同
        this.account.commit();
    }

    /**
     * 个人捕获率修正失效检查
     */
    checkPersonalGpctOut() {
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

    /**
     * 封号
     */
    forbidAccount(cheatCode) {
        cheatCode = cheatCode || -1;
        this._account.test = cheatCode;
        this._account.token = 1;
        this.save();

        let timeNow = new Date().getTime();
        redisConnector.cmd.hset(REDISKEY.CHEAT_FORBID_TIME, this._account.id, timeNow);
        logger.error('作弊封号，终止操作：', this._account.id);
    }

    _checkBullet(bullet, isFireChecking) {
        this._cheat.count = this._cheat.count || 0;
        let ret = super._checkBullet(bullet, isFireChecking);
        if (ret) {
            this._cheatOnce(ret.msg);
            return ret;
        }
        this._cheat.count = 0;
        this._cheat.msg = '';
    }

    /**
     * 作弊标记
     * @param {*作弊信息} msg
     * @param {*立即剔除玩家标记} cheatCode
     */
    _cheatOnce(msg, cheatCode) {
        if (msg) {
            msg += ' uid = ' + this.uid;
        }
        this._cheat.msg = msg;
        this._cheat.count++;
        if (cheatCode && cheatCode < 0) {
            this._cheat.count = CHEAT_MAX;
            this.forbidAccount(cheatCode);
        }
        msg && logger.error(msg, ' cheatC = ', this._cheat.count);
    }

    //获取玩家作弊数据
    getCheatingData() {
        return (this._cheat.count >= 3 ? this._cheat : 0);
    }
}

module.exports = VietnamPlayer;
