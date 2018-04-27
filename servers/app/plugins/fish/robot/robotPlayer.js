const Player = require('../entity/player');
const consts = require('../consts');
const uuidv1 = require('uuid/v1');
const redisAccountSync = require('../../../utils/redisAccountSync');
const configReader= require('../../../utils/configReader');

const B_MAX = 9999;

class RobotPlayer extends Player {
    constructor(opts) {
        super(opts);
        this._joinTime = Date.now();
        this._room = opts.room;
        
        this._robotFireBKeys = {};
        this._robotLastFire = 0;
        this._fireRandomCount = 0; //连续开炮随机上限次数
        this._waitDt = 0; //达成上限，随机等待时间
        this._waitTimer = null;
        this._fireCount = 0; //连续开炮次数
        this._resetRandom();
    }

    get joinTime(){
        return this._joinTime;
    }

    get room(){
        return this._room;
    }

    clearSkillTickers () {
        this._waitTimer && clearTimeout(this._waitTimer);
        super.clearSkillTickers();
    }

    /**
     * 随机等待参数
     */
    _resetRandom () {
        this._fireCount = 0;
        this._fireRandomCount = 5 + Math.floor(Math.random()*50);
        this._waitDt = 3 + Math.floor(Math.random()*15);
        this._waitTimer && clearTimeout(this._waitTimer);
        this._waitTimer = null;
    }

    //创建机器人
    static allocPlayer(data) {
        let uid = uuidv1();
        let player = new RobotPlayer({uid:uid, account: redisAccountSync.genAccount(uid,data.account),
            kindId: consts.ENTITY_TYPE.ROBOT, room:data.room});

        return player;
    }

        
    /**
     * 机器人开火
     */
    robotFire () {
        let curSkin = this.DIY.weapon_skin;
        let now = new Date().getTime();
        if (this._fireTimestamp > 0) {
            let passed = now - this._fireTimestamp;
            const SKIN_CFGS = configReader.getValue('newweapon_weapons_cfg', curSkin);
            if (passed < SKIN_CFGS.interval * 1000) {
                return;
            }
        }
        this._fireTimestamp = now;

        //logger.error('fic = ', this._fireCount, this._fireRandomCount, this._waitDt);
        if (this._fireCount >= this._fireRandomCount) {
            if (!this._waitTimer) {
                this._waitTimer = setTimeout(function () {
                    this._resetRandom();
                }.bind(this), this._waitDt* 1000);
            }
            return;
        }
        this._fireCount ++;
        let fishKey = this._lastFireFish;
        if (fishKey) {
            if (this.fishModel.findFish(fishKey)) {
                if (Math.random() > 0.9) {
                    fishKey = null;
                }
            }
        }
        if (!fishKey) {
            fishKey = this.fishModel.findMaxValueFish();
            this._lastFireFish = fishKey;
        }
        let wpBk = this.genRobotBulletNameKey();
        this.c_fire({
            wp_level: this.DIY.weapon,
            wp_skin: curSkin, 
            fire_fish: fishKey,
            wp_bk: wpBk,
        });
    }

    genRobotBulletNameKey ( skillId ) {
        let name = this.seatId + '_' + this.DIY.weapon_skin + '_' + this.DIY.weapon;
        let i = this._robotLastFire;
        this._robotLastFire ++;
        if (this._robotLastFire >= B_MAX) {
            this._robotLastFire = 0;
        }
        let tk = '';
        for (; i < B_MAX; i++) {
            let nameKey = name + "_" + i;
            skillId && (nameKey += '_' + skillId);
            if (!this._robotFireBKeys.hasOwnProperty(nameKey)) {
                tk = nameKey;
                break;
            }
        }
        tk += '_rb';
        return tk;
    }

    /**
     * 是否是真人
     */
    isRealPlayer () {
        return false;
    }

}


module.exports = RobotPlayer;