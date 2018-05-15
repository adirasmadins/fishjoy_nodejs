const BuzzUtil = require('../utils/BuzzUtil');
const CommonUtil = require('./CommonUtil');
const DateUtil = require('../utils/DateUtil');
const ObjUtil = require('./ObjUtil');
const CstError = require('../../../../consts/fish_error');
const CacheAccount = require('./cache/CacheAccount');
const Item = require('./pojo/Item');
const itemDef = require('../../../../consts/itemDef');
const _ = require('underscore');
const buzz_goddess = require('./buzz_goddess');
const RewardModel = require('../../../../utils/account/RewardModel');
const dropManager = require('../../../../utils/DropManager');
const configReader = require('../../../../utils/configReader');

//------------------------------------------------------------------------------
// 配置表
//------------------------------------------------------------------------------
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;// 宠物鱼
const aquarium_petfish_cfg = gameConfig.aquarium_petfish_cfg;// 宠物鱼
const aquarium_petup_cfg = gameConfig.aquarium_petup_cfg;// 宠物鱼升级表
const goddess_goddessup_cfg = gameConfig.goddess_goddessup_cfg;
const shop_shop_buy_type_cfg = gameConfig.shop_shop_buy_type_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;

//==============================================================================
// const
//==============================================================================

const ERROR_OBJ = CstError.ERROR_OBJ;

const ItemTypeC = Item.ItemTypeC;


const PET_STATE = {
    LOCKED : 0, //锁住的
    NOTPLACED : 1, //未放养
    PLACED : 2, //已放养
    READY : 3, //可收取
    ALREADY_REWARD : 4, //已收取
};

const GODDESS_STATE = {
    NOTPLACED : 0, //未放养
    PLACED : 1, //已放养
};

const TAG = "【buzz_aquarium】";


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.upgradePetfish = upgradePetfish;
exports.putPetfish = putPetfish;
exports.rewardPetfish = rewardPetfish;
exports.putGoddess = putGoddess;
exports.getAquarium = getAquarium;

exports.getCost = _getCost;
exports.getChipFromId = _getChipFromId;

exports.PET_STATE = PET_STATE;
exports.GODDESS_STATE = GODDESS_STATE;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

function upgradePetfish(data, cb) {
    let account=data.account;
    let id = data.id;
    let chip_id = _getChipFromId(id);
    let coinId = shop_shop_buy_type_cfg.PETFISH_UP.id;
    let coinType = shop_shop_buy_type_cfg.PETFISH_UP.name;

    account.aquarium = account.aquarium || {};// 数据为空则初始化
    account.aquarium.petfish = account.aquarium.petfish || {};// 数据为空则初始化

    let aquarium = account.aquarium;

    // 未解锁指定id的鱼等级设置为0
    let level = 0;//data['level'];

    // 取用对象的键时再确认一下对象是否为空.
    if (aquarium.petfish != null && aquarium.petfish["" + id] != null) {
        level = account.aquarium.petfish["" + id].level;
    }
    let need = _getCost(level);// 获取消耗品种类和数量

    // 查看当前玩家水族馆中这个鱼是否解锁或达到了目标等级
    if (_alreadyHave(account, id, level, cb)) return;

    // 判断玩家碎片是否足够
    if (!_isChipEnough(account, id, need.chip, cb)) return;

    let package1 = account.package;
    let chip = package1[ItemTypeC.DEBRIS];

    // 金币数量判断
    if (!_isGoldEnough(account, need.gold, cb)) return;

    // 消耗碎片: 从缓存背包中删除一定量的碎片, 从缓存金币数量中扣除金币
    chip[chip_id] -= need.chip;

    BuzzUtil.useCoin(account, coinId, need.gold, function (err, res) {

        // account.gold = -need.gold;

        if (aquarium && aquarium.petfish) {

            // 在水族馆中放入一条鱼(数据字段为aquarium)
            // 或升级已经解锁的鱼
            if (level == 0) {
                aquarium.petfish["" + id] = {
                    id: id,
                    level: level + 1,
                    state: PET_STATE.NOTPLACED,
                    time: 0,
                };
            }
            else {
                aquarium.petfish["" + id].level++;
            }

            // 记录玩家宠物鱼的排名更新
            let petfish_list = aquarium.petfish;
            let total_level = 0;
            for (let i in petfish_list) {
                let petfish = petfish_list[i];
                total_level += petfish.level;
            }
            CacheAccount.setMaxPetfishLevel(account, total_level);
            account.package = package1;
            CacheAccount.setAquarium(account, aquarium,function (err, res) {
                account.commit();
                cb(null, account);
            });

            let item_list = [
                {
                    item_id: coinId,
                    item_num: need.gold,
                },
                {
                    item_id: chip_id,
                    item_num: need.chip,
                }
            ];
            logBuilder.addGoldAndItemLog(item_list, account, common_log_const_cfg.PET_FISH_UPGRADE, -1);
            // logBuilder.addItemLog(account.id, chip_id, -need.chip, chip[chip_id], common_log_const_cfg.PET_FISH_UPGRADE, account.level);
        }
    });

    /**
     * 玩家游戏币是否足够的判断.
     */
    function _isGoldEnough(account, needCoin, cb) {
        const FUNC = TAG + "_isGoldEnough() --- ";

        let ownCoin = account[coinType];
        logger.info(FUNC + "ownCoin:", ownCoin);
        if (ownCoin < needCoin) {
            logger.error("金币不足:", ERROR_OBJ.GOLD_NOT_ENOUGH);
            cb(ERROR_OBJ.GOLD_NOT_ENOUGH);
            return false;
        }
        return true;
    }
}

function putPetfish(data, cb) {
    const FUNC = TAG + "_checkFish() --- ";
    let account=data.account;
    let id = data.id;
    let aquarium = _getAquariumOrInit(account);
    let count = 0;

    for (let i in id) {
        let fish_id = id[i];
        //logger.info("fish_id:", fish_id);
        if (!_fishUnlocked(aquarium, fish_id, cb)) return;

        logger.info(FUNC + "用户放养的鱼在水族馆中");
        let petfish = aquarium.petfish['' + fish_id];
        if (_fishPlaced(petfish)) {
            logger.error(FUNC + "用户放养的鱼已经处于放养状态，请勿重复放养");
            cb(ERROR_OBJ.PETFISH_PLACED);
            return;
        }
        else if (petfish.state == PET_STATE.NOTPLACED) {
            count++;
            petfish.state = PET_STATE.PLACED;
            petfish.starttime = new Date().getTime();// 设置时间戳
            //petfish.starttime = new Date().getTime() - 10000;// 设置时间戳,测试，开始时间早10秒
            continue;
        }
        else if (petfish.state == PET_STATE.ALREADY_REWARD) {
            logger.error(FUNC + "宠物鱼今日已放养并领取奖励");
            continue;
        }

        logger.error(FUNC + "宠物鱼处于未知状态:" + petfish.state);
        cb(ERROR_OBJ.PETFISH_STATE_ERR);
        return;
    }
    account.aquarium = aquarium;

    //统计放养鱼dfc
    if(count) {
        let mission = new RewardModel(account);
        mission.updateProcess(RewardModel.TaskType.STOCKING_FISH, count);
        mission.updateProcess(RewardModel.TaskType.PETFISH_TOTAL_LEVEL, account.petfish_total_level);
        mission.commit(); 
    }
    account.commit();
    cb(null, _currentAquarium(account));// 返回当前水族馆的所有数据
}

function rewardPetfish(data, cb) {
    let account=data.account;
    let id=data.id;
    let aquarium = _getAquariumOrInit(account);

    if (!_fishUnlocked(aquarium, id, cb)) return;

    let petfish = aquarium.petfish['' + id];

    if (!_fishPlaced(petfish)) {
        logger.error("宠物鱼未放养，无法收取");
        cb(ERROR_OBJ.PETFISH_REWARD_ERR_NOTPLACED);
        return;
    }

    // 引导没有完成跳过时间判断
    let guideWeak = account.guide_weak;//CacheAccount.getGuideWeak(account_id);
    if (guideWeak.petfish == null || !guideWeak.petfish) {
        // Do nothing.
        logger.info("没有完成引导, 需要跳过倒计时");
    }
    else {
        if (!_PetfishCanReward(petfish,aquarium)) {
            logger.error("宠物鱼没有到时间");
            cb(ERROR_OBJ.PETFISH_REWARD_ERR_TIME_NOT_UP);
            return;
        }
    }

    // 计算玩家可以开启宝箱的次数: probase + progoldadd
    // 重置宠物鱼状态
    petfish.state = PET_STATE.ALREADY_REWARD;

    let goddess = getCurrentGoddess();
    let item_list = getItemlistFromFish(petfish, goddess);
    let ret = {
        item_list: item_list,
        change: {
            pearl: account.pearl,
            gold: account.gold,
            skill: account.skill,
            package: account.package,
        },
        aquarium: _currentAquarium(account),
    };
    account.aquarium = ret.aquarium;
    account.commit();
    cb(null, ret);

    function getCurrentGoddess() {
        for (let idx in aquarium.goddess) {
            let goddess = aquarium.goddess[idx];
            let state = goddess.state;
            if (GODDESS_STATE.PLACED == state) {
                goddess.id = idx;
                return goddess;
            }
        }
        return null;
    }

    function getItemlistFromFish(petfish, goddess) {
        let petfish_info = configReader.getValue('aquarium_petfish_cfg', petfish.id);
        let tid = petfish_info.treasureid;
        let goddess_id = 0;
        let goddess_lv = 0;
        if (goddess) {
            goddess_id = goddess.id;
            goddess_lv = goddess.lv;
        }
        let reward_times = BuzzUtil.getRewardTimes4Petfish(petfish, goddess_id, goddess_lv);
        let dropRet = dropManager.openTreasure(account, tid, common_log_const_cfg.Pet_FISH_DROP, 1, reward_times);
        let item_list = dropRet.logItems;
        return item_list;
    }
}

function putGoddess(data, cb) {
    let account=data.account;
    let id=data.id;
    let aquarium = _getAquariumOrInit(account);

    // 数据验证及操作.
    if (aquarium.goddess['' + id] == null) {
        logger.error("放置的女神没有解锁");
        cb(ERROR_OBJ.GODDESS_LOCKED);
        return;
    }
    else {
        logger.info("放置的女神已解锁");
        let goddess = aquarium.goddess['' + id];
        logger.info("goddess:", goddess);
        if (GODDESS_STATE.PLACED == goddess.state) {
            logger.error("女神已经处于放置状态，请勿重复放置");
            cb(ERROR_OBJ.GODDESS_PLACED);
            return;
        }
        else if (GODDESS_STATE.NOTPLACED == goddess.state
            || "undefined" == typeof(goddess.state)) {
            // 遍历设置女神为0
            for (let idx in aquarium.goddess) {
                aquarium.goddess[idx].state = GODDESS_STATE.NOTPLACED;
            }

            goddess.state = GODDESS_STATE.PLACED;
            CacheAccount.setAquarium(account, aquarium);
            account.commit();
            cb(null, _currentAquarium(account));// 返回当前水族馆的所有数据
            return;
        }
        logger.error("女神处于未知状态:" + goddess.state);
        logger.error("goddess:", goddess);
        cb(ERROR_OBJ.GODDESS_STATE_ERR);
        return;
    }
}

function getAquarium(data, cb) {
    cb(null, _currentAquarium(data.account));
}

function checkAccount(data, cb, next) {
    next(data, cb, data.account);
}


//==============================================================================
// private
//==============================================================================

//----------------------------------------------------------
// 获取水族馆信息(玩家点击水族馆时调用)
//----------------------------------------------------------
function _didGetAquarium(data, cb) {
    const FUNC = TAG + "_didGetAquarium() --- ";

    logger.info(FUNC + "CALL...");

    let account_id = data['account_id'];
    
    
    CacheAccount.getAccountById(account_id, function (err, account) {

        logger.info(FUNC + "玩家ID存在于内存:", account_id);
        logger.info(FUNC + "Aquarium:", _currentAquarium(account));

        cb(null, _currentAquarium(account));

    });
}

//----------------------------------------------------------
// 放置女神
//----------------------------------------------------------
function _didPutGoddess(req, data, cb) {
    const FUNC = TAG + "_didPutGoddess() --- ";
    
    let token = data['token'];
    let id = data['id'];
    let account_id = data['account_id'];


    CacheAccount.getAccountById(account_id, function (err, account) {
        if(account){
            logger.info(FUNC + "call _getAquariumOrInit()");
            let aquarium = _getAquariumOrInit(account);

            // 数据验证及操作.
            if (aquarium.goddess['' + id] == null) {
                logger.error(FUNC + "放置的女神没有解锁");
                cb(ERROR_OBJ.GODDESS_LOCKED);
                return;
            }
            else {
                logger.info(FUNC + "放置的女神已解锁");
                let goddess = aquarium.goddess['' + id];
                logger.info(FUNC + "goddess:", goddess);
                if (GODDESS_STATE.PLACED == goddess.state) {
                    logger.error(FUNC + "女神已经处于放置状态，请勿重复放置");
                    cb(ERROR_OBJ.GODDESS_PLACED);
                    return;
                }
                else if (GODDESS_STATE.NOTPLACED == goddess.state
                    || "undefined" == typeof(goddess.state)) {
                    // 遍历设置女神为0
                    for (let idx in aquarium.goddess) {
                        aquarium.goddess[idx].state = GODDESS_STATE.NOTPLACED;
                    }

                    goddess.state = GODDESS_STATE.PLACED;
                    CacheAccount.setAquarium(account, aquarium);
                    account.commit();
                    cb(null, _currentAquarium(account));// 返回当前水族馆的所有数据
                    return;
                }
                logger.error(FUNC + "女神处于未知状态:" + goddess.state);
                logger.error(FUNC + "goddess:", goddess);
                cb(ERROR_OBJ.GODDESS_STATE_ERR);
                return;
            }
        }
    });

}

//----------------------------------------------------------
// 获取宠物鱼奖励
//----------------------------------------------------------
function _didRewardPetfish(req, data, cb, account) {
    const FUNC = TAG + "_didRewardPetfish() --- ";
    
    let token = data['token'];
    let id = data['id'];
    let account_id = data['account_id'];

    CacheAccount.getAccountById(account_id, function (err, account) {
        logger.info(FUNC + "call _getAquariumOrInit()");
        let aquarium = _getAquariumOrInit(account);

        if (!_fishUnlocked(aquarium, id, cb)) return;

        let petfish = aquarium.petfish['' + id];

        if (!_fishPlaced(petfish)) {
            logger.error(FUNC + "宠物鱼未放养，无法收取");
            cb(ERROR_OBJ.PETFISH_REWARD_ERR_NOTPLACED);
            return;
        }

        // 引导没有完成跳过时间判断
        let guideWeak = account.guide_weak;//CacheAccount.getGuideWeak(account_id);
        logger.info(FUNC + "guideWeak:", guideWeak);
        if (guideWeak.petfish == null || !guideWeak.petfish) {
            // Do nothing.
            logger.info(FUNC + "没有完成引导, 需要跳过倒计时");
        }
        else {
            if (!_PetfishCanReward(petfish,aquarium)) {
                logger.error(FUNC + "宠物鱼没有到时间");
                cb(ERROR_OBJ.PETFISH_REWARD_ERR_TIME_NOT_UP);
                return;
            }
        }

        // 计算玩家可以开启宝箱的次数: probase + progoldadd
        // TODO: 将客户端计算的宝箱掉落逻辑转移到服务器
        // 重置宠物鱼状态
        petfish.state = PET_STATE.ALREADY_REWARD;

        // let aquarium = account.aquarium;
        let goddess = getCurrentGoddess();
        let item_list = getItemlistFromFish(petfish, goddess);
        let ret = {
            item_list: item_list,
            change: {
                pearl: account.pearl,
                gold: account.gold,
                skill: account.skill,
                package: account.package,
            },
            aquarium: _currentAquarium(account),
        };
        account.aquarium = ret.aquarium;
        account.commit();
        cb(null, ret);

        function getCurrentGoddess() {
            for (let idx in aquarium.goddess) {
                let goddess = aquarium.goddess[idx];
                let state = goddess.state;
                if (GODDESS_STATE.PLACED == state) {
                    goddess.id = idx;
                    return goddess;
                }
            }
            return null;
        }

        function getItemlistFromFish(petfish, goddess) {
            let petfish_info = configReader.getValue('aquarium_petfish_cfg', petfish.id);
            let tid = petfish_info.treasureid;
            let goddess_id = 0;
            let goddess_lv = 0;
            if (goddess) {
                goddess_id = goddess.id;
                goddess_lv = goddess.lv;
            }
            let reward_times = BuzzUtil.getRewardTimes4Petfish(petfish, goddess_id, goddess_lv);
            let dropRet = dropManager.openTreasure(account, tid, common_log_const_cfg.Pet_FISH_DROP, 1, reward_times);
            let item_list = dropRet.logItems;
            return item_list;
        }

    });

}

//----------------------------------------------------------
// 放养
//----------------------------------------------------------

function _didPutPetfish(req, data, cb) {
    
    let id = data['id'];
    let account_id = data['account_id'];

    CacheAccount.getAccountById(account_id, function (err, account) {
        _checkFish(account, id, cb);
    });
}

function _checkFish(account, id, cb) {
    const FUNC = TAG + "_checkFish() --- ";

    logger.info(FUNC + "CALL...");

    let aquarium = _getAquariumOrInit(account);
    let count = 0;
    
    for (let i in id) {
        let fish_id = id[i];
        //logger.info("fish_id:", fish_id);
        if (!_fishUnlocked(aquarium, fish_id, cb)) return;
        
        logger.info(FUNC + "用户放养的鱼在水族馆中");
        let petfish = aquarium.petfish['' + fish_id];
        if (_fishPlaced(petfish)) {
            logger.error(FUNC + "用户放养的鱼已经处于放养状态，请勿重复放养");
            cb(ERROR_OBJ.PETFISH_PLACED);
            return;
        }
        else if (petfish.state == PET_STATE.NOTPLACED) {
            count++;
            petfish.state = PET_STATE.PLACED;
            petfish.starttime = new Date().getTime();// 设置时间戳
            //petfish.starttime = new Date().getTime() - 10000;// 设置时间戳,测试，开始时间早10秒
            continue;
        }
        else if (petfish.state == PET_STATE.ALREADY_REWARD) {
            logger.error(FUNC + "宠物鱼今日已放养并领取奖励");
            continue;
        }

        logger.error(FUNC + "宠物鱼处于未知状态:" + petfish.state);
        cb(ERROR_OBJ.PETFISH_STATE_ERR);
        return;
    }
    account.aquarium = aquarium;

    //统计放养鱼dfc
    if(count) {
        let mission = new RewardModel(account);
        mission.updateProcess(RewardModel.TaskType.STOCKING_FISH, count);
        mission.updateProcess(RewardModel.TaskType.PETFISH_TOTAL_LEVEL, account.petfish_total_level);
        mission.commit(); 
    }
    account.commit();
    cb(null, _currentAquarium(account));// 返回当前水族馆的所有数据
}

// 判断当前宠物鱼是否解锁
function _fishUnlocked(aquarium, id, cb) {
    const FUNC = TAG + "_fishUnlocked() --- ";

    if (aquarium.petfish['' + id] == null) {
        logger.error(FUNC + "用户放养的鱼并没有在水族馆中");
        if (cb) cb(ERROR_OBJ.PETFISH_LOCKED);
        return false;
    }
    return true;
}

// 判断当前宠物鱼是否为放养状态
function _fishPlaced(petfish) {
    return petfish.state == PET_STATE.PLACED || petfish.state == PET_STATE.READY;
}

// 宠物鱼已经可以收取奖励(时间已到)
function _PetfishCanReward(petfish,aquarium) {
    _setLeftTime(petfish,aquarium);
    return petfish.lefttime == 0;
}

//----------------------------------------------------------
// 升级
//----------------------------------------------------------

// function _didUpgradePetfish(req, data, cb) {
//     const FUNC = TAG + "_didUpgradePetfish() --- ";

//     let token = data['token'];
//     let id = data['id'];
//     let uid = data['account_id'];
    
//     logger.info(FUNC + "fish_id:", id);

//     let chip_id = _getChipFromId(id);

//     CacheAccount.getAccountById(uid, function (err, account) {

//         if(account){

//             let coinId = shop_shop_buy_type_cfg.PETFISH_UP.id;
//             let coinType = shop_shop_buy_type_cfg.PETFISH_UP.name;

//             account.aquarium = account.aquarium || {};// 数据为空则初始化
//             account.aquarium.petfish = account.aquarium.petfish || {};// 数据为空则初始化

//             let aquarium = account.aquarium;

//             // 未解锁指定id的鱼等级设置为0
//             let level = 0;//data['level'];

//             // 取用对象的键时再确认一下对象是否为空.
//             if (aquarium.petfish != null && aquarium.petfish["" + id] != null) {
//                 level = account.aquarium.petfish["" + id].level;
//             }
//             let need = _getCost(level);// 获取消耗品种类和数量
//             logger.info(FUNC + "解锁或升级需要消耗的碎片 --- need:", need);

//             // 查看当前玩家水族馆中这个鱼是否解锁或达到了目标等级
//             if (_alreadyHave(account, id, level, cb)) return;

//             // 判断玩家碎片是否足够
//             if (!_isChipEnough(account, id, need.chip, cb)) return;

//             let package1 = account.package;
//             let chip = package1[ItemTypeC.DEBRIS];

//             // 金币数量判断
//             if (!_isGoldEnough(account, need.gold, cb)) return;

//             // 消耗碎片: 从缓存背包中删除一定量的碎片, 从缓存金币数量中扣除金币
//             chip[chip_id] -= need.chip;

//             BuzzUtil.useCoin(account, coinId, need.gold, function (err, res) {

//                 // account.gold = -need.gold;

//                 if (aquarium && aquarium.petfish) {

//                     // 在水族馆中放入一条鱼(数据字段为aquarium)
//                     // 或升级已经解锁的鱼
//                     if (level == 0) {
//                         logger.info(FUNC + "解锁！");
//                         aquarium.petfish["" + id] = {
//                             id: id,
//                             level: level + 1,
//                             state: PET_STATE.NOTPLACED,
//                             time: 0,
//                         };
//                     }
//                     else {
//                         logger.info(FUNC + "升级！");
//                         aquarium.petfish["" + id].level++;
//                     }

//                     // 记录玩家宠物鱼的排名更新
//                     let petfish_list = aquarium.petfish;
//                     let total_level = 0;
//                     for (let i in petfish_list) {
//                         let petfish = petfish_list[i];
//                         total_level += petfish.level;
//                     }
//                     CacheAccount.setMaxPetfishLevel(account, total_level);
//                     account.package = package1;
//                     CacheAccount.setAquarium(account, aquarium,function (err, res) {
//                         account.commit();
//                         cb(null, account);
//                     });
//                     logBuilder.addItemLog(account.id, chip_id, -need.chip, chip[chip_id], common_log_const_cfg.PET_FISH_UPGRADE, account.level);
//                 }
//             });

//             /**
//              * 玩家游戏币是否足够的判断.
//              */
//             function _isGoldEnough(account, needCoin, cb) {
//                 const FUNC = TAG + "_isGoldEnough() --- ";

//                 let ownCoin = account[coinType];
//                 logger.info(FUNC + "ownCoin:", ownCoin);
//                 if (ownCoin < needCoin) {
//                     logger.error("金币不足:", ERROR_OBJ.GOLD_NOT_ENOUGH);
//                     cb(ERROR_OBJ.GOLD_NOT_ENOUGH);
//                     return false;
//                 }
//                 return true;
//             }
//         }
//         else {
//             cb(new Error("玩家数据错误"));
//         }

//     });
// }

////------------------------------------------------------------------------------

/**
 * 判断玩家碎片是否足够, 需要读取缓存中的背包.
 */
function _isChipEnough(account, fish_id, need_chip, cb) {
    const FUNC = TAG + "_isChipEnough() --- ";

    account.package = ObjUtil.str2Data(account.package);
    let pack = account.package;
    let chip = pack[ItemTypeC.DEBRIS];
    let chip_id = _getChipFromId(fish_id);
    logger.info(FUNC + "chip:", chip);
    logger.info(FUNC + "chip_id:", chip_id);
    if (chip) {
        if (chip[chip_id] == null || chip[chip_id] < need_chip) {
            logger.error(FUNC + "碎片不足:", ERROR_OBJ.CHIP_NOT_ENOUGH);
            cb(ERROR_OBJ.CHIP_NOT_ENOUGH);
            return false;
        }
        return true;
    }
    else {
        logger.error(FUNC + "碎片不足:", ERROR_OBJ.CHIP_NOT_ENOUGH);
        cb(ERROR_OBJ.CHIP_NOT_ENOUGH);
        return false;
    }
}

function _getCost(level) {
    for (let idx in aquarium_petup_cfg) {
        let petup = aquarium_petup_cfg[idx];
        if (petup.level == level + 1) {
            return {
                chip: petup.chip,
                gold: petup.needgold,
            };
        }
    }
    throw new Error("没有查找到对应的宠物鱼等级");
}

function _alreadyHave(account, id, level, cb) {
    if (account.aquarium != null) {
        if (level == 0 && account.aquarium["" + id] != null) {
            cb && cb(new Error("玩家已经解锁了这条鱼"));
            return true;
        }
        else if (level > 0 && account.aquarium["" + id] > level) {
            cb && cb(new Error("玩家已经将这条鱼升级到了" + (level + 1)));
            return true;
        }
    }
    return false;
}

function _prepareGet(data, cb) {
    const FUNC = TAG + "_prepareGet() --- ";
    
    let token = data['token'];
    logger.info(FUNC + "token:", token);
    if (!CommonUtil.isParamExist("aquarium", token, "接口调用请传参数token", cb)) return false;
    let account_id = token.split("_")[0];
    data['account_id'] = account_id;
    
    return true;
}

function _prepare(data, cb) {
    const FUNC = TAG + "_prepareGet() --- ";
    
    let token = data['token'];
    let id = data['id'];
    
    logger.info(FUNC + "token:", token);
    logger.info(FUNC + "id:", id);

    if (!CommonUtil.isParamExist("aquarium", token, "接口调用请传参数token", cb)) return false;
    if (!CommonUtil.isParamExist("aquarium", id, "接口调用请传参数id(玩家需要解锁的鱼的ID)", cb)) return false;
    
    // 扩展数据
    let account_id = token.split("_")[0];
    data['account_id'] = account_id;
    
    return true;
}

//----------------------------------------------------------
// 通用
//----------------------------------------------------------

function _petupInfo(level) {
    for (let idx in aquarium_petup_cfg) {
        let info = aquarium_petup_cfg[idx];
        if (info.level == level) {
            return info;
        }
    }
}

function _petfishInfo(id) {
    for (let idx in aquarium_petfish_cfg) {
        let info = aquarium_petfish_cfg[idx];
        if (info.id == id) {
            return info;
        }
    }
}

function _getChipFromId(id) {
    const FUNC = TAG + "_getChipFromId() --- ";
    let fishInfo = _petfishInfo(id);
    if (fishInfo) {
        return fishInfo.chip;
    }
    else {
        logger.error(FUNC + "获取鱼的信息失败, 鱼的id:", id);
        return null;
    }
    // return _petfishInfo(id).chip;
}

function _realProtime(id, level) {
    const FUNC = TAG + "_realProtime() --- ";
    
    logger.info(FUNC + "id:", id);
    logger.info(FUNC + "level:", level);
    let protime = _petfishInfo(id).protime;
    let protimecut = _petupInfo(level).protimecut;
    return protime * (1 - protimecut);
}

// 获取当前的水族馆状态(返回给客户端使用)
function _currentAquarium(account) {
    const FUNC = TAG + "_currentAquarium() --- ";

    logger.info(FUNC + "call _getAquariumOrInit()");
    let aquarium = _getAquariumOrInit(account);
    
    for (let idx in aquarium.petfish) {
        let petfish = aquarium.petfish[idx];
        if (petfish.state == PET_STATE.PLACED) {
            _setLeftTime(petfish,aquarium);
        }
        if (petfish.state == PET_STATE.ALREADY_REWARD) {
            _resetPetFishState(petfish);
        }
    }
    account.aquarium = aquarium;
    account.commit();
    return aquarium;
}

// 返回的时间要转化为剩余时间
function _setLeftTime(petfish,aquarium) {
    let passedtime = Math.floor((new Date().getTime() - petfish.starttime) / 1000);
    petfish.time = passedtime;
    petfish.lefttime = _realProtime(petfish.id, petfish.level) - passedtime;
    if(aquarium){
        for(let i in aquarium.goddess) {
            if(aquarium.goddess[i].state==1){
                let id = i;
                let level = aquarium.goddess[i].level || 1;
                let camp;
                for(let k in goddess_goddessup_cfg) {
                    for(let l in aquarium_petfish_cfg) {
                        if(aquarium_petfish_cfg[l].id==petfish.id) {
                            camp = aquarium_petfish_cfg[l].camp;
                        }
                    }
                    if(goddess_goddessup_cfg[k].id==id && goddess_goddessup_cfg[k].level == level &&
                        goddess_goddessup_cfg[k].property==6 && camp==id) {
                        petfish.lefttime -= goddess_goddessup_cfg[k].value;
                        break;
                    }
                }
            }
        }
    }
    if (petfish.lefttime < 0) {
        petfish.lefttime = 0;
        // 服务器永远不会有这个可领取状态(是否可领取根据petfish.lefttime = 0来设置)
        // petfish.state = PET_STATE.READY;// 剩余时间为0, 设置宠物鱼状态为可领取
    }

    //petfish.time = 10000000;// 测试用
    //petfish.lefttime = 0;// 测试用
}

// 如果开始时间早于当日的凌晨0时时间戳, 则设置状态为未放置
function _resetPetFishState(petfish) {
    if (petfish.starttime < DateUtil.timestamp4zero()) {
        petfish.state = PET_STATE.NOTPLACED;
    }
}

// 获取水族馆数据或初始化
function _getAquariumOrInit(account, cb) {
    const FUNC = TAG + "_getAquariumOrInit() --- ";

    let aquarium = account.aquarium = account.aquarium || {};

    // 宠物鱼初始化
    if (aquarium.petfish == null) {
        logger.info(FUNC + "aquarium.petfish == null, 宠物鱼重新设置");
        aquarium.petfish = {};
    }

    // 女神初始化
    logger.info(FUNC + "aquarium.goddess:", aquarium.goddess);
    if (aquarium.goddess == null || _.keys(aquarium.goddess).length == 0) {
        aquarium.goddess = buzz_goddess.getUnlocked(account);
        // 默认第一个女神状态为1
        for (let idx in aquarium.goddess) {
            if (idx == '1') {
                aquarium.goddess['' + idx].state = 1;
                break;
            }
        }
    }
    else {
        let unlocked_goddess = buzz_goddess.getUnlocked(account);
        for (let goddess_id in aquarium.goddess) {
            if (!unlocked_goddess[goddess_id]) {
                delete aquarium.goddess[goddess_id];
            }
        }
        account.aquarium = aquarium;
        buzz_goddess.updateLevel(account);
    }

    if (aquarium.goddess.state) {
        delete aquarium.goddess.state;
    }
    account.aquarium = aquarium;
    account.commit();
    return aquarium;
}