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
const import_def = require('../../../database/consts');
const ACCOUNTKEY = import_def.ACCOUNTKEY;
const REDISKEY = import_def.REDISKEY;
const playerEvent = require('../../../cache/playerEvent');
const gamePlay = require('../gamePlay/gamePlay');
const Pirate = require('./pirate');
const RmatchHelper = require('./rmatchHelper');
const RewardModel = require('../../../utils/account/RewardModel');
const FishingLog = require('./fishingLog');
const dropManager = require('../../../utils/DropManager');
const tools = require('../../../utils/tools');
const GameEventBroadcast = require('../../../common/broadcast/GameEventBroadcast');
const rpcSender = require('../../../net/rpcSender');
const globalStatusData = require('../../../utils/globalStatusData');
const constDef = require('../../../consts/constDef');

const FIRE_DELAY = 50; //开炮事件服务端与客户端的延时,单位毫秒
const LOG_DT = 30000; //金币钻石日志写入周期，即每隔指定时间插入一条
const REDIS_DT = 1000; //redis及时存入周期
const CHEAT_MAX = 3;

const DEBUG = 0;
let log = null;
if (DEBUG === 1) {
    log = logger.error;
} else if (DEBUG === 2) {
    log = logger.info;
}

class FishPlayer extends Player {
    constructor(opts) {
        super(opts);
        this.cost = gamePlay.cost;
        this.account = opts.account || {};
        this._roomId = null;
        this._connectState = CONSTS.constDef.PALYER_STATE.ONLINE;
        this._skinDt = 200;
        this._resetDIY();
        this._sword = 0; //玩家战力（）
        this._skState = {}; //0准备 1进行中 2结束
        this._sceneCfg = null;
        this._fishModel = null;
        this._seatId = -1; //座位号，从0开始
        this._gameInfo = {
            gameMode: null,
            sceneId: null
        };

        this._lastFireFish = null;
        this._bkCost = {};
        this._fireTimestamp = 0;
        this._lastFireIdx = 0;
        this._pirate = null;
        this._pirateTimestamp = null;

        this.initFishingLoger();

        this._writeRedisTimestamp = new Date().getTime();
        this._wait2WriteRedis = false;
        this._cheat = {
            count: 0,
            msg: ''
        };
        this._rmHelper = null;
        this._isForbided = this.account.test < 0;
        this._mission = new RewardModel(this.account);

        playerEvent.on(this.uid, this._playerChangeEvt.bind(this));

        let cfg = GAMECFG.newweapon_upgrade_cfg;
        let wbks = Object.keys(cfg);
        wbks.sort(function (a, b) {
            return Number(a) > Number(b) ? 1 : -1;
        });
        this._wbks = wbks;
    }

    initFishingLoger() {
        this._log = new FishingLog(this.account);
    }

    _playerChangeEvt(key, value) {
        this.account[key] = value;
    }

    set roomId(value) {
        this._roomId = value;
    }

    get roomId() {
        return this._roomId;
    }

    set connectState(value) {
        this._connectState = value;
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
     * 设置场景配置
     * @param value
     */
    set sceneCfg(value) {
        this._sceneCfg = {
            max_level: value.max_level,
            min_level: value.min_level,
            name: value.name,
            pirate_time: value.pirate_time,
            pirate_id: value.pirate_id,
        };
        let allowMaxWp = Math.min(value.max_level, this._maxWpLv);
        this._change2Weapon(allowMaxWp);//进入房间后，默认该场景允许且已解锁的最大等级
    }

    set fishModel(value) {
        this._fishModel = value;
    }

    get fishModel() {
        return this._fishModel;
    }

    setDIY(key, value) {
        if (this._DIY[key]) {
            this._DIY[key] = value;
        }
    }

    get DIY() {
        return this._DIY;
    }

    get seatId() {
        return this._seatId;
    }

    set seatId(id) {
        this._seatId = id;
        logger.info('seatId changed = ', id);
    }

    set gameInfo(info) {
        this._gameInfo = info;
    }

    get gameInfo() {
        return this._gameInfo;
    }

    set account(value) {
        this._account = value;
        //注意：玩家金币、钻石可能未负数，故进入战斗或重新拉取玩家数据时，及时处理内存数据并及时写入redis
        let isOk = false;
        if (this.account.gold < 0) {
            this.account.gold = -this.account.gold;
            isOk = true;
        }
        if (this.account.pearl < 0) {
            this.account.pearl = -this.account.pearl;
            isOk = true;
        }
        isOk && this.save();
    }

    get account() {
        return this._account;
    }

    save() {
        this.account.commit();
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
        return baseField;
    }

    getBaseField() {
        return FishPlayer.sBaseField();
    }


    syncData() {
        // logger.info('收到来自数据服的同步通知 ');
        this.account.commit(function () {
            this._regetField();
        }.bind(this));
    }

    _regetField() {
        let tfs = this.getBaseField();
        redisAccountSync.getAccount(this.uid, tfs, function (err, account) {
            if (err) {
                logger.error('err = ', err, ' code = ', CONSTS.SYS_CODE.DB_INNER_ERROR.code);
                return;
            }
            if (!account) {
                logger.error('err = ', err, ' code = ', CONSTS.SYS_CODE.PLAYER_NOT_EXIST.code);
                return;
            }

            this.account = account;
            this._log && this._log.logAll(this.account);
            this._mission && this._mission.resetLoginData(this.account);
            this._resetDIY();

            this.emit(fishCmd.push.player_notify.route, {
                player: this,
                data: {
                    seatId: this.seatId,
                    gold: this.account.gold,
                    pearl: this.account.pearl,
                    wp_level: this.DIY.weapon,
                    wp_skin: this.DIY.weapon_skin,
                    wp_star: this.getSkinStar()
                }
            });
        }.bind(this));
    }

    /**
     * 检查武器皮肤
     */
    _checkBulletSkin(skin) {
        let mySKins = this.account.weapon_skin;
        if (!mySKins || !mySKins.own || mySKins.own.indexOf(parseInt(skin)) === -1) {
            this._cheatOnce('没有这个皮肤 skin = ' + skin);
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
        let wpEng = this.DIY.weapon_energy;
        if (wpEng && (wpEng[wpLv] >= 0 || wpLv === 1) && wpLv >= this._sceneCfg.min_level && wpLv <= this._sceneCfg.max_level) {
            return true;
        }
        this._cheatOnce('当前场景没有这个等级 wpLv = ' + wpLv);
        logger.error('wpLv = ', wpLv, wpEng);
        return false;
    }

    /**
     * 封号
     */
    forbidAccount(cheatCode) {
        cheatCode = cheatCode || -1;
        this.account.test = cheatCode;
        this.account.token = 1;
        this.save();

        let timeNow = new Date().getTime();
        redisConnector.cmd.hset(REDISKEY.CHEAT_FORBID_TIME, this.account.id, timeNow);
        this._isForbided = true;
        logger.error('作弊封号，终止操作：', this.account.id);
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

    getCheatingData() {
        return null;//this._isForbided || (this._cheat.count >= CHEAT_MAX ? this._cheat : 0);
    }

    /**
     * 检查子弹的合法性
     */
    _checkBullet(bullet, isFireChecking) {
        this._cheat.count = this._cheat.count || 0;
        if (!bullet) {
            this._cheatOnce('子弹数据有误');
            return -1;
        }
        let bSkin = bullet.skin;
        if (!this._checkBulletSkin(bSkin)) {
            return -2;
        }
        let bLv = bullet.wpLv;
        if (!this._checkBulletLevel(bLv)) {
            return -3;
        }
        if (isFireChecking) {
            let curSkin = this.DIY.weapon_skin;
            if (curSkin != bSkin) {
                this._cheatOnce('武器皮肤不匹配curSkin = ' + curSkin + ' bSkin = ' + bSkin);
                return -4;
            }
            let curWpLv = this.DIY.weapon;
            if (curWpLv != bLv) {
                this._cheatOnce('武器等级不匹配curWpLv = ' + curWpLv + ' bLv = ' + bLv);
                return -5;
            }
        }
        this._cheat.count = 0;
        this._cheat.msg = '';
        return 1;
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
                pearl: this.account.pearl,
                gold: this.account.gold,
                wp_level: this.DIY.weapon,
                wp_skin: this.DIY.weapon_skin,
            },
        };

        if (this._isForbided) {
            return utils.invokeCallback(cb, null, resetData);
        }
        if (!data) {
            utils.invokeCallback(cb, null, resetData);
        }
        let wpBk = data.wp_bk;
        let bullet = this.cost.parseBulletKey(wpBk);
        if (this._checkBullet(bullet, true) <= 0) {
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

        let energy = this.DIY.weapon_energy[curWpLv] || 0;
        let gainLaser = energy;
        let newComebackHitrate = this.account.comeback && this.account.comeback.hitrate || 1;
        let nextFireBCC = 0; //下一炮子弹可能分裂出的子弹数
        let saveData = {
            level: this.account.level,
            exp: this.account.exp,
            gold: 0,
        };
        if (this.account.gold > 0) {
            let costGold = this.cost.fire_gold_cost({
                weapon_skin: curSkin,
                weapon: curWpLv
            });
            if (costGold > this.account.gold) {
                costGold = this.account.gold; //最后一炮不足以开炮时，则默认剩余全部用完可开一次，下一次开炮则破产
            }
            nextFireBCC = this.cost.calBulletClonedCount(curSkin);
            this._addBkCost(wpBk, costGold, curSkin == consts.WP_SKIN_ID.PAOPAOTANG, nextFireBCC);

            let star = this.getSkinStar(curSkin);
            let wpStarCfg = null;
            star && (wpStarCfg = configReader.getWeaponStarData(curSkin, star));

            let gainExp = this.cost.fire_gain_exp({
                gold: costGold,
                godId: -1, //todo
                godLevel: -1, //todo
                starExp: wpStarCfg && wpStarCfg.exp || 0, //星级加成经验
            });
            gainExp > 0 && this._checkLevelUp(saveData, gainExp);
            newComebackHitrate = this.cost.subComebackHitRate(curWpLv, this.account.comeback);
            if (newComebackHitrate > 0) {
                saveData.comeback_hitrate = newComebackHitrate;
            }
            let heart = this.cost.newHeartBeat(costGold, this._sceneCfg.max_level, this.account.heartbeat_min_cost, this.account.heartbeat, this._maxWpLv);
            gainLaser = this.cost.fire_gain_laser({
                weapon_skin: curSkin,
                weapon: curWpLv,
                energy: energy,
                godId: -1, //todo 
                godLevel: -1, //todo
                starLaser: wpStarCfg && wpStarCfg.powerspeed || 0, //星级加成激光累计速度
            });
            this.DIY.weapon_energy[curWpLv] = gainLaser;
            saveData.weapon_energy = this.DIY.weapon_energy;
            saveData.gold -= costGold;
            saveData.heartbeat = heart[0];
            saveData.heartbeat_min_cost = heart[1];
            this._log.addGoldLog(GAMECFG.common_log_const_cfg.GAME_FIGHTING, saveData.gold, this.account.level, true);
            this._save(saveData);

            this.checkPersonalGpctOut();
        }

        let resData = {
            wp_laser: {
                wp_level: curWpLv,
                laser: gainLaser
            },
            exp: this.account.exp,
            level: this.account.level,
            gold: this.account.gold,
            comeback_hitrate: newComebackHitrate,
            nextFireBCC: nextFireBCC,
        };
        saveData.skill && (resData.skill = this.account.skill);
        saveData.pearl && (resData.pearl = this.account.pearl);
        saveData.package && (resData.package = this.account.package);
        utils.invokeCallback(cb, null, resData);

        if (this.account.gold > 0) {
            let sd = {
                seatId: this.seatId,
                fire_point: data.fire_point,
                gold: this.account.gold,
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
        if (!data) {
            return utils.invokeCallback(cb, null);
        }
        let srcWbk = data.src;
        let clones = data.clones;
        if (!srcWbk) {
            return utils.invokeCallback(cb, null);
        }
        let bkData = this._bkCost[srcWbk];
        let srcBullet = this.cost.parseBulletKey(srcWbk);
        if (this._checkBullet(srcBullet) <= 0) {
            return utils.invokeCallback(cb, null);
        }
        let srcSkin = srcBullet.skin;
        if (srcSkin == consts.WP_SKIN_ID.LIMING) {
            //星舰黎明反弹处理：反弹子弹标识与原始子弹相同
            if (clones) {
                return utils.invokeCallback(cb, null);
            }
            let costValue = -1;
            let cloneC = 0;
            if (bkData) {
                costValue = bkData.cost;
                if (bkData.clone > 0) {
                    bkData.clone--;
                } else {
                    this._delBkCost(srcWbk);
                    return utils.invokeCallback(cb, null);
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
                    this._cheatOnce('无原始子弹，疑似作弊=' + srcWbk);
                    return utils.invokeCallback(cb, null);
                }
                onceMax = bkData.clone || 8;
            }
            if (!clones || clones.length > onceMax) {
                this._delBkCost(srcWbk);
                return utils.invokeCallback(cb, null);
            }
            for (let i = 0; i < clones.length; i++) {
                let wbk = clones[i];
                let bullet = this.cost.parseBulletKey(wbk);
                if (this._checkBullet(bullet) <= 0 || bullet.skin != srcSkin || bullet.wpLv != srcBullet.wpLv) {
                    this._delBkCost(srcWbk);
                    return utils.invokeCallback(cb, null);
                }
                this._addBkCost(wbk, -1, srcSkin == consts.WP_SKIN_ID.PAOPAOTANG);//克隆子弹特殊标记
            }
        } else if (clones.length === 1 && clones[0] == srcWbk) {
            this._addBkCost(clones[0], -1, false);
        } else {
            this._cheatOnce('非克隆子弹发克隆消息，疑似作弊');
        }
        utils.invokeCallback(cb, null);
    }

    /**
     * 碰撞鱼捕获率判定
     */
    c_catch_fish(data, cb) {
        if (this._isForbided) {
            return utils.invokeCallback(cb, null);
        }

        let isReal = this.isRealPlayer();
        //校验子弹是否真的存在过 //子弹不存在，则无消耗，不能碰撞
        let bFishes = data.b_fishes;
        if (!bFishes || !bFishes.length) {
            return utils.invokeCallback(cb, null, {});
        }
        let cFishes = {};
        let bks = [];
        let costTotal = 0;
        let fireTotal = 0;
        let minWplv = Math.min(this._maxWpLv, this._sceneCfg.max_level);

        for (let i = 0; i < bFishes.length; ++i) {
            let bdata = bFishes[i];
            let bk = bdata.wp_bk;
            let bullet = this.cost.parseBulletKey(bk);
            if (this._checkBullet(bullet) <= 0) {
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
                log && log('numberTest--无效碰撞', bk);
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

        let tData = this.cost.catchNot(cFishes, this.account, this.fishModel, isReal, this._maxWpLv);
        let ret = tData.ret;
        let gainGold = 0;
        let oldRrewardFishGold = this.account.bonus && this.account.bonus.gold_count || 0;
        let rewardFishNum = 0;
        let pirateData = null;
        let fireFlagGolds = {};
        let gotC = 0;
        let dropKeys = [];
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
                }
                let temp = this._missionCoutWithFish(fk, gold, rd.skin);
                temp.rewardFishFlag === 1 && (rewardFishNum++);
                temp.pirateFlag > 0 && this._pirate && (pirateData = this._pirate.getProgress());
                temp.dropKeys.length > 0 && (rd.drops = temp.dropKeys);
                srcFishId > 0 && (fg.fish_id = srcFishId);
                gotC++;
            }
        }
        for (let fk in fireFlagGolds) {
            gainGold += fireFlagGolds[fk].gold;
        }
        let newRrewardFishGold = this.account.bonus && this.account.bonus.gold_count || 0;
        newRrewardFishGold -= oldRrewardFishGold;
        newRrewardFishGold = Math.max(newRrewardFishGold, 0);
        this._mission.updateProcess(RewardModel.TaskType.ONE_GET_GOLD, gainGold);//单次开炮获得金币x
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
                    log && log('fc = ', fc, bk, bkd);
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

        //排位赛统计
        isReal && this._rmHelper && this._rmHelper.fireCount(bks, ret, this.fishModel);

        let sceneFlags = {
            '0': GAMECFG.common_log_const_cfg.GAME_FIGHTING, //普通命中
            '1': GAMECFG.common_log_const_cfg.FISH_LIGHTING, //鱼闪电技能命中
            '2': GAMECFG.common_log_const_cfg.FISH_BOMB, //鱼炸弹技能命中
            '3': GAMECFG.common_log_const_cfg.NUCLER_DROP, //被核弹打中
            '4': GAMECFG.common_log_const_cfg.NUCLER_LASER, //被激光打中
        };
        for (let fk in fireFlagGolds) {
            this._log.addGoldLog(sceneFlags[fk], fireFlagGolds[fk].gold, this.account.level, false);
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
                bonus: this.account.bonus,
                rewardFishGold: newRrewardFishGold,
                rewardFishNum: rewardFishNum,
            };
        }
        pirateData && (res.pirateData = pirateData);
        utils.invokeCallback(cb, null, res);

        //打死鱼才广播
        if (ret && Object.keys(ret).length > 0) {
            this.emit(fishCmd.push.catch_fish.route, {
                player: this,
                data: {
                    seatId: this.seatId,
                    catch_fishes: ret,
                    gold: this.account.gold,
                    pearl: this.account.pearl,
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
        let skill = this.account.skill;
        if (skill) {
            skill[skillId] = ret.skillC;
            saveData.skill = skill;
            saveData.skillUsed = {
                id: skillId,
                ct: ret.skillC,
            };
            this._mission.updateProcess(RewardModel.TaskType.USE_SKILL, 1, skillId);//使用x技能y次，如果x为0则为任意技能
        }
        let costVal = 0;
        ret.costPearl > 0 && (saveData.pearl = -ret.costPearl, costVal = ret.costPearl);
        ret.costGold > 0 && (saveData.gold = -ret.costGold, costVal = ret.costGold);

        if (saveData.pearl) {
            this._log.addDiamondLog(GAMECFG.common_log_const_cfg.SKILL_BUY, saveData.pearl, this.account.level);
            this._powerSkillCost = saveData.pearl;
            logBuilder.addItemLogByAccount([
                {
                    item_id: 'i002',
                    item_num: saveData.pearl,
                }
            ], this.account, GAMECFG.common_log_const_cfg.SKILL_BUY);
        } else if (saveData.gold) {
            this._log.addGoldLog(GAMECFG.common_log_const_cfg.SKILL_BUY, saveData.gold, this.account.level, false);
            this._powerSkillCost = saveData.gold;
        } else {
            skillId != consts.SKILL_ID.SK_LASER && this._addSkillItemCostLog(skillId);
        }

        this._log.addSkillUsingLog(skillId, ret.skillC);
        this._save(saveData);

        let common = {
            skill_id: skillId,
            skill_count: ret.skillC,
        };
        common.pearl = this.account.pearl;
        common.gold = this.account.gold;
        return common;
    }

    /**
     * 开始使用技能
     */
    c_use_skill(data, cb) {
        if (this._isForbided) {
            return utils.invokeCallback(cb, null);
        }
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
        let curWpLv = this.DIY.weapon;
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
            if (this._rmHelper) {
                if (!this._rmHelper.isNormalFireEnd()) {
                    utils.invokeCallback(cb, null, {
                        rmatch: true,
                    });
                    return;
                } else {
                    if (this.cost.checkRmatchWithCost(this.account, this._rmHelper.nbombCost) > 0) {
                        return utils.invokeCallback(cb, FishCode.INVALID_SKILL);
                    }
                }
            } else {
                if (this.cost.checkEnough(skillId, data.wp_level, this.account) > 0) {
                    return utils.invokeCallback(cb, FishCode.INVALID_SKILL);
                }
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

        let ret = this.cost.useSkill(skillId, data.wp_level, this.account);
        //开始持续时间定时器，结束时即技能结束
        if (skillId === consts.SKILL_ID.SK_FREEZ || skillId === consts.SKILL_ID.SK_AIM) {
            this._startSkillTicker(skillId);
        } else if (skillId === consts.SKILL_ID.SK_LASER && ret.notEnough === 3) {
            utils.invokeCallback(cb, FishCode.INVALID_WP_LASER);
            return;
        } else if (ret.notEnough > 0) {
            utils.invokeCallback(cb, FishCode.INVALID_SKILL);
            return;
        }

        this._skState[skillId].flag = 0;
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
            let bullet = this.cost.parseBulletKey(wpBk);
            if (this._checkBullet(bullet, true) <= 0) {
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
                this.DIY.weapon_energy[curWpLv] = reset;
                this._save({
                    weapon_energy: this.DIY.weapon_energy,
                    isRightNow: true,
                });
                utils.invokeCallback(cb, null, {
                    wp_level: curWpLv,
                    laser: reset,
                });
            } else {
                //核弹需要在确认发射时才扣钱
                let ret = null;
                if (this.isRealPlayer() && this._rmHelper && this._rmHelper.isNormalFireEnd()) {
                    let nbCost = this._rmHelper.nbombCost;
                    if (nbCost > 0) {
                        ret = this.cost.useSkillWithRmatch(skillId, data.wp_level, this.account, nbCost);
                        this._rmHelper.nbFlag(true);
                    } else {
                        this._rmHelper.nbFlag(false);
                    }
                } else {
                    if (data.invite && this._checkInviteRewardNbomb(skillId)) {
                        ret = this.cost.useSkill(skillId, data.wp_level, this.account, true);//因邀请成功而免费释放核弹
                    } else {
                        ret = this.cost.useSkill(skillId, data.wp_level, this.account);
                    }
                }
                if (!ret || ret.notEnough > 0) {
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
            let sdReward = this.account.social_daily_invite_reward;
            let freeBomb = this.account.free_bomb;
            if (sdReward && sdReward.length >= 2 && freeBomb != 2) {
                this.account.free_bomb = 2;
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
                if (mgold > 0 && this._miniGame.startTimestamp) {
                    let dt = this._miniGame.cd * 1000;
                    let now = new Date().getTime();
                    now -= this._miniGame.startTimestamp;
                    mgold = Math.min(mgold, this._miniGame.maxscore);
                    if (now >= dt && this.isRealPlayer()) {
                        this._mission.updateProcess(RewardModel.TaskType.PLAY_LITTLE_GAME, mgold, mtype);
                        this._save({
                            gold: mgold,
                            isRightNow: true,
                        }, GAMECFG.common_log_const_cfg.MINI_GAME);
                        ret = {
                            gold: mgold,
                            totalGold: this.account.gold,
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

            case consts.FIGHTING_NOTIFY.RMATCH_NB: {
                let rmatch_nb = evtData.rmatch_nb;
                if (this._rmHelper && !rmatch_nb) {
                    this._rmHelper.nbFlag(false);
                    this.rpcRankMatchCall(rankMatchCmd.remote.cancelNbomb.route);
                    this.clearRmatch();
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
                let ret = dropManager.try2Drop(this.account, cfg.reward, 1, GAMECFG.common_log_const_cfg.PIRATE_GAIN);
                this._checkMiniGame(ret.logItems);
                pirate.reset();
                this._save({
                    pirateData: -1,
                });
                this._pirate = null;
                return utils.invokeCallback(cb, null, {
                    gold: this.account.gold,
                    pearl: this.account.pearl,
                    package: this.account.package,
                    skill: this.account.skill,
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
        if (data.matchFlag > 0) {
            let tdata = {
                type: data.type,
                idx: data.idx,
                matchFlag: data.matchFlag,
            };
            this._rmHelper && this.rpcRankMatchCall(rankMatchCmd.remote.rmatchChat.route, tdata);
        } else {
            this.emit(fishCmd.push.fighting_notify.route, {
                player: this,
                data: {
                    seatId: data.seatId,
                    type: data.type,
                    idx: data.idx,
                    data: data,
                }
            });
        }
        utils.invokeCallback(cb, null, {
            state: this._rmHelper ? 1 : 0,
        });
    }

    //TODO弹幕：检查玩家聊天时间间隔
    c_world_barrage(data, cb){
        //this._globalBroadcast('s_barrage', data.msg, constDef.WORLD_CHANNEL_NAME.BARRAGE);
    }

    /**
     * 破产领取
     */
    c_broke_reward(data, cb) {
        let cfg = configReader.getValue('vip_vip_cfg', this.account.vip);
        //校验金币是否为破产状态
        if (!cfg || this.account.gold > 0) {
            return utils.invokeCallback(cb, FishCode.BROKE_INVALID);
        }

        //校验破产次数
        if (this.account.broke_times >= cfg.vip_alms_times) {
            return utils.invokeCallback(cb, FishCode.BROKE_OVER_TODAY);
        }

        //发放破产基金、返回破产剩余次数
        let bTimes = this.account.broke_times + 1;
        let brokeGold = cfg.vip_alms_value - this.account.gold; //注意，gold可能未负数，所以领取破产后务必保证当前金币为配置金币
        this._save({
            gold: brokeGold,
            broke_times: bTimes,
            isRightNow: true,
        });
        utils.invokeCallback(cb, null, {
            gold: brokeGold,
            broke_times: bTimes,
        });
    }

    /**
     * 排位赛：继续比赛，例如中途退出或断线重连
     */
    async c_continue_rmatch(data, cb) {
        try {
            let rankMatchPos = await globalStatusData.queryData(constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_RANKMATCH_POS, rpcSender.serverType.rankMatch, this.uid);
            if (!rankMatchPos) {
                throw ERROR_OBJ.MATCH_ROOM_GAMEOVER;
            } else {
                if (Date.now() - Number(rankMatchPos.time) >= constDef.MATCH.MSECONDS) {
                    await globalStatusData.delData(constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_RANKMATCH_POS, this.uid, rankMatchPos.serverId);
                    throw ERROR_OBJ.MATCH_ROOM_GAMEOVER;
                }
            }
            logger.error('rankMatchPos=', rankMatchPos);
            this._generateRmHelper({serverId: rankMatchPos.serverId, roomId: rankMatchPos.roomId});

            let matchInfo = await this.rpcRankMatchCall(rankMatchCmd.remote.query_playerInfo.route);
            if (!matchInfo) {
                throw ERROR_OBJ.MATCH_ROOM_GAMEOVER;
            }

            let playersInfos = matchInfo.players;
            for (let i = 0; i < playersInfos.length; i++) {
                let p = playersInfos[i];
                if (p.uid == this.uid) {
                    this._rmHelper.resetWithContinue(p.status.fire, p.status.score);
                    this.startRmatch({
                        nbomb_cost: p.nbomb_cost,
                        serverId: data.serverId,
                        roomId: data.roomId,
                    });
                    break;
                }
            }
            utils.invokeCallback(cb, null, {
                players: playersInfos,
                countdown: matchInfo.countdown
            });
            logger.error('继续比赛信息=', {
                players: playersInfos,
                countdown: matchInfo.countdown
            });

        } catch (e) {
            logger.error('c_continue_rmatch 继续比赛失败', e);
            //排位赛结束
            this.clearRmatch();
            utils.invokeCallback(cb, null, {});
        }
    }

    /**
     * 切换武器倍率
     */
    c_turn_weapon(data, cb) {
        let wbks = this._wbks;
        let pos = -1;
        for (let i = 0; i < wbks.length; i ++) {
            if (this.DIY.weapon == wbks[i]) {
                pos = i;
                break;
            }
        }
        if (pos === -1) {
            logger.error('this.DIY.weapon = ', this.DIY.weapon);
            return utils.invokeCallback(cb, ERROR_OBJ.WEAPON_LEVEL_INVALID);
        }
        if (data.up === 1) {
            pos ++;
        }else {
            pos --;
        }
        let allowMaxWp = Math.min(this._sceneCfg.max_level, this._maxWpLv);
        let newWp = Number(wbks[pos]);
        if (!newWp) {
            if (pos < 0) {
                newWp = allowMaxWp;
            }else if (pos >= wbks.length) {
                newWp = this._sceneCfg.min_level;
            }
        }else {
            if (newWp > allowMaxWp) {
                newWp = this._sceneCfg.min_level;
            }else if (newWp < this._sceneCfg.min_level) {
                newWp = allowMaxWp;
            }
        }
        if (this._rmHelper) {
            let rmMinLevel = configReader.getValue('common_const_cfg', 'RMATCH_OPEN_LIMIT');
            if (newWp < rmMinLevel) {
                return utils.invokeCallback(cb, ERROR_OBJ.WEAPON_LEVEL_LIMIT);
            }
        }

        this._change2Weapon(newWp);
        utils.invokeCallback(cb, null, {
            wp_level: newWp,
        });
        this.emit(fishCmd.push.turn_weapon.route, {
            player: this,
            data: {
                seatId: this.seatId,
                wp_level: newWp
            }
        });
    }

    _change2Weapon(newWp) {
        this.DIY.weapon = newWp;
        this._save({
            weapon: newWp,
        });
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
        let id = this.account.id;
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

    /**
     * 重置diy
     * 注意：重置的武器倍率不能超过当前场景允许的最大等级
     */
    _resetDIY() {
        let account = this.account;
        let aw = account.weapon;
        let weapon = this.DIY && this.DIY.weapon || 1;
        let oldWpLv = weapon;
        if (!this._sceneCfg) {
            weapon = aw;
        } else if (aw >= this._sceneCfg.min_level && aw <= this._sceneCfg.max_level) {
            weapon = aw;
        }
        if (oldWpLv && weapon > oldWpLv && this.DIY && this.DIY.weapon_energy && this.DIY.weapon_energy[weapon]) {
            weapon = oldWpLv;
        }
        //排位赛时，皮肤变化需要及时通知
        let wpSkin = account.weapon_skin.equip;
        if (this.DIY && this.DIY.weapon_skin != wpSkin) {
            this.rpcRankMatchCall(rankMatchCmd.remote.weaponChange.route, {
                wp_skin: wpSkin,
            });
        }

        this._DIY = {
            weapon: weapon,
            weapon_skin: wpSkin,
            weapon_energy: account.weapon_energy,
        };

        //注意：原始数据可能无1倍激光能量标记，此处兼容处理
        this.DIY.weapon_energy = this.DIY.weapon_energy || {};
        let cfg = GAMECFG.newweapon_upgrade_cfg;
        let wbks = Object.keys(cfg);
        for (let i = 0; i < wbks.length; i++) {
            let lv = parseInt(wbks[i]);
            if (lv > aw) {
                break;
            }
            if (this.DIY.weapon_energy[lv] == undefined || this.DIY.weapon_energy[lv] == null) {
                this.DIY.weapon_energy[lv] = lv == aw ? cfg[lv].needpower : 0;
                this.account.weapon_energy = this.DIY.weapon_energy;
                this.save();
            }
        }
        this._makePirateFieldValid();
        this._resetSkinDt();
    }

    _resetSkinDt() {
        let curSkin = this._DIY.weapon_skin;
        let SKIN_CFG = configReader.getValue('newweapon_weapons_cfg', curSkin);
        let offset = FIRE_DELAY + Math.floor(Math.random() * 50);
        this._skinDt = (SKIN_CFG.interval || 0.2) * 1000 - offset;
        this._maxWpLv = this.cost.getWpLevelMax(this.DIY.weapon_energy);
    }

    getSkinStar(skin) {
        skin = skin || this.DIY.weapon_skin;
        let star = 0;
        if (this.account.weapon_skin.star) {
            star = this.account.weapon_skin.star[skin] || 0;
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
            data.hasOwnProperty('gold') && (this.account.gold = data.gold);
            data.hasOwnProperty('weapon_energy') && (this.account.weapon_energy = data.weapon_energy);
            data.hasOwnProperty('heartbeat') && (this.account.heartbeat = data.heartbeat);
            data.hasOwnProperty('heartbeat_min_cost') && (this.account.heartbeat_min_cost = data.heartbeat_min_cost);
            data.hasOwnProperty('roipct_time') && (this.account.roipct_time = data.roipct_time);
            data.hasOwnProperty('pearl') && (this.account.pearl = data.pearl);
            data.hasOwnProperty('skill') && (this.account.skill = data.skill);
            data.hasOwnProperty('exp') && (this.account.exp = data.exp);
            data.hasOwnProperty('level') && (this.account.level = data.level);
            data.hasOwnProperty('package') && (this.account.package = data.package);
            data.hasOwnProperty('broke_times') && (this.account.broke_times = data.broke_times);
            data.hasOwnProperty('weapon') && (this.account.weapon = data.weapon);
            this.account.comeback && data.hasOwnProperty('comeback_hitrate') && (this.account.comeback.hitrate = data.comeback_hitrate, this.account.comeback = this.account.comeback);

            let goldChange = data.gold;
            if (goldChange > 0) {
                this._mission.updateProcess(RewardModel.TaskType.GET_GOLD, goldChange);
            } else if (goldChange < 0) {
                this._mission.updateProcess(RewardModel.TaskType.USE_GOLD, -goldChange);
            }
            this._mission.ready2Commit();

            if (data.hasOwnProperty('pirateData') && data.pirateData) {
                let td = this.account.pirate;
                let tp = data.pirateData;
                if (tp === -1) {
                    delete this.account.pirate[this._sceneCfg.name];
                    td = this.account.pirate;
                } else {
                    td[this._sceneCfg.name] = tp;
                }
                this.account.pirate = td;
            }

            //减缓及时存入，两次操作间隔大于某值时写入
            this._wait2WriteRedis = true;
            let now = new Date().getTime();
            if (this._writeRedisTimestamp) {
                let passed = now - this._writeRedisTimestamp;
                if (data.isRightNow || passed >= REDIS_DT) {
                    this.save();
                    this._writeRedisTimestamp = now;
                    this._wait2WriteRedis = false;
                    this._updateRankWithBP();
                }
            }
        }
    }

    /**
     * 退出房间之前，立即写入尚未写入的日志
     */
    clear() {
        this._tellOthersMiniTimeout();
        this.clearSkillTickers();
        this.removeAllListeners();

        playerEvent.removeAllListeners(this.uid);
        this._log.logAll();

        this.save();
        this._updateRankWithBP();
    }

    /**
     * 捕获鱼相关任务统计
     */
    _missionCoutWithFish(fk, gold, skin) {
        let temp = fk.split('#');
        let fishID = temp[0];
        let cfg = fishID && this.fishModel.getFishCfgWithID(fishID) || null;
        let data = {};
        if (cfg) {
            let star = this.getSkinStar(skin);
            let wpStarCfg = configReader.getWeaponStarData(skin, star);

            //奖金鱼统计
            if (cfg.display_type === 4) {
                let bonus = this.account.bonus;
                if (!bonus.fish_count) {
                    bonus.fish_count = 0;
                }
                bonus.fish_count += 1;
                if (!bonus.gold_count) {
                    bonus.gold_count = 0;
                }
                let reward = this.cost.calGoldenFishReward(gold, skin, star, wpStarCfg);
                bonus.gold_count += reward;
                this.account.bonus = bonus;
                data.rewardFishFlag = 1;
            } else if (cfg.display_type === 3) {
                this._broadcastWithKillingBoss(cfg.name, gold);
            }

            //海盗任务统计(排位赛进行中不统计)
            if (this._pirate && !this._rmHelper) {
                let fishName = this.fishModel.getFishName(fishID);
                fishName && (data.pirateFlag = this._pirate.countFish(fishName));
            }

            //捕鱼积分统计,注意星级加成
            let fishingScore = gold;
            wpStarCfg && (fishingScore *= (1 + (wpStarCfg.fishing || 0)));
            this._countBp(fishingScore);

            //日常、成就统计
            this._mission.updateProcess(RewardModel.TaskType.CATCH_FISH, 1, cfg.fish_id); //打死指定鱼1条
            this._mission.updateProcess(RewardModel.TaskType.CATCH_FISH, 1, 0); //打死任意鱼统计  

            //掉落检查
            let ret = dropManager.try2Drop(this.account, cfg.drop_pack_id, 1, GAMECFG.common_log_const_cfg.GAME_FIGHTING);
            data.dropKeys = ret.dpks;
            this._checkMiniGame(ret.logItems);
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
        if (this.account.pirate && this._sceneCfg && !this._pirate) {
            let now = new Date().getTime();
            if (this._pirateTimestamp && now - this._pirateTimestamp < this._sceneCfg.pirate_time * 1000) {
                return null;
            }
            let name = this._sceneCfg.name;
            this._pirate = new Pirate(this.account.pirate[name], this._sceneCfg.pirate_id);
            this._pirateTimestamp = now;
        }
        return this._pirate;
    }

    /**
     * 海盗任务字段合法化
     */
    _makePirateFieldValid() {
        if (this.account.pirate && typeof (this.account.pirate) === 'string') {
            this.account.pirate = JSON.parse(this.account.pirate);
        }
    }

    _generateRmHelper(data) {
        if (!this._rmHelper) {
            this._rmHelper = new RmatchHelper();
            this._rmHelper.setServerData({
                serverId: data.serverId,
                roomId: data.roomId,
            });
        }
    }

    /**
     * 排位赛：正式开始
     */
    startRmatch(evtData) {
        this._generateRmHelper(evtData);
        this._rmHelper.setNbCost(evtData.nbomb_cost);
        this._rmHelper.registerUpdateFunc(function (data) {
            //logger.error('当前战绩===', data);
            if (data.nbomb) {
                this.rpcRankMatchCall(rankMatchCmd.remote.useNbomb.route, data);
                this.clearRmatch();
            } else {
                //比赛结算时，注意皮肤星级加成
                if (this._rmHelper.isNormalFireEnd()) {
                    let curSkin = this.DIY.weapon_skin;
                    let star = this.getSkinStar(curSkin);
                    let wpStarCfg = null;
                    star && (wpStarCfg = configReader.getWeaponStarData(curSkin, star));
                    if (wpStarCfg) {
                        data.star = {
                            skin: curSkin,
                            score: wpStarCfg.score,    //--比赛分数提高
                            rank: wpStarCfg.rank,    //--比赛胜点提高
                        };
                    }
                }
                this.rpcRankMatchCall(rankMatchCmd.remote.fightInfo.route, data);
            }
        }.bind(this));
    }

    /**
     * 排位赛：全程结束，销毁
     */
    clearRmatch() {
        this._rmHelper = null;
        logger.info('比赛结束，重置状态');
    }

    /**
     * 战斗服向比赛服发送数据
     * @param {*} method
     * @param {*} data
     * @param {*} cb
     */
    async rpcRankMatchCall(method, data) {
        if (!this.isRealPlayer()) return;
        if (!this._rmHelper) return;
        data = data || {};
        data.uid = this.account.id;
        data.roomId = this._rmHelper.roomId;

        return await rpcSender.invoke(rpcSender.serverType.rankMatch, rpcSender.serverModule.rankMatch.rankMatchRemote, method, data, this._rmHelper.rankMatchSid);
    }

    /**
     * 统计捕鱼积分
     */
    _countBp(gold) {
        this.account.bp += gold;
    }

    /**
     * 捕鱼积分送入排行榜
     */
    _updateRankWithBP() {
        const BP = "rank:bp"; //捕鱼积分排行榜
        let redis = redisConnector.cmd;
        let platform = this.account.platform;
        let score = this.account.bp;
        let member = this.account.id;
        if (this.account.privacy == 1 && this.account.test >= 0) {
            redis.zadd(BP + ":" + platform, score, member);
            redis.hset(BP + ":timestamp", member, new Date().getTime());
        }
    }

    /**
     * 角色等级升级
     */
    _checkLevelUp(saveData, gainExp) {
        let oldLv = saveData.level;
        let result = this.cost.reset_exp_level(oldLv, saveData.exp, gainExp);
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
                let skillID = itemCfg.id;
                let skill = this.account.skill || {};
                if (!skill[skillID]) {
                    skill[skillID] = 0;
                }
                skill[skillID] += itemNum;
                saveData.skill = skill;
            } else {
                let pack = this.account.package || {};
                if (!pack[type]) {
                    pack[type] = {};
                }
                if (!pack[type][itemKey]) {
                    pack[type][itemKey] = 0;
                }
                pack[type][itemKey] += itemNum;
                saveData.package = pack;
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
        logBuilder.addItemLogByAccount([
            {
                item_id: cfg.item_id,
                item_num: -1,
            }
        ], this.account, GAMECFG.common_log_const_cfg.GAME_FIGHTING);
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
        this._miniGame = {
            type: miniType,
            startTimestamp: new Date().getTime(),//记下开始时间戳
            timeoutDt: cfg.cd * 2, //默认两倍持续时间为超时时间
            maxscore: cfg.maxscore,
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
                        totalGold: this.account.gold
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
        let params = [this.account.nickname, fishname, reward];
        let content = {
            type: GameEventBroadcast.TYPE.GAME_EVENT.BOSS_KILL,
            params: params,
        };
        let account = this.account;
        new GameEventBroadcast(account, content).add();
    }
}

module.exports = FishPlayer;