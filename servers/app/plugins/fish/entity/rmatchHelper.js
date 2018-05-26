// //--[[
// description: 排位赛统计信息
// author: scott (liuwenming@chufengnet.com)
// date: 20171129
// ATTENTION：
// //--]]
const omelo = require('omelo');
const config = require('../config');
const consts = require('../consts');
const STATE = consts.RMATCH_STATE;

class RmatchHelper {
    constructor () {
        this._rankMatchSid = 0;
        this._roomId = 0;
        this._curScore = 0; //总共得分
        
        this._fHistory = null; //打死什么鱼、多少条、多少分
        this._fHistoryNB = null; //核弹打死多少条鱼、共计分
        this._state = STATE.READY; //比赛状态,0准备中 1开始比赛 2一百炮开完 3使用核弹 4取消核弹 5比赛结束
        this._updateFunc = null;
        this._nbCost = 1000;
        this._maxFireC = config.MATCH.FIRE; //最大开炮数
        this._fireC = this._maxFireC; //剩余开炮数
    }

    set maxfireC(value){
        this._maxFireC = value;
        this._fireC = this._maxFireC; //剩余开炮数
    }

    get rankMatchSid () {
        return this._rankMatchSid;
    }

    get roomId () {
        return this._roomId;
    }

    get nbombCost () {
        return this._nbCost;
    }

    /**
     * 记录本次核弹消耗
     */
    setNbCost (val) {
        this._nbCost = val;
    }

    /**
     * 记录比赛房间相关id
     * @param {*} data 
     */
    setServerData (data) {
        this._rankMatchSid = data.serverId;
        this._roomId = data.roomId;
    }

    /**
     * 重连重置进度
     * @param {*上一次的开炮数} fire 
     * @param {*上一次的得分} score 
     */
    resetWithContinue (fire, score) {
        this._fireC = fire || 0;
        this._curScore = score || 0;
    }

    /**
     * 数据发生变化时，及时回调
     * @param {*回调} func 
     */
    registerUpdateFunc (func) {
        this._updateFunc = func;
    }

    /**
     * 统计开炮次数,子弹碰撞完毕才算一次
     * times： 一炮当多炮，如金蝉武器，默认普通炮为1
     */
    _fireTimes (times) {
        if (this.isNormalFireEnd()) {
            return;
        }
        times = times || 1;
        this._fireC -= times;
        this._fireC = Math.max(this._fireC, 0);
    }

    /**
     * 普通开火是否结束
     */
    isNormalFireEnd () {
        return this._fireC === 0;
    }

    /**
     * 排位赛子弹数统计\捕鱼统计
     */
    fireCount (bks, ret, fishModel) {
        if (!this._updateFunc) return;
        
        let oldScore = this._curScore;
        this._fishCount(ret, fishModel);
        let scoreGet = this._curScore - oldScore;

        let oldFc = this._fireC;
        if (bks) {
            const cost = omelo.app.entry.instance.gamePlay.cost;
            for (let i = 0; i < bks.length; i ++) {
                let bk = bks[i];
                let temp = cost.parseBulletKey(bk);
                let skillId = temp.skillId;
                if (!temp.rmatching 
                    || skillId === consts.SKILL_ID.SK_LASER 
                    || (this._fireC === this._maxFireC && (skillId === consts.SKILL_ID.SK_NBOMB0 || skillId === consts.SKILL_ID.SK_NBOMB1 || skillId === consts.SKILL_ID.SK_NBOMB2))) {
                    continue; //非比赛、激光、第一炮核弹都不统计次数
                }
                const cfg = cost._getWpSKinCfg(temp.skin);
                let times = Math.round(cfg.power[0]);
                this._fireTimes(times);
            }
        }

        if (oldFc != this._fireC || scoreGet > 0) {
            let td = this._getDetail();
            this._updateFunc(td);
            this._fHistoryNB = null;
            this._fHistory = null;
        }
        return scoreGet;
    }

    /**
     * 排位赛打死鱼统计
     */
    _fishCount (ret, fishModel) {
        let fireEnd = this.isNormalFireEnd();
        let isFiredWithNB = this._state === STATE.NB_USED;
        for (let fk in ret) {
            let data = ret[fk];
            if (!data.rmatching) {
                continue;
            }
            let fireFlag = data.fireFlag;
            if (fireFlag === consts.FIRE_FLAG.LASER) {
                continue; //被激光打中不统计为比赛分数
            }else if (fireFlag === consts.FIRE_FLAG.NBOMB && this._fireC === this._maxFireC) {
                continue; //第一炮被核弹打中，不计分数
            }

            let fish = fishModel.getActorData(fk);
            let gold = fish.goldVal;
            let temp = fk.split('#');
            let name = temp[0];
            name = fishModel.getFishName(name);
            if (fireEnd && fireFlag === consts.FIRE_FLAG.NBOMB) {
                if (isFiredWithNB) {
                    if (!this._fHistoryNB) {
                        this._fHistoryNB = {
                            num: 0,
                            point: 0,
                        };
                    }
                    this._fHistoryNB.num ++;
                    this._fHistoryNB.point += gold;
                    this._curScore += gold;
                }
            }else if (!fireEnd){
                if (!this._fHistory) {
                    this._fHistory = {};
                }
                if (!this._fHistory[name]) {
                    this._fHistory[name] = {
                        num: 0,
                        point: 0,
                    };
                }
                this._fHistory[name].num ++;
                this._fHistory[name].point += gold;
                this._curScore += gold;
            }
        }
    }

    /**
     * 核弹使用与否
     */
    nbFlag (isUsed) {
        this._state = isUsed ? STATE.NB_USED : STATE.NB_CANCEL;
    }

    /**
     * 返回当前信息
     * fire: 剩余子弹数
     * score: 当前得分
     */
    _getDetail () {
        let temp = {};
        if (this._fHistoryNB) {
            temp = {
                score: this._curScore,
                nbomb: {
                    num: this._fHistoryNB.num,
                    point: this._fHistoryNB.point,
                }
            };
        }else{
            let flist = [];
            for (let k in this._fHistory) {
                let td = this._fHistory[k];
                flist.push({
                    name: k,
                    num: td.num,
                    point: td.point,
                });
            }
            temp = {
                score: this._curScore,
                fire: this._fireC,
                fish_list: flist,
            };
        }
        return temp;
    }

    /**
     * 魅惑对手
     */
    provocativeAnother() {
        let val = 2 + Math.floor(Math.random()*4);
        return val;
    }
    
}

module.exports = RmatchHelper;