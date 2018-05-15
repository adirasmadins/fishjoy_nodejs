// //--[[
// description: 战斗内各种消耗计算（越南版）
// author: scott (liuwenming@chufengnet.com)
// date: 20171129
// ATTENTION：引用外部参数不可在该内中修改
// //--]]

const Cost = require('./cost');
const omelo = require('omelo');
const consts = require('../consts');
const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const TAG = 'numberTest ---';

class VietnamCost extends Cost {
    constructor() {
        super();
    }

    /**
     * 获取全服命中修正
     */
    getGlobalByGM() {
        return omelo.app.entry.instance.cacheReader.platformCatchRate;
    }

    /**
     * 全服提现命中修正
     */
    getGlobalRechargeByGM() {
        return omelo.app.entry.instance.cacheReader.catchRevise;
    }
    
    /**
     * 场景命中率修正
     */
    getSceneRateByGM (sceneName) {
        return omelo.app.entry.instance.cacheReader.getSceneCatchRate(sceneName);
    }

    /**
     * 计算捕获率
     * 个人命中
     * 全服命中
     */
    _calGpct (params) {
        let fishCfg = params.fishCfg;
        let weaponspct = params.weaponspct;
        let fireFlag = params.fireFlag; 
        let fishbasepctTotal = params.fishbasepctTotal; 
        let fishGoldTotal = params.fishGoldTotal;
        let goldVal = params.goldVal;
        let glaPCT = params.glaPCT;
        let roiPCT = params.roiPCT; 
        let heartbeat = params.heartbeat; 
        let pumpWater = params.pumpWater; 
        let newcomergold = params.newcomergold; 
        let vipHitrate = params.vipHitrate;
        let skinPct = params.skinPct;
        let gold = params.gold;
        let weaponLv = params.weaponLv;
        let fishbasepct = fishCfg.fishbasepct;
        let basPCT = fishbasepct * fishCfg.mapct * weaponspct;
        
        let log = params.isReal && this.log || null;
        log && log(TAG + '------------fish---start----------------------------1');
        log && log(TAG + '--fishbasepct = ', fishbasepct);
        log && log(TAG + '--mapct = ', fishCfg.mapct, fireFlag);

        let mofPCT = fishbasepct / fishbasepctTotal;
        if (fishGoldTotal > 0 && fireFlag) {
            mofPCT = goldVal / fishGoldTotal;
        }
        log && log(TAG + '--goldVal = ', goldVal);
        log && log(TAG + '--fishName = ', fishCfg.name);
        log && log(TAG + '--basPCT = ', basPCT);
        log && log(TAG + '--glaPCT = ', glaPCT);
        log && log(TAG + '--mofPCT = ', mofPCT);
        log && log(TAG + '--heartbeat = ', heartbeat);
        log && log(TAG + '--pumpWater = ', pumpWater);

        let gpct = basPCT * glaPCT * mofPCT;

        log && log(TAG + '--gpct = ', gpct);

        heartbeat = Math.floor(heartbeat);
        const MAC = this.MATH_ADJUST_CFG;
        let rcPCT = 1 + Math.sin(heartbeat * MAC.PICHANGE) * Math.min((MAC.DIVERGE + Math.ceil(heartbeat / 30) * MAC.DRATIO), MAC.HVALUE);
        log && log(TAG + '--gpct = ', gpct, ' rcPCT = ', rcPCT, heartbeat);

        gpct *= rcPCT;
        gpct *= pumpWater; // scPCT == pumpWater
        
        let nrPCT = 1;
        if (gold < newcomergold) {
            let cfg = DESIGN_CFG.common_const_cfg;
            weaponLv/fishbasepct <= cfg.CHANGE_CASH_1 && (nrPCT = 100);
            log && log(TAG + '--weaponLv = ', weaponLv);
        }
        gpct *= nrPCT;
        log && log(TAG + '--nrPCT = ', nrPCT, gpct);

        gpct *= (1 + vipHitrate);
        log && log(TAG + '--vipHitrate = ', vipHitrate, gpct);

        gpct *= skinPct;
        log && log(TAG + '--skinPct = ', skinPct, gpct);

        let personal = params.player_catch_rate;
        gpct *= personal;
        log && log(TAG + '------------个人修正 = ', personal, gpct);

        let gl = this.getGlobalByGM();
        gpct *= gl;
        log && log(TAG + '------------全服修正 = ', gl, gpct);

        let recharge = this.rechargeRevise(params.account, params.fishRewad);
        gpct *= recharge;
        log && log(TAG + '------------个人充值修正 = ', recharge, gpct);

        let glRecharge = this.getGlobalRechargeByGM();
        gpct *= glRecharge;
        log && log(TAG + '------------全服提现修正 = ', glRecharge, gpct);

        let sceneRate = this.getSceneRateByGM(params.sceneName);
        gpct *= sceneRate;
        log && log(TAG + '------------场景修正 = ', sceneRate, gpct);
        return gpct;
    }

    /**
     * 个人捕获率充值修正
     * @param {捕鱼、幸运大奖、奖金抽奖、激光、核弹即将会产生的金币} curGold 
     */
    rechargeRevise(account, curGold) {
        let credit_free = Math.max((account.recharge * 3 * 20 - account.cash * 3.75), DESIGN_CFG.common_const_cfg.GOLDE_MIN); //信用余额
        let revise = Math.max(Math.min((credit_free - account.gold - curGold) / credit_free * 4, 1), 0);
        //logger.error(`用户(${account.id})个人提现修正值:`, revise, ' 信用额度 = ', credit_free, ' account.gold = ', account.gold, ' curGold = ', curGold);
        return revise;
    }
}

module.exports = VietnamCost;