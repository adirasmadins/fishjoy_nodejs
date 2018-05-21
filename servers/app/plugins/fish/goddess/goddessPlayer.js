// //--[[
// description: 保卫女神玩家
// author: scott (liuwenming@chufengnet.com)
// date: 20171129
// ATTENTION：
// //--]]
const ChannelPlayer =  require('../entity/channelPlayer');
const FishCode = CONSTS.SYS_CODE;
const fishCmd = require('../../../cmd/fishCmd');
const ACCOUNTKEY = require('../../../database').dbConsts.ACCOUNTKEY;
const REDISKEY = require('../../../database').dbConsts.REDISKEY;
const configReader= require('../../../utils/configReader');
const dropManager = require('../../../utils/DropManager');
const tools = require('../../../utils/tools');
const GAMECFG = require('../../../utils/imports').DESIGN_CFG;
const GameEventBroadcast = require('../../../common/broadcast/GameEventBroadcast');
const RedisUtil = require('../../../../app/utils/tools/RedisUtil');
const RewardModel = require('../../../utils/account/RewardModel');
const SAVE_DT = 30 * 1000;

class GoddessPlayer extends ChannelPlayer {
    constructor (data) {
        super(data);
        this._godIdx = 0;
        this._godHp = 0;
        this._actionType = 1;
        this._isGodOVerAndSaved = false;
        this._top1Score = 0; //女神第一名关数
        this._top1Nick = 'None';
        this._top1Charm = 0;//女神第一名魅力点数
        this._jumpIdx = -1;

        if (this.account.goddess_jump > 0) {
            this.account.goddess_jump = Math.min(this.account.goddess_jump, 5);
            this._getTop1();
        }
    }

    /**
     * 取得当前保卫女神第一名的关数
     */
    async _getTop1 () {
        let platform = this.account.platform;
        let k = 'rank:goddess:result';
        let rankGoddess = await RedisUtil.get(`${k}:${platform}`);
        try {
            rankGoddess = JSON.parse(rankGoddess)
            if (rankGoddess) {
                let ps = rankGoddess.players;
                if (ps && ps.length > 0) {
                    let top1 = ps[0];
                    if (top1.uid == this.uid) {
                        return;//自己是保卫女神第一名，则不能跳关
                    }
                    this._top1Score = top1.score;
                    this._top1Nick = top1.ext.nickname;
                    this._top1Charm = top1.ext.charm_point; 
                }
            }   
        } catch (error) {
            logger.error('can not parse goddess rank data.');
        }
    }

    static sBaseField () {
        let baseField = ChannelPlayer.sBaseField();
        const self = [
            ACCOUNTKEY.GODDESS,
            ACCOUNTKEY.GODDESS_CROSSOVER,
            ACCOUNTKEY.GODDESS_ONGOING,
            ACCOUNTKEY.MAX_WAVE,
            ACCOUNTKEY.PLATFORM,
            ACCOUNTKEY.PRIVACY,
            ACCOUNTKEY.GODDESS_JUMP,
            ACCOUNTKEY.CHARM_POINT,
        ];
        return baseField.concat(self);
    }

    getBaseField(){
        return GoddessPlayer.sBaseField();
    }

    getCurGod (godIdx) {
        godIdx = godIdx || this._godIdx;
        let goddess = this.account.goddess;
        if (goddess && goddess.length > godIdx) {
            return goddess[godIdx];
        }
        return null;
    }

    godStart () {
        let god = this.getCurGod();
        return god.startWaveIdx;
    }

    _isGodUnlocked (godIdx) {
        let god = this.getCurGod(godIdx);
        if (god) {
            let unlock = god.unlock;
            for (let i = 0 ; i < unlock.length; i ++) {
                if (unlock[i] != 2) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    /**
     * 准备就绪
     * @param {*} data 
     * @param {*} cb 
     */
    c_god_ready (data, cb) {
        let godIdx = data.godIdx;
        if (!this._isGodUnlocked(godIdx)) {
            return utils.invokeCallback(cb, FishCode.LOCK_GOD);
        }

        this._godIdx = godIdx;
        let god = this.getCurGod();
        this._godHp = god.hp;
        this._setPauseAwayFlag();//进入房间，则标记暂离

        let cfg = configReader.getGodLevelData(god.id, god.level);
        let hpPercent = god.hp / cfg.hp;
        utils.invokeCallback(cb, null, {
            hpPercent: hpPercent,
            jumpLeft: this._top1Score > 0 ? this.account.goddess_jump : 0
        });
        this.emit(fishCmd.push.god_ready.route, {player: this});
    }

    /**
     * 客户端主动暂停，例如打开一个ui弹窗
     * @param {*} data 
     * @param {*} cb 
     */
    c_god_pause (data, cb) {
        let godIdx = data.godIdx;
        if (!this._isGodUnlocked(godIdx)) {
            return utils.invokeCallback(cb, FishCode.LOCK_GOD);
        }
        if (this._godIdx != godIdx) {
            return utils.invokeCallback(cb, FishCode.INVALID_GOD);
        }
        utils.invokeCallback(cb, null, {});
        this.emit(fishCmd.push.god_pause.route, {player: this});
        this.save();
        this._isPaused = true;
        logger.error('pause');
    } 

    /**
     * 客户端主动继续，例如关闭刚刚打开的弹窗
     * @param {*} data 
     * @param {*} cb 
     */
    c_god_continue (data, cb) {
        let godIdx = data.godIdx;
        if (!this._isGodUnlocked(godIdx)) {
            return utils.invokeCallback(cb, FishCode.LOCK_GOD);
        }
        if (this._godIdx != godIdx) {
            return utils.invokeCallback(cb, FishCode.INVALID_GOD);
        }
        utils.invokeCallback(cb, null, {});
        this.emit(fishCmd.push.god_continue.route, {player: this});
        this._isPaused = false;
    } 

    /**
     * 女神受伤
     * @param {*} data 
     * @param {*} cb 
     */
    c_god_hurt (data, cb) {   
        if (this._isPaused) {
            return;
        }      
        logger.debug('---client is c_god_hurt.', data.godIdx, data.fishKey, data.isInGroup);
        let godIdx = data.godIdx;
        if (!this._isGodUnlocked(godIdx)) {
            return utils.invokeCallback(cb, FishCode.LOCK_GOD);
        }
        if (this._godIdx != godIdx) {
            return utils.invokeCallback(cb, FishCode.INVALID_GOD);
        }

        let fish = this.fishModel.getActorData(data.fishKey);
        if (!fish) {
            logger.error('该鱼不存在或已死，为啥还要碰撞？', data.fishKey);
            utils.invokeCallback(cb, null);
            return;
        }
        if (!this._godHp) {
            logger.error('女神已死');
            utils.invokeCallback(cb, null);
            return;
        }
        let hurtVal = this.fishModel.getHurtValue(data.fishKey);
        if (!hurtVal || hurtVal < 0) {
            logger.error('召唤鱼不攻击或女神受伤数据有误');
            utils.invokeCallback(cb, null);
            return;
        }
        logger.debug('hurtVal = ', hurtVal);
        let god = this.getCurGod();
        let cfg = configReader.getGodLevelData(god.id, god.level);
        this._godHp -= hurtVal;
        let hpPercent = this._godHp / cfg.hp;
        let reward = {};
        if (hpPercent <= 0) {
            hpPercent = 0;
            this._godHp = 0;
           reward = this._godPassReward(godIdx);
        }
        utils.invokeCallback(cb, null, {
            hpPercent: hpPercent, 
            hurtVal: hurtVal,
        });
        this.emit(fishCmd.push.god_hurt.route, {
            player: this, 
            hpPercent: hpPercent, 
            fishKey: data.fishKey,
            reward: reward,
        });
    }

    /**
     * 开炮
     */
    c_fire(data, cb) {
        if (this._isPaused) {
            logger.error('疑似作弊：暂停不能开炮, uid = ', this.uid);
            return;
        }
        super.c_fire(data, cb);
    }
     /**
     * 子弹克隆：反弹或分裂
     */
    c_fire_clone (data, cb) {
        if (this._isPaused) {
            return;
        }
        super.c_fire_clone(data, cb);
    }

    /**
     * 碰撞鱼捕获率判定
     */
    c_catch_fish(data, cb) {
        if (this._isPaused) {
            logger.error('疑似作弊：暂停不能碰撞, uid = ', this.uid);
            return;
        }
        super.c_catch_fish(data, cb);
    }

    /**
     * 切换武器倍率
     * 注意保卫女神规则：
     *  * 当玩家最高倍率低于 GOLDDESS_WEAPON倍 时，只能使用玩家的最高倍率
        当玩家最高倍率大于等于 GOLDDESS_WEAPON倍 时，可以使用 GOLDDESS_WEAPON倍 及以上的倍率
     */
    c_turn_weapon(data, cb) {
        let godWpLv = configReader.getValue('common_const_cfg', 'GOLDDESS_WEAPON');
        if (this._maxWpLv < godWpLv) {
            return utils.invokeCallback(cb, null, {
                wp_level: -1, //切换失败，当前可用最大倍率低于  GOLDDESS_WEAPON倍
            });
        }
        this._sceneCfg.min_level = Math.max(this._sceneCfg.min_level, godWpLv);
        super.c_turn_weapon(data, cb);
    }

    /**
     * 领取海盗任务奖励
     * 保卫女神不会发生海盗任务领取
     */
    c_pirate_reward(data, cb) {
        utils.invokeCallback(cb, FishCode.PIRATE_NOT_DONE);
    }

    /**
     * 跳关
     */
    c_god_jump(data, cb) {
        let godIdx = data.godIdx;
        if (!this._isGodUnlocked(godIdx)) {
            return utils.invokeCallback(cb, FishCode.LOCK_GOD);
        }
        if (this._godIdx != godIdx) {
            return utils.invokeCallback(cb, FishCode.INVALID_GOD);
        }
        this._getTop1();
        if (this.account.charm_point < this._top1Charm) {
            return utils.invokeCallback(cb, null, { charmBelowTop1: true });
        }
        if (this.account.goddess_jump > 0 && this._top1Score > 0) {
            let goddess = this.account.goddess[godIdx];
            if (goddess.startWaveIdx + 1 >= this._top1Score - 1) {
                return utils.invokeCallback(cb, null, {failBeyondTop1: true});
            }

            goddess.startWaveIdx ++;
            let totalWave = GAMECFG.goddess_defend_cfg.length;
            goddess.startWaveIdx = Math.min(goddess.startWaveIdx, totalWave - 1);

            this.account.goddess_jump = this.account.goddess_jump - 1;
            utils.invokeCallback(cb, null, {
                clearAll: 1,
                jumpLeft: this.account.goddess_jump
            });
            this.emit(fishCmd.push.god_jump.route, {
                player: this, 
            });
            this.account.commit();

            //成功碾压第一名公告
            let params = [this.account.nickname, this._top1Nick, this.account.vip];
            let content = {
                type: GameEventBroadcast.TYPE.GAME_EVENT.GODDESS_JUMP,
                params: params,
            };
            new GameEventBroadcast(content).extra(this.account).add();
            this._jumpIdx = goddess.startWaveIdx;
        }else{
            utils.invokeCallback(cb, FishCode.INVALID_GOD);
        }
    }

    /**
     * 定时轮序逻辑
     * @param {*轮询时间差，单位秒} dt 
     */
    update (dt) {
        if (this._isGodOVerAndSaved) return;
        super.update(dt);

        //定时存档
        let now = new Date().getTime();
        if (this._lastTime) {
            let pass = now - this._lastTime;
            if (pass >= SAVE_DT) {
                this.save();
                this._lastTime = now;
            }
        }else{
            this._lastTime = now;
        }
    }

    save(){
        if (this._isGodOVerAndSaved) return;
        let goddess = this.account.goddess;
        if (goddess && goddess.length > this._godIdx) {
            let god = goddess[this._godIdx];
            let max_wave = this.account.max_wave;
            let wc = god.startWaveIdx + 1;   
            //注意，每过一波更新最大波数
            if (!max_wave || max_wave < wc) {
                max_wave = wc;
                this.account.max_wave = max_wave;
                let mission = new RewardModel(this.account);
                mission.updateProcess(RewardModel.TaskType.GODDESS_LEVEL, max_wave);
                mission.commit();
            }

            if (this._godHp === 0) {
                this._actionType = 3;
                logBuilder.addGoddessLog(this.account.id, wc, this._actionType);//女神挑战结算

                //女神死了，则恢复到默认血量,且暂离失效
                let cfg = configReader.getGodLevelData(god.id, god.level);
                god.hp = cfg.hp;
                god.isPauseAway = false;
                god.startWaveIdx = 0;
                this.account.goddess_crossover = 0;
                this.account.goddess_ongoing = 0;
                this.account.goddess_jump = 0;
                //更新一次排行榜
                if (!tools.BuzzUtil.isCheat(this.account)) {
                    max_wave > 0 && redisConnector.cmd.zadd(`${REDISKEY.RANK.GODDESS}:${this.account.platform}`, max_wave, this.account.id);
                }
            } else {
                god.startWaveIdx = this.fishModel.getStart();
                god.hp = this._godHp;
                god.isPauseAway = true;
                this.account.goddess_ongoing = 1;
            }
            this.account.goddess = goddess;
            super.save();
            this._isGodOVerAndSaved = this._godHp === 0 && this._actionType === 3;
        }
    }

    _setPauseAwayFlag () {
        let goddess = this.account.goddess;
        if (goddess && goddess.length > this._godIdx) {
            let god = goddess[this._godIdx];
            god.isPauseAway = true;
            this.account.goddess = goddess;
            super.save();
        }
    }

    /**
     * 女神过关开宝箱
     * @param {*} godIdx 
     */
    _godPassReward (godIdx) {
        let totalWave = GAMECFG.goddess_defend_cfg.length;
        let wave = Math.min(totalWave, this.fishModel.getStart() + 1);
        let defendCfg = configReader.getValue('goddess_defend_cfg', wave);
        let treasureID = defendCfg.treasure[godIdx];
        let crossover = this.account.goddess_crossover || 0;
        let times = 1 + crossover * 0.5;
        let reward = {};
        reward.times = Math.min(4, times);
        let ret = dropManager.openTreasure(this.account, treasureID, configReader.getValue('common_log_const_cfg', 'GOD_CHALLENGE'), reward.times);
        reward.drops = ret.dpks;
        reward.treasureID = treasureID;
        return reward;
    }

    /**
     * 检查武器等级
     * 当玩家最高倍率低于 GOLDDESS_WEAPON倍 时，只能使用玩家的最高倍率
        当玩家最高倍率大于等于 GOLDDESS_WEAPON倍 时，可以使用 GOLDDESS_WEAPON倍 及以上的倍率
     */
    _checkBulletLevel (wpLv) {
        let godWpLv = configReader.getValue('common_const_cfg', 'GOLDDESS_WEAPON');
        if (this._maxWpLv < godWpLv) {
            if (wpLv !== this._maxWpLv) {
                return false;
            }
        }else {
            if (wpLv < godWpLv) {
                return false;
            }
        }
        return super._checkBulletLevel(wpLv);
    }

    /**
     * 下一波开始
     * @param {*波数，从1算起} waveCount 
     */
    nextWave (waveCount) {
        this.save();
        let wc = waveCount;
        if (this._actionType == 1) {
            wc = waveCount + 1;
        }else if (this._actionType === 3) {
            return;
        }
        if (this._jumpIdx === wc) {
            logBuilder.addGoddessLog(this.account.id, wc, 4);//直接跳关开始新的一波
            this._jumpIdx = -1;
        }else{
            logBuilder.addGoddessLog(this.account.id, wc, this._actionType);//女神挑战过关
        }
        this._actionType = 2;
    }
            

}

module.exports = GoddessPlayer;