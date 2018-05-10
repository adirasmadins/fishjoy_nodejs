// //--[[
// description: 保卫女神刷鱼逻辑
// author: scott (liuwenming@chufengnet.com)
// date: 20171129
// ATTENTION：
// //--]]

const FishModel = require('../fishModel');
const configReader= require('../../../utils/configReader');
const GAMECFG = require('../../../utils/imports').DESIGN_CFG;

const WAVE_DT = 3; //倒计时5秒
let GOD_UP_CFG = null;
let FISH_BORN_CFG = null;

class GoddessFishModel extends FishModel {
    constructor (evtor, currentSceneName){
        super(evtor, currentSceneName);        
        this._nextWaveFunc = null;
        logger.info('welcome goddeess 保卫女神房间 刷鱼');
    }

    resetAll() {
        super.resetAll();
        this._startWaveIdx = 0;
        this._curWaveNextFishDt = 0; //当前波下一条鱼生成间隔
        this._curWaveFishCount = 0; //当前波鱼总条数
        this._curWaveFishTotal = 0; //当前波鱼总条数
        this._fishHurt = null; //鱼伤害表
        this._waveBeginDt = WAVE_DT + 1; //每波开始前的倒计时
        this._resetFunc = null;
        this._curWaveFish = [];
        this._hpMax = 0;
        this._isFirstInWave = false; //每一波的第一条鱼标记;该鱼不延迟时间出生
        this._curGodIdx = 0; //当前女神索引
        this._curWaveRandomFishGroupKey = null;// 当前波随机组idx
        this._fishHurt = {};
        this._curWaveFish = [];
        this._godWaveCount = GAMECFG.goddess_defend_cfg.length;
    }

    setNextWaveFunc (func) {
        this._nextWaveFunc = func;
    }

    setStart (start) {
        this._startWaveIdx = start;
    }

    getStart () {
        return this._startWaveIdx;
    }

    getGodFish (waveIdx) {
        waveIdx = waveIdx + 1;
        return configReader.getValue('goddess_defend_cfg', waveIdx);
    }

    //检测是否有新鱼出现
    checkNewFish (dt) {
        if (this._startWaveIdx >= this._godWaveCount) {
            return;
        }
        this._waveBeginDt -= dt;
        if (this._waveBeginDt > 0) {
            return;
        }

        this._selectWaveFish();
        this._checkOneFish(dt);
    }

    //当前波选鱼注意元素构成：[key,间隔,伤害,总数]
    _selectWaveFish () {
        if (this._curWaveFish.length > 0) {
            return;
        }
        let rIdx = this._curWaveRandomFishGroupKey;
        logger.info('rIdx = ', rIdx);
        const FISH_GROUP = configReader.getValue('goddess_fishborn_cfg', rIdx);
        const fishCFG = FISH_GROUP.fish;
        for (let i = 0; i < fishCFG.length; i ++) {
            let fish = fishCFG[i];
            let data = {
                fishTypeKey: fish[0],
                fishInternal: fish[1],
                fishTotal: fish[3],
                fishHurt: fish[2],
                dt: 0,
                count: 0,
            };
            this._curWaveFish.push(data);
            this._curWaveFishTotal += data.fishTotal;
        }
        this._curWaveFish.length > 0  && (this._isFirstInWave = true); 
    }

    //当前波刷鱼
    _checkOneFish (dt) {
        let data = this._curWaveFish;
        let i = data.length;
        while (i > 0 && i --) {
            let temp = data[i];
            temp.dt += dt;
            if (this._isFirstInWave || temp.dt >= temp.fishInternal) {
                if (temp.count < temp.fishTotal) {
                    temp.count ++;
                    temp.dt = 0;
                    let fishTypeKey = temp.fishTypeKey;
                    let newFishData = null;
                    //注意：鱼阵名以‘_json’结尾
                    if (fishTypeKey.indexOf('_json') > 0) {
                        newFishData = this._newGroupFish(fishTypeKey, function (dt, subfishes) {
                            for (let k = 0; k < subfishes.length; k ++) {
                                let nameKey = subfishes[k];
                                this._fishHurt[nameKey] = temp.fishHurt;
                            }
                        }.bind(this));
                    }else{
                        newFishData = this._newFish(fishTypeKey);
                        this._fishHurt[newFishData.nameKey] = temp.fishHurt;
                    }
                    this._curWaveFishCount ++;
                    this._isFirstInWave = false;
                }
            }
        }
    }

    //重写父类同名方法,若是本波全部被干死或消失，则下一波开始
    removeActorData ( nameKey, isGodDead ) {
        super.removeActorData(nameKey);
        this._fishHurt[nameKey] && (delete this._fishHurt[nameKey]);
        let hurtC = Object.keys(this._fishHurt).length;
        let liveC = this.getActorTotal();
        this._emitGodEvent(GoddessFishModel.EventType.EVENT_FISH_LIVE, {liveC: liveC});
        (!isGodDead) && this._checkNewWave();
   }

   //返回鱼的伤害值，没有的则视为不是刷出来得所在波的鱼，例如召唤鱼则取不到伤害值
   getHurtValue (nameKey) {
       return this._fishHurt[nameKey];
   }

   //检查是否最终胜利，即所有波已过，且女神还没死
   pass (passAll, godId, reward) {
        this._emitGodEvent(GoddessFishModel.EventType.EVENT_PASS, {
            waveCount: this._startWaveIdx, 
            passAll: passAll ? 1 : 0, 
            godId: godId,
            reward: reward
        });
    }

   //下一波
   _checkNewWave () {
        if (this._startWaveIdx < this._godWaveCount) {
            if (this._curWaveFishTotal > 0 && this._curWaveFishCount >= this._curWaveFishTotal) {
                if (Object.keys(this._fishHurt).length == 0) {
                    this._curWaveRandomFishGroupKey = null;
                    this._curWaveFishTotal = 0;
                    this._startWaveIdx ++;
                    if (this._startWaveIdx < this._godWaveCount) {
                        this._curWaveFishCount = 0;
                        this._curWaveFish = [];
                        this._ready2StartNextWave(false);
                    }else{
                        this.pass(true);
                    }
                }
            }
        }else{
            logger.info("牛，所有波已搞定！");
        }
   }

   //下一波即将开始
   _ready2StartNextWave (isFirst) {
        this._waveBeginDt = WAVE_DT + 1;
        const WAVE = this.getGodFish(this._startWaveIdx);
        let rIdx = this._selectWaveRandomGroup(WAVE);
        let nextWave = this._startWaveIdx + 1;
        this._emitGodEvent(GoddessFishModel.EventType.EVENT_FISH_WAVE, {waveCount: nextWave, waveDt: WAVE_DT, isFirst: isFirst ? 1 : 0, rIdx: rIdx});
        this._nextWaveFunc && this._nextWaveFunc(this._startWaveIdx);
    }
    
    //选择当前波随机鱼组
    _selectWaveRandomGroup (wave) {
        if (!this._curWaveRandomFishGroupKey) {
            const borns = wave.fishborn;
            if (borns && borns instanceof Array) {
                let rIdx = Math.floor(Math.random()*borns.length);
                let bornKey = borns[rIdx];
                this._curWaveRandomFishGroupKey = bornKey;
                return bornKey;
            }else {
                logger.error('cfg is error. must be an Array.', wave.id);
            }
        }
        logger.error('no need to select random group.');
    }

    _emitGodEvent (evtName, evtData) {
        this._emitEvent(evtName, {
            goddess: evtData
        });
    }

}

GoddessFishModel.EventType = {
    EVENT_GOD_HURT : "EVENT_GOD_HURT",		//女神受攻击
    EVENT_FISH_WAVE : "EVENT_FISH_WAVE", //新一波到来 
    EVENT_PASS : "EVENT_PASS", //通过所有波，最终胜利
    EVENT_PAUSE: "EVENT_PAUSE", //暂停
    EVENT_FISH_WAVE_VIP_TIP : "EVENT_FISH_WAVE_VIP_TIP", //新一波到来 非vip提示
    EVENT_FISH_LIVE : "EVENT_FISH_LIVE", //存活鱼条数
};

module.exports = GoddessFishModel;