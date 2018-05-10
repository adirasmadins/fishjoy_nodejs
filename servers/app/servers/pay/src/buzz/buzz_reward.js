const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const ObjUtil = require('./ObjUtil');
const ArrayUtil = require('../utils/ArrayUtil');
const DateUtil = require('../utils/DateUtil');
const BuzzUtil = require('../utils/BuzzUtil');
const RedisUtil = require('../utils/RedisUtil');
const CacheAccount = require('./cache/CacheAccount');
const dao_reward = require('../dao/dao_reward');
const CacheLogMailReward = require('./cache/CacheLogMailReward');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const daily_dailypast_cfg = gameConfig.daily_dailypast_cfg;
const common_const_cfg = gameConfig.common_const_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const newweapon_upgrade_cfg = gameConfig.newweapon_upgrade_cfg;
const player_level_cfg = gameConfig.player_level_cfg;
const daily_dailytarget_cfg = gameConfig.daily_dailytarget_cfg;
const RewardModel = require('../../../../utils/account/RewardModel');
/** 每次补签需要扣除的钻石数量 */
const MISS_SIGN = common_const_cfg.MISS_SIGN;

let DEBUG = 0;
let ERROR = 1;

const TAG = "【buzz_reward】";
exports.getReward = getReward;
exports.cost = cost;

exports.guideReward = guideReward;
exports.dailyReward = dailyReward;
exports.activeReward = activeReward;
exports.onekeyReward = onekeyReward;
exports.resetReward = resetReward;
exports.getRewardInfo = getRewardInfo;

/**
 * 验证用户有效性
 */
function getReward(account, reward, cb) {

    // 制作一个data数据.
    let data = {
        account: account,
        reward: reward
    };

    dao_reward.getCommonReward(data, cb);
}

/**
 * 验证用户有效性
 */
function cost(account, reward, cb) {

    // 制作一个data数据.
    let data = {
        account: account,
        reward: reward
    };

    dao_reward.costCommon(data, cb);
}

function guideReward(req, dataObj, cb) {
    const FUNC = TAG + "guideReward() --- ";
    //----------------------------------
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "guide_reward");

    _didGuideReward(req, dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_reward", cb);
    }
}

function dailyReward(req, dataObj, cb) {
    const FUNC = TAG + "dailyReward() --- ";
    //----------------------------------
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "daily_reward");

    _didDailyReward(req, dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'quest_id'], "buzz_reward", cb);
    }
}

function activeReward(req, dataObj, cb) {
    const FUNC = TAG + "activeReward() --- ";
    //----------------------------------
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "active_reward");

    _didActiveReward(req, dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'idx'], "buzz_reward", cb);
    }
}

function onekeyReward(req, dataObj, cb) {
    const FUNC = TAG + "onekeyReward() --- ";
    //----------------------------------
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "onekey_reward");

    _onekeyReward(req, dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'type'], "buzz_reward", cb);
    }
}

//==============================================================================
// private
//==============================================================================

/**
 * 查询本月的可签到状态
 * @return
 * {days:?, today:?}
 */
function _monthSign(req, dataObj, cb) {
    const FUNC = TAG + "_monthSign() --- ";
    let uid = dataObj.uid;
    let token = dataObj.token;
    let pool = req.pool;

    doNextWithAccount(dataObj.account);

    function doNextWithAccount(account) {

        // 从0开始, 即0为1号
        let today = new Date().getDate() - 1;
        // TODO: 玩家签到数据异常判定(可能是回档到上月)
        let new_month_sign = ArrayUtil.getIntArr(buzz_initdata.initMonthSign());

        for (let i = 0; i <= today; i++) {
            if (account.month_sign.length <= i) {
                break;
            }
            new_month_sign[i] = account.month_sign[i];
        }
        account.month_sign = new_month_sign;

        let ret = {
            days: account.month_sign,
            today: today,
            extra_states: account.month_sign_extra_reward
        };

        account.commit();

        cb(null, ret);

    }
}

/**
 * 领取每日奖励(签到奖励)
 * @return
 * {day:?,day_state:?}
 */
function _getDayReward(req, dataObj, cb) {
    const FUNC = TAG + "_monthSign() --- ";
    let uid = dataObj.uid;
    let token = dataObj.token;
    let day = dataObj.day;
    let today = new Date().getDate() - 1;
    let pool = req.pool;

    doNextWithAccount(dataObj.account);

    function doNextWithAccount(account) {
        if (!_checkGetDayReward(account, day, today, cb)) return;

        let dailypast = _getMonthDailypast(day);
        let reward = dailypast.reward;
        let viplevel = dailypast.viplevel;
        let times = 1;
        // 目前满足VIP等级的只有双倍奖励.
        if (viplevel > 0 && account.vip >= viplevel) {
            times = 2;
        }

        let gain_item_list = [{
            item_id: reward[0],
            item_num: reward[1] * times,
        }, ];
        let cost_item_list = [{
            item_id: "i002",
            item_num: MISS_SIGN,
        }, ];

        BuzzUtil.putIntoPack( account, gain_item_list, function (reward_info) {
            let reward_change = BuzzUtil.getChange(account, reward_info);
            let ret = {
                day: day,
                day_state: 1,
                item_list: gain_item_list,
            };
            // 设置month_sign
            // account.month_sign[day] = 1;

            let month_sign = account.month_sign;
            month_sign[day] = 1;
            account.month_sign = month_sign;
            account.commit();
            // CacheAccount.signMonth(uid, day);
            // 补签扣钻石
            if (day < today) {
                BuzzUtil.removeFromPack( account, cost_item_list, function (cost_info) {
                    let cost_change = BuzzUtil.getChange(account, cost_info);
                    let change = ObjUtil.merge(reward_change, cost_change);
                    ret.change = change;
                    cb(null, ret);
                    addGameLog();
                });
            } else {
                ret.change = reward_change;
                cb(null, ret);
                addGameLog();
            }

            function addGameLog() {
                let gain = 0;
                let cost = 0;
                // yDONE: 金币数据记录
                for (let i = 0; i < gain_item_list.length; i++) {
                    let item = gain_item_list[i];
                    let item_id = item.item_id;
                    let item_num = item.item_num;
                    if ('i001' == item_id) {
                        gain += item_num;
                    }
                }

                // yDONE: 钻石数据记录
                let diamondGain = 0;
                let diamondCost = 0;
                for (let i = 0; i < gain_item_list.length; i++) {
                    let item = gain_item_list[i];
                    let item_id = item.item_id;
                    let item_num = item.item_num;
                    if ('i002' == item_id) {
                        diamondGain += item_num;
                    }
                }
                for (let i = 0; i < cost_item_list.length; i++) {
                    let item = cost_item_list[i];
                    let item_id = item.item_id;
                    let item_num = item.item_num;
                    if ('i002' == item_id) {
                        diamondCost += item_num;
                    }
                }
                if (diamondGain > 0 || diamondCost > 0) {
                    logger.info(FUNC + uid + "签到领取到钻石:", diamondGain);
                    logger.info(FUNC + uid + "补签消耗钻石:", diamondCost);
                    logBuilder.addPearlLogEx({
                        account_id: uid,
                        log_at: new Date(),
                        gain: diamondGain,
                        cost: diamondCost,
                        total: account.pearl,
                        scene: common_log_const_cfg.MONTH_SIGN_REWARD,
                        nickname: 0,
                    });
                }

            }
        });
    }
}

//额外领奖
function _getDayExtraReward(req, dataObj, cb) {
    let token = dataObj.token;
    let id = dataObj.id;
    let account = dataObj.account;
    let month_sign = account.month_sign;
    let count = 0;
    for (let i = 0; i < month_sign.length; i++) {
        if (month_sign[i] === 1) count++;
    }
    let item_list = null;
    let days = 0;
    for (let i = 0; i < daily_dailytarget_cfg.length; i++) {
        let data = daily_dailytarget_cfg[i];
        if (id === data.id) {
            item_list = data.reward;
            days = data.days;
        }
    }
    if (count < days || !item_list) {
        cb && cb(ERROR_OBJ.DAY_EXTRA_REWARD_NOT_SATISFIED);
        return;
    }
    let monthSignExtraReward = account.month_sign_extra_reward;
    if (!monthSignExtraReward[id]) {
        let item = BuzzUtil.getItemList(item_list);
        BuzzUtil.putIntoPack( account, item, function (reward) {
            monthSignExtraReward[id] = 1;
            account.month_sign_extra_reward = monthSignExtraReward;
            account.commit();
            let change = BuzzUtil.getChange(account, reward);
            let ret = {
                change: change,
                item_list: item
            };
            cb(null, ret);
        });
    } else {
        cb && cb(ERROR_OBJ.DAY_EXTRA_REWARD_ALREADY);
    }
}

function _checkGetDayReward(account, day, today, cb) {
    const FUNC = TAG + "_checkGetDayReward() ...";
    let month_sign = account.month_sign;

    if (day >= month_sign.length || day < 0) {
        cb(ERROR_OBJ.SIGN_DAY_OUT_OF_RANGE);
        return false;
    }
    if (month_sign[day] == 1) {
        cb(ERROR_OBJ.SIGN_REPEAT);
        return false;
    }
    if (month_sign[day] == 2) {
        cb(ERROR_OBJ.SIGN_FORBIDDEN1);
        return false;
    }
    if (today < day) {
        cb(ERROR_OBJ.SIGN_FORBIDDEN2);
        return false;
    }
    if (day < today && account.pearl < MISS_SIGN) {
        cb(ERROR_OBJ.SIGN_DIAMOND_NOT_ENOUGH);
        return false;
    }

    return true;
}

function _getMonthDailypast(day) {
    for (let idx in daily_dailypast_cfg) {
        let dailypast = daily_dailypast_cfg[idx];
        if (dailypast.type == 1 && dailypast.id == day + 1) {
            return dailypast;
        }
    }
    return null;
}


//----------------------------------------------------------
// 领奖

/**
 * 强制引导结束后领奖.
 */
function _didGuideReward(req, dataObj, cb) {
    const FUNC = TAG + "_didGuideReward() --- ";
    let uid = dataObj.uid;
    let token = dataObj.token;
    let pool = req.pool;

    doNextWithAccount(dataObj.account);

    function doNextWithAccount(account) {
        //新手完成，获得100万兑换券("i200")，30级可用
        let item_list = [];
        item_list.push({
            item_id: "i200",
            item_num: 1,
        });
        let needpower = 3000;
        let weapon_level_next = 5;
        if (newweapon_upgrade_cfg[weapon_level_next] &&
            newweapon_upgrade_cfg[weapon_level_next].needpower) {
            needpower = newweapon_upgrade_cfg[weapon_level_next].needpower;
        }
        let gold = 1000;
        if (player_level_cfg && player_level_cfg.length > 0 && player_level_cfg[0]) {
            gold = player_level_cfg[0].newcomergold;
        }
        CacheAccount.setGold(account.id, gold);
        let wpEng = {
            '1': 0
        };
        wpEng[weapon_level_next] = needpower;
        CacheAccount.setWeaponEnergy(uid, wpEng);
        BuzzUtil.putIntoPack( account, item_list, function (reward) {
            let change = BuzzUtil.getChange(account, reward);
            let ret = {};
            ret.item_list = item_list;
            ret.change = {};
            ret.change.package = account.package;
            ret.change.weapon = weapon_level_next;
            ret.change.weapon_energy = wpEng;
            ret.change.gold = gold;
            cb(null, ret);
        });
    }
}

/**
 * desperated
 */
function _didDailyReward(req, dataObj, cb) {
    const FUNC = TAG + "_didDailyReward() --- ";
    let uid = dataObj.uid;
    let token = dataObj.token;

    doNextWithAccount(dataObj.account);

    function doNextWithAccount(account) {}
}

/**
 * desperated
 */
function _didAchieveReward(req, dataObj, cb) {
    const FUNC = TAG + "_didAchieveReward() --- ";
    let uid = dataObj.uid;
    let token = dataObj.token;
    let pool = req.pool;

    DaoCommon.checkAccount(pool, token, function (error, account) {
        if (error) {
            cb(error);
            return;
        }
        doNextWithAccount(account);
    });

    function doNextWithAccount(account) {}
}

//----------------------------------------------------------
// 任务领奖

/** 任务类型 */
const QUEST_TYPE = {
    /** 每日重置任务 */
    DAILY_RESET: 0,
    /** 成就任务, 只能达成一次 */
    ACHIEVE_ONCE: 1,
};

function _getMissionRecordByType(account, quest_type) {
    switch (quest_type) {
        case QUEST_TYPE.DAILY_RESET:
            return account.mission_daily_reset;
        case QUEST_TYPE.ACHIEVE_ONCE:
            return account.mission_only_once;
    }
    return null;
}

//----------------------------------------------------------
// 活跃领奖

/**
 * 活跃领奖
 */
function _didActiveReward(req, dataObj, cb) {
    const FUNC = TAG + "_didActiveReward() --- ";
    let uid = dataObj.uid;
    let token = dataObj.token;
    let idx = dataObj.idx;

    doNextWithAccount(dataObj.account);

    function doNextWithAccount(account) {

        let vitality = BuzzUtil.getVitalityByIdx(idx);
        if (!_checkActiveReward1()) return;

        let item_list = BuzzUtil.getItemList(vitality.reward);

        // 需要将成就点进行更新
        BuzzUtil.putIntoPack( account, item_list, function (reward) {
            let change = BuzzUtil.getChange(account, reward);
            let ret = {
                item_list: item_list,
                change: change,
                idx: idx,
            };

            account.mission_daily_reset["box" + idx] = 1;
            account.mission_daily_reset = account.mission_daily_reset;
            account.commit();
            cb(null, ret);
        });

        // 校验方法1
        function _checkActiveReward1() {
            if (null == vitality) {
                cb(ERROR_OBJ.MISSION_WRONG_ACTIVE_IDX);
                return false;
            }

            let dailyTotal = account.mission_daily_reset.dailyTotal;
            if (vitality.value > dailyTotal) {
                cb(ERROR_OBJ.MISSION_ACTIVE_DISATISFY);
                return false;
            }

            let box = account.mission_daily_reset["box" + idx];
            if (box > 0) {
                cb(ERROR_OBJ.MISSION_GOTTON);
                return false;
            }

            return true;
        }
    }
}

//----------------------------------------------------------
// 一键领取

const ONE_KEY_REWARD_TYPE = {
    ACHIEVE: 0,
    DAILY: 1,
    MAIL: 2,
};

/**
 * 一键领取
 */
function _onekeyReward(req, dataObj, cb) {
    const FUNC = TAG + "_onekeyReward() --- ";
    let uid = dataObj.uid;
    let token = dataObj.token;
    let type = dataObj.type;

    doNextWithAccount(dataObj.account);

    function doNextWithAccount(account) {

        if (!_checOnekeyReward1()) return;

        let item_list = [];
        // TODO: 一键领取逻辑
        // 分不同类型
        switch (type) {
            case ONE_KEY_REWARD_TYPE.ACHIEVE:
                rewardAllAchieve(item_list, function (item_list) {
                    handleResult(item_list);
                });
                break;
            case ONE_KEY_REWARD_TYPE.DAILY:
                rewardAllDaily(item_list, function (item_list) {
                    handleResult(item_list);
                });
                break;
            case ONE_KEY_REWARD_TYPE.MAIL:
                rewardAllMail(item_list, function (item_list) {
                    handleResult(item_list);
                });
                break;
        }

        function handleResult(item_list) {
            if (DEBUG) logger.info(FUNC + "item_list:\n", item_list);
            BuzzUtil.putIntoPack( account, item_list, function (reward_info) {
                let change = BuzzUtil.getChange(account, reward_info);
                account.mission_only_once.achievePoint = account.achieve_point;
                if (DEBUG) logger.info(FUNC + "mission_daily_reset:", account.mission_daily_reset);
                let ret = {
                    item_list: item_list,
                    change: change,
                };
                switch (type) {
                    case ONE_KEY_REWARD_TYPE.ACHIEVE:
                    case ONE_KEY_REWARD_TYPE.DAILY:
                        ret.mission_only_once = account.mission_only_once;
                        ret.mission_daily_reset = account.mission_daily_reset;
                        if (DEBUG) logger.info(FUNC + "mission_only_once:", ret.mission_only_once);
                        break;
                    case ONE_KEY_REWARD_TYPE.MAIL:
                        ret.mail_box = account.mail_box;
                        // TODO:改是否有邮件的值
                        break;
                }
                if (DEBUG) logger.info(FUNC + "ret:", ret);
                cb(null, ret);
                addGameLogForOneKeyReward(item_list, account, type);
            });
        }

        function addGameLogForOneKeyReward(item_list, account, type) {
            let scene = common_log_const_cfg.MAIL;
            switch (type) {
                case ONE_KEY_REWARD_TYPE.ACHIEVE:
                    scene = common_log_const_cfg.ACHIEVE_GAIN;
                    break;

                case ONE_KEY_REWARD_TYPE.DAILY:
                    scene = common_log_const_cfg.DAILY_GAIN;
                    break;
            }

            logger.info(FUNC + "000mailReward:", item_list);
            let goldGain = 0;
            let diamondGain = 0;
            let huafeiGain = 0;
            for (let i = 0; i < item_list.length; i++) {
                let item = item_list[i];
                let item_id = item.item_id;
                let item_num = item.item_num;
                if ('i001' == item_id) {
                    goldGain += item_num;
                }
                if ('i002' == item_id) {
                    diamondGain += item_num;
                }
                if ('i003' == item_id) {
                    huafeiGain += item_num;
                }
            }
            let uid = account.id;
            if (goldGain > 0) {
                // yDONE: 金币记录日志
                logger.info(FUNC + uid + "领取邮件发放的金币");
                logBuilder.addGoldLogEx({
                    account_id: uid,
                    log_at: new Date(),
                    gain: goldGain,
                    cost: 0,
                    duration: 0,
                    total: account.gold,
                    scene: scene,
                    nickname: 0,
                    level: account.level,
                });
            }
            if (diamondGain > 0) {
                // yDONE: 钻石记录日志
                logger.info(FUNC + uid + "领取邮件发放的钻石");
                logBuilder.addPearlLogEx({
                    account_id: uid,
                    log_at: new Date(),
                    gain: diamondGain,
                    cost: 0,
                    total: account.pearl,
                    scene: scene,
                    nickname: 0,
                });
            }
            if (huafeiGain > 0) {
                // yDONE: 话费券记录日志
                logger.info(FUNC + uid + "领取邮件发放的话费券");
                let total = account.package['9']['i003'];
                logBuilder.addHuafeiLog({
                    uid: uid,
                    gain: huafeiGain,
                    cost: 0,
                    total: total,
                    scene: scene,
                    comment: "'邮件发放话费券'",
                    time: new Date(),
                });
            }
        }

        // 校验方法1
        function _checOnekeyReward1() {
            if (ONE_KEY_REWARD_TYPE.ACHIEVE != type &&
                ONE_KEY_REWARD_TYPE.DAILY != type &&
                ONE_KEY_REWARD_TYPE.MAIL != type) {
                cb(ERROR_OBJ.MISSION_WRONG_TYPE);
                return false;
            }

            return true;
        }

        /**
         mission_only_once: {
        "1001": 0,
        "201400": 9,
        "achievePoint": 0
    }
         */
        function rewardAllAchieve(item_list, cb) {
            const FUNC = TAG + "rewardAllAchieve() --- ";
            let has_more = false;
            for (let idx in account.mission_only_once) {
                if ("achievePoint" != idx) {
                    let cur_value = account.mission_only_once[idx];
                    let quest = BuzzUtil.getQuestById(idx);
                    if (null != quest && cur_value >= quest.value2) {
                        let temp_item_list = BuzzUtil.getItemList(quest.reward);
                        let gold_acc = BuzzUtil.getGoldRewardFromItemList(temp_item_list);
                        let achieve_acc = BuzzUtil.getAchieveRewardFromItemList(temp_item_list);
                        item_list = ObjUtil.mergeItemList(item_list, temp_item_list);
                        if (DEBUG) logger.info(FUNC + "quest_id:", idx);
                        if (DEBUG) logger.info(FUNC + "temp_item_list:\n", temp_item_list);
                        has_more = true;
                        let precondition = quest.precondition;
                        if (0 != precondition) {
                            account.mission_only_once['' + precondition] = cur_value;
                            delete account.mission_only_once[idx];
                        } else {
                            account.mission_only_once[idx] = -1;
                        }
                        if (gold_acc > 0) {
                            let gold_quest_id = BuzzUtil.getGoldQuestIdByMission(account.mission_only_once);
                            if (gold_quest_id != null) {
                                account.mission_only_once[gold_quest_id] += gold_acc;
                            }
                        }
                        if (DEBUG) logger.info(FUNC + "achieve_acc:", achieve_acc);
                        if (achieve_acc > 0) {
                            let achieve_quest_id = BuzzUtil.getAchieveQuestIdByMission(account.mission_only_once);
                            if (DEBUG) logger.info(FUNC + "achieve_quest_id:", achieve_quest_id);
                            if (achieve_quest_id != null) {
                                account.mission_only_once[achieve_quest_id] += achieve_acc;
                                if (DEBUG) logger.info(FUNC + "achieve_quest_step:", account.mission_only_once[achieve_quest_id]);
                            }
                        }
                    }
                }
            }
            if (has_more) {
                rewardAllAchieve(item_list, cb);
            } else {
                cb(item_list);
            }
        }

        /**
         mission_daily_reset: {
    '101000': 56,
    '102000': 1,
    '107000': 4,
    '111000': 100001,
    '119000': 2,
    dailyTotal: 30,
    box0: 0,
    box1: 0,
    box2: 0,
    box3: 0 
    }
         */
        function rewardAllDaily(item_list, cb) {
            const FUNC = TAG + "rewardAllDaily() --- ";
            let mission_daily_reset = account.mission_daily_reset;
            if (DEBUG) logger.info(FUNC + "mission_daily_reset:", JSON.stringify(mission_daily_reset));
            for (let idx in mission_daily_reset) {
                let mission = mission_daily_reset[idx];
                let cur_value = mission_daily_reset[idx];
                let quest = BuzzUtil.getQuestById(idx);
                if (DEBUG) logger.info(FUNC + "queat idx:", idx);
                if (DEBUG) logger.info(FUNC + "当前值:", cur_value);
                if (quest) logger.info(FUNC + "目标值:", quest.value2);
                if (quest && cur_value >= quest.value2) {
                    let temp_item_list = BuzzUtil.getItemList(quest.reward);
                    item_list = ObjUtil.mergeItemList(item_list, temp_item_list);
                    let precondition = quest.precondition;
                    if (0 != precondition) {
                        delete account.mission_daily_reset[idx];
                    } else {
                        account.mission_daily_reset[idx] = -1;
                    }
                }
            }
            cb(item_list);
        }

        function rewardAllMail(item_list, cb) {
            let mail_box = account.mail_box;
            _getMailsDetail(mail_box, function (err, mails) {
                if (err || !mails) {
                    cb && cb(ERROR_OBJ.MAIL_LIST_EMPTY);
                    return;
                }

                mail_box.forEach(function (id) {
                    let mail = mails[id];
                    if (mail.reward != null) {
                        if (DEBUG) logger.info(FUNC + "字符串 reward:", mail.reward);
                        let reward = ObjUtil.str2Data(mail.reward);
                        if (DEBUG) logger.info(FUNC + "对象 reward:", reward);
                        let temp_item_list = BuzzUtil.getItemList(reward);
                        item_list = ObjUtil.mergeItemList(item_list, temp_item_list);

                        // yDONE: 增加一条玩家领取邮件奖励的记录
                        logger.info(FUNC + "增加一条玩家领取邮件奖励的记录");
                        let mailReward = {
                            uid: uid,
                            mid: id,
                            reward: ObjUtil.data2String(mail.reward),
                            log_at: DateUtil.format(new Date(), "yyyy-MM-dd hh:mm:ss"),
                        };
                        CacheLogMailReward.push(mailReward);
                    }
                });

                account.mail_box = [];
                account.commit();

                if (DEBUG) logger.info(FUNC + "item_list:", item_list);
                cb(item_list);
            });
        }

        function _getMailsDetail(mids, cb) {

            let sp = '';
            for (let i = 1; i <= mids.length; ++i) {
                sp += '?';
                if (i != mids.length) {
                    sp += ',';
                }
            }

            let sql = `SELECT * FROM tbl_mail WHERE id IN(${sp})`;
            mysqlConnector.query(sql, mids, function (err, results) {
                if (err) {
                    cb(err);
                    return;
                }

                let objs = {};

                if (results && results.length) {
                    for (let i = 0; i < results.length; ++i) {
                        objs[results[i].id] = results[i];
                    }
                }

                cb(err, objs);
            });

        }
    }
}

function resetReward(req, token, redis_key, hash, account, cb) {
    let uid = account.id;
    RedisUtil.hincr(hash, uid, function (err, incr_id) {
        if (err) {
            cb && cb(err);
            return;
        }
        if (incr_id == 1) {
            RedisUtil.hget(redis_key, uid, function (err, reward) {
                if (err) {
                    cb && cb(err);
                    return;
                }
                if (reward) {
                    reward = JSON.parse(reward);
                }
                if (reward && reward.award) {
                    let item_list = BuzzUtil.getItemList(reward.award);
                    BuzzUtil.putIntoPack( account, item_list, function (reward_info) {
                        let change = BuzzUtil.getChange(account, reward_info);
                        let ret = {
                            item_list: item_list,
                            change: change,
                            my_rank: reward.rank || 10001,
                            reward: 0,
                        };
                        let value = {
                            rank: reward.rank || 10001
                        };
                        if (reward.score) {
                            value.score = reward.score;
                        }
                        RedisUtil.hset(redis_key, uid, JSON.stringify(value), function (err, res) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            RedisUtil.hdel(hash, uid, function (err, res) {
                                if (err) {
                                    cb(err);
                                    return;
                                }
                                cb(null, ret);
                            });
                        });

                        for (let i = 0; i < item_list.length; i++) {
                            let item_info = item_list[i];

                            if ('i001' == item_info.item_id) {

                                // yDONE: 金币数据记录
                                let data = {
                                    account_id: uid,
                                    token: token,
                                    total: change.gold,
                                    duration: 0,
                                    group: [{
                                        "gain": item_info.item_num,
                                        "cost": 0,
                                        "scene": common_log_const_cfg.CHARTS_REWARD,
                                    }],
                                };
                                dao_gold.addGoldLogCache(req.pool, data, function (err, res) {
                                    if (err) return logger.error("err:", err);
                                });
                            }
                            if ('i002' == item_info.item_id) {
                                // yDONE: 钻石数据记录
                                logBuilder.addPearlLogEx({
                                    account_id: uid,
                                    log_at: new Date(),
                                    gain: item_info.item_num,
                                    cost: 0,
                                    total: change.pearl,
                                    scene: common_log_const_cfg.CHARTS_REWARD,
                                    nickname: 0,
                                });
                            }
                            if ('i003' == item_info.item_id) {
                                // yDONE: 话费券数据记录
                                let total = account.package['9']['i003'];
                                logBuilder.addHuafeiLog({
                                    uid: uid,
                                    gain: item_info.item_num,
                                    cost: 0,
                                    total: total,
                                    scene: common_log_const_cfg.CHARTS_REWARD,
                                    comment: "'排行榜奖励中获得话费券'",
                                    time: new Date(),
                                });
                            }
                        }
                    });
                } else {
                    // logger.info("*****************3*******************");
                    RedisUtil.hdel(hash, uid, function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        cb();
                    });
                }
            });
        } else {
            RedisUtil.expire(hash, uid, 5);
            cb();
        }
    });
}

function getRewardInfo(account, redis_key, cb) {
    let uid = account.id;
    RedisUtil.hget(redis_key, uid, function (err, res) {
        if (err) {
            cb(err);
            return;
        }
        // logger.info("============>",redis_key,uid,res);
        if (res) {
            res = JSON.parse(res);
        }
        cb(null, res);
    });

}