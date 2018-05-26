// //--[[
// description: 排位赛比赛机器人
// author: scott (liuwenming@chufengnet.com)
// date: 20171222
// ATTENTION：
// //--]]

const RankMatchPlayer = require('./rankMatchPlayer');
const FishModel = require('../fishModel');
const consts = require('../consts');
const config = require('../config');
const configReader= require('../../../utils/configReader');
const GAMECFG = require('../../../utils/imports').DESIGN_CFG;

class RankMatchRobotPlayer extends RankMatchPlayer {
    constructor(opts) {
        super(opts);
        this._ready = true;
        this._updateFunc = null;
        //yxlDONE: 每个段位的iop定时生成, 这里只是取出相应的值
        let iop = opts.ior || 1;

        this._ioP = iop; //历史真人与机器人排位赛对战时的收支比
        this._wpSkin = 1; //武器皮肤
        this._wpLv = 1; //武器等级
        this._curScore = 0; //总共得分
	    this._maxFireC = config.MATCH.FIRE; //最大开炮数
        this._fireC = this._maxFireC; //剩余开炮数
        this._wpChangeFC = this._maxFireC - (20 + Math.floor(Math.random() * (this._maxFireC - 20))); //指定炮数后切换武器,注意只切换一次

        let total = 30 + Math.floor(Math.random() * 30); //随机开炮时间，秒
        this._fireInterval = total / 100 * 1000; //平均100炮间隔, 毫秒
        this._findAverageDt = this._fireInterval;
        this._fireDt = 0;
        this._chatDt = 0;
        this._chatInterval = 15000;//随机聊天时间，秒
        

        this._initRandomFishes();
        this._initNbomb();
        this._resetWpSkin(this.account.weapon_skin.equip);
    }

    save () {
        //do nothing
    }

    newBox (treasure2) {
        return null;
    }

    _newFirstWinBoxEnabled () {
        return false;
    }

    /**
     * 初始化核弹使用情况
     *  核弹使用率，需要统计历史比赛中，该段位所有玩家的核弹使用概率
        核弹伤害值，需要统计历史比赛中，该段位所有玩家和机器人比赛时的青铜核弹捕鱼的平均分值，上下20分浮动
     */
    _initNbomb () {
        this._nbEnbaled = true; //TODO：根据平均概率确定是否使用核弹
        this._nbFishCount = Math.floor(Math.random() * 10); //TODO: 核弹打死平均条数
        this._nbFishTotal = this._nbFishCount * (1 + Math.floor(Math.random() * 10)); //TODO: 核弹打死鱼平均得分
        this._nbWait = 1 + Math.floor(Math.random() * 10); //100开完，延时时间，模拟思考过程
    }

    /**
     * 初始化可能随机到的鱼
     */
    _initRandomFishes () {
        this._fishData = [];
        this._weightTotal = 0; //权重之和
        
        const FISH_CFGS = GAMECFG.fish_fish_cfg;
        let randSceneId = 1 + Math.floor(Math.random() * 3);
        var sName = "scene_mutiple_" + randSceneId;
        const scene = GAMECFG.scene_scenes_cfg[sName];
        let names = scene.fish_sort;
        let i = names.length;
        while (i > 0 && i --) {
            let name = names[i];
            const cfg = FISH_CFGS[name];
            let dtype = cfg.display_type;
            if (dtype === 2  || dtype === 3) {
                continue;
            }
            
            let gold = FishModel.sGenerateFishGold(cfg);
            let weight = Math.pow(gold, 0.5);
            this._weightTotal += weight;

            this._fishData.push({
                name: name,
                gold: gold,
                weight: weight,
            });
        }
    }


    /**
     * 操作结果回调
     */
    registerUpdateFunc (func) {
        this._updateFunc = func;
    }

    /**
     * 根据权重选出一条鱼开炮
     */
    _selectFish2Fire () {
        let ran = Math.random() * this._weightTotal;
        let t = 0;
        let data = null;
        for (let i = 0; i < this._fishData.length; i ++) {
            data = this._fishData[i];
            t += data.weight;
            if (t >= ran) {
                break;
            }
        }
        let name = data.name;
        const FISH_CFGS = GAMECFG.fish_fish_cfg;
        const cfg = FISH_CFGS[name];

        this._fireC -= this._wpTimes;
        this._fireC = Math.max(this._fireC, 0);
        if (this._fireC === this._wpChangeFC) {
            this._think2ChangeWeaponSkin();
            this._wpChangeFC = -1;
        }
        
        let temp = {
            score: this._curScore,
            fire: this._fireC,
            fish_list: [],
        };

        let OP = 1 / this._ioP;
        let rV = Math.random() * OP; //捕获率随机值
        let fP = cfg.fishbasepct * cfg.mapct;
        if (rV < fP) {
            let gold = data.gold;
            this._curScore += gold;
            temp.fish_list.push({
                name: name,
                num: 1,
                point: gold,
            });
            temp.score = this._curScore;
        }
        this._operation(consts.RMATCH_ROBOT_OPT.FIGHTING, temp);
    }

    /**
     * 操作结果
     */
    _operation (type, data) {
        data.uid = data.uid || this.account.uid;
        this._updateFunc && this._updateFunc(type, data);
    }

    /**
     * 考虑是否使用核弹
     */
    _think2FireWithNbomb () {
        if (this._thinkTimer) return;
        this._thinkTimer = setTimeout(function () {
            if (this._nbEnbaled) {
                let cout = this._nbFishCount; 
                let nScore = this._nbFishTotal;
                this._curScore += nScore;
                let temp = {
                    score: this._curScore,
                    nbomb: {
                        num: cout,
                        point: nScore,
                    }
                };
                this._operation(consts.RMATCH_ROBOT_OPT.USE_NBOMB, temp);
            }else{
                this._operation(consts.RMATCH_ROBOT_OPT.CANCEL_NBOMB);
            }
        }.bind(this), this._nbWait * 1000);
    }

    /**
     * 思考是否切换武器皮肤
     */
    _think2ChangeWeaponSkin () {
        if (Math.random() < 0.4) return; 
        let wpSkin = this.account.weapon_skin.equip;
        if (Math.random() < 0.5) {
            wpSkin += 1;
            wpSkin = Math.min(wpSkin, consts.WP_SKIN_ID.JIAN20);
        }else{
            wpSkin -= 1;
            wpSkin = Math.max(wpSkin, consts.WP_SKIN_ID.HUOPAO);
        }
        let temp = {
            wp_skin: wpSkin,
        };
        this._operation(consts.RMATCH_ROBOT_OPT.WEAPON_CHANGE, temp);
        this._resetWpSkin(wpSkin);
    }

    /**
     * 思考是否发送聊天
     */
    _think2Chat (dt) {
        this._chatDt += dt;
        if (this._chatDt < this._chatInterval) {
            return;
        }
        this._chatDt = 0;
        this._chatInterval = (10 + Math.floor(Math.random() * 10)) * 1000;

        if (Math.random() < 0.5) return; 
        let index = utils.random_int(1, GAMECFG.common_const_cfg.RMATCH_CHAT_COUNT);
        //logger.error('index = ', index)
        let tdata = {
            type: 0,
            idx: index,
            matchFlag: 1,
        };
        this._operation(consts.RMATCH_ROBOT_OPT.RANDOM_CHAT, tdata);
    }

    /**
     * 思考是否魅惑
     */
    _think2Provocative() {
        if (this._isThinkedToProvocative) {
            return;
        }
        this._isThinkedToProvocative = true;
        let val = 2 + Math.floor(Math.random()*4);
        let tdata = {
            provocativeVal: val
        };
        this._operation(consts.RMATCH_ROBOT_OPT.PROVOCATIVE, tdata);
    }

    _resetWpSkin (wpSkin) {
        this.account.weapon_skin.equip = wpSkin;
        const cfg = configReader.getValue('newweapon_weapons_cfg', wpSkin);
        let times = Math.round(cfg.power[0]);
        this._wpTimes = times || 1;
        //最低间隔不能少于武器皮肤对应的开炮间隔
        this._fireInterval = Math.max(cfg.interval, this._fireInterval);
        this._findAverageDt = this._fireInterval;

    }

     /**
     * 清除相关参数
     */
    clear () {
        this.save();
        this._thinkTimer && clearTimeout(this._thinkTimer);
        this._thinkTimer = null;
    }


    /**
     * 开炮
     * @param {*} dt 
     */ 
    fire (dt) {
        if (this.isOver()) return;
        if (this._fireC === 0) {
            return;
        }else {
            this._think2Chat(dt);
        }
        if (!this._checkFire(dt)) return;
        this._selectFish2Fire();
        if (this._fireC === 0) {
            this._think2FireWithNbomb();
        }else {
            this.isProvocativeEnabled() && this._fireC > this._maxFireC/3 && this._think2Provocative();
        }
        
    }

    /**
     * 检查是否可以开炮
     */
    _checkFire (dt) {
        this._fireDt += dt;
        if (this._fireDt < this._fireInterval) {
            return false;
        }
        this._fireDt = 0;
        //一炮之后，修正下一炮的间隔,
        let rand = this._findAverageDt / (1 + Math.floor(Math.random() * 10));
        if (Math.random() > 0.7) {
            this._fireInterval += rand;
        }else {
            this._fireInterval -= rand;
        }
        let ret = Math.abs(this._fireInterval - this._findAverageDt);
        if (this._fireInterval < 0 || ret > 3000) {
            this._fireInterval = this._findAverageDt;
        } 
        return true;
    }

    _countMission (matchRank) {
        //do nothing
    }

    async updateAccount(){
        //机器人无需处理
    }

    /**
     * 魅惑对手
     */
    provocative(hisScore) {
        let isOK = super.provocative(hisScore);
        if (!isOK) {
            this._isThinkedToProvocative = false;
        }
        return isOK;
    }

    async _zaddMatchPoints() {
        //do nothing
    }

    afterSetResult(result){
        let charm = result.charm;
        let matchRank = result.matchRank;
        this._charmPoint += charm;
        this._rankChange = matchRank - this._matchRank;
        this._matchRank = matchRank; //注意这个段位不是准确的，实际需求是需要根据排名和点数共同决定
        return this._winner === 1;
    }

}

module.exports = RankMatchRobotPlayer;