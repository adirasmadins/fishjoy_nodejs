const BuzzUtil = require('../utils/BuzzUtil');
const CommonUtil = require('./CommonUtil');
const DateUtil = require('../utils/DateUtil');
const CacheAccount = require('./cache/CacheAccount');
const Item = require('./pojo/Item');
const _ = require('underscore');
const buzz_account = require('./buzz_account');
const buzz_charts = require('./buzz_charts');
const cache = require('../rankCache/cache');
const DaoCommon = require('../dao/dao_common');
const RANK_TYPE = require('../rankCache/cacheConf').RANK_TYPE;
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const tools = require('../../../../utils/tools');
const goddess_goddess_cfg = gameConfig.goddess_goddess_cfg;// 女神基础数据
const goddess_goddessup_cfg = gameConfig.goddess_goddessup_cfg;// 女神升级数据
const common_const_cfg = gameConfig.common_const_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const shop_shop_buy_type_cfg = gameConfig.shop_shop_buy_type_cfg;
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const ItemTypeC = Item.ItemTypeC;
const RewardModel = require('../../../../utils/account/RewardModel');

const TAG = "【buzz_goddess】";

/** */
const GODDESS_PROPERTY = {
    GOLD_SHOPPING: 12,
};
exports.GODDESS_PROPERTY = GODDESS_PROPERTY;

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.init = init;
exports.getLeftDays = getLeftDays;
exports.getDefend = getDefend;
exports.getUnlocked = getUnlocked;
exports.updateLevel = updateLevel;
exports.challengeGoddess = challengeGoddess;
exports.unlock = unlock;
exports.levelup = levelup;
exports.weekReward = weekReward;
exports.queryWeekReward = queryWeekReward;
exports.putWeekReward = putWeekReward;
exports.getGoddessTop1 = getGoddessTop1;


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 获取初始化的女神数据
 */
function init() {
    logger.info("【CALL】 buzz_goddess.init()");

    return JSON.stringify(_initGods());
}

function getLeftDays() {
    let ret = [];
    for (let i = 0; i < goddess_goddess_cfg.length; i++) {
        let goddess = goddess_goddess_cfg[i];
        let opentime = goddess.opentime;
        let left_days = DateUtil.leftDays(opentime);
        ret.push(left_days);
    }
    return ret;
}

function getDefend(data, cb) {
    let account=data.account;
    let goddess = account.goddess;
    let goddess_free = account.goddess_free;
    let goddess_ctimes = account.goddess_ctimes;

    // 检查goddess数据
    for (let i = 0; i < goddess.length; i++) {
        let unlock = goddess[i].unlock;
        let goddess_unlock = 1;
        for (let j = 0; j < unlock.length; j++) {
            if (unlock[j] < 2) {
                goddess_unlock = 0;
            }
        }
        if (goddess_unlock && goddess[i].level == 0) {
            goddess[i].level = 1;
        }
    }

    let first_goddess = goddess[0];
    if (first_goddess && first_goddess.level == 0) {
        first_goddess.level = 1;
        first_goddess.unlock = [2, 2, 2, 2, 2, 2, 2, 2, 2];
    }
    account.goddess = goddess;
    account.commit();
    CacheAccount.resetCharmPoint(account, function (chs) {});
    let response = {
        leftDays: getLeftDays(),
        gods: goddess,
        free: goddess_free,
        ctimes: goddess_ctimes,
    };
    cb(null, response);
}


function getUnlocked(account) {
    const FUNC = TAG + "getUnlocked()---";
    logger.info(FUNC + "CALL...");

    let list = account.goddess;// 一定要把字符串转换为对象处理，否则会得到第一个字符而不是第一个对象
    let response = {};
    for (let idx in list) {
        let goddess = list[idx];
        if (_isGoddessUnlocked(goddess)) {
            response['' + goddess.id] = {
                lv: goddess.level,
                state: 0// 0为未放置状态, 这个值稍后由aquarium修改
            };
        }
    }
    return response;


}

function updateLevel(account) {
    let aquarium_goddess = account.aquarium.goddess;
    let FUNC = TAG + "updateLevel() --- ";
    logger.info(FUNC + "CALL...");
    let list = account.goddess;
    for (let idx in list) {
        let goddess = list[idx];
        logger.info(FUNC + "goddess:", goddess);
        if (_isGoddessUnlocked(goddess)) {
            if (!aquarium_goddess['' + goddess.id]) {
                aquarium_goddess['' + goddess.id] = {};
            }
            aquarium_goddess['' + goddess.id].lv = goddess.level;
        }
    }
    account.aquarium = account.aquarium;
    account.commit();
}

/**
 * 挑战女神.
 */
function challengeGoddess(data, cb) {
    let FUNC = TAG + "challengeGoddess() --- ";
    let account=data.account;
    // 账户数据中原来的女神数据
    let uid = data.uid;
    let goddess_free = account.goddess_free;
    let goddess_ctimes = account.goddess_ctimes;
    logger.info(FUNC + "goddess_free:\n", goddess_free);
    logger.info(FUNC + "goddess_ctimes:\n", goddess_ctimes);
    if (goddess_free > 0) {
        logger.info(FUNC + "不消耗钻石");
        goddess_free--;
        account.goddess_free = goddess_free;
    }
    else {
        logger.info(FUNC + "计算消耗钻石");
        let pearl_cost = _getPrice(goddess_ctimes);
        logger.info(FUNC + "pearl_cost:", pearl_cost);
        // 消耗钻石
        if (account.pearl < pearl_cost) {
            logger.error(FUNC + "玩家钻石不足, 不能挑战女神");
            // 客户端无法把这个错误导向钻石购买, 返回一个消耗钻石数
            // cb(ERROR_OBJ.DIAMOND_NOT_ENOUGH);
            let ret = {
                pearl_cost: pearl_cost
            };
            cb(null, ret);
            return;
        }
        account.pearl = -pearl_cost;
        goddess_ctimes++;
        account.goddess_ctimes = goddess_ctimes;
        logBuilder.addItemLog(uid, 'i002', -pearl_cost, account.pearl, common_log_const_cfg.GOD_CHALLENGE, account.level);
    }
    //统计女神挑战次数dfc
    let mission = new RewardModel(account);
    mission.updateProcess(RewardModel.TaskType.DEFEND_GODDESS, 1);
    mission.updateProcess(RewardModel.TaskType.GODDESS_LEVEL, account.max_wave);
    mission.commit(); //等价account.commit()
    let ret = {
        pearl: account.pearl,
        free: account.goddess_free,
        ctimes: account.goddess_ctimes,
    };
    cb(null, ret);
}

/**
 * 女神解锁
 */
function unlock(dataObj, cb) {
    if (!lPrepare(dataObj)) return;
    let account = dataObj.account;
    let goddess_id = dataObj.goddess_id;
    let idx = dataObj.idx;
    let goddess_list = account.goddess;
    let goddess_info = tools.BuzzUtil.getGoddessById(goddess_id);
    if (!_checkUnlock1()) return;
    let goddess = _getGoddessById(goddess_list, goddess_id);
    let goddess_unlock = goddess.unlock;
    let needitem = goddess_info.needitem[idx];
    let needitem_id = needitem[0];
    let needitem_num = needitem[1];
    if (!_checkUnlock2()) return;

    // 设置对应解锁位为2
    goddess.unlock[idx] = 2;
    // 消耗对应女神的魂石(解锁一个碎片消耗一个)
    let item_list = tools.BuzzUtil.getItemList([needitem]);

    BuzzUtil.removeFromPack(account, item_list, function (cost_info) {
        let change = BuzzUtil.getChange(account, cost_info);
        let unlock_all = _isGoddessUnlocked(goddess);
        if (unlock_all) {
            goddess.level = 1;
        }
        let ret = {
            change: change,
            goddess_id: goddess_id,
            idx: idx,
            level: goddess.level,
            unlock_all: unlock_all,
        };
        if (unlock_all) {
            ret.change = ret.change || {};
            //全部解锁时即获得该女神一级属性
            //女神升级或通过碎片全部解锁后才需更新魅力值
            account.goddess = goddess_list;
            account.commit();
            CacheAccount.resetCharmPoint(account, function (chs) {
                if (chs && chs.length == 2) {
                    let charmPoint = chs[0];
                    let charmRank = chs[1];
                    charmPoint >= 0 && (ret.change.charm_point = charmPoint);
                    charmRank >= 0 && (ret.change.charm_rank = charmRank);
                }
                cb(null, ret);
                //统计女神解锁dfc
                let goddess = account.goddess;
                let count = 0;
                for (let i in goddess) {
                    if (goddess[i].level > 0) {
                        count++;
                    }
                }
                let mission = new RewardModel(account);
                mission.addProcess(RewardModel.TaskType.UNLOCK_GODDESS, count);//内含account.commit
            });
        } else {
            account.goddess = goddess_list;
            account.commit();
            cb(null, ret);
        }
        logBuilder.addGoldAndItemLog(item_list, account, common_log_const_cfg.GOD_UNLOCK, -1);
    });

    // 校验方法
    function _checkUnlock1() {
        if (null == goddess_info) {
            cb(ERROR_OBJ.GODDESS_ID_ERROR);
            return false;
        }

        return true;
    }

    function _checkUnlock2() {
        logger.info("goddess_unlock[" + idx + "]:", goddess_unlock[idx]);
        if (idx < 0 || idx > 8) {
            cb(ERROR_OBJ.GODDESS_UNLOCK_IDX_ERROR);
            return false;
        }
        if (account.package[ItemTypeC.DEBRIS]) {
            if (account.package[ItemTypeC.DEBRIS][needitem_id] < needitem_num) {
                cb(ERROR_OBJ.GODDESS_UNLOCK_NO_STONE);
                return false;
            }
        }
        else {
            cb(ERROR_OBJ.GODDESS_UNLOCK_NO_STONE);
            return false;
        }
        if (UNLOCK_STAT.UNLOCKED == goddess_unlock[idx]) {
            cb(ERROR_OBJ.GODDESS_ALREADY_UNLOCKED);
            return false;
        }

        return true;
    }

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'goddess_id', 'idx'], "buzz_goddess", cb);
    }
}

/**
 * 女神升级
 */
function levelup(dataObj, cb) {
    if (!lPrepare(dataObj)) return;
    let account = dataObj.account;
    let goddess_id = dataObj.goddess_id;
    let coinType = shop_shop_buy_type_cfg.GODDESS_UP.name;
    let coinId = shop_shop_buy_type_cfg.GODDESS_UP.id;

    let goddess_list = account.goddess;
    let goddess_info = BuzzUtil.getGoddessById(goddess_id);

    if (!_checkLevelup1()) return;
    let goddess = _getGoddessById(goddess_list, goddess_id);
    let goddess_level = goddess.level;
    logger.info("女神当前等级:", goddess_level);
    let goddessup = BuzzUtil.getGoddessUpByIdAndLevel(goddess_id, goddess_level + 1);
    if (!_checkLevelup2()) return;
    let needitem_id = goddessup.needitem[0];
    let needitem_num = goddessup.needitem[1];
    if (!_checkLevelup3()) return;

    let levelup_cost = [goddessup.needitem];
    if (goddessup.needgold > 0) {
        levelup_cost.push([coinId, goddessup.needgold]);
    }
    logger.info("levelup_cost:", levelup_cost);
    let item_list = tools.BuzzUtil.getItemList(levelup_cost);
    logger.info("item_list:", item_list);

    BuzzUtil.removeFromPack(account, item_list, function (cost_info) {
        goddess.level++;
        logger.info("女神升级到:", goddess.level);
        let change = BuzzUtil.getChange(account, cost_info);
        let ret = {
            change: change,
            goddess_id: goddess_id,
            level: goddess.level,
        };
        //女神升级一级可改变魅力值
        //女神升级或通过碎片全部解锁后才需更新魅力值
        account.goddess = goddess_list;
        CacheAccount.resetCharmPoint(account, function (chs) {
            ret.change = ret.change || {};
            if (chs && chs.length == 2) {
                let charmPoint = chs[0];
                let charmRank = chs[1];
                charmPoint >= 0 && (ret.change.charm_point = charmPoint);
                charmRank >= 0 && (ret.change.charm_rank = charmRank);
            }
            cb(null, ret);
        });
        logBuilder.addItemLogByAccount(item_list, account, common_log_const_cfg.GOD_UPGRADE, -1);
    });

    // 校验方法
    function _checkLevelup1() {
        if (null == goddess_info) {
            cb(ERROR_OBJ.GODDESS_ID_ERROR);
            return false;
        }

        return true;
    }

    function _checkLevelup2() {
        if (null == goddessup) {
            cb(ERROR_OBJ.GODDESS_UP_DATA_WRONG);
            return false;
        }

        return true;
    }

    function _checkLevelup3() {
        if (account[coinType] < goddessup.needgold) {
            cb(ERROR_OBJ.GODDESS_UP_LACK_GOLD);
            return false;
        }
        if (account.package && account.package[ItemTypeC.DEBRIS]) {
            if (account.package[ItemTypeC.DEBRIS][needitem_id] < needitem_num) {
                cb(ERROR_OBJ.GODDESS_UP_LACK_DEBRIS);
                return false;
            }
        }
        else {
            return false;
        }

        return true;
    }

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'goddess_id'], "buzz_goddess", cb);
    }
}

/**
 * 领取保卫女神周排名奖励
 */
function weekReward(dataObj, cb) {
    dataObj.type = RANK_TYPE.GODDESS_LW;
    buzz_charts.getChartReward(dataObj, function (err, resposne) {
        logger.info('getChartReward:', resposne);
        if (_.keys(resposne).length == 0) {
            cb({code: 11111, msg: "用户奖励已经领取"});
        }
        else {
            let ret = {
                item_list: resposne.item_list,
                change: resposne.change,
                week_reward: resposne.reward,
                //max_wave: 0,
            };
            cb && cb(null, ret);
        }
    });
}

/**
 * 查询当前有无保卫女神周奖励，且返回我的当前排名、以及可以领奖的dropkey
 */
function queryWeekReward(dataObj, cb) {
    dataObj.type = RANK_TYPE.GODDESS_LW;
    dataObj.account_id = dataObj.uid;
    buzz_charts.getUserRank(dataObj, function (err, info) {
        logger.info("info:", info);
        let rank_reward = tools.BuzzUtil.getGoddessChartRewardByRank(info.my_rank, info.score);
        let ret = {};
        ret.week_reward = info.reward;
        ret.week_rank = info.my_rank;
        ret.rank_reward = rank_reward;
        ret.max_wave = info.score;
        cb(null, ret);
    });
}

/**
 * 发放周奖励.
 */
function putWeekReward(pool, cb) {
    const FUNC = TAG + "putWeekReward() --- ";
    //----------------------------------

    // 实现每周女神排行的产生
    // buzz_charts.generateWeeklyReward();
    // yTODO: 上线后删除下面代码及相关逻辑
    // dao_goddess.putWeekReward(pool, cb);
}

/**
 * 获取上周结算时女神排名第一的玩家
 * NOTE: 暂时处理成当前第一
 */
function getGoddessTop1(platform) {
    //暂时服务器处理数据格式，后续客户端修改
    let chart = cache.getChart(platform, RANK_TYPE.GODDESS, 0, 1);
    let data = chart[0];
    if (data) {
        for (let key in data.ext) {
            data[key] = data.ext[key];
        }
        data.max_wave = Number(data.score);
        delete data.ext;
    }
    return chart[0];
}

//==============================================================================
// private
//==============================================================================
/**
 * 女神是否已经解锁.
 * @param goddess 女神数据(一个女神的全部数据, 其中的unlock为解锁数组).
 */
function _isGoddessUnlocked(goddess) {
    const FUNC = TAG + "_isGoddessUnlocked()---";
    // logger.info(FUNC + "hao gui yi goddess:\n", goddess);

    let unlock = goddess.unlock;

    // TODO: BUG(20170407【10】)
    if (unlock == null) {
        logger.error(FUNC + "goddess:\n", goddess);
        return false;
    }
    for (let i = 0; i < unlock.length; i++) {
        if (unlock[i] < 2) {
            // 有一个遮罩没被解锁就返回false
            return false;
        }
    }
    // 所有遮罩都被解锁返回true
    return true;
}

function _didGetDefend(req, data, account, cb) {
    const FUNC = TAG + "_didGetDefend() --- ";

    let uid = account.id;
    let goddess = account.goddess;
    let goddess_free = account.goddess_free;
    let goddess_ctimes = account.goddess_ctimes;

    // 检查goddess数据
    for (let i = 0; i < goddess.length; i++) {
        let unlock = goddess[i].unlock;
        let goddess_unlock = 1;
        for (let j = 0; j < unlock.length; j++) {
            if (unlock[j] < 2) {
                goddess_unlock = 0;
            }
        }
        if (goddess_unlock && goddess[i].level == 0) {
            goddess[i].level = 1;
        }
    }

    // yDONE: 没有解锁第一个女神的玩家数据设置
    let first_goddess = goddess[0];
    if (first_goddess && first_goddess.level == 0) {
        first_goddess.level = 1;
        first_goddess.unlock = [2, 2, 2, 2, 2, 2, 2, 2, 2];
        // CacheAccount.setGoddess(uid, goddess);
    }
    CacheAccount.setGoddess(uid, goddess);

    let response = {
        leftDays: getLeftDays(),
        gods: goddess,
        free: goddess_free,
        ctimes: goddess_ctimes,
    };

    // logger.info(FUNC + "response:", response);

    cb(null, response);

}

function _didChallengeGoddess(req, data, account, cb) {
    const FUNC = TAG + "_didChallengeGoddess() --- ";

    // let challenge_goddess_id = data["god_id"];

    // 账户数据中原来的女神数据
    let uid = account.id;
    let goddess_free = account.goddess_free;
    let goddess_ctimes = account.goddess_ctimes;
    logger.info(FUNC + "goddess_free:\n", goddess_free);
    logger.info(FUNC + "goddess_ctimes:\n", goddess_ctimes);
    if (goddess_free > 0) {
        logger.info(FUNC + "不消耗钻石");
        goddess_free--;
        CacheAccount.setGoddessFree(uid, goddess_free);
    }
    else {
        logger.info(FUNC + "计算消耗钻石");
        let pearl_cost = _getPrice(goddess_ctimes);
        logger.info(FUNC + "pearl_cost:", pearl_cost);
        // 消耗钻石
        if (account.pearl < pearl_cost) {
            logger.error(FUNC + "玩家钻石不足, 不能挑战女神");
            // 客户端无法把这个错误导向钻石购买, 返回一个消耗钻石数
            // cb(ERROR_OBJ.DIAMOND_NOT_ENOUGH);
            let ret = {
                pearl_cost: pearl_cost
            };
            cb(null, ret);
            return;
        }
        account.pearl = -pearl_cost;
        goddess_ctimes++;
        CacheAccount.setGoddessCTimes(uid, goddess_ctimes);
        logBuilder.addItemLog(uid, 'i002', -pearl_cost, account.pearl, common_log_const_cfg.GOD_CHALLENGE, account.level);
    }
    //统计女神挑战次数dfc
    let mission = new RewardModel(account);
    mission.updateProcess(RewardModel.TaskType.DEFEND_GODDESS, 1);
    mission.updateProcess(RewardModel.TaskType.GODDESS_LEVEL, account.max_wave);
    mission.commit(); //等价account.commit()
    let ret = {
        pearl: account.pearl,
        free: account.goddess_free,
        ctimes: account.goddess_ctimes,
    };
    cb(null, ret);
}

/**
 * 获取挑战女神消耗的钻石数
 */
function _getPrice(ctimes) {
    let price = common_const_cfg.GODDESS_COST;
    let idx = ctimes > price.length - 1 ? price.length - 1 : ctimes;
    return price[idx];
}

function _initGods() {
    let ret = [];
    for (let i = 0; i < goddess_goddess_cfg.length; i++) {
        let goddess = goddess_goddess_cfg[i];
        let god = {
            id: goddess.id,
            level: 0,
            hp: _getHpByIdAndLv(goddess.id, 0),
            startWaveIdx: 0,
            free: goddess.free,
            ctimes: 0,
            unlock: [0, 0, 0, 0, 0, 0, 0, 0, 0],//女神解锁
            interactReward: [0, 0, 0, 0],//互动奖励时间戳, 4个，身体四个区域
            isPauseAway: false,
        };
        ret.push(god);
    }
    return ret;
}

function _getHpByIdAndLv(id, lv) {
    for (let idx in goddess_goddessup_cfg) {
        let lvGoddess = goddess_goddessup_cfg[idx];
        if (lvGoddess.id == id && lvGoddess.level == lv) {
            return lvGoddess.hp;
        }
    }
    return 0;
}

function _prepare(data, cb) {

    let token = data['token'];

    logger.info("token:", token);

    if (!CommonUtil.isParamExist("buzz_goddess", token, "接口调用请传参数token", cb)) return false;

    return true;

}

//----------------------------------------------------------
// 女神解锁

const UNLOCK_STAT = {
    NO_STONE: 0,
    WITH_STONE: 1,
    UNLOCKED: 2,
};

function _getItemList(quest_reward) {
    let item_list = [];
    for (let i = 0; i < quest_reward.length; i++) {
        let reward = quest_reward[i];
        item_list.push({
            item_id: reward[0],
            item_num: reward[1],
        });
    }
    return item_list;
}

function _unlock(req, dataObj, cb) {
    const FUNC = TAG + "_unlock() --- ";
    let uid = dataObj.uid;
    let token = dataObj.token;
    let goddess_id = dataObj.goddess_id;
    let idx = dataObj.idx;
    let pool = req.pool;
    logger.info(FUNC + "goddess_id:", goddess_id);

    DaoCommon.checkAccount(pool, token, function (error, account) {
        if (error) {
            cb(error);
            return;
        }
        doNextWithAccount(account);
    });

    function doNextWithAccount(account) {
        let goddess_list = account.goddess;
        let goddess_info = BuzzUtil.getGoddessById(goddess_id);
        if (!_checkUnlock1()) return;
        let goddess = _getGoddessById(goddess_list, goddess_id);
        let goddess_unlock = goddess.unlock;
        let needitem = goddess_info.needitem[idx];
        let needitem_id = needitem[0];
        let needitem_num = needitem[1];
        if (!_checkUnlock2()) return;

        // 设置对应解锁位为2
        goddess.unlock[idx] = 2;
        // 消耗对应女神的魂石(解锁一个碎片消耗一个)
        let item_list = _getItemList([needitem]);

        BuzzUtil.removeFromPack(account, item_list, function (cost_info) {
            let change = BuzzUtil.getChange(account, cost_info);
            let unlock_all = _isGoddessUnlocked(goddess);
            if (unlock_all) {
                goddess.level = 1;
            }
            let ret = {
                change: change,
                goddess_id: goddess_id,
                idx: idx,
                level: goddess.level,
                unlock_all: unlock_all,
            };
            if (unlock_all) {
                ret.change = ret.change || {};
                //全部解锁时即获得该女神一级属性
                CacheAccount.setGoddess(account.id, goddess_list, function (chs) {
                    if (chs && chs.length == 2) {
                        let charmPoint = chs[0];
                        let charmRank = chs[1];
                        charmPoint >= 0 && (ret.change.charm_point = charmPoint);
                        charmRank >= 0 && (ret.change.charm_rank = charmRank);
                    }
                    cb(null, ret);
                });
            } else {
                account.goddess = goddess_list;
                account.commit();
                cb(null, ret);
            }
            logBuilder.addItemLogByAccount(item_list, account, common_log_const_cfg.GOD_UNLOCK, -1);
        });

        // 校验方法
        function _checkUnlock1() {
            if (null == goddess_info) {
                cb(ERROR_OBJ.GODDESS_ID_ERROR);
                return false;
            }

            return true;
        }

        function _checkUnlock2() {
            logger.info(FUNC + "goddess_unlock[" + idx + "]:", goddess_unlock[idx]);
            if (idx < 0 || idx > 8) {
                cb(ERROR_OBJ.GODDESS_UNLOCK_IDX_ERROR);
                return false;
            }
            if (account.package[ItemTypeC.DEBRIS]) {
                if (account.package[ItemTypeC.DEBRIS][needitem_id] < needitem_num) {
                    cb(ERROR_OBJ.GODDESS_UNLOCK_NO_STONE);
                    return false;
                }
            }
            else {
                cb(ERROR_OBJ.GODDESS_UNLOCK_NO_STONE);
                return false;
            }
            if (UNLOCK_STAT.UNLOCKED == goddess_unlock[idx]) {
                cb(ERROR_OBJ.GODDESS_ALREADY_UNLOCKED);
                return false;
            }

            return true;
        }
    }
}

function _getGoddessSum(goddess_list) {
    let count = 0;
    for (let i in goddess_list) {
        if (goddess_list[i].level > 0) {
            count++;
        }
    }
    return count;
}

function _getGoddessById(goddess_list, goddess_id) {
    for (let i = 0; i < goddess_list.length; i++) {
        let goddess = goddess_list[i];
        if (goddess_id == goddess.id) {
            return goddess;
        }
    }
}

//----------------------------------------------------------
// 女神升级

function _levelup(req, dataObj, cb) {
    const FUNC = TAG + "_levelup() --- ";
    let uid = dataObj.uid;
    let token = dataObj.token;
    let goddess_id = dataObj.goddess_id;
    let pool = req.pool;

    logger.info(FUNC + "女神ID:", goddess_id);

    DaoCommon.checkAccount(pool, token, function (error, account) {
        if (error) {
            cb(error);
            return;
        }
        doNextWithAccount(account);
    });

    function doNextWithAccount(account) {

        let coinType = shop_shop_buy_type_cfg.GODDESS_UP.name;
        let coinId = shop_shop_buy_type_cfg.GODDESS_UP.id;

        let goddess_list = account.goddess;
        let goddess_info = BuzzUtil.getGoddessById(goddess_id);

        if (!_checkLevelup1()) return;
        let goddess = _getGoddessById(goddess_list, goddess_id);
        let goddess_level = goddess.level;
        logger.info(FUNC + "女神当前等级:", goddess_level);
        let goddessup = BuzzUtil.getGoddessUpByIdAndLevel(goddess_id, goddess_level + 1);
        if (!_checkLevelup2()) return;
        let needitem_id = goddessup.needitem[0];
        let needitem_num = goddessup.needitem[1];
        if (!_checkLevelup3()) return;

        let levelup_cost = [goddessup.needitem];
        if (goddessup.needgold > 0) {
            levelup_cost.push([coinId, goddessup.needgold]);
        }
        logger.info(FUNC + "levelup_cost:", levelup_cost);
        let item_list = _getItemList(levelup_cost);
        logger.info(FUNC + "item_list:", item_list);

        BuzzUtil.removeFromPack(account, item_list, function (cost_info) {
            goddess.level++;
            logger.info(FUNC + "女神升级到:", goddess.level);
            let change = BuzzUtil.getChange(account, cost_info);
            let ret = {
                change: change,
                goddess_id: goddess_id,
                level: goddess.level,
            };
            //女神升级一级可改变魅力值
            CacheAccount.setGoddess(account.id, goddess_list, function (chs) {
                ret.change = ret.change || {};
                if (chs && chs.length == 2) {
                    let charmPoint = chs[0];
                    let charmRank = chs[1];
                    charmPoint >= 0 && (ret.change.charm_point = charmPoint);
                    charmRank >= 0 && (ret.change.charm_rank = charmRank);
                }
                cb(null, ret);
            });
            logBuilder.addItemLogByAccount(item_list, account, common_log_const_cfg.GOD_UPGRADE, -1);
        });

        // 校验方法
        function _checkLevelup1() {
            if (null == goddess_info) {
                cb(ERROR_OBJ.GODDESS_ID_ERROR);
                return false;
            }

            return true;
        }

        function _checkLevelup2() {
            if (null == goddessup) {
                cb(ERROR_OBJ.GODDESS_UP_DATA_WRONG);
                return false;
            }

            return true;
        }

        function _checkLevelup3() {
            if (account[coinType] < goddessup.needgold) {
                cb(ERROR_OBJ.GODDESS_UP_LACK_GOLD);
                return false;
            }
            if (account.package && account.package[ItemTypeC.DEBRIS]) {
                if (account.package[ItemTypeC.DEBRIS][needitem_id] < needitem_num) {
                    cb(ERROR_OBJ.GODDESS_UP_LACK_DEBRIS);
                    return false;
                }
            }
            else {
                return false;
            }

            return true;
        }
    }
}

//------------------------------------------------------------------------------
// 保卫女神周奖励相关

const WEEK_REWARD_STATUS = {
    UNABLE: 0,
    AVAILABLE: 1,
    ALREADY: 2,
};
const MIN_RATE = 1;
const MAX_RATE = 1000;

/**
 * 领取女神周奖励
 */
function _weekReward(dataObj, cb) {
    dataObj.type = RANK_TYPE.GODDESS_LW;
    buzz_charts.getChartReward(dataObj, function (err, resposne) {
        logger.info('getChartReward:', resposne);
        if (_.keys(resposne).length == 0) {
            cb({code: 11111, msg: "用户奖励已经领取"});
        }
        else {
            let ret = {
                item_list: resposne.item_list,
                change: resposne.change,
                week_reward: resposne.reward,
                //max_wave: 0,
            };
            cb && cb(null, ret);
        }
    });

    return;

    // DaoCommon.checkAccount(pool, token, function(error, account) {
    //     if (error) {
    //         cb(error);
    //         return;
    //     }
    //     doNextWithAccount(account);
    // });

    // function doNextWithAccount(account) {

    //     let max_wave = account.max_wave;
    //     let week_reward = account.week_reward;
    //     let week_rank = account.week_rank;
    //     if (!_checkWeekReward1()) return;

    //     let rank_reward = BuzzUtil.getRankrewardByRank(week_rank, max_wave);

    //     let item_list = BuzzUtil.getItemList(rank_reward);

    //     account.week_reward = WEEK_REWARD_STATUS.ALREADY;


    //     BuzzUtil.putIntoPack( account, item_list, function(reward) {
    //         let change = BuzzUtil.getChange(account, reward);
    //         let ret = {
    //             item_list: item_list,
    //             change: change,
    //             week_reward: account.week_reward,
    //             max_wave: max_wave,
    //         };

    //         cb(null, ret);
    //     });

    //     // 校验方法
    //     function _checkWeekReward1() {
    //         if (WEEK_REWARD_STATUS.UNABLE == week_reward) {
    //             logger.error(FUNC + "保卫女神周奖励领取错误(week_reward为不可领取)");
    //             cb(ERROR_OBJ.GODDESS_WEEKREWARD_UNABLE);
    //             return false;
    //         }
    //         if (WEEK_REWARD_STATUS.ALREADY == week_reward) {
    //             logger.error(FUNC + "保卫女神周奖励领取错误(week_reward为已领取)");
    //             cb(ERROR_OBJ.GODDESS_WEEKREWARD_ALREADY);
    //             return false;
    //         }
    //         if (week_rank < MIN_RATE || week_rank > MAX_RATE) {
    //             logger.error(FUNC + "保卫女神未进入排名, 不可领取:", week_rank);
    //             cb(ERROR_OBJ.GODDESS_WEEKREWARD_OUT_OF_RANKS);
    //             return false;
    //         }

    //         return true;
    //     }
    // }
}

/**
 * 查询女神周奖励
 */
function _queryWeekReward(req, dataObj, cb) {
    const FUNC = TAG + "_queryWeekReward() --- ";
    let uid = dataObj.uid;
    let token = dataObj.token;
    let pool = req.pool;

    dataObj.type = RANK_TYPE.GODDESS_LW;

    dataObj.account_id = dataObj.uid;

    buzz_charts.getUserRank(req, dataObj, function (err, info) {
        logger.info(FUNC + "info:", info);
        let rank_reward = BuzzUtil.getGoddessChartRewardByRank(info.my_rank, info.score);
        let ret = {};
        ret.week_reward = info.reward;
        ret.week_rank = info.my_rank;
        ret.rank_reward = rank_reward;
        ret.max_wave = info.score;
        cb(null, ret);
    });
    return;

    // DaoCommon.checkAccount(pool, token, function(error, account) {
    //     if (error) {
    //         cb(error);
    //         return;
    //     }
    //     doNextWithAccount(account);
    // });

    // function doNextWithAccount(account) {
    //     let max_wave = account.max_wave;
    //     let week_reward = account.week_reward;
    //     let week_rank = account.week_rank;
    //     if (!_checkQueryWeekReward1()) return;

    //     let rank_reward = BuzzUtil.getGoddessChartRewardByRank(week_rank, max_wave);
    //     let ret = {
    //         week_reward: week_reward,
    //         week_rank: week_rank,
    //         rank_reward: rank_reward,
    //         max_wave: max_wave,
    //     };
    //     cb(null, ret);

    //     // 校验方法
    //     function _checkQueryWeekReward1() {
    //         // 这里直接将week_reward设置为不可领取的状态即可, 无需返回错误
    //         if (WEEK_REWARD_STATUS.AVAILABLE == week_reward) {
    //             if (week_rank < MIN_RATE || week_rank > MAX_RATE) {
    //                 logger.error(FUNC + "保卫女神周奖励状态错误(week_reward为可领取,但是week_rank在1~1000之外)");
    //                 week_reward = WEEK_REWARD_STATUS.UNABLE;
    //                 account.week_reward = WEEK_REWARD_STATUS.UNABLE;
    //             }
    //         }

    //         return true;
    //     }
    // }
}
