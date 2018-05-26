const _ = require('underscore');
const async = require('async');
const tools = require('../../../../utils/tools');
const CommonUtil = require('./CommonUtil');
const BuzzUtil = require('../utils/BuzzUtil');
const RedisUtil = require('../utils/RedisUtil');
const CstError = require('../../../../consts/fish_error');
const buzz_reward = require('./buzz_reward');
const redisKeys = require('../../../../database').dbConsts.REDISKEY;
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const advert_advert_cfg = gameConfig.advert_advert_cfg;
const ERROR_OBJ = CstError.ERROR_OBJ;


const TAG = "【buzz_gift】";

exports.getAdvGift = getAdvGift;
exports.getAdReward = getAdReward;
exports.getAdRewardTimes = getAdRewardTimes;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 获取玩家今日领取观看广告奖励的次数
 * @param {*} req 
 * @param {*} data 
 * @param {*} cb 
 */
function getAdRewardTimes(data, cb) {
    _getAdRewardTimes(data, cb);
}

function _getAdRewardTimes(data, cb) {
    let account=data.account;
    let uid = data.uid;
    RedisUtil.hget(redisKeys.ADV_REWARD_TIMES, uid, function (err, res) {
        if (err) return cb(err);
        if (!res) res = getAdvInit();
        cb(null, res);
    });
}

/**
 * 获取观看广告的奖励
 */
function getAdReward(data, cb) {
    if (!lPrepare(data, cb)) return;

    _getAdReward(data, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'type'], "buzz_gift", cb);
    }

}

// TODO: 读取配置表
const MAX_ADV_REWARD_TIMES = getAdvLimit();

function _getAdReward(data, cb) {
    const FUNC = TAG + "_getAdReward() --- ";
    let account=data.account;
    let uid = data.uid;
    let type = data.type;
    let adv_reward_times = account.adv_reward_times;


    async.waterfall(
        [
            function step1(cb) {
                RedisUtil.hget(redisKeys.ADV_REWARD_TIMES, uid, function (err, res) {
                    if (err){
                        logger.error(FUNC + "res:", res);
                        cb(err);
                        return ;
                    }
                    if (!res) {
                        res = getAdvInit();
                    }
                    else {
                        res = JSON.parse(res);
                    }
                    logger.info(FUNC + "res:", res);
                    cb(null, res);
                });
            }
            , function step2(advRewardTimes, cb) {
            logger.info(FUNC + "advRewardTimes:", advRewardTimes);
            logger.info(FUNC + "MAX_ADV_REWARD_TIMES:", MAX_ADV_REWARD_TIMES);
            if (advRewardTimes[type] >= MAX_ADV_REWARD_TIMES[type]) {
                cb(ERROR_OBJ.ADV_REWARD_TIMES_FINISH);
            }
            else {
                lGetReward(account, advRewardTimes, cb);
            }
        }
        ],
        function next(err, ret) {
            cb && cb(err, ret);
        }
    );

    function lGetReward(account, advRewardTimes, cb) {
        // TODO: 读取配置表
        let advCfg = getAdvCfg(type);
        let item_list = [];
        if(advCfg) {
            let reward = advCfg.reward;
            item_list = BuzzUtil.getItemList(reward);
        }
        else {
            cb(ERROR_OBJ.ADV_REWARD_TIMES_FINISH);
            return;
        }
        advRewardTimes[type]++;
        BuzzUtil.putIntoPack( account, item_list, function (rewardObj) {
            let change = BuzzUtil.getChange(account, rewardObj);
            let ret = {
                item_list: item_list,
                change: change,
                adv_reward_times: advRewardTimes,
            };
            cb(null, ret);
            RedisUtil.hset(redisKeys.ADV_REWARD_TIMES, uid, JSON.stringify(advRewardTimes));
        });
    }
}

function getAdvCfg(id) {
    for (let i = 0; i < advert_advert_cfg.length; i++) {
        let advCfg = advert_advert_cfg[i];
        if (advCfg.id == id) {
            return advCfg;
        }
    }
}

function getAdvInit() {
    const FUNC = TAG + "getAdvInit() --- ";
    let ret = {};
    for (let i = 0; i < advert_advert_cfg.length; i++) {
        let advCfg = advert_advert_cfg[i];
        ret[advCfg.id] = 0;
    }
    logger.info(FUNC + "ret:", ret);
    return ret;
}

function getAdvLimit() {
    let ret = {};
    for (let i = 0; i < advert_advert_cfg.length; i++) {
        let advCfg = advert_advert_cfg[i];
        ret[advCfg.id] = advCfg.limit;
    }
    return ret;
}

/**
 * 获取广告礼包
 */
function getAdvGift(data, cb) {
    const FUNC = TAG + "getAdvGift() --- ";
    if (!_prepare(data, cb)) return;
    let gift_id = data.giftid;
    let gift_info = tools.CfgUtil.daily_dailypast.getInfo(gift_id);
    let reward = [gift_info.reward];
    let account=data.account;
    if (account.day_reward_adv) {
        logger.error(FUNC + "玩家已经领取了今日礼包");
        cb(ERROR_OBJ.GIFT_ADV_GOTTEN);
        return;
    }
    if (gift_id == 910) {
        if (!account.new_reward_adv) {
            // 领取奖励
            buzz_reward.getReward(account, gift_info.reward, function (err, results) {
                // 获取奖励成功
                logger.info(FUNC + "获取新手奖励成功");
                // 设置day_reward_adv为已经领取(1)
                account.day_reward_adv = 1;
                account.commit();
                let ret = {
                    gold: account.gold,
                    pearl: account.pearl,
                    package: account.package,
                    skill: account.skill,
                };
                cb(null, ret);
            });
        }
        else {
            cb({ code: 1111111, msg: "你已经领取过新手礼包了" });
        }
    }
    else {
        // 领取奖励
        buzz_reward.getReward(account, reward, function (err, results) {
            // 获取奖励成功
            logger.info(FUNC + "获取奖励成功");
            // 设置day_reward_adv为已经领取(1)
            account.day_reward_adv = 1;
            account.commit();
            let ret = {
                gold: account.gold,
                pearl: account.pearl,
                package: account.package,
                skill: account.skill,
            };
            cb(null, ret);
        });
    }
}


//==============================================================================
// private
//==============================================================================

function _prepare(data, cb) {

    let token = data['token'];
    let giftid = data['giftid'];

    logger.info("token:", token);
    logger.info("giftid:", giftid);

    if (!CommonUtil.isParamExist("buzz_gift", token, "接口调用请传参数token", cb)) return false;
    if (!CommonUtil.isParamExist("buzz_gift", giftid, "接口调用请传参数giftid(广告礼包ID)", cb)) return false;

    return true;

}
