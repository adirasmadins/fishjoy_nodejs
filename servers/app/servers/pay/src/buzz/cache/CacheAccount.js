const _ = require('underscore');
const ObjUtil = require('../ObjUtil');
const ErrorUtil = require('../ErrorUtil');
const ArrayUtil = require('../../utils/ArrayUtil');
const RedisUtil = require('../../utils/RedisUtil');
const CharmUtil = require('../../utils/CharmUtil');
const active_activequest_cfg = require('../../../../../utils/imports').DESIGN_CFG.active_activequest_cfg;
const redisAccountSync = require('../../../../../utils/redisAccountSync');
const utils = require('../../utils/utils');
const account_def = require('../../../../../models/index').ACCOUNTKEY;
const CacheSkill = require('./CacheSkill');
const redisKeys = require('../../../../../database').dbConsts.REDISKEY;

const RewardModel = require('../../../../../utils/account/RewardModel');
const tools = require('../../../../../utils/tools');

const CACHE_MAX = 1000;
const CACHE_LEN = 100;
/** 排行榜默认返回排名是10001(客户端显示为10000+) */
const RANK_DEFAULT = 10001;

const DRAW_TYPE = {
    GOLD: 1,
    PEARL: 2,
};

const TAG = "【CacheAccount】";

// 缓存账户相关
exports.push = push;
exports.uid_list = uid_list;
exports.length = length;
exports.contains = contains;
exports.getAccountById = getAccountById;
exports.getAccountFieldById = getAccountFieldById;
exports.setAccountById = setAccountById;
exports.update = update;
exports.setField = setField;
exports.getGuide = getGuide;
exports.getGuideWeak = getGuideWeak;
exports.getAllIds = getAllIds;
exports.setSex = setSex;
exports.setCity = setCity;

// 每日重置杂项
exports.addLoginCount = addLoginCount;
exports.addDayRewardWeekly = addDayRewardWeekly;
exports.setDayReward = setDayReward;
exports.setLoginCount = setLoginCount;
exports.setFirstLogin = setFirstLogin;
exports.setVipDailyFill = setVipDailyFill;
exports.setFreeDraw = setFreeDraw;
exports.setBrokeTimes = setBrokeTimes;
exports.setActive = setActive;
exports.setActiveDaily = setActiveDaily;
exports.setActiveStatOnce = setActiveStatOnce;
exports.setActiveStatReset = setActiveStatReset;
exports.setFreeDraw = setFreeDraw;

// 女神相关
exports.setGoddess = setGoddess;
exports.getGoddess = getGoddess;
exports.setGoddessFree = setGoddessFree;
exports.getGoddessFree = getGoddessFree;
exports.setGoddessCTimes = setGoddessCTimes;
exports.getGoddessCTimes = getGoddessCTimes;
exports.setGoddessCrossover = setGoddessCrossover;
exports.getGoddessCrossover = getGoddessCrossover;
exports.setGoddessOngoing = setGoddessOngoing;
exports.getGoddessOngoing = getGoddessOngoing;
exports.setAquarium = setAquarium;
exports.setMaxPetfishLevel = setMaxPetfishLevel;

// 金币购买相关
exports.setGoldShopping = setGoldShopping;

// token相关
exports.getToken = getToken;

// 月卡相关
exports.setCard = setCard;

// 破产相关
exports.costBrokeTimes = costBrokeTimes;

// 奖金相关
exports.setBonus = setBonus;

// 活动礼包相关
exports.setActivityGift = setActivityGift;
exports.setDayRewardAdv = setDayRewardAdv;
exports.setNewRewardAdv = setNewRewardAdv;

// 翻盘基金相关
exports.setComeback = setComeback;

// 玩家充值相关
exports.setVip = setVip;
exports.setRmb = setRmb;
exports.addRmb = addRmb;

// 投资回报率(ROI PCT)相关
exports.setRoipctTime = setRoipctTime;

// 武器相关
exports.setWeaponEnergy = setWeaponEnergy;
exports.setOneWeaponEnergy = setOneWeaponEnergy;
exports.setWeaponSkin = setWeaponSkin;
exports.setWeapon = setWeapon;

exports.getAllWeaponEnergy = getAllWeaponEnergy;
exports.getWeaponEnergy = getWeaponEnergy;

// VIP礼包相关
exports.setVipGift = setVipGift;

// 心跳相关
exports.setHeartbeat = setHeartbeat;
exports.setHeartbeatMinCost = setHeartbeatMinCost;

// 任务相关
exports.setLevelMission = setLevelMission;// 关卡任务
exports.setMissionDailyReset = setMissionDailyReset;// 每日重置任务
exports.setMissionOnlyOnce = setMissionOnlyOnce;// 一次性任务
exports.setPirate = setPirate;// 海盗任务

// 新手引导相关
exports.setGuide = setGuide;
exports.setGuideWeak = setGuideWeak;

// 月卡相关
exports.setGetCard = setGetCard;

// 首充相关
exports.setFirstBuy = setFirstBuy;
exports.setFirstBuyGift = setFirstBuyGift;

// 经验相关
exports.setExp = setExp;

// 等级相关
exports.setLevel = setLevel;

// 技能相关
exports.setSkill = setSkill;
exports.addSkill = addSkill;
exports.useSkill = useSkill;

// 背包相关
exports.setPack = setPack;

// 金币相关
exports.getGold = getGold;
exports.costGold = costGold;
exports.setGold = setGold;

// 钻石相关
exports.getPearl = getPearl;
exports.addPearl = addPearl;
exports.addPearlEx = addPearlEx;
exports.costPearl = costPearl;
exports.setPearl = setPearl;

// 活动相关
exports.useFreeDraw = useFreeDraw;
exports.getActualCostTimes = getActualCostTimes;
exports.updateActiveCharge = updateActiveCharge;

// 字段值获取包装
exports.getFreeDraw = getFreeDraw;
exports.getTotalDraw = getTotalDraw;

// 邮件操作相关
exports.addSpecifyMail = addSpecifyMail;
exports.addSysMail = addSysMail;
exports.getMailList = getMailList;
exports.getMailBox = getMailBox;
exports.deleteMail = deleteMail;
exports.hasMail = hasMail;
exports.setMailBox = setMailBox;
exports.getAllMailBox = getAllMailBox;

// 用户相关其他表设置
exports.setAccountGold = setAccountGold;
exports.setAccountGoldCurrentTotal = setAccountGoldCurrentTotal;
exports.addAccountGoldTotalGain = addAccountGoldTotalGain;
exports.addAccountGoldTotalCost = addAccountGoldTotalCost;
exports.setNeedInsert = setNeedInsert;


// 后门程序
exports.setAccountModifying = setAccountModifying;
exports.setToken = setToken;

// 创建操作
exports.create = create;
exports.remove = remove;

// 2017-09-18
exports.signMonth = signMonth;

//魅力值操作:魅力点数point、魅力等级
exports.setCharmRank = setCharmRank;


exports.setTest = setTest;

exports.setCharmPointWithFriendChange = function (uid, cb) {
    getAccountById(uid, function (err, account) {
        if (!account) return;
        resetCharmPoint(account, cb);
    });

};

exports.setCharmPointWithGivenFlower = function (account, currentTotal, cb) {
    if (!account) return;
    resetCharmPoint(account, function (chs) {
        cb && cb(chs);
    });
};

exports.setCharmPointWithUsingOneHorn = function (account, cb) {
    resetCharmPoint(account, cb);
};

// 操作限制
exports.setOp = setOp;
exports.clearOp = clearOp;

function setOp(account, api_name) {
    if (!account.op) {
        account.op = {};
    }
    account.op[api_name] = 1;
    setTimeout(function () {
        clearOp(account, api_name);
    }, 5000);
}

function clearOp(account, api_name) {
    if (account.op && account.op[api_name]) {
        account.op[api_name] = 0;
    }
}

exports.resetCharmPoint = resetCharmPoint;

function resetCharmPoint(account, cb) {
    if (account) {
        CharmUtil.getCurrentCharmPoint(account, function (charmPoint) {
            if (charmPoint) {
                let uid = account.id;
                let aTempCharmRank = account.myTempCharmRank || RANK_DEFAULT;
                let rank = CharmUtil.getCharmCfgLevel(charmPoint, aTempCharmRank);
                setCharmRank(uid, rank);
                account.charm_point = charmPoint;
                //注释如下内容，直接调用redisutil,防止闭环require
                // buzz_charts.updateRankCharm(account.platform, uid, charmPoint);
                if(account.privacy==1) {
                    if (!tools.BuzzUtil.isCheat(account)) {
                        RedisUtil.updateRank(redisKeys.RANK.CHARM, account.platform, charmPoint, uid);
                    }
                }
                cb && cb([charmPoint, rank]);
            } else {
                cb && cb([account.charm_point, account.charm_rank]);
            }

            account.commit();
        });
    } else {
        cb && cb(-1);//非法标记  
    }
}

function setCharmRank(uid, cur) {
    setField(uid, cur, 'charm_rank');
    RedisUtil.hset(redisKeys.CHARM_RANK, uid, cur);
}

function signMonth(uid, day) {
    let account = getAccountById(uid);
    if (account && account.month_sign && account.month_sign.length >= 28) {
        account.month_sign[day] = 1;
        account.commit();
    }
}

function setTest(pool, uid, value) {
    const FUNC = TAG + "setTest() --- ";

    let account = getAccountById(uid);
    if (account) {
        account.test = value;
        account.commit();
    }
}

exports.CACHE_MAX = CACHE_MAX;
exports.CACHE_LEN = CACHE_LEN;


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

function create(data) {
    push(data);
}

function setField(uid, cur, field_name, cb) {
    getAccountFieldById(uid, [field_name], function (err, account) {
        if (account) {
            if (typeof(cur) == "undefined" || (typeof(cur) == 'number' && isNaN(cur))) {
                logger.error('cur = ', cur, field_name);
                throw new Error('cur is invalid.');
            }
            // 需要特殊处理的字段调用cb进行优化.
            if (cb) {
                cb(account);
            }
            // 无需特殊处理的字段直接赋值即可.
            else {
                if (account.modify && account.modify.field == field_name) {
                    account[field_name] = account.modify.value;
                    delete account.modify;
                }
                else {
                    account[field_name] = cur;
                }

                account.commit();
            }
        } else {
            cb && cb(null);
        }
    });
}

//----------------------------------------------------------
// 后门程序
//----------------------------------------------------------
/**
 * 设置账号在内存中为修改状态
 */
function setAccountModifying(uid, field, value) {
    if (contains(uid)) {
        let account = getAccountById(uid);
        account.modify = {
            field: field,
            value: value
        };
    }
}

/**
 * 设置玩家token, 用于踢出玩家.
 */
function setToken(uid, value) {
    getAccountFieldById(uid, function (err, account) {
        if (account) {
            account.token = value;
            account.commit();
        }
    });
}



//----------------------------------------------------------
// 每日重置杂项
//----------------------------------------------------------
function addLoginCount(uid, cur) {
    setField(uid, cur, 'login_count', function (account) {
        account.login_count = parseInt(account.login_count) + parseInt(cur);
        account.commit();
    });
}

function addDayRewardWeekly(uid, cur) {
    setField(uid, cur, 'day_reward_weekly', function (account) {
        account.day_reward_weekly = parseInt(account.day_reward_weekly) + parseInt(cur);
        account.commit();
    });
}

function setDayReward(uid, cur) {
    setField(uid, cur, 'day_reward');
}

function setLoginCount(uid, cur) {
    setField(uid, cur, 'login_count');
}

function setFirstLogin(uid, cur) {
    setField(uid, cur, 'first_login');
}

function setVipDailyFill(uid, cur) {
    setField(uid, cur, 'vip_daily_fill');
}

function setBrokeTimes(uid, cur) {
    setField(uid, cur, 'broke_times');
}

function setActive(uid, cur) {
    ErrorUtil.throwNullError('active', cur);
    setField(uid, cur, 'active');
}

function setActiveDaily(uid, cur) {
    ErrorUtil.throwNullError('active_daily_reset', cur);
    setField(uid, cur, 'active_daily_reset');
}

function setActiveStatOnce(uid, cur) {
    ErrorUtil.throwNullError('active_stat_once', cur);
    setField(uid, cur, 'active_stat_once');
}

function setActiveStatReset(uid, cur) {
    ErrorUtil.throwNullError('active_stat_reset', cur);
    setField(uid, cur, 'active_stat_reset');
}

function setFreeDraw(uid, cur) {
    setField(uid, cur, 'free_draw');
}

//----------------------------------------------------------
// 金币购买相关
//----------------------------------------------------------
function setGoldShopping(uid, cur) {
    setField(uid, cur, 'gold_shopping');
}

//----------------------------------------------------------
// 女神相关
//----------------------------------------------------------
function getGoddess(uid, cb) {
    getAccountFieldById(uid, [account_def.GODDESS], function (err, account) {
        utils.invokeCallback(cb, null, account.goddess);
    });
}

function setGoddess(uid, cur, cb) {
    getAccountById(uid, function (err, account) {
        if (account) {
            //女神升级或通过碎片全部解锁后才需更新魅力值
            account.goddess = cur;
            resetCharmPoint(account, cb);
            //统计女神解锁dfc
            let goddess = account.goddess;
            let count = 0;
            for (let i in goddess) {
                if (goddess[i].level > 0) {
                    count++;
                }
            }
            let mission = new RewardModel(account);
            mission.addProcess(RewardModel.TaskType.UNLOCK_GODDESS, count);
            account.commit();
        }
    });

}

function setAquarium(account, cur, cb) {
    account.aquarium = cur;
    resetCharmPoint(account, cb);
}

/**
 * 设置宠物鱼最大等级.
 */
function setMaxPetfishLevel(account, cur) {
    let update = false;
    if (account.petfish_total_level) {
        if (account.petfish_total_level < cur) {
            account.petfish_total_level = cur;
            update = true;
        }
    }
    else {
        account.petfish_total_level = cur;
        update = true;
    }
    if (update) {
        let mission = new RewardModel(account);
        mission.addProcess(RewardModel.TaskType.PETFISH_TOTAL_LEVEL, cur);
    }
    account.commit();
    //注释如下内容，直接调用redisutil,防止闭环require
    // buzz_charts.updateRankAquarium(account.platform, account.id, account.petfish_total_level);
    if (!tools.BuzzUtil.isCheat(account)) {
        RedisUtil.updateRank(redisKeys.RANK.AQUARIUM, account.platform, account.petfish_total_level, account.id);
    }
}

function setGoddessFree(uid, cur) {
    setField(uid, parseInt(cur), 'goddess_free');
}

function setGoddessCTimes(uid, cur) {
    setField(uid, parseInt(cur), 'goddess_ctimes');
}

function setGoddessCrossover(uid, cur) {
    setField(uid, parseInt(cur), 'goddess_crossover');
}

function setGoddessOngoing(uid, cur) {
    setField(uid, parseInt(cur), 'goddess_ongoing');
}

function getGoddessFree(uid, cb) {
    getAccountFieldById(uid, [account_def.GODDESS_FREE], function (err, account) {
        utils.invokeCallback(cb, null, account.goddess_free);
    });
}

function getGoddessCTimes(uid, cb) {
    getAccountFieldById(uid, [account_def.GODDESS_CTIMES], function (err, account) {
        utils.invokeCallback(cb, null, account.goddess_ctimes);
    });
}

function getGoddessCrossover(uid, cb) {
    getAccountFieldById(uid, [account_def.GODDESS_CROSSOVER], function (err, account) {
        utils.invokeCallback(cb, null, account.goddess_crossover);
    });
}

function getGoddessOngoing(uid, cb) {

    getAccountFieldById(uid, [account_def.GODDESS_ONGOING], function (err, account) {
        utils.invokeCallback(cb, null, account.goddess_ongoing);
    });
}

//----------------------------------------------------------
// Token相关
//----------------------------------------------------------
function getToken(uid, cb) {
    getAccountFieldById(uid, [account_def.TOKEN], function (err, account) {
        utils.invokeCallback(cb, null, account.token);
    });
}

//----------------------------------------------------------
// 月卡相关
//----------------------------------------------------------
function setCard(account, cur, cb) {
    ErrorUtil.throwNullError("card", cur);
    if (account) {
        account.card = cur;
        resetCharmPoint(account, null);
        account.commit();
        utils.invokeCallback(cb, null, 1);
    }
    else {
        utils.invokeCallback(cb, null, -1);
    }
}

//----------------------------------------------------------
// 破产相关
//----------------------------------------------------------
function costBrokeTimes(uid) {
    setField(uid, 0, 'broke_times', function (account) {
        account.broke_times++;
        // TODO: 破产领取的上限判断(和玩家等级关联)

        account.commit();
    });
}


//----------------------------------------------------------
// 奖金相关
//----------------------------------------------------------
function setBonus(uid, cur) {
    ErrorUtil.throwNullError("bonus", cur);
    setField(uid, cur, 'bonus');
}

//----------------------------------------------------------
// 活动礼包相关
//----------------------------------------------------------
function setActivityGift(uid, cur) {
    ErrorUtil.throwNullError('activity_gift', cur);
    setField(uid, cur, 'activity_gift');
}

// 设置广告礼包为被领取状态
function setDayRewardAdv(uid, cur) {
    setField(uid, cur, 'day_reward_adv');
}

// 设置新手礼包为被领取状态
function setNewRewardAdv(uid, cur) {
    setField(uid, cur, 'new_reward_adv');
}

//----------------------------------------------------------
// 翻盘基金相关
//----------------------------------------------------------
function setComeback(uid, cur) {
    setField(uid, cur, 'comeback');
}

//----------------------------------------------------------
// 玩家充值相关
//----------------------------------------------------------
function setVip(account, cur, cb) {
    let newVip = parseInt(cur);
    if (!account || newVip <= account.vip) {
        utils.invokeCallback(cb, null, -1);
        return;
    }

    account.vip = newVip;
    account.commit();
    resetCharmPoint(account, cb);
}

function setRmb(account, cur) {
    let newRmb = parseInt(cur);
    if (account.rmb != newRmb) {
        account.rmb = newRmb;
    }
    account.commit();
}

function addRmb(uid, cur) {
    setField(uid, cur, 'rmb', function (account) {
        account.rmb = parseInt(account.rmb) + parseInt(cur);
        account.commit();
    });
}

//----------------------------------------------------------
// 投资回报率相关
//----------------------------------------------------------
function setRoipctTime(uid, cur) {
    setField(uid, cur, 'roipct_time');
}

//----------------------------------------------------------
// 武器相关
//----------------------------------------------------------
// 武器充能进度
function setWeaponEnergy(uid, cur) {
    setField(uid, cur, 'weapon_energy');
}

function setOneWeaponEnergy(account, weapon_level, val) {
    if (account) {
        if (!account.weapon_energy) {
            account.weapon_energy = {};
        }
        account.weapon_energy[weapon_level] = val;
        setWeaponEnergy(account.id, account.weapon_energy);
    }
}

// 武器皮肤
function setWeaponSkin(account, cur, cb) {
    const FUNC = TAG + "setWeaponSkin() --- ";
    if (account && cur) {
        logger.info(FUNC + "可以设置玩家皮肤");
        let weapon_skin = ObjUtil.str2Data(cur);// NOTE: weapon_skin may be a string
        // yTODO: 验证拥有的武器是否重复, 如果重复就去掉重复并重写缓存和Redis
        weapon_skin.own = ArrayUtil.delRepeat(weapon_skin.own);
        account.weapon_skin = weapon_skin;
        //统计武器皮肤dfc
        let mission = new RewardModel(account);
        let num = weapon_skin.own.length - 1;
        mission.addProcess(RewardModel.TaskType.GET_WEAPON_SKIN, num);
        account.commit();
        resetCharmPoint(account, cb);
    }
    else {
        logger.info(FUNC + "设置玩家皮肤失败");
        utils.invokeCallback(cb, null, -1);
    }
}

function setWeapon(account, cur, cb) {
    let newWeapon = parseInt(cur);
    if (account) {
        if (newWeapon > account.weapon) {
            account.weapon = newWeapon;
            account.commit();
        }
        resetCharmPoint(account, cb);
        return 1;
    }
    else {
        return -1;
    }
}

/** 获取玩家所有激光能量记录. */
function getAllWeaponEnergy(account) {
    if (account && account.weapon_energy) {
        return account.weapon_energy;
    }
    return {};
}

/** 获取玩家对应武器等级的激光能量. */
function getWeaponEnergy(account, weapon_level) {
    let ret = 0;
    if (account && account.weapon_energy) {
        ret = account.weapon_energy[weapon_level];
        if (!ret) ret = 0;
    }
    return ret;
}


//----------------------------------------------------------
// VIP礼包相关
//----------------------------------------------------------
function setVipGift(uid, cur) {
    setField(uid, cur, 'vip_gift');
}

//----------------------------------------------------------
// 心跳相关
//----------------------------------------------------------
function setHeartbeat(uid, cur) {
    setField(uid, cur, 'heartbeat');
}

function setHeartbeatMinCost(uid, cur) {
    setField(uid, cur, 'heartbeat_min_cost');
}

//----------------------------------------------------------
// 任务相关
//----------------------------------------------------------
// 关卡任务
function setLevelMission(uid, cur) {
    //不再使用该方法
}

// 每日重置任务
function setMissionDailyReset(uid, cur) {
    setField(uid, cur, 'mission_daily_reset');
}

// 一次性任务
function setMissionOnlyOnce(uid, cur) {
    setField(uid, cur, 'mission_only_once');
}

// 海盗任务
function setPirate(uid, cur) {
    setField(uid, cur, 'pirate');
}

//----------------------------------------------------------
// 新手引导相关
//----------------------------------------------------------
// 强引导
function setGuide(uid, cur) {
    setField(uid, cur, 'guide');
}

function getGuide(uid, cb) {
    getAccountFieldById(uid, [account_def.GUIDE], function (err, account) {
        utils.invokeCallback(cb, null, account.guide);
    });
}

// 弱引导
function setGuideWeak(uid, cur) {
    setField(uid, cur, 'guide_weak');
}

function getGuideWeak(uid, cb) {
    getAccountFieldById(uid, [account_def.GUIDE_WEAK], function (err, account) {
        utils.invokeCallback(cb, null, account.guide_weak);
    });
}

//----------------------------------------------------------
// 月卡相关
//----------------------------------------------------------
// 对象, 表示月卡奖励是否领取(月卡有多种)
function setGetCard(uid, cur) {
    setField(uid, cur, 'get_card');
}

//----------------------------------------------------------
// 首充相关
//----------------------------------------------------------
// 对象, 表示不同等级钻石的首充
function setFirstBuy(uid, cur) {
    ErrorUtil.throwNullError('activity_gift', cur);
    setField(uid, cur, 'first_buy');
}

// 布尔类型, 表示首充奖励是否获取
function setFirstBuyGift(uid, cur) {
    setField(uid, cur, 'first_buy_gift');
}

//----------------------------------------------------------
// 经验相关
//----------------------------------------------------------

function setExp(uid, cur) {
    setField(uid, cur, 'exp', function (account) {
        let exp = parseInt(cur);
        if (exp == account.exp) return;
        account.exp = exp;
        account.commit();
    });
}

//----------------------------------------------------------
// 等级相关
//----------------------------------------------------------

function setLevel(uid, cur) {
    setField(uid, cur, 'level', function (account) {
        account.level = parseInt(cur);
        account.commit();
    });
}

//----------------------------------------------------------
// 技能相关
//----------------------------------------------------------

function setSkill(uid, cur) {
    ErrorUtil.throwNullError("skill", cur);
    setField(uid, cur, 'skill');
}

/**
 * 只是记录技能的使用, 具体操作在对应的获取代码中
 */
function addSkill(uid, deltaSkill) {
    const FUNC = TAG + "addSkill() --- ";
    opSkill(uid, deltaSkill, function (skill, skill_info) {
        logger.info(FUNC + "skill_info:", skill_info);
        if (skill) {
            // 使用缓存记录skill_log， 定时向数据库中写
            let skill_log = {
                account_id: uid,
                skill_id: skill_info.sid,
                gain: skill_info.num,
                cost: 0,
                total: skill["" + skill_info.sid],
                log_at: new Date().getTime(),
                nickname: 0,
            };
            CacheSkill.push(skill_log);
        }
    });
}

/**
 * 只是记录技能的使用, 具体操作在buzz_skill中
 */
function useSkill(account, deltaSkill) {
    const FUNC = TAG + "useSkill() --- ";
    opSkill(account, deltaSkill, function (skill, skill_info) {
        logger.info(FUNC + "skill_info:", skill_info);
        if (skill) {
            // 使用缓存记录skill_log， 定时向数据库中写
            let skill_log = {
                account_id: account.id,
                skill_id: skill_info.sid,
                gain: 0,
                cost: skill_info.num,
                total: skill["" + skill_info.sid],
                log_at: new Date().getTime(),
                nickname: 0,
            };
            CacheSkill.push(skill_log);
        }
    });
}

function opSkill(account, deltaSkill, cb) {
    if (account) {
        let skill = account.skill;
        for (let idx in deltaSkill) {
            let skill_info = deltaSkill[idx];
            cb(skill, skill_info);
        }
    }
    else {
        cb(null, {fail: 1});
    }
}

//----------------------------------------------------------
// 背包相关
//----------------------------------------------------------

function setPack(uid, cur) {
    ErrorUtil.throwNullError("package", cur);
    setField(uid, cur, 'package');
}

//----------------------------------------------------------
// 金币相关
//----------------------------------------------------------
function getGold(uid, cb) {
    getAccountFieldById(uid, [account_def.GOLD], function (err, account) {
        utils.invokeCallback(cb, null, account.gold);
    });
}

function costGold(uid, cost) {
    cost > 0 && setField(uid, cost, 'gold', function (account) {
        account.gold = Math.max(0, parseInt(account.gold) - parseInt(cost));
        account.commit();
    });
}

function setGold(uid, cur) {
    cur >= 0 && setField(uid, cur, 'gold', function (account) {
        if (cur != account.gold) {
            let inc_gold = cur - account.gold;
            account.gold = inc_gold;
            account.commit();
        }
    });
}

//----------------------------------------------------------
// 钻石相关
//----------------------------------------------------------
function getPearl(uid, cb) {
    getAccountFieldById(uid, [account_def.PEARL], function (err, account) {
        utils.invokeCallback(cb, null, account.pearl);
    });
}

// TODO: 钻石是否足够的判断
function addPearl(uid, add) {
    add > 0 && setField(uid, add, 'pearl', function (account) {
        logger.info("增加前:", account.pearl);
        account.pearl = parseInt(account.pearl) + parseInt(add);
        logger.info("增加后:", account.pearl);
        account.commit();
    });
}


// TODO: 钻石是否足够的判断
function addPearlEx(account, add) {
    if (add > 0) {
        logger.info("增加前:", account.pearl);
        account.pearl = parseInt(account.pearl) + parseInt(add);
        logger.info("增加后:", account.pearl);
        account.commit();
    }

}

function costPearl(uid, cost) {
    cost > 0 && setField(uid, cost, 'pearl', function (account) {
        logger.info("消费前:", account.pearl);
        account.pearl = Math.max(0, parseInt(account.pearl) - parseInt(cost));
        logger.info("消费后:", account.pearl);
        account.commit();
    });
}

function setPearl(account, cur) {

    if (cur >= 0 && account) {
        cur = parseInt(cur);
        if ((typeof(cur) == "undefined" || isNaN(cur))) {
            throw new Error('err, pearl wrong.');
        }
        if (cur != account.pearl) {
            account.pearl = cur;
            account.commit();
        }
    }
}

//----------------------------------------------------------
// 邮件操作
//----------------------------------------------------------

/**
 * 向指定玩家发邮件(内存中)
 */
function addSpecifyMail(mail_obj, player_list) {
    const FUNC = TAG + "addSpecifyMail() --- ";
    logger.info(FUNC + "player_list:", player_list);
    logger.info(FUNC + "player_list:", player_list);

    let palyer_array = player_list.split(",");
    palyer_array.forEach(function (id) {
        getAccountFieldById(id, [account_def.MAIL_BOX], function (err, account) {
            if (err) {
                logger.error(FUNC + 'err:', err);
                return;
            }
            if (account.mail_box == null) {
                account.mail_box = [mail_obj];
            }
            else {
                account.mail_box.push(mail_obj);
            }
            account.mail_box = account.mail_box;
            account.commit();
        });
    });
}

/**
 * 添加一条系统邮件到CacheAccount.
 */
function addSysMail(mail_obj) {
    const FUNC = TAG + "addSysMail()---";

    RedisUtil.repeatHscan(redisKeys.PLATFORM, 0, 1000,
        function op(res, nextCursor) {
            logger.info(FUNC + "res:", res);
            for (let i = 0; i < res[1].length; i += 2) {
                let uid = parseInt(res[1][i]);
                getAccountFieldById(uid, [account_def.MAIL_BOX], function (err, account) {
                    if (err) {
                        logger.error(FUNC + 'err:', err);
                        return;
                    }
                    if (account) {
                        account.mail_box = [mail_obj];
                        account.commit();
                    }
                });
            }
            nextCursor();
        },
        function next() {
            logger.info(FUNC + "所有邮件设置完毕");
        }
    );
}

/**
 * 获取玩家邮件列表.
 */
function getMailList(account, max_mail_id, num) {
    const FUNC = TAG + "getMailList()---";
    logger.info(FUNC + "缓存中存在用户数据");
    let mail_box = account.mail_box;
    logger.info(FUNC + "mail_box.0:", mail_box);
    if (max_mail_id != null && num != null) {
        mail_box = _.filter(mail_box, function (mail_id) {
            return mail_id > max_mail_id;
        });
        mail_box = mail_box.slice(0, num);
    }
    logger.info(FUNC + "mail_box.1:", mail_box);

    return mail_box;
}

/**
 * 获取玩家邮箱数据
 */
function getMailBox(id, cb) {
    const FUNC = TAG + "getMailBox()---";
    logger.info(FUNC + "CALL...");

    getAccountFieldById(id, [account_def.MAIL_BOX], function (err, account) {
        if (err) {
            logger.error(FUNC + 'err:', err);
            cb(err);
            return;
        }
        utils.invokeCallback(cb, null, account.mail_box);
    });
}

/**
 * 玩家在领取邮件奖励后需要删除邮件.
 */
function deleteMail(account, mail_id) {
    logger.info("删除前:", account.mail_box);
    account.mail_box = _.filter(account.mail_box, function (num) {
        return num != mail_id;
    });
    logger.info("删除后:", account.mail_box);
    account.commit();
}

/**
 * 查看玩家是否拥有获取奖励的那封邮件, 拥有邮件则返回true, 没有邮件则返回false.
 */
function hasMail(uid, mail_id, cb) {
    const FUNC = TAG + "hasMail()---";
    getAccountFieldById(uid, [account_def.MAIL_BOX], function (err, account) {
        if (err) {
            logger.error(FUNC + 'err:', err);
            cb(err);
            return;
        }
        let ret = _.contains(account.mail_box, mail_id);
        utils.invokeCallback(cb, null, ret);
    });
}

function setMailBox(uid, cur) {
    setField(uid, cur, 'mail_box');
}

/**
 * 返回所有玩家的邮箱数据.
 */
function getAllMailBox(cb) {
    const FUNC = TAG + "getAllMailBox()---";
    // redisSync.getUIDs(function (err, uids) {

    //     async.mapSeries(uids, function (uid, cb) {
    //         getAccountFieldById(uid, [account_def.MAIL_BOX], function (err, account) {
    //             if (err) {
    //                 logger.error(FUNC + 'err:', err);
    //                 cb(err);
    //                 return;
    //             }
    //             cb(null, {
    //                 id: uid,
    //                 mail_box: account.mail_box
    //             });
    //         });
    //     }, function (err, result) {
    //         utils.invokeCallback(cb, null, result);
    //     });

    // });
}

//----------------------------------------------------------
// tbl_gold操作
//----------------------------------------------------------

function setAccountGold(uid, account_gold) {
    getAccountById(uid, function (err, account) {
        if (!account.account_gold) {
            account.account_gold = {};
        }
        account.account_gold = account_gold;
        account.last_online_time = new Date().getTime();
        account.need_update = 1;
        account.commit();

    });
}

function setAccountGoldCurrentTotal(uid, current_total) {
    getAccountById(uid, function (err, account) {
        if (!account.account_gold) {
            account.account_gold = {};
        }
        account.account_gold.current_total = current_total;
        account.last_online_time = new Date().getTime();
        account.need_update = 1;
        account.commit();
    });
}

function addAccountGoldTotalGain(uid, gold_add) {
    getAccountById(uid, function (err, account) {
        if (!account.account_gold) {
            account.account_gold = {};
        }
        account.account_gold.total_gain += gold_add;
        account.last_online_time = new Date().getTime();
        account.need_update = 1;
        account.commit();
    });
}

function addAccountGoldTotalCost(uid, gold_cost) {
    getAccountById(uid, function (err, account) {
        if (!account.account_gold) {
            account.account_gold = {};
        }
        account.account_gold.total_cost += gold_cost;
        account.last_online_time = new Date().getTime();
        account.need_update = 1;
        account.commit();
    });
}

function setNeedInsert(uid) {
    getAccountById(uid, function (err, account) {
        account.need_insert = 1;
        account.commit();
    });
}

//----------------------------------------------------------
// 通用操作
//----------------------------------------------------------

/**
 * 插入一条数据, 每一条数据格式如下
 * {id, active, active_stat_once, active_stat_reset, free_draw}
 */
function push(data) {
    redisAccountSync.setAccount(data.id, data, function (err, result) {
        if (err) {
            logger.error('插入玩家数据失败');
        }
    });
}

function _safeLoadObj(field, value) {
    const FUNC = TAG + "_safeLoadObj() --- ";
    if (value == "null") {
        logger.error(FUNC + "[Error]" + field + "数据库为null字符串:", value);
        return {};
    }
    let ret = {};
    try {
        ret = ObjUtil.str2Data(value);
    }
    catch (e) {
        logger.error(FUNC + "[Error]" + field + "数据库为null字符串:", value);
    }
    return ret;
}

/**
 * 根据玩家ID获取一条记录RedisUtil.hset(PAIR.UID_SIGN_MONTH, uid, JSON.stringify(account.month_sign));
 */
function getAccountById(id, cb) {
    redisAccountSync.getAccount(id, function (err, account) {
        if (account != null) {
            if (account.mail_box == null || account.mail_box == "" || account.mail_box == []) {
                account.mail_box = [];
                account.has_new_mail = false;
            }
            else {
                account.has_new_mail = true;
            }
        }
        utils.invokeCallback(cb, err, account);
    });

}


function getAccountFieldById(id, fields, cb) {
    fields = fields || ['platform'];
    redisAccountSync.getAccount(id, fields, function (err, account) {
        utils.invokeCallback(cb, err, account);
    });
}


function setAccountById(id, data, cb) {
    redisAccountSync.setAccount(id, data, cb);
}


function uid_list(cb) {
    // redisSync.getUIDs(function (err, uids) {
    //     utils.invokeCallback(cb, null, uids);
    // });
}

function getAllIds(cb) {
    // redisSync.getUIDs(function (err, uids) {
    //     utils.invokeCallback(cb, null, uids);
    // });
}

function length(cb) {
    // redisSync.getUIDs(function (err, uids) {
    //     utils.invokeCallback(cb, null, uids.length);
    // });
}


/**
 * 检测缓存中是否存在某用户信息.
 */
function contains(id, cb) {
    getAccountFieldById(id, function (err, account) {
        utils.invokeCallback(cb, null, account != null);
    });
}

/**
 * 更新缓存数据(统一使用一个接口, 每次更新都要改变updated_at属性).
 */
function update(id, key, value) {
    getAccountById(id, function (err, account) {
        if (account) {
            account[key] = value;
            changeOnlineTime(account);
            account.commit();
        }
    });

}

/**
 * 复杂对象的更新.
 */
function useFreeDraw(account, type, times) {
    if (account) {
        if (type < 100) {
            switch (type) {
                case DRAW_TYPE.GOLD:
                    account.free_draw.gold -= times;
                    break;
                case DRAW_TYPE.PEARL:
                    account.free_draw.diamond -= times;
                    break;
            }
        }
        else {
            account.free_draw[type] -= times;
        }
        account.free_draw = account.free_draw;
        changeOnlineTime(account);
    }
}

function getActualCostTimes(uid, type, times, cb) {
    getAccountFieldById(uid, [account_def.FREE_DRAW], function (err, account) {
        let ret = times;
        if (account) {
            switch (type) {
                case DRAW_TYPE.GOLD:
                    ret = times - account.free_draw.gold;
                    break;
                case DRAW_TYPE.PEARL:
                    ret = times - account.free_draw.diamond;
                    break;
            }
            utils.invokeCallback(cb, null, ret < 0 ? 0 : ret);
        }
        else {
            utils.invokeCallback(cb, null, ret);
        }
    });
}

/**
 * 仅用来更新["19"]["0"]这个值(玩家活动期间充值的钻石数量)
 */
function updateActiveCharge(account, price) {
    const FUNC = TAG + "updateActiveCharge() --- ";

    logger.info(FUNC + "id:", account.id);

    if (account) {
        let new_charge = {
            "19": {
                "0": price,
                "1": price
            }
        };
        logger.info(FUNC + "price:", price);
        if (account.active && account.active["19"]) {
            if (account.active["19"]["0"]) {
                logger.info(FUNC + "更新前的充钻数(不重置):", account.active["19"]["0"]);
            }
            if (account.active["19"]["1"]) {
                logger.info(FUNC + "更新前的充钻数(每日重置):", account.active["19"]["1"]);
            }
        }
        else {
            logger.info(FUNC + "更新前的充钻数: 0");
        }
        _updateActiveChargeInCache(account, new_charge);
        // 没有更新active_daily_reset中的数据, 导致玩家拉取数据时被active_daily_reset重置.
        _updateActiveDailyResetInCache(account, new_charge);
        logger.info(FUNC + "更新后的充钻数(不重置):", account.active["19"]["0"]);
        logger.info(FUNC + "更新后的充钻数(每日重置):", account.active["19"]["1"]);
        logger.info(FUNC + "更新后的充钻数(active_daily_reset):", account.active_daily_reset["19"]["1"]);

        logger.info(FUNC + "account.active_daily_reset:", account.active_daily_reset);
        changeOnlineTime(account);
        account.commit();
    }

    function _updateActiveChargeInCache(account, active_new) {

        let accountActive = account.active;
        for (let c in active_new) {
            let val_list = active_new[c];
            if (_.has(accountActive, c)) {
                let condition = accountActive[c];
                for (let val1 in val_list) {
                    let num = val_list[val1];
                    if (_.has(condition, val1)) {
                        condition[val1] += num;
                    }
                    else {
                        condition[val1] = num;
                    }
                }
            }
            else {
                accountActive[c] = val_list;
            }
        }

        account.active = accountActive;
    }

    function _updateActiveDailyResetInCache(account, active_new) {
        let active_daily_reset = account.active_daily_reset;
        for (let condition in active_new) {
            let val_list = active_new[condition];

            if (!_.has(active_daily_reset, condition)) {
                active_daily_reset[condition] = {};
            }

            let condition_data = active_daily_reset[condition];
            for (let val1 in val_list) {
                let repeat = getRepeatFromActiveQuest(condition, val1);
                if (repeat) {
                    let num = val_list[val1];
                    if (_.has(condition_data, val1)) {
                        condition_data[val1] += num;
                    }
                    else {
                        condition_data[val1] = num;
                    }
                }
            }
        }

        account.active_daily_reset = active_daily_reset;
    }
}

/**
 * 返回活动是否重复, 默认返回不重复.
 * @param condition 判断条件1.
 * @param val1 判断条件2.
 */
function getRepeatFromActiveQuest(condition, val1) {
    for (let id in active_activequest_cfg) {
        let activequest = active_activequest_cfg[id];
        if (activequest.condition == condition && activequest.value1 == val1) {
            return activequest.repeat;
        }
    }
    return 0;// 默认返回不重复
}

//------------------------------------------------------------------------------
// 字段值获取包装
//------------------------------------------------------------------------------
function getFreeDraw(id, cb) {
    getAccountFieldById(id, [account_def.FREE_DRAW], function (err, account) {
        if (account) {
            utils.invokeCallback(cb, null, account.free_draw);
        }
        else {
            utils.invokeCallback(cb, null, null);
        }
    });
}

function getTotalDraw(id, cb) {
    getAccountFieldById(id, [account_def.TOTAL_DRAW], function (err, account) {
        if (account) {
            utils.invokeCallback(cb, null, account.total_draw);
        }
        else {
            utils.invokeCallback(cb, null, null);
        }
    });
}

//从缓存中移除一个用户.
function remove(uid) {
    // redisSync.delAccount(uid);
}

//从缓存中读取一个元素.
function _read(key, cb) {
    getAccountById(key, function (err, account) {
        utils.invokeCallback(cb, null, account);
    });
}

function changeOnlineTime(account) {
    let timeNow = (new Date()).format("yyyy-MM-dd hh:mm:ss");
    account.updated_at = timeNow;
    account.last_online_time = timeNow;
}

function setSex(uid, sex) {
    setField(uid, sex, "sex");
}

function setCity(uid, city) {
    setField(uid, city, "city");
}