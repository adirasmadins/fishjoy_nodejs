const BuzzUtil = require('../utils/BuzzUtil');
const CommonUtil = require('./CommonUtil');
const DateUtil = require('../utils/DateUtil');
const CacheAccount = require('./cache/CacheAccount');
const Item = require('./pojo/Item');
const _ = require('underscore');
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
const pack = require('../../../pay/controllers/data/pack');
const SCENE = require('../../../../utils/tools/BuzzUtil').SCENE;
const dropManager = require('../../../../utils/DropManager');
const RedisUtil = require('../../../../../app/utils/tools/RedisUtil');

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
    let account = data.account;
    let goddess = account.goddess;
    let goddess_free = account.goddess_free;
    let goddess_ctimes = account.goddess_ctimes;

    // 检查goddess数据
    for (let i = 0; i < goddess.length; i++) {
        let god = goddess[i];
        let unlock = god.unlock;
        let goddess_unlock = 1;
        for (let j = 0; j < unlock.length; j++) {
            if (unlock[j] < 2) {
                goddess_unlock = 0;
            }
        }
        if (goddess_unlock && god.level == 0) {
            god.level = 1;
        }
        if (god.free >= 0) {
            delete god.free;
        }
    }

    let first_goddess = goddess[0];
    if (first_goddess && first_goddess.level == 0) {
        first_goddess.level = 1;
        first_goddess.unlock = [2, 2, 2, 2, 2, 2, 2, 2, 2];
    }
    account.goddess = goddess;
    //新增暂离免费次数
    let pauseAwayFree = account.goddess_free_pause_away;
    if (!pauseAwayFree) {
        pauseAwayFree = [0, 0, 0, 0, 0];
        account.goddess_free_pause_away = pauseAwayFree;
    }
    account.commit();
    CacheAccount.resetCharmPoint(account, function (chs) { });
    let response = {
        leftDays: getLeftDays(),
        gods: goddess,
        free: goddess_free,
        ctimes: goddess_ctimes,
        pauseAwayFree: pauseAwayFree,
    };
    cb(null, response);
}

const GOD_INTERACT_ID = [
    2, //解锁微笑表情
    3, //解锁害羞表情
    4, //解锁卖萌表情
    5, //解锁缠绵表情
];

exports.interractReward = interractReward;
/**
 * 女神互动奖励(爱抚女神获取奖励)
 * @param {*} data 
 * @param {*} cb 
 */
function interractReward(data, cb) {
    let account = data.account;
    let godList = account.goddess;
    let godId = data.godId;
    let bodyIdx = data.bodyIdx;
    let interactId = bodyIdx + 1;

    // 获取玩家指定女神的具体信息
    let goddess = _getGoddessById(godList, godId);

    // 判断该女神是否已经解锁
    if (!_isGodUnlocked(goddess)) {
        throw ERROR_OBJ.GODDESS_LOCKED;
    }

    // 判断该等级女神互动区域是否解锁
    let godLevel = goddess.level;
    let property = tools.CfgUtil.goddess.findGodProperty(
        godId, godLevel, GOD_INTERACT_ID[bodyIdx]);
    if (!property) {
        throw ERROR_OBJ.GODDESS_LEVEL_NOT_REACHED;
    }

    // 判断该女神上次互动到现在是否已经超过了CD时间
    const currentTimestamp = new Date().getTime();
    let lastInteractTimestamp = goddess.interactReward[bodyIdx];
    if (common_const_cfg.GODDESS_TIME * 1000 > currentTimestamp - lastInteractTimestamp) {
        throw ERROR_OBJ.GODDESS_INTERACT_REWARD_ALREADY;
    }

    let interactInfo = tools.CfgUtil.goddess.getInteractInfo(interactId);
    const dropid = interactInfo.dropid;
    // dropManager.try2Drop已经完成了往背包中放入物品的操作
    // 场景添加后替换语句
    // let dropRet = dropManager.try2Drop(account, dropid, 1, SCENE.GOD_INTERACT);
    const dropRet = dropManager.try2Drop(account, dropid, 1, 55);
    const item_list = dropRet.logItems;

    // goddess.interactReward[bodyIdx]记录每一个互动的时间
    // 在过去了common_const_cfg.GODDESS_TIME秒后可以进行下一次互动
    goddess.interactReward[bodyIdx] = new Date().getTime();
    account.goddess = godList;
    account.commit();

    // 制作返回值
    let ret = {
        item_list: item_list,
        change: {
            gold: account.gold,
            pearl: account.pearl,
            package: account.package,
            skill: account.skill,
            goddess: account.goddess,
        },
    };
    cb(null, ret);
}

function getUnlocked(account) {
    const FUNC = TAG + "getUnlocked()---";
    logger.info(FUNC + "CALL...");

    let list = account.goddess;// 一定要把字符串转换为对象处理，否则会得到第一个字符而不是第一个对象
    let response = {};
    for (let idx in list) {
        let goddess = list[idx];
        if (_isGodUnlocked(goddess)) {
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
        if (_isGodUnlocked(goddess)) {
            if (!aquarium_goddess['' + goddess.id]) {
                aquarium_goddess['' + goddess.id] = {};
            }
            aquarium_goddess['' + goddess.id].lv = goddess.level;
        }
    }
    account.aquarium = account.aquarium;
    account.commit();
}


function _isGodUnlocked (god) {
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
 * 挑战女神.
 */
function challengeGoddess(data, cb) {
    let account = data.account;

    //查找女神并确认女神是否已解锁
    let gods = account.goddess;
    let curGod = null;
    let idx = 0;
    for (let i = 0; i < gods.length; i ++) {
        let god = gods[i];
        if (god.id === data.godId) {
            curGod = god;
            idx = i;
            break;
        }
    }
    for (let i = 0; i < idx; i ++) {
        let god = gods[i];
        if (god.isPauseAway) {
            logger.error('之前的还有女神尚未结束')
            throw ERROR_OBJ.INVALID_GOD; //前面还有女神未结束
            return;
        }
    }
    if (!curGod || !_isGodUnlocked(curGod)) {
        throw ERROR_OBJ.LOCK_GOD;
    }
    
    let mission = new RewardModel(account);
    mission.updateProcess(RewardModel.TaskType.GODDESS_LEVEL, account.max_wave);
    
    //新增暂离状态免费进入次数限制
    if (data.isForEnterFree) {
        if (!curGod.isPauseAway) {
            throw ERROR_OBJ.INVALID_GOD;
        }
        let cfg = common_const_cfg.GODDESS_ENTER_COST;
        let pauseAwayFree = account.goddess_free_pause_away;
        let freeTimes = pauseAwayFree[idx];
        let cost = cfg[freeTimes];
        if (freeTimes >= cfg.length) {
            cost = cfg[cfg.length - 1];
        }
        if (account.pearl < cost) {
            cb(null, {
                pearl_cost: cost
            });
            return;
        }
        pauseAwayFree[idx] = freeTimes + 1;
        account.goddess_free_pause_away = pauseAwayFree;
        account.pearl = -cost;
        mission.commit();
        account.commit();
        cb(null, {
            pearl: account.pearl,
        });
        return;
    }

    //创建挑战，即非暂离状态进入保卫女神,含免费挑战
    let goddess_free = account.goddess_free;
    let goddess_ctimes = account.goddess_ctimes;
    if (goddess_free > 0) {
        goddess_free--;
        account.goddess_free = goddess_free;
    }else {
        let pearl_cost = _getPrice(goddess_ctimes);
        // 消耗钻石
        if (account.pearl < pearl_cost) {
            let ret = {
                pearl_cost: pearl_cost
            };
            cb(null, ret);
            return;
        }
        account.pearl = -pearl_cost;
        goddess_ctimes++;
        account.goddess_ctimes = goddess_ctimes;
        logBuilder.addItemLog(account.id, 'i002', -pearl_cost, account.pearl, common_log_const_cfg.GOD_CHALLENGE, account.level);
    }
    //统计女神挑战次数dfc
    mission.updateProcess(RewardModel.TaskType.DEFEND_GODDESS, 1);
    mission.commit();
    account.commit();
    let ret = {
        pearl: account.pearl,
        free: account.goddess_free,
        ctimes: account.goddess_ctimes,
    };
    cb(null, ret);
    
    //计算可跳关次数
    try {
        _calJumLeft(account);   
    } catch (error) {
        logger.error('can not cal jump left.');
    }
}

/**
 * 计算跳关次数
 */
async function _calJumLeft (account) {
    let platform = account.platform;
    let k = 'rank:charm:result';
    let rankCharm = await RedisUtil.get(`${k}:${platform}`);
    rankCharm = JSON.parse(rankCharm);
    if (rankCharm) {
        let myCharmRank = 10001;
        let ps = rankCharm.players;
        if (ps) {
            for (let i = 0; i < ps.length; i ++) {
                let rp = ps[i];
                if (rp.uid == account.id) {
                    myCharmRank = i + 1;
                    break;
                }
            }
            let a = Math.floor(Math.pow(Math.max(1, 100 - myCharmRank), 0.4));
            let jumpLeft = Math.min(5, a); 
            account.goddess_jump = jumpLeft;
            account.commit();
        }
    }
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
        let unlock_all = _isGodUnlocked(goddess);
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
                mission.addProcess(RewardModel.TaskType.UNLOCK_GODDESS, count);
                account.commit();
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
        // 升级女神可能消耗金币, 需要使用通用日志方法.
        logBuilder.addGoldAndItemLog(item_list, account, common_log_const_cfg.GOD_UPGRADE, -1);
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
            cb({ code: 11111, msg: "用户奖励已经领取" });
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
            //free: goddess.free,
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
            let unlock_all = _isGodUnlocked(goddess);
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

/**
 * 从女神id获取女神数据
 * @param {*} goddess_list 
 * @param {*} goddess_id 
 */
function _getGoddessById(goddess_list, goddess_id) {
    for (let i = 0; i < goddess_list.length; i++) {
        let goddess = goddess_list[i];
        if (goddess_id == goddess.id) {
            return goddess;
        }
    }
    throw ERROR_OBJ.GODDESS_ID_ERROR;
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
            logBuilder.addGoldAndItemLog(item_list, account, common_log_const_cfg.GOD_UPGRADE, -1);
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
            cb({ code: 11111, msg: "用户奖励已经领取" });
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
