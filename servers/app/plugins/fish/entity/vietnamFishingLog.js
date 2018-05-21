/**
 * 战斗房间内日志
 * 金币、钻石 消耗/获得：注意按场景记录
 * 技能 消耗，无获得
 * 其他：
 * 规则：
 * 作弊判定，以下两种情况（两种情况都要判断），任意满足一种就认为作弊：
    近1000发子弹gain/cost >= 1.8  and  提现VND + 持有金币/CHANGE_CASH_4 >= 充值VND + （CHANGE_CASH_1 + 75000）/CHANGE_CASH_4 
    level >=DRAW_LEVEL and 近1000发子弹gain/cost >=1.5  and  历史累计gain/cost  >= 1.25    and  提现VND + 持有金币/CHANGE_CASH_4 >= 充值VND + （CHANGE_CASH_1 + 75000）/CHANGE_CASH_4 
 */
const fishingLog = require('./fishingLog');
const REDISKEY = require('../../../database').dbConsts.REDISKEY;
const consts = require('../consts');
const configReader= require('../../../utils/configReader');

const LOG_FIELDS = [
    REDISKEY.CHEAT_GOLD,
    REDISKEY.CHEAT_GOLD_TOTAL,
];

const CASH_FIELDS = [
    REDISKEY.CASH,
    REDISKEY.RECHARGE,
    REDISKEY.GOLD,
    REDISKEY.LEVEL,
];

const REGET_DT = 60; //重新获取充值参数周期，单位秒
const FIRE_C = 1000; //金币收益多批次共检查炮数
const GOLD_C = 10; //金币收益检查批次
const CHEAT_P = 1.8; //金币作弊阈值
const CHEAT_P2 = 1.5; //金币作弊阈值
const CHEAT_P3 = 1.25; //金币作弊阈值

 class VietnamFishingLog extends fishingLog{
    constructor(account) {
        super(account);

        //金币收益校验,共1000炮，10个批次，每个批次100炮
        this._golds = [];
        this._goldTotals = {
            gain: 0,
            cost: 0
        };
        this._cashTempData = {
            cash: 0,
            recharge: 0,
            gold: 0,
            level: 1,
        };
        this._regetDt = 0;

        let cmds = [];
        for (let i = 0; i < LOG_FIELDS.length; i ++) {
            let field = LOG_FIELDS[i];
            cmds.push(['hget', field, this._uid]);
        }
        redisConnector.cmd.multi(cmds).exec(function (err, docs) {
            if (docs && docs.length > 0) {
                let golds = docs[0];
                let totals = docs[1];
                totals && (this._goldTotals = JSON.parse(totals));
                if (golds) {
                    this._golds = JSON.parse(golds);
                }else{
                    this._insertDefaultGold();
                }
            }else{
                this._insertDefaultGold();
            }
        }.bind(this));

        this._regetCach();
    }

    addGoldLog (flag, gold, level, isFireCounting, isRightNow) {
        if (gold > 0) {
            this._goldTotals.gain += gold;
        }else if (gold < 0) {
            this._goldTotals.cost -= gold;
        }
        super.addGoldLog(flag, gold, level, isFireCounting, isRightNow);
    }

    
    logAll () {
        super.logAll();
        this._saveCheatGold();
    }

    checkWriteNow (dt) {
        super.checkWriteNow(dt);
        //
        this._regetDt += dt;
        if (this._regetDt >= REGET_DT) {
            this._regetDt = 0;
            this._regetCach();
        }
    }

    /**
     * 重新读取提现、充值、金币等数据
     */
    _regetCach () {
        let cmds = [];
        for (let i = 0; i < CASH_FIELDS.length; i ++) {
            let field = CASH_FIELDS[i];
            cmds.push(['hget', field, this._uid]);
        }
        redisConnector.cmd.multi(cmds).exec(function (err, docs) {
            if (docs && docs.length > 0) {
                this._cashTempData.cash = parseInt(docs[0]) || 0;
                this._cashTempData.recharge = parseInt(docs[1]) || 0;
                this._cashTempData.gold = parseInt(docs[2]) || 0;
                this._cashTempData.level = parseInt(docs[3]) || 1;
                logger.debug('dd = ', this._cashTempData);
            }else{
                logger.error('fishingLog:_regetCach failed.', err);
            }
        }.bind(this));
    }

    /**
     * 提现、充值、持有金币特殊关系
     * 提现VND + 持有金币/CHANGE_CASH_4 >= 充值VND + （ CHANGE_CASH_1 + 75000）/CHANGE_CASH_4
     */
    _isNotNormalWithCash () {
        let data = this._cashTempData;
        let CHANGE_CASH_4 = configReader.getValue('common_const_cfg', 'CHANGE_CASH_4');
        let CHANGE_CASH_1 = configReader.getValue('common_const_cfg', 'CHANGE_CASH_1');

        let v1 = data.cash + data.gold/CHANGE_CASH_4;
        let v2 = data.recharge + (CHANGE_CASH_1 + 75000)/CHANGE_CASH_4;
        let isOK = v1 >= v2;
        logger.debug('v1 = ', v1, ' v2 = ', v2, ' cash = ', data.cash, ' gold = ', data.gold, ' CHANGE_CASH_4 = ', CHANGE_CASH_4, ' data.recharge = ', data.recharge, ' CHANGE_CASH_1 = ', CHANGE_CASH_1);
        return isOK;
    }

    /**
     * 根据历史产出和消耗比值确定是否正常
     * 历史累计gain/cost  >= 1
     */
    _isNotNormalWithTotal () {
        let DRAW_LEVEL = configReader.getValue('common_const_cfg', 'DRAW_LEVEL');
        if (this._cashTempData.level >= DRAW_LEVEL) {
            let data = this._goldTotals;
            if (data) {
                let tp = data.cost ? (data.gain / data.cost) : 0;
                logger.debug('total gain = ', data.gain, ' total cost = ', data.cost);
                return tp >= CHEAT_P3;
            }
        }
        return false;
    }

    /**
     * 将作弊校验数据持久化
     */
    _saveCheatGold () {
        let values = [];
        values.push(JSON.stringify(this._golds));
        values.push(JSON.stringify(this._goldTotals));

        let cmds = [];
        for (let i = 0; i < LOG_FIELDS.length; i ++) {
            let field = LOG_FIELDS[i];
            let value = values[i];
            cmds.push(['hset', field, this._uid, value]);
        }
        redisConnector.cmd.multi(cmds).exec(function (err, res) {
            if (err) {
                logger.error('fishingLog save failed.', err);
            }
        });
    }

    setCheatProc (func) {
        this._cheatFunc = func;
    }

    _exeCheat (msg, cheatCode) {
        this._saveCheatGold();
        this._cheatFunc && this._cheatFunc(msg, cheatCode);
        this._isForbided = true;
    }

    _insertDefaultGold () {
        this._golds.push({
            fire: 0, 
            gain: 0, 
            cost: 0
        });
    }

    /**
     * 增加一条金币作弊校验数据
     * @param {*收益} gain 
     * @param {*消耗} cost 
     * @param {*开炮数} fire 
     */
    addGoldGot (gain, cost, fire) {
        let len = this._golds.length;
        let data = this._golds[len - 1];
        data.fire += fire;
        data.gain += gain;
        data.cost += cost;

        let TC = FIRE_C/GOLD_C; //单批次开炮数
        
        logger.debug('gain = ', data.gain, ' cost = ', data.cost, ' fire = ', data.fire, ' TC = ', TC, ' len = ', len, ' GOLD_C = ', GOLD_C);
        
        if (data.fire >= TC) {
            if (len >= GOLD_C) {
                if (this._checkGold()) {
                    return;
                }
            }
            this._insertDefaultGold();
        }
    }

    /**
     * 检查最近1000炮玩家的金币数据，已确认是否作弊、剔除多余数据
     */
    _checkGold () {
        let tfire = 0;
        let tgain = 0;
        let tcost = 0;
        let i = this._golds.length;
        logger.debug('this._golds = ', this._golds);
        while (i > 0 && i --) {
            let data = this._golds[i];
            tfire += data.fire;
            tgain += data.gain;
            tcost += data.cost;
            if (tfire >= FIRE_C) {
                break;
            }
        }
        if (!tcost) {
            this._exeCheat('无金币消耗', consts.CHEAT_FLAG.NO_GOLD3);
            return true;
        }else {
            let pp = tgain/tcost;
            let isNotNormal = this._isNotNormalWithCash();
            if (pp >= CHEAT_P && isNotNormal) {
                let msg = '金币收益比大于指定值1, PP = ' + pp + ' CHEAT_P= ' + CHEAT_P;
                this._exeCheat(msg, consts.CHEAT_FLAG.NO_GOLD);
                return true;
            }
            if (pp >= CHEAT_P2 && this._isNotNormalWithTotal() && isNotNormal) {
                let msg = '金币收益比大于指定值2, PP = ' + pp + ' CHEAT_P2= ' + CHEAT_P2;
                this._exeCheat(msg, consts.CHEAT_FLAG.NO_GOLD2);
                return true;
            }
        }
        //数据正常时，移除前面的多余数据，保证只有最近的10个批次
        let ct = i + 1;
        ct > 0 && this._golds.splice(0, ct);
        this._saveCheatGold();
    }

 }

 module.exports = VietnamFishingLog;