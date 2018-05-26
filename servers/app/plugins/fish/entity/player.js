const omelo = require('omelo');
const Player = require('./basePlayer');
const fishCmd = require('../../../cmd/fishCmd');
const rankMatchCmd = require('../../../cmd/rankMatchCmd');
const FishCode = CONSTS.SYS_CODE;
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const logBuilder = require('../../../utils/logSync').logBuilder;
const consts = require('../consts');
const GAMECFG = require('../../../utils/imports').DESIGN_CFG;
const configReader = require('../../../utils/configReader');
const redisAccountSync = require('../../../utils/redisAccountSync');
const import_def = require('../../../models/index');
const ACCOUNTKEY = import_def.ACCOUNTKEY;
const Pirate = require('./pirate');
const RewardModel = require('../../../utils/account/RewardModel');
const FishingLog = require('./fishingLog');
const dropManager = require('../../../utils/DropManager');
const tools = require('../../../utils/tools');
const GameEventBroadcast = require('../../../common/broadcast/GameEventBroadcast');
const ObjUtil = require('../../../../app/utils/tools/ObjUtil');
const FIRE_DELAY = 50; //开炮事件服务端与客户端的延时,单位毫秒
const REDIS_DT = 1000; //redis及时存入周期
const baseField = [
    ACCOUNTKEY.NICKNAME,
    ACCOUNTKEY.SEX,
    ACCOUNTKEY.LEVEL,
    ACCOUNTKEY.WEAPON,
    ACCOUNTKEY.WEAPON_SKIN,
    ACCOUNTKEY.GOLD,
    ACCOUNTKEY.PEARL,
    ACCOUNTKEY.VIP,
    ACCOUNTKEY.COMEBACK,
    ACCOUNTKEY.WEAPON_ENERGY,
    ACCOUNTKEY.HEARTBEAT,
    ACCOUNTKEY.ROIPCT_TIME,
    ACCOUNTKEY.SKILL,
    ACCOUNTKEY.EXP,
    ACCOUNTKEY.FIGURE_URL,
    ACCOUNTKEY.BONUS,
    ACCOUNTKEY.PIRATE,
    ACCOUNTKEY.BP,
    ACCOUNTKEY.PLATFORM,
    ACCOUNTKEY.TOKEN,
    ACCOUNTKEY.TEST,
    ACCOUNTKEY.MISSION_DAILY_RESET,
    ACCOUNTKEY.MISSION_ONLY_ONCE,
    ACCOUNTKEY.PACKAGE,
    ACCOUNTKEY.SOCIAL_DAILY_INVITE_REWARD,
    ACCOUNTKEY.FREE_BOMB,
    ACCOUNTKEY.ACTIVE_DAILY_RESET,
    ACCOUNTKEY.ACTIVE,
    ACCOUNTKEY.DROP_ONCE,
    ACCOUNTKEY.DROP_RESET,
    ACCOUNTKEY.PRIVACY,
    ACCOUNTKEY.BROKE_TIMES,
];

class FishPlayer extends Player {
    constructor(opts) {
        super(opts);
        this._cost = omelo.app.entry.instance.gamePlay.cost;
        this._account = opts.account || {};

        this._curSkin = 1; //当前武器装备的皮肤
        this._curEnergy = {1:0}; //当前武器激光能量
        this._maxWpLv = 1;// 当前皮肤武器最大等级
        this._curWeapon = 1;//当前皮肤武器等级
        this._curSkill = {}; //当前技能 //只记录当前增量
        this._curPackage = {}; //当前背包//只记录当前增量

        this._roomId = null;
        this._connectState = CONSTS.constDef.PALYER_STATE.ONLINE;
        this._skinDt = 200;

        this._sword = 0; //玩家战力（）
        this._skState = {}; //0准备 1进行中 2结束
        this._sceneCfg = null;
        this._fishModel = null;
        this._seatId = -1; //座位号，从0开始

        this._lastFireFish = null;
        this._bkCost = {};
        this._fireTimestamp = 0;
        this._lastFireIdx = 0;
        this._pirate = null;
        this._pirateTimestamp = null;

        this.initFishingLoger();

        this._writeRedisTimestamp = new Date().getTime();

        this._mission = new RewardModel(this._account);

        omelo.app.entry.instance.playerEventEmitter.on(this.uid, this._playerChangeEvt.bind(this));

        let cfg = GAMECFG.newweapon_upgrade_cfg;
        let wbks = Object.keys(cfg);
        wbks.sort(function (a, b) {
            return Number(a) > Number(b) ? 1 : -1;
        });
        this._wbks = wbks;
    }

    initFishingLoger() {
        this._log = new FishingLog(this._account);
    }

    _playerChangeEvt(key, value) {
        this._account[key] = value;
    }

    set roomId(value) {
        this._roomId = value;
    }

    get roomId() {
        return this._roomId;
    }

    set connectState(value) {
        this._connectState = value;

        //离线时及时写入内存数据
        CONSTS.constDef.PALYER_STATE.OFFLINE == value && this._writeNow();
    }

    get connectState() {
        return this._connectState;
    }

    /**
     * 获取玩家战力
     * weapon
     * @returns {number}
     */
    get sword() {
        return this._sword;
    }

    /**
     * 加入房间
     * @param {*} param0
     */
    joinRoom({sceneCfg, seatId, fishModel, roomId, sceneIdx}) {
        this._seatId = seatId;
        this._fishModel = fishModel;
        this._roomId = roomId;
        this._sceneCfg = {
            max_level: sceneCfg.max_level,
            min_level: sceneCfg.min_level,
            name: sceneCfg.name,
            pirate_time: sceneCfg.pirate_time,
            pirate_id: sceneCfg.pirate_id,
        };
        this._sceneIdx = sceneIdx;
        this._reset(true);
    }

    get fishModel() {
        return this._fishModel;
    }

    get DIY() {
        return {
            weapon: this._curWeapon,
            weapon_energy: this._curEnergy,
            weapon_skin: this._curSkin,
        };
    }

    get seatId() {
        return this._seatId;
    }

    set account(value) {
        this._account = value;
        //注意：玩家金币、钻石可能未负数，故进入战斗或重新拉取玩家数据时，及时处理内存数据并及时写入redis
        let isOk = false;
        if (this._account.gold < 0) {
            this._account.gold = -this._account.gold;
            isOk = true;
        }
        if (this._account.pearl < 0) {
            this._account.pearl = -this._account.pearl;
            isOk = true;
        }
        isOk && this.save();
    }

    get account() {
        return this._account;
    }

    save() {
        this._account.commit();
    }

    c_query_fishes(data, cb) {
        let fm = this.fishModel;
        let fishes = fm.getLiveFish();
        utils.invokeCallback(cb, null, {
            fishes: fishes,
        });
        logger.debug('--c_query_fishes--done');
    }

    static sBaseField() {
        return baseField;
    }

    getBaseField() {
        return FishPlayer.sBaseField();
    }

    async syncData() {
        this._account.commit(function () {
            this._regetField();
        }.bind(this));
    }

    _regetField() {
        let tfs = this.getBaseField();
        let old = this._account.weapon;
        redisAccountSync.getAccount(this.uid, tfs, function (err, account) {
            if (err) {
                logger.error('err = ', err, ' code = ', CONSTS.SYS_CODE.DB_INNER_ERROR.code);
                return;
            }
            if (!account) {
                logger.error('err = ', err, ' code = ', CONSTS.SYS_CODE.PLAYER_NOT_EXIST.code);
                return;
            }

            this._account = account;
            this._log && this._log.logAll(this._account);
            this._reset(this._account.weapon > old);

            this.emit(fishCmd.push.player_notify.route, {
                player: this,
                data: {
                    seatId: this.seatId,
                    gold: this._account.gold,
                    pearl: this._account.pearl,
                    wp_level: this._curWeapon,
                    wp_skin: this._curSkin,
                    wp_star: this.getSkinStar()
                }
            });
        }.bind(this));
    }

    /**
     * 检查武器皮肤
     */
    _checkBulletSkin(skin) {
        let mySKins = this._account.weapon_skin;
        if (!mySKins || !mySKins.own || mySKins.own.indexOf(parseInt(skin)) === -1) {
            mySKins && mySKins.own && logger.error('skin = ', skin, mySKins.own);
            return false;
        }
        return true;
    }

    /**
     * 检查武器等级
     * 是否已升级该等级、当前场景是否允许该等级
     */
    _checkBulletLevel(wpLv) {
        let wpEng = this._curEnergy;
        if (wpEng && (wpEng[wpLv] >= 0 || wpLv === 1) && wpLv >= this._sceneCfg.min_level && wpLv <= this._sceneCfg.max_level) {
            return true;
        }
        logger.error('wpLv = ', wpLv, wpEng);
        return false;
    }

    //获取玩家作弊数据
    getCheatingData() {
    }

    /**
     * 检查子弹的合法性
     */
    _checkBullet(bullet, isFireChecking) {
        if (!bullet) {
            return {code: -1, msg: '子弹数据有误'};
        }
        let bSkin = bullet.skin;
        if (!this._checkBulletSkin(bSkin)) {
            return {code: -2, msg: '没有这个皮肤 skin = ' + bSkin};
        }
        let bLv = bullet.wpLv;
        if (!this._checkBulletLevel(bLv)) {
            return {code: -3, msg: '当前场景没有这个等级 wpLv =' + bLv};
        }
        if (isFireChecking) {
            let curSkin = this._curSkin;
            if (curSkin != bSkin) {
                return {code: -4, msg: '武器皮肤不匹配curSkin = ' + curSkin + ' bSkin = ' + bSkin};
            }
            let curWpLv = this._curWeapon;
            if (curWpLv != bLv) {
                return {code: -5, msg: '武器等级不匹配curWpLv = ' + curWpLv + ' bLv = ' + bLv};
            }
        }

        return null;
    }

    /**
     * 定时轮序逻辑
     * @param {*轮询时间差，单位秒} dt
     */
    update(dt) {
        this._checkBkCostTimeout(dt);
        this._log.checkWriteNow(dt);
        this._checkMinigameStartPass(dt);
    }

    /**
     * 检查小游戏从掉落到开始的超时时间，即时间已过，则不能再触发小游戏，必须等下一次掉落。
     * @param {*} dt
     */
    _checkMinigameStartPass(dt) {
        if (!this._miniGame) {
            return;
        }
        if (this._miniGame.startTimestamp) {
            this._miniGame.timeoutDt -= dt;
            if (this._miniGame.timeoutDt <= 0) {
                this._tellOthersMiniTimeout();
                this._miniGame = null;
                return;
            }
        }
    }

    /**
     * 检查bkcost过期
     * @param {*} dt
     */
    _checkBkCostTimeout(dt) {
        let bks = [];
        for (let k in this._bkCost) {
            this._bkCost[k].dt -= dt;
            if (this._bkCost[k].dt <= 0) {
                bks.push(k);
            }
        }
        let length = bks.length;
        for (let i = 0; i < length; i++) {
            this._delBkCost(bks[i]);
        }
    }

    _delBkCost(bk) {
        if (!this._bkCost[bk]) return;
        delete this._bkCost[bk];
    }

    /**
     * 增加bk记录
     * @param {*} bk
     * @param {*} value
     */
    _addBkCost(bk, value, isSpecial, nextFireBCC) {
        this._bkCost[bk] = this._bkCost[bk] || {};
        this._bkCost[bk].cost = value;
        this._bkCost[bk].dt = 2 + Math.floor(Math.random() * 4);
        if (isSpecial) {
            this._bkCost[bk].dt *= 5;
        }
        nextFireBCC > 0 && (this._bkCost[bk].clone = nextFireBCC);
        return true;
    }

    /**
     * 开炮
     */
    c_fire(data, cb) {
        let resetData = {
            old: {
                pearl: this._account.pearl,
                gold: this._account.gold,
                wp_level: this._curWeapon,
                wp_skin: this._curSkin,
            },
        };

        if (!data) {
            utils.invokeCallback(cb, null, resetData);
        }
        let wpBk = data.wp_bk;
        let bullet = this._cost.parseBulletKey(wpBk);
        if (this._checkBullet(bullet, true)) {
            this._delBkCost(wpBk);
            utils.invokeCallback(cb, null, resetData);
            return;
        }
        let curSkin = bullet.skin;
        let curWpLv = bullet.wpLv;
        let now = new Date().getTime();
        if (this._fireTimestamp > 0) {
            let passed = now - this._fireTimestamp;
            //压力测试可关闭开炮频率校验
            // logger.error('passed = ', passed, this._skinDt);
            if (passed < this._skinDt) {
                resetData.err = FishCode.INVALID_WP_FIRE;
                utils.invokeCallback(cb, null, resetData);
                return;
            }
        }
        this._fireTimestamp = now;

        if (this._bkCost[wpBk]) {
            this._delBkCost(wpBk);
            resetData.err = FishCode.INVALID_WP_BK;
            utils.invokeCallback(cb, null, resetData);
            return;
        }

        let energy = this._curEnergy[curWpLv] || 0;
        let gainLaser = energy;
        let newComebackHitrate = this._account.comeback && this._account.comeback.hitrate || 1;
        let nextFireBCC = 0; //下一炮子弹可能分裂出的子弹数
        let saveData = {
            level: this._account.level,
            exp: this._account.exp,
            gold: 0,
        };
        if (this._account.gold > 0) {
            let costGold = this._cost.fire_gold_cost({
                weapon_skin: curSkin,
                weapon: curWpLv
            });
            if (costGold > this._account.gold) {
                costGold = this._account.gold; //最后一炮不足以开炮时，则默认剩余全部用完可开一次，下一次开炮则破产
            }
            nextFireBCC = this._cost.calBulletClonedCount(curSkin);
            this._addBkCost(wpBk, costGold, curSkin == consts.WP_SKIN_ID.PAOPAOTANG, nextFireBCC);

            let star = this.getSkinStar(curSkin);
            let wpStarCfg = null;
            star && (wpStarCfg = configReader.getWeaponStarData(curSkin, star));

            let gainExp = this._cost.fire_gain_exp({
                gold: costGold,
                godId: -1, //todo
                godLevel: -1, //todo
                starExp: wpStarCfg && wpStarCfg.exp || 0, //星级加成经验
            });
            gainExp > 0 && this._checkLevelUp(saveData, gainExp);
            newComebackHitrate = this._cost.subComebackHitRate(curWpLv, this._account.comeback);
            if (newComebackHitrate > 0) {
                saveData.comeback_hitrate = newComebackHitrate;
            }
            let heart = this._cost.newHeartBeat(costGold, this._sceneCfg.max_level, this._account.heartbeat_min_cost, this._account.heartbeat, this._maxWpLv);
            const wpCfg = this._cost._getWpLevelCfg(curWpLv);
            if (wpCfg && energy < wpCfg.needpower) {
                gainLaser = this._cost.fire_gain_laser({
                    weapon_skin: curSkin,
                    weapon: curWpLv,
                    energy: energy,
                    godId: -1, //todo 
                    godLevel: -1, //todo
                    starLaser: wpStarCfg && wpStarCfg.powerspeed || 0, //星级加成激光累计速度
                });
                this._curEnergy[curWpLv] = gainLaser;
            }
            saveData.gold -= costGold;
            saveData.heartbeat = heart[0];
            saveData.heartbeat_min_cost = heart[1];
            this._log.addGoldLog(GAMECFG.common_log_const_cfg.GAME_FIGHTING, saveData.gold, this._account.level, true);
            this._save(saveData);

            this.checkPersonalGpctOut();
        }

        let resData = {
            wp_laser: {
                wp_level: curWpLv,
                laser: gainLaser
            },
            exp: this._account.exp,
            level: this._account.level,
            gold: this._account.gold,
            comeback_hitrate: newComebackHitrate,
            nextFireBCC: nextFireBCC,
        };
        saveData.skill && (resData.skill = this.getLeftSkill());
        saveData.pearl && (resData.pearl = this._account.pearl);
        saveData.package && (resData.package = this.getLeftPackage());
        utils.invokeCallback(cb, null, resData);

        if (this._account.gold > 0) {
            let sd = {
                seatId: this.seatId,
                fire_point: data.fire_point,
                gold: this._account.gold,
                wp_bk: wpBk,
            };
            data.fire_fish && (sd.fire_fish = data.fire_fish);
            data.clone && (sd.clone = data.clone);
            this.emit(fishCmd.push.fire.route, {
                player: this,
                data: sd
            });
        }
    }

    /**
     * 子弹克隆：反弹或分裂
     */
    c_fire_clone(data, cb) {
        this._fire_clone(data);
        utils.invokeCallback(cb, null);
    }

    _fire_clone(data) {
        if (!data) {
            return;
        }
        let srcWbk = data.src;
        let clones = data.clones;
        if (!srcWbk) {
            return;
        }
        let bkData = this._bkCost[srcWbk];
        let srcBullet = this._cost.parseBulletKey(srcWbk);
        if (this._checkBullet(srcBullet)) {
            return;
        }
        let srcSkin = srcBullet.skin;
        if (srcSkin == consts.WP_SKIN_ID.LIMING) {
            //星舰黎明反弹处理：反弹子弹标识与原始子弹相同
            if (clones) {
                return;
            }
            let costValue = -1;
            let cloneC = 0;
            if (bkData) {
                costValue = bkData.cost;
                if (bkData.clone > 0) {
                    bkData.clone--;
                } else {
                    this._delBkCost(srcWbk);
                    return;
                }
                cloneC = bkData.clone;
            }
            this._addBkCost(srcWbk, costValue, cloneC);
        } else if (srcSkin == consts.WP_SKIN_ID.PAOPAOTANG || srcSkin == consts.WP_SKIN_ID.JIAN20 || srcSkin == consts.WP_SKIN_ID.YUELIANGTU) {
            //泡泡膛、歼20、月亮兔 克隆个数检查
            let onceMax = 8;
            if (srcSkin == consts.WP_SKIN_ID.YUELIANGTU) {
                onceMax = 1;
            } else {
                if (!bkData) {
                    return '无原始子弹，疑似作弊=' + srcWbk;
                }
                onceMax = bkData.clone || 8;
            }
            if (!clones || clones.length > onceMax) {
                this._delBkCost(srcWbk);
                return;
            }
            for (let i = 0; i < clones.length; i++) {
                let wbk = clones[i];
                let bullet = this._cost.parseBulletKey(wbk);
                if (this._checkBullet(bullet) || bullet.skin != srcSkin || bullet.wpLv != srcBullet.wpLv) {
                    this._delBkCost(srcWbk);
                    return null;
                }
                this._addBkCost(wbk, -1, srcSkin == consts.WP_SKIN_ID.PAOPAOTANG);//克隆子弹特殊标记
            }
        } else if (clones.length === 1 && clones[0] == srcWbk) {
            this._addBkCost(clones[0], -1, false);
        } else {
            return '非克隆子弹发克隆消息，疑似作弊';
        }
    }

    _catch_fish_count(bks, ret){
    }

    /**
     * 碰撞鱼捕获率判定
     */
    c_catch_fish(data, cb) {

        let isReal = this.isRealPlayer();
        //校验子弹是否真的存在过 //子弹不存在，则无消耗，不能碰撞
        let bFishes = data.b_fishes;
        if (!bFishes || !bFishes.length) {
            utils.invokeCallback(cb, null);
            return {};
        }
        let cFishes = {};
        let bks = [];
        let costTotal = 0;
        let fireTotal = 0;
        let minWplv = Math.min(this._maxWpLv, this._sceneCfg.max_level);

        for (let i = 0; i < bFishes.length; ++i) {
            let bdata = bFishes[i];
            let bk = bdata.wp_bk;
            let bullet = this._cost.parseBulletKey(bk);
            if (this._checkBullet(bullet)) {
                this._delBkCost(bk);
                continue;
            }
            bks.push(bk);
            if (bk.indexOf('=') > 0) {
                //被鱼技能打死的鱼，不做此校验
                cFishes[bk] = {
                    fishes: bdata.fishes,
                    skill_ing: bdata.skill_ing,
                };
                continue;
            }

            let bkd = this._bkCost[bk];
            if (!bkd) {
                this._delBkCost(bk);//碰撞事件比开火事件先收到，视为无效碰撞，则下一次收到该开火事件时不处理
                delete bFishes[bk];
            } else {
                cFishes[bk] = {
                    fishes: bdata.fishes,
                    skill_ing: bdata.skill_ing,
                };
                let tp = bullet.wpLv / minWplv;
                if (tp >= 0.1) {
                    if (bkd.cost > 0) {
                        costTotal += bkd.cost;
                        fireTotal++;
                    }
                }
            }
        }

        let tData = this._cost.catchNot(cFishes, this._account, this.fishModel, isReal, this._maxWpLv);
        let ret = tData.ret;
        let gainGold = 0;
        let oldRrewardFishGold = this._account.bonus && this._account.bonus.gold_count || 0;
        let rewardFishNum = 0;
        let pirateData = null;
        let fireFlagGolds = {};
        let gotC = 0; //普通命中、激光命中、核弹命中条数
        let isDropSkill = false;
        let isDropItem = false;
        for (let fk in ret) {
            let rd = ret[fk];
            let gold = rd.gold;
            if (gold >= 0) {
                let fireFlag = rd.fireFlag;
                let srcFishId = rd.srcFishId;
                fireFlagGolds[fireFlag] = fireFlagGolds[fireFlag] || {
                    count: 0,
                    gold: 0,
                    score: 0,
                };
                let score = this.fishModel.getActorData(fk).goldVal;
                let fg = fireFlagGolds[fireFlag];
                if (fireFlag === consts.FIRE_FLAG.BOMB) {
                    fg.score += score;
                    if (fg.score < 100) {
                        fg.count++;
                        fg.gold += gold;
                    } else {
                        fg.score = 100;
                    }
                } else {
                    fg.score += score;
                    fg.count++;
                    fg.gold += gold;
                    if (fireFlag != consts.FIRE_FLAG.LIGHTING) {
                        gotC ++;
                    }
                }
                let temp = this._missionCoutWithFish(fk, gold, rd.skin);
                temp.rewardFishFlag === 1 && (rewardFishNum++);
                temp.pirateFlag > 0 && this._pirate && (pirateData = this._pirate.getProgress());
                temp.dropKeys.length > 0 && (rd.drops = temp.dropKeys, isDropItem = true);
                isDropSkill = temp.isDropSkill;
                srcFishId > 0 && (fg.fish_id = srcFishId);
            }
        }
        for (let fk in fireFlagGolds) {
            gainGold += fireFlagGolds[fk].gold;
        }
        let newRrewardFishGold = this._account.bonus && this._account.bonus.gold_count || 0;
        newRrewardFishGold -= oldRrewardFishGold;
        newRrewardFishGold = Math.max(newRrewardFishGold, 0);
        this._mission.updateProcess(RewardModel.TaskType.ONE_GET_GOLD, gainGold);//单次开炮获得金币x
        gotC > 0 && this._mission.updateProcess(RewardModel.TaskType.ONE_CATCH_FISH, gotC);//单次开炮捕获鱼x条
        for (let fk in fireFlagGolds) {
            let flag = parseInt(fk);
            if (flag === consts.FIRE_FLAG.LIGHTING || flag === consts.FIRE_FLAG.BOMB) {
                let fg = fireFlagGolds[fk];
                this._mission.updateProcess(RewardModel.TaskType.USE_FISH_CATCH_FISH, fg.count, fg.fish_id);//利用x鱼炸死y条其他鱼
            }
        }

        //打死已经被捕获的鱼，补偿其开炮金币
        let fireCostBack = tData.costGold;
        if (fireCostBack) {
            for (let bk in fireCostBack) {
                let fc = fireCostBack[bk];
                let bkd = this._bkCost[bk];
                if (bkd) {
                    if (bkd.cost > 0 && fc) {
                        gainGold += bkd.cost;
                    }
                    this._delBkCost(bk);
                }
            }
        }
        for (let i = 0; i < bks.length; i++) {
            this._delBkCost(bks[i]);
        }

        this._catch_fish_count(bks, ret);

        let sceneFlags = {
            '0': GAMECFG.common_log_const_cfg.GAME_FIGHTING, //普通命中
            '1': GAMECFG.common_log_const_cfg.FISH_LIGHTING, //鱼闪电技能命中
            '2': GAMECFG.common_log_const_cfg.FISH_BOMB, //鱼炸弹技能命中
            '3': GAMECFG.common_log_const_cfg.NUCLER_DROP, //被核弹打中
            '4': GAMECFG.common_log_const_cfg.NUCLER_LASER, //被激光打中
        };
        for (let fk in fireFlagGolds) {
            this._log.addGoldLog(sceneFlags[fk], fireFlagGolds[fk].gold, this._account.level, false);
        }
        costTotal && fireTotal && this._log.addGoldGot(gainGold, costTotal, fireTotal); //有消耗时才统计
        this._save({
            gold: gainGold,
            roipct_time: tData.roipct_time,
            pirateData: pirateData,
        });

        let res = {};
        if (rewardFishNum > 0) {
            res = {
                bonus: this._account.bonus,
                rewardFishGold: newRrewardFishGold,
                rewardFishNum: rewardFishNum,
            };
        }

        pirateData && (res.pirateData = pirateData);
        isDropSkill && (res.skill = this.getLeftSkill());
        isDropItem && (res.package = this.getLeftPackage());
        utils.invokeCallback(cb, null, res);

        //打死鱼才广播
        if (ret && Object.keys(ret).length > 0) {
            this.emit(fishCmd.push.catch_fish.route, {
                player: this,
                data: {
                    seatId: this.seatId,
                    catch_fishes: ret,
                    gold: this._account.gold,
                    pearl: this._account.pearl,
                },
            });
        }
    }

    /**
     * 技能消耗之后处理
     */
    _afterSkillCost(skillId, ret) {
        let saveData = {
            isRightNow: true,
        };
        ret.costSkillCount && this._changeSkill(skillId, -1);//消耗一个技能
        !ret.free && this._mission.updateProcess(RewardModel.TaskType.USE_SKILL, 1, skillId);//使用x技能y次，如果x为0则为任意技能
        
        let costVal = 0;
        ret.costPearl > 0 && (saveData.pearl = -ret.costPearl, costVal = ret.costPearl);
        ret.costGold > 0 && (saveData.gold = -ret.costGold, costVal = ret.costGold);

        if (saveData.pearl) {
            this._log.addDiamondLog(GAMECFG.common_log_const_cfg.SKILL_BUY, saveData.pearl, this.account.level);
            this._powerSkillCost = saveData.pearl;
        } else if (saveData.gold) {
            this._log.addGoldLog(GAMECFG.common_log_const_cfg.SKILL_BUY, saveData.gold, this.account.level, false);
            this._powerSkillCost = saveData.gold;
        }

        this._log.addSkillUsingLog(skillId, ret.skillC);
        this._save(saveData);
        this._writeNow(); 
        if (saveData.pearl) {
            logBuilder.addGoldAndItemLog([
                {
                    item_id: 'i002',
                    item_num: saveData.pearl,
                }
            ], this.account, GAMECFG.common_log_const_cfg.SKILL_BUY);
        }else if (!saveData.gold) {
            skillId != consts.SKILL_ID.SK_LASER && this._addSkillItemCostLog(skillId);
        }

        let common = {
            skill_id: skillId,
            skill_count: ret.skillC,
        };
        common.pearl = this._account.pearl;
        common.gold = this._account.gold;
        return common;
    }

    _check_nbombCost_enough(skillId, wp_level){
        if (this._cost.checkEnough(skillId, wp_level, this) > 0) {
            return {err:FishCode.INVALID_SKILL};
        }
        return {};
    }

    /**
     * 开始使用技能
     */
    c_use_skill(data, cb) {
        let skillId = data.skill;
        if (!this._skState) {
            this._skState = {};
        }
        if (!this._skState[skillId]) {
            this._skState[skillId] = {};
        }
        if (this._skState[skillId].ticker) {
            utils.invokeCallback(cb, FishCode.INVALID_SKILL_ING);
            return;
        }
        if (this._skState[skillId].flag) {
            utils.invokeCallback(cb, FishCode.INVALID_SKILL_STATE);
            return;
        }
        let curWpLv = this._curWeapon;
        if (data.wp_level != curWpLv) {
            return utils.invokeCallback(cb, null);
        }
        let sdata = {
            common: {
                skill_id: skillId,
            },
        };
        if (data.call) {
            let callFish = data.call.fish;
            const cfg = configReader.getValue('skill_skill_cfg', skillId);
            if (!callFish || !cfg || !cfg.summon_type || cfg.summon_type.indexOf(callFish) === -1) {
                return utils.invokeCallback(cb, null);
            }
            sdata.call_ready = data.call;
        }

        //核弹在确认发射时才扣钱
        if (skillId === consts.SKILL_ID.SK_NBOMB0 || skillId === consts.SKILL_ID.SK_NBOMB1 || skillId === consts.SKILL_ID.SK_NBOMB2) {
            let {err,resp} = this._check_nbombCost_enough(skillId, data.wp_level);
            if(err || resp){
                return utils.invokeCallback(cb, err, resp);
            }

            this._skState[skillId].flag = 0;
            utils.invokeCallback(cb, null, {
                skill_id: skillId,
            });

            this.emit(fishCmd.push.use_skill.route, {
                player: this,
                data: sdata
            });
            return;
        }

        let ret = this._cost.useSkill(skillId, data.wp_level, this);
        //开始持续时间定时器，结束时即技能结束
        if (skillId === consts.SKILL_ID.SK_FREEZ) {
            this._startSkillTicker(skillId);
        } else if (skillId === consts.SKILL_ID.SK_LASER && ret.notEnough === 3) {
            utils.invokeCallback(cb, FishCode.INVALID_WP_LASER);
            return;
        } else if (ret.notEnough > 0) {
            utils.invokeCallback(cb, FishCode.INVALID_SKILL);
            return;
        }

        this._skState[skillId].flag = 0;
        ret.costSkillCount = true;
        let common = this._afterSkillCost(skillId, ret);
        utils.invokeCallback(cb, null, common);

        this.emit(fishCmd.push.use_skill.route, {
            player: this,
            data: sdata
        });
    }

    /**
     * 锁定技能，锁定鱼
     */
    c_use_skill_lock_fish(data, cb) {
        let tfishKey = data.tfish;
        let fish = this.fishModel.getActorData(tfishKey);
        if (!fish) {
            utils.invokeCallback(cb, FishCode.LOCK_FAILD);
            return;
        }

        let skillId = consts.SKILL_ID.SK_AIM;
        this._startSkillTicker(skillId);
        if (!this._skState[skillId]) {
            utils.invokeCallback(cb, FishCode.INVALID_SKILL_STATE);
            return;
        }
        let flag = this._skState[skillId].flag;
        if (flag === undefined || flag === null || !this._skState[skillId].ticker) {
            utils.invokeCallback(cb, FishCode.INVALID_SKILL_STATE);
            return;
        }
        this._skState[skillId].flag = 1;

        utils.invokeCallback(cb, null);
        this.emit(fishCmd.push.use_skill.route, {
            player: this,
            data: {
                skill_lock: tfishKey,
                skill_id: skillId,
            }
        });
    }

    /**
     * 召唤技能,召唤鱼
     */
    c_use_skill_call_fish(data, cb) {
        let skillId = consts.SKILL_ID.SK_CALL;
        if (!this._skState[skillId] || this._skState[skillId].flag !== 0 || this._skState[skillId].ticker) {
            utils.invokeCallback(cb, FishCode.INVALID_SKILL_STATE);
            return;
        }
        this._skState[skillId].flag = 1;
        this._startSkillTicker(skillId);

        let fishKey = data.tfish;
        let fishPath = data.path;
        let call = {
            fish_key: fishKey,
            fish_path: fishPath,
        };
        utils.invokeCallback(cb, null);

        this.emit(fishCmd.push.use_skill.route, {
            player: this,
            data: {
                skill_call: call,
                skill_id: skillId,
            }
        });
    }

    _isNbomb(skillId) {
        return skillId === consts.SKILL_ID.SK_NBOMB0 || skillId === consts.SKILL_ID.SK_NBOMB1 || skillId === consts.SKILL_ID.SK_NBOMB2;
    }

    // 扣除核弹消耗
    _deduct_nbombCost(data){
        let ret = null;
        let skillId = data.skill;
        if (data.invite && this._checkInviteRewardNbomb(skillId)) {
            ret = this._cost.useSkill(skillId, data.wp_level, this, true);//因邀请成功而免费释放核弹
	        ret.free = true;
        } else {
            ret = this._cost.useSkill(skillId, data.wp_level, this);
	        ret.costSkillCount = true;
        }
        return ret;
    }

    /**
     * 激光或核弹确定打击位置
     */
    c_use_skill_sure(data, cb) {
        let skillId = data.skill;
        if (!this._skState[skillId] || this._skState[skillId].flag !== 0 || this._skState[skillId].ticker) {
            utils.invokeCallback(cb, FishCode.INVALID_SKILL_STATE);
            return;
        }
        let skillPower = null;
        if (skillId === consts.SKILL_ID.SK_LASER || this._isNbomb(skillId)) {
            let wpBk = data.wp_bk;
            let bullet = this._cost.parseBulletKey(wpBk);
            if (this._checkBullet(bullet, true)) {
                this._delBkCost(wpBk);
                return utils.invokeCallback(cb, null);
            }
            let curWpLv = bullet.wpLv;
            this._addBkCost(wpBk, this._powerSkillCost, true);//技能使用时，特殊标记
            this._powerSkillCost = 0;

            let firePoint = data.fire_point;
            skillPower = firePoint;
            this._skState[skillId].flag = 1;
            this._startSkillTicker(skillId);
            if (skillId === consts.SKILL_ID.SK_LASER) {
                let reset = 0;
                this._curEnergy[curWpLv] = reset;
                utils.invokeCallback(cb, null, {
                    wp_level: curWpLv,
                    laser: reset,
                });
                this._writeNow(); //激光使用后，及时将内存数据写入redis
            } else {
                //核弹需要在确认发射时才扣钱
                let ret = this._deduct_nbombCost(data);
                if (!ret || ret.notEnough > 0) {
                    logger.error('000非法12')
                    utils.invokeCallback(cb, FishCode.INVALID_SKILL);
                    return;
                }
                let common = this._afterSkillCost(skillId, ret);
                utils.invokeCallback(cb, null, common);
            }
            this.emit(fishCmd.push.use_skill.route, {
                player: this,
                data: {
                    skill_power: skillPower,
                    skill_id: skillId,
                    wp_bk: wpBk,
                }
            });
        } else {
            utils.invokeCallback(cb, FishCode.INVALID_SKILL);
            return;
        }
    }

    /**
     * 因为邀请成功而免费释放青铜核弹
     * @param {*} skillId
     */
    _checkInviteRewardNbomb(skillId) {
        if (skillId === consts.SKILL_ID.SK_NBOMB0) {
            let sdReward = this._account.social_daily_invite_reward;
            let freeBomb = this._account.free_bomb;
            if (sdReward && sdReward.length >= 2 && freeBomb != 2) {
                this._account.free_bomb = 2;
                return true;
            }
        }
        return false;
    }

    /**
     * 战斗行为通知
     * 注意，只是变更通知，并不需持久化
     */
    c_fighting_notify(data, cb) {
        let event = data.event;
        let evtData = data.event_data;
        let ret = null;
        switch (event) {
            case consts.FIGHTING_NOTIFY.MINI_GAME: {
                let mini = evtData.mini;
                if (!this._miniGame || !mini) {
                    return utils.invokeCallback(cb, FishCode.MINIGAME_INVALID);
                }
                let mtype = mini.type;
                if (this._miniGame.type != mtype) {
                    return utils.invokeCallback(cb, FishCode.MINIGAME_TYPE_INVALID);
                }
                let mgold = mini.gold;
                let mscore = mini.score;
                if (mgold > 0 && this._miniGame.startTimestamp) {
                    let dt = this._miniGame.cd * 1000;
                    let now = new Date().getTime();
                    now -= this._miniGame.startTimestamp;
                    mgold = Math.min(mgold, this._miniGame.maxscore);
                    if (now >= dt && this.isRealPlayer()) {
                        this._mission.updateProcess(RewardModel.TaskType.PLAY_LITTLE_GAME, mscore, mtype);
                        this._log.addGoldLog(GAMECFG.common_log_const_cfg.MINI_GAME, mgold, this._account.level);
                        this._save({
                            gold: mgold,
                            isRightNow: true,
                        });
                        ret = {
                            gold: mgold,
                            totalGold: this._account.gold,
                        };
                        mini.totalGold = ret.totalGold;
                    } else {
                        logger.error('小游戏持续时间小于配置时间，无法结算 uid = ', this.uid);
                    }
                    this._miniGame = null;
                } else {
                    return utils.invokeCallback(cb, FishCode.MINIGAME_INVALID);
                }
            }
                break;
        }
        utils.invokeCallback(cb, null, ret);
        this.emit(fishCmd.push.fighting_notify.route, {
            player: this,
            data: {
                seatId: this.seatId,
                event: event,
                event_data: evtData,
            }
        });
    }

    /**
     * 查询海盗任务
     */
    c_query_pirate(data, cb) {
        let pirate = this._generatePirate();
        let pirateData = pirate && pirate.getProgress() || null;
        utils.invokeCallback(cb, null, {
            pirateData: pirateData
        });
    }

    /**
     * 领取海盗任务奖励
     */
    c_pirate_reward(data, cb) {
        let taskId = data.task_id;
        let pirate = this._pirate;
        if (pirate) {
            let progress = pirate.getProgress();
            if (progress && progress.pirate_task_id === taskId && pirate.isFinished()) {
                let cfg = configReader.getValue('daily_pirate_cfg', taskId);
                let ret = dropManager.try2Drop(this._account, cfg.reward, 1, GAMECFG.common_log_const_cfg.PIRATE_GAIN);
                this._checkMiniGame(ret.logItems);
                pirate.reset();
                this._save({
                    pirateData: -1,
                });
                this._pirate = null;
                return utils.invokeCallback(cb, null, {
                    gold: this._account.gold,
                    pearl: this._account.pearl,
                    package: this.getLeftPackage(),
                    skill: this.getLeftSkill(),
                    dpks: ret.dpks
                });
            }
        }
        utils.invokeCallback(cb, FishCode.PIRATE_NOT_DONE);
    }

    /**
     * 战斗内聊天
     */
    c_room_chat(data, cb) {
        this.emit(fishCmd.push.fighting_notify.route, {
            player: this,
            data: {
                seatId: data.seatId,
                type: data.type,
                idx: data.idx,
                data: data,
            }
        });
        utils.invokeCallback(cb, null, {
            state: 0,
        });
    }

    //TODO弹幕：检查玩家聊天时间间隔
    c_world_barrage(data, cb) {
        //this._globalBroadcast('s_barrage', data.msg, constDef.WORLD_CHANNEL_NAME.BARRAGE);
    }

    /**
     * 破产领取
     */
    c_broke_reward(data, cb) {
        let cfg = configReader.getValue('vip_vip_cfg', this._account.vip);
        //校验金币是否为破产状态
        if (!cfg || this._account.gold > 0) {
            return utils.invokeCallback(cb, FishCode.BROKE_INVALID);
        }

        //校验破产次数
        if (this._account.broke_times >= cfg.vip_alms_times) {
            return utils.invokeCallback(cb, FishCode.BROKE_OVER_TODAY);
        }

        //发放破产基金、返回破产剩余次数
        let bTimes = this._account.broke_times + 1;
        let brokeGold = cfg.vip_alms_value - this._account.gold; //注意，gold可能未负数，所以领取破产后务必保证当前金币为配置金币
        this._save({
            gold: brokeGold,
            broke_times: bTimes,
            isRightNow: true,
        });
        utils.invokeCallback(cb, null, {
            gold: brokeGold,
            broke_times: bTimes,
        });
        this._log.addGoldLog(GAMECFG.common_log_const_cfg.BROKE_GAIN, brokeGold, this._account.level);
    }

    _turn_new_weapon_level(up){
        let wbks = this._wbks;
        let pos = -1;
        for (let i = 0; i < wbks.length; i++) {
            if (this._curWeapon == wbks[i]) {
                pos = i;
                break;
            }
        }
        if (pos === -1) {
            logger.error('this._curWeapon = ', this._curWeapon);
            return {err:ERROR_OBJ.WEAPON_LEVEL_INVALID};
        }
        if (up === 1) {
            pos++;
        } else {
            pos--;
        }
        let allowMaxWp = Math.min(this._sceneCfg.max_level, this._maxWpLv);
        let newWp = Number(wbks[pos]);
        if (!newWp) {
            if (pos < 0) {
                newWp = allowMaxWp;
            } else if (pos >= wbks.length) {
                newWp = this._sceneCfg.min_level;
            }
        } else {
            if (newWp > allowMaxWp) {
                newWp = this._sceneCfg.min_level;
            } else if (newWp < this._sceneCfg.min_level) {
                newWp = allowMaxWp;
            }
        }
        return {newWp:newWp};
    }

    _notify_weapon_level(newWp){
        this.emit(fishCmd.push.turn_weapon.route, {
            player: this,
            data: {
                seatId: this.seatId,
                wp_level: newWp
            }
        });
    }
    /**
     * 切换武器倍率
     */
    c_turn_weapon(data, cb) {
        let {err, newWp} = this._turn_new_weapon_level(data.up);
        if(err){
            return utils.invokeCallback(cb, err);
        }

        this._curWeapon = newWp;
        utils.invokeCallback(cb, null, {
            wp_level: newWp,
        });

        this._notify_weapon_level(newWp);
    }

    /**
     * 清除技能持续时间定时器
     */
    clearSkillTickers() {
        if (this._skState) {
            for (let skillId in this._skState) {
                this._clearSkillTicker(skillId);
            }
            this._skState = null;
        }
    }

    /**
     * 开启指定技能定时器
     */
    _startSkillTicker(skillId) {
        const cfg = configReader.getValue('skill_skill_cfg', skillId);
        let duration = cfg.skill_duration;
        let isReal = this.isRealPlayer();
        let id = this._account.id;
        if (duration > 0 && this._skState[skillId] && !this._skState[skillId].ticker) {
            let self = this;
            this._skState[skillId].ticker = setTimeout(function () {
                let skId = this;
                self._clearSkillTicker(skId);
                //广播某玩家某技能结束 
                self.emit(fishCmd.push.use_skill_end.route, {
                    player: self,
                    data: {
                        seatId: self.seatId,
                        skill: skId,
                    }
                });
            }.bind(skillId), duration * 1000);
        }
    }

    /**
     * 关闭指定技能定时器
     */
    _clearSkillTicker(skillId) {
        if (!this._skState) return;
        let ts = this._skState[skillId];
        if (!ts) return;
        ts.ticker && clearTimeout(ts.ticker);
        ts.ticker = null;
        ts.flag = null;
    }

    _weapon_skin_change(wpSkin){
    }

    _getWpMaxLv(){
        return this._cost.getWpLevelMax(this._curEnergy);
    }

    /**
     * 重置内存数据
     * 注意：重置的武器倍率不能超过当前场景允许的最大等级
     */
    _reset(isUpgraded) {
        let account = this._account;
        let wpSkin = account.weapon_skin.equip;
        let wpLevel = account.weapon;
        let wpEnergy = account.weapon_energy;
        this._curEnergy = this._curEnergy || {};
        if (wpEnergy) {
            for (let k in wpEnergy) {
                if (this._curEnergy[k] == undefined || this._curEnergy[k] == null) {
                    this._curEnergy[k] = wpEnergy[k];
                }
            }
            //todo:兼容处理，部分玩家因bug没有1和5级能量
            if (!this._curEnergy[1] && (wpEnergy[1] == undefined || wpEnergy[1] == null)) {
                this._curEnergy[1] = 0;
            }
            if (!this._curEnergy[5] && (wpEnergy[5] == undefined || wpEnergy[5] == null)) {
                this._curEnergy[5] = 3000;
            }
        }
        this._maxWpLv = this._getWpMaxLv();
        if (!this._curEnergy[wpLevel]) {
            wpLevel = this._maxWpLv;
        } else {
            wpLevel = Math.max(this._maxWpLv, wpLevel);
        }
        if (isUpgraded) {
            this._curWeapon = Math.min(this._sceneCfg.max_level, wpLevel);
        }
        //logger.error('this._curWeapon = ', this._curWeapon, ' account.weapon = ', account.weapon, ' wse = ', account.weapon_energy)
        if (this._curSkin != wpSkin) {
            this._curSkin = wpSkin;
            this._weapon_skin_change(wpSkin);
        }
        let SKIN_CFG = configReader.getValue('newweapon_weapons_cfg', this._curSkin);
        let offset = FIRE_DELAY + Math.floor(Math.random() * 50);
        this._skinDt = (SKIN_CFG.interval || 0.2) * 1000 - offset;

        this._makePirateFieldValid();
    }

    getSkinStar(skin) {
        skin = skin || this._curSkin;
        let star = 0;
        if (this._account.weapon_skin.star) {
            star = this._account.weapon_skin.star[skin] || 0;
        }
        return star;
    }

    /**
     * 机器人开火
     */
    robotFire() {
    }

    /**
     * 是否是真人
     */
    isRealPlayer() {
        return true;
    }

    /**
     * 将更新后的数据及时持久化
     * 注意：
     * 1、房间内不能直接改变武器等级和皮肤并持久化，因为武器升级和切换皮肤在数据服操作，且实际武器等级可能超过了当前房间所允许的区间
     * 2、data所含字段必须是account含有字段，反之不会持久化
     */
    _save(data) {
        if (this.isRealPlayer() && data && Object.keys(data).length > 0) {
            data.hasOwnProperty('gold') && (this._account.gold = data.gold);
            data.hasOwnProperty('heartbeat') && (this._account.heartbeat = data.heartbeat);
            data.hasOwnProperty('heartbeat_min_cost') && (this._account.heartbeat_min_cost = data.heartbeat_min_cost);
            data.hasOwnProperty('roipct_time') && (this._account.roipct_time = data.roipct_time);
            data.hasOwnProperty('pearl') && (this._account.pearl = data.pearl);
            data.hasOwnProperty('exp') && (this._account.exp = data.exp);
            data.hasOwnProperty('level') && (this._account.level = data.level);
            data.hasOwnProperty('broke_times') && (this._account.broke_times = data.broke_times);
            this._account.comeback && data.hasOwnProperty('comeback_hitrate') && (this._account.comeback.hitrate = data.comeback_hitrate, this._account.comeback = this._account.comeback);
            this._mission.commit();

            if (data.hasOwnProperty('pirateData') && data.pirateData) {
                let td = this._account.pirate;
                let tp = data.pirateData;
                if (tp === -1) {
                    delete this._account.pirate[this._sceneCfg.name];
                    td = this._account.pirate;
                } else {
                    td[this._sceneCfg.name] = tp;
                }
                this._account.pirate = td;
            }

            //减缓及时存入，两次操作间隔大于某值时写入
            let now = new Date().getTime();
            if (this._writeRedisTimestamp) {
                let passed = now - this._writeRedisTimestamp;
                if (data.isRightNow || passed >= REDIS_DT) {
                    this.save();
                    this._writeRedisTimestamp = now;
                    this._updateRankWithBP();
                }
            }
        }
    }

    /**
     * 退出房间之前，立即写入尚未写入的日志
     * 注意：只保存战斗内修改的字段
     */
    clear() {
        this._tellOthersMiniTimeout();
        this.clearSkillTickers();
        this.removeAllListeners();

        omelo.app.entry.instance.playerEventEmitter.removeAllListeners(this.uid);
        this._writeNow();
    }

    /**
     * 及时将内存数据写入redis
     */
    _writeNow() {
        this._log.logAll();

        let tt = this._account.weapon_energy;
        for (let k in this._curEnergy) {
            tt[k] = Math.ceil(this._curEnergy[k]);
        }
        this._account.weapon_energy = tt;

        //注意背包和技能记录的是增量
        this._account.package = this.getLeftPackage();
        this._account.skill = this.getLeftSkill();
        this._curPackage = {}; //注意清空增量，下同
        this._curSkill = {};

        this.save();
        this._updateRankWithBP();
        // logger.error('及时写入内存数据，并清空增量')
    }

    getWeaponEnergy(wpLevel) {
        return this._curEnergy[wpLevel] || 0;
    }

    /**
     * 当前剩余背包物品
     */
    getLeftPackage() {
        let tps = ObjUtil.clone(this._account.package);
        let cps = this._curPackage;
        for (let type in cps) {
            let cp = cps[type];
            let ps = tps[type];
            if (!ps) {
                tps[type] = cp;
            } else {
                for (let k in cp) {
                    ps[k] = ps[k] || 0;
                    ps[k] += cp[k];
                }
            }
        }
        return tps;
    }

    /**
     * 技能变化
     * @param {*} skillId
     * @param {*} itemNum， 变化数量，>0 获得，<0消耗
     */
    _changeSkill(skillId, itemNum) {
        this._curSkill = this._curSkill || {};
        this._curSkill[skillId] = this._curSkill[skillId] || 0;
        this._curSkill[skillId] += itemNum;

        //logger.error('this._curSkill = ', this._curSkill, ' skillId = ', skillId, ' itemNum = ', itemNum)
    }

    /**
     * 当前剩余技能
     */
    getLeftSkill() {
        let temp = ObjUtil.clone(this._account.skill);
        let csk = this._curSkill;
        // logger.error('left csk = ', csk)
        for (let id in csk) {
            temp[id] = temp[id] || 0;
            temp[id] += csk[id];
            temp[id] = Math.max(0, temp[id]);
        }
        //logger.error('left skill = ', temp)
        return temp;
    }

    //海盗任务统计
    _pirate_mission(data, fishID){
        if (this._pirate) {
            let fishName = this.fishModel.getFishName(fishID);
            fishName && (data.pirateFlag = this._pirate.countFish(fishName));
        }
    }

    /**
     * 捕获鱼相关任务统计
     */
    _missionCoutWithFish(fk, gold, skin) {
        let temp = fk.split('#');
        let fishID = temp[0];
        let cfg = fishID && this.fishModel.getFishCfgWithID(fishID) || null;
        let data = {
            isDropSkill: false,
        };
        if (cfg) {
            let star = this.getSkinStar(skin);
            let wpStarCfg = configReader.getWeaponStarData(skin, star);

            //奖金鱼统计
            if (cfg.display_type === 4) {
                let bonus = this._account.bonus;
                if (!bonus.fish_count) {
                    bonus.fish_count = 0;
                }
                bonus.fish_count += 1;
                if (!bonus.gold_count) {
                    bonus.gold_count = 0;
                }
                let reward = this._cost.calGoldenFishReward(gold, skin, star, wpStarCfg);
                bonus.gold_count += reward;
                this._account.bonus = bonus;
                data.rewardFishFlag = 1;
            } else if (cfg.display_type === 3) {
                this._broadcastWithKillingBoss(cfg.name, gold);
            }

            //海盗任务统计
            this._pirate_mission(data, fishID);

            //捕鱼积分统计,注意星级加成
            let fishingScore = gold;
            wpStarCfg && (fishingScore *= (1 + (wpStarCfg.fishing || 0)));
            this._countBp(fishingScore);

            //日常、成就统计
            this._mission.updateProcess(RewardModel.TaskType.CATCH_FISH, 1, cfg.fish_id); //打死指定鱼1条

            //掉落检查
            let ret = dropManager.try2Drop(this._account, cfg.drop_pack_id, 1, GAMECFG.common_log_const_cfg.GAME_FIGHTING);
            data.dropKeys = ret.dpks;
            let dropLogItems = ret.logItems;
            this._checkMiniGame(dropLogItems);

            //掉落中是否有技能,有则视为战斗内获得技能
            const ITEM_ITEM = GAMECFG.item_item_cfg;
            for (let i = 0; i < dropLogItems.length; i++) {
                let drop = dropLogItems[i];
                if (!drop) continue;
                let cfg = ITEM_ITEM[drop.item_id];
                if (cfg && cfg.type === 3 && drop.item_num > 0) {
                    //logger.error('通过掉落获得技能')
                    data.isDropSkill = true;
                }
            }

        }
        return data;
    }

    /**
     * 返回玩家重连时需要继续的关键数据
     */
    getContinueData() {
        let data = {};
        let mBIdx = this._lastFireIdx;
        mBIdx > 0 && (data.mBIdx = mBIdx);
        return data;
    }

    /**
     * 其他消耗:
     * 购买皮肤、购买月卡、购买VIP礼包、购买道具（提现功能内非实物类购买）、购买钻石、购买技能等各种其他非赌博消耗
     * 即未参于奖池和抽水
     */
    addCostOther(costVal) {
    }

    /**
     * 个人捕获率修正过期检查
     */
    checkPersonalGpctOut() {
    }

    /**
     * 初始化海盗任务
     */
    _generatePirate() {
        if (!this.isRealPlayer()) {
            return null;
        }
        if (this._account.pirate && this._sceneCfg && !this._pirate) {
            let now = new Date().getTime();
            if (this._pirateTimestamp && now - this._pirateTimestamp < this._sceneCfg.pirate_time * 1000) {
                return null;
            }
            let name = this._sceneCfg.name;
            this._pirate = new Pirate(this._account.pirate[name], this._sceneCfg.pirate_id);
            this._pirateTimestamp = now;
        }
        return this._pirate;
    }

    /**
     * 海盗任务字段合法化
     */
    _makePirateFieldValid() {
        if (this._account.pirate && typeof (this._account.pirate) === 'string') {
            this._account.pirate = JSON.parse(this._account.pirate);
        }
    }

    /**
     * 统计捕鱼积分
     */
    _countBp(gold) {
        this._account.bp += gold;
    }

    /**
     * 捕鱼积分送入排行榜
     */
    _updateRankWithBP() {
        const BP = "rank:bp"; //捕鱼积分排行榜
        let redis = redisConnector.cmd;
        let platform = this._account.platform;
        let score = this._account.bp;
        let member = this._account.id;
        if (this._account.privacy == 1 && this._account.test >= 0) {
            redis.zadd(BP + ":" + platform, score, member);
            redis.hset(BP + ":timestamp", member, new Date().getTime());
        }
    }

    /**
     * 角色等级升级
     */
    _checkLevelUp(saveData, gainExp) {
        let oldLv = saveData.level;
        let result = this._cost.reset_exp_level(oldLv, saveData.exp, gainExp);
        if (!result.full) {
            if (result.level > oldLv) {
                saveData.level = result.level; //升级了，数据服负责发放升级奖励
                this._mission.updateProcess(RewardModel.TaskType.UPDATE_USER_LV, saveData.level);////角色等级x级

                //发奖
                let plvCfg = configReader.getValue('player_level_cfg', saveData.level);
                if (plvCfg) {
                    let reward = plvCfg.reward_package;
                    for (let i = 0; i < reward.length; i++) {
                        let temp = reward[i];
                        if (temp.length === 2) {
                            let itemKey = temp[0];
                            let itemNum = temp[1];
                            this._add2Package(itemKey, itemNum, saveData);
                        }
                    }
                    this._writeNow(); //升级房间之后及时写入redis，方便玩家升级武器时所需道具前后端同步
                }
            }
            saveData.exp = result.exp; //注意经验是增量
        }
    }

    _add2Package(itemKey, itemNum, saveData) {
        let itemCfg = configReader.getValue('item_item_cfg', itemKey);
        if (itemCfg && itemNum > 0) {
            let type = itemCfg.type;
            if (type == 1) {
                saveData.gold = saveData.gold || 0;
                saveData.gold += itemNum;
            } else if (type == 2) {
                saveData.pearl = saveData.pearl || 0;
                saveData.pearl += itemNum;
            } else if (type == 3) {
                this._changeSkill(itemCfg.id, itemNum);//获得技能
                saveData.skill = true;
            } else {
                let pack = this._curPackage;
                if (!pack[type]) {
                    pack[type] = {};
                }
                if (!pack[type][itemKey]) {
                    pack[type][itemKey] = 0;
                }
                pack[type][itemKey] += itemNum;
                this._curPackage = pack;
                saveData.package = true;
            }
            saveData.isRightNow = true;
        }
    }

    /**
     * 增加技能道具消耗日志
     * @param {*技能id} skillId
     * @param {*场景标记} scene
     */
    _addSkillItemCostLog(skillId) {
        const cfg = configReader.getValue('skill_skill_cfg', skillId);
        logBuilder.addGoldAndItemLog([
            {
                item_id: cfg.item_id,
                item_num: -1,
            }
        ], this._account, GAMECFG.common_log_const_cfg.GAME_FIGHTING);
    }

    /**
     * 根据掉落物品确定是否有小游戏触发
     * @param {*} dIts
     */
    _checkMiniGame(dIts) {
        if (dIts && dIts.length > 0) {
            for (let i = 0; i < dIts.length; i++) {
                let itemId = dIts[i].item_id;
                if (itemId === 'i110' || itemId === 'i111') {
                    this._startMiniWithDrop(itemId === 'i110' ? consts.MINI_TYPE.COIN_CATCHING : consts.MINI_TYPE.CRAZY_FUGU);
                    break;
                }
            }
        }
    }

    /**
     * 从掉落开始一个小游戏,广播给其他人
     * @param {*} miniType
     */
    _startMiniWithDrop(miniType) {
        let cfg = null;
        if (miniType === consts.MINI_TYPE.COIN_CATCHING) {
            cfg = configReader.getValue('new_mini_game_coincatch_cfg', 1001);
        } else if (miniType === consts.MINI_TYPE.CRAZY_FUGU) {
            cfg = configReader.getValue('new_mini_game_crazyfugu_cfg', 1001);
        } else {
            return logger.error('uid =', this.uid, FishCode.MINIGAME_TYPE_INVALID.code, FishCode.MINIGAME_TYPE_INVALID.desc);
        }
        if (this._miniGame) {
            let now = new Date().getTime();
            now -= this._miniGame.startTimestamp;
            if (now < this._miniGame.cd * 1000) {
                logger.error('不科学，小游戏掉落太频繁了，上一次小游戏尚未结束！');
            }
            return;
        }
        let maxscore = 0;
        if (cfg.maxscore instanceof Array) {
            if (this._sceneIdx < 1 || isNaN(this._sceneIdx)) {
                maxscore = cfg.maxscore[cfg.maxscore.length - 1];
            } else {
                maxscore = cfg.maxscore[this._sceneIdx - 1];
            }
        } else {
            maxscore = cfg.maxscore;
            logger.error('小游戏配置有误，字段maxscore应该为数组');
        }
        this._miniGame = {
            type: miniType,
            startTimestamp: new Date().getTime(),//记下开始时间戳
            timeoutDt: cfg.cd * 2, //默认两倍持续时间为超时时间
            maxscore: maxscore,
            cd: cfg.cd,
        };
        this.emit(fishCmd.push.fighting_notify.route, {
            player: this,
            data: {
                seatId: this.seatId,
                event: consts.FIGHTING_NOTIFY.MINI_GAME,
                event_data: {
                    mini: {
                        type: miniType,
                        gold: 0,
                    }
                },
            }
        });
    }

    /**
     * 小游戏超时广播其他人
     */
    _tellOthersMiniTimeout() {
        if (!this._miniGame) return;
        this.emit(fishCmd.push.fighting_notify.route, {
            player: this,
            data: {
                seatId: this.seatId,
                event: consts.FIGHTING_NOTIFY.MINI_GAME,
                event_data: {
                    mini: {
                        type: 99,  //超时标记
                        gold: 0,
                        totalGold: this._account.gold
                    }
                },
            }
        });
    }

    /**
     * 打死boss公告
     */
    _broadcastWithKillingBoss(bossNameKey, reward) {
        let fishname = tools.CfgUtil.string.get(bossNameKey, 'no name');
        let params = [this._account.nickname, fishname, reward];
        let content = {
            type: GameEventBroadcast.TYPE.GAME_EVENT.BOSS_KILL,
            params: params,
        };
        let account = this._account;
        new GameEventBroadcast(content).extra(account).add();
    }
}

module.exports = FishPlayer;