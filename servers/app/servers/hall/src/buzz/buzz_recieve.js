const _ = require('underscore');
const CstError = require('../../../../consts/fish_error');
const ERROR_OBJ = CstError.ERROR_OBJ;
const ObjUtil = require('./ObjUtil');
const ArrayUtil = require('../utils/ArrayUtil');
const BuzzUtil = require('../utils/BuzzUtil');
const RandomUtil = require('../../../../utils/RandomUtil');
const ACCOUNTKEY = require('../../../../models/index').ACCOUNTKEY;
const HttpUtil = require('../utils/HttpUtil');
const DaoUtil = require('../utils/DaoUtil');
const DaoCommon = require('../dao/dao_common');
const CacheAccount = require('./cache/CacheAccount');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const SCENE = gameConfig.common_log_const_cfg;
const goldfish_goldlevel_cfg = gameConfig.goldfish_goldlevel_cfg;
const goldfish_goldfish_cfg = gameConfig.goldfish_goldfish_cfg;
const item_item_cfg = gameConfig.item_item_cfg;
const item_itemtype_cfg = gameConfig.item_itemtype_cfg;
const string_strings_cfg = gameConfig.string_strings_cfg;
const change_change_cfg = gameConfig.change_change_cfg;
const vip_vip_cfg = gameConfig.vip_vip_cfg;
//----------------------------------------------------------
// 通用

let ItemType = require('./pojo/Item').ItemType;

//==============================================================================
// const
//==============================================================================
let DEBUG = 0;
let ERROR = 1;
const TAG = "【buzz_recieve】";

exports.weaponUp = weaponUp;
exports.buyVipGift = buyVipGift;
exports.vipDailyReward = vipDailyReward;

exports.queryCik = queryCik;

function weaponUp(req, dataObj, cb) {
    const FUNC = TAG + "weaponUp() --- ";
    //----------------------------------
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "weapon_up");

    // TODO

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_recieve", cb);
    }
}

function buyVipGift(dataObj, cb) {
    const FUNC = TAG + "buyVipGift() --- ";
    //----------------------------------
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "buy_vip_gift");

    // TODO

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_recieve.buyVipGift", cb);
    }
}

function vipDailyReward(dataObj, cb) {
    const FUNC = TAG + "vipDailyReward() --- ";
    //----------------------------------
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "vip_daily_reward");

    _vipDailyReward(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_recieve.vipDailyReward", cb);
    }
    
}

//----------------------------------------------------------

/**
 * 校验客户端传来的数据.
 */
function _checkTurntableDraw(account, goldlevel, cb) {
    // 判断传入的奖金鱼抽奖等级是否合法
    if (goldlevel < 1 || goldlevel > 6) {
        cb(ERROR_OBJ.BONUS_GOLDLEVEL_WRONG);
        return false;
    }
    // TODO: 判断是否满足该等级的抽奖条件(goldfishcount, goldcount)
    let goldfishcount = 10;
    let goldcount = 10000000;
    for (let idx in goldfish_goldlevel_cfg) {
        if (goldfish_goldlevel_cfg[idx].goldlevel == goldlevel) {
            goldfishcount = goldfish_goldlevel_cfg[idx].goldfishcount;
            goldcount = goldfish_goldlevel_cfg[idx].goldcount;
            break;
        }
    }

    // yTODO: 什么时候在对bonus进行修改?
    let bonus = account.bonus;
    if (bonus.fish_count < goldfishcount) {
        cb(ERROR_OBJ.BONUS_FISH_NOT_ENOUGH);
        return false;
    }
    if (bonus.gold_count < goldcount) {
        cb(ERROR_OBJ.BONUS_GOLD_NOT_ENOUGH);
        return false;
    }
    return true;
}

/**
 * 获取当前抽奖等级对应的信息列表.
 */
function _getRewardList(goldlevel) {
    let reward_list = [];
    for (let idx in goldfish_goldfish_cfg) {
        let reward = goldfish_goldfish_cfg[idx];
        if (!reward.wintimes) {
            reward.wintimes = [];
        }
        if (reward.goldlevel == goldlevel) {
            reward_list.push(reward);
        }
    }
    return reward_list;
}

function _getRewardProbability(reward_list) {
    let probability = [];
    for (let i = 0; i < reward_list.length; i++) {
        probability.push(reward_list[i].item_probability);
    }
    return probability;
}

/**
 * 检查实物兑换是否满足条件.
 */
function _checkChangeInKind1(account, change_id, cb) {
    const FUNC = TAG + "_checkChangeInKind1() --- ";

    let change_info = getChangeInfoFromId(change_id);
    if (change_info == null) {
        cb(ERROR_OBJ.CIK_WRONG_CHANGE_ID);
        return false;
    }

    // 兑换券
    let tokens = 0;
    if (typeof(account.package[ItemType.TOKENS]) == "undefined") {
        cb(ERROR_OBJ.CIK_TOKEN_NOT_ENOUGH);
        return false;
    }
    if (typeof(account.package[ItemType.TOKENS]["i003"]) == "undefined") {
        cb(ERROR_OBJ.CIK_TOKEN_NOT_ENOUGH);
        return false;
    }
    tokens = account.package[ItemType.TOKENS]["i003"];

    // 需要的话费券是否足够判断
    logger.info(FUNC + "需要消耗兑换券:", change_info.cost);
    logger.info(FUNC + "拥有兑换券:", tokens);
    if (change_info.cost > tokens) {
        cb(ERROR_OBJ.CIK_TOKEN_NOT_ENOUGH);
        return false;
    }
    
    return true;
}


/**
 * 检查实物兑换是否满足条件.
 */
function _checkChangeInKind2(account, change_id, cb, next) {
    const FUNC = TAG + "_checkChangeInKind2() --- ";

    // let count = CacheOperation.findValueByCid(change_info.id, 1);
    // let total = CacheOperation.findValueByCid(change_info.id, 2);

    let change_info = getChangeInfoFromId(change_id);
    let data = {
        cid: change_info.id
    };
    HttpUtil.postBalance('/server_api/find_values_by_cid', data, function(ret) {
        HttpUtil.handleReturn(ret, function(err, values) {
            let count = values.count;
            let total = values.total;

            // 判断总库存是否足够
            if (total > 0) {
                cb(ERROR_OBJ.CIK_TOTAL_NOT_ENOUGH);
                return;
            }

            // 判断有没有库存
            if (count > 0) {
                cb(ERROR_OBJ.CIK_COUNT_NOT_ENOUGH);
                return;
            }

            next();
            // return true;
        });
    });
}

function getChangeInfoFromId(change_id) {
    for (let idx in change_change_cfg) {
        let record = change_change_cfg[idx];
        if (record.id == change_id) {
            return record;
        }
    }
    return null;
}


/** 
 * 领取VIP每日奖励
 */
function _vipDailyReward(dataObj, cb) {
    let uid = dataObj.uid;
    doNextWithAccount(dataObj.account);
    function doNextWithAccount(account) {
        if (account.vip_daily_reward == 1) {
            cb(ERROR_OBJ.VIP_DAILY_REWARD_GOTTEN);
            return;
        }

        // 加载配置表数据
        let gift_free = vip_vip_cfg[account.vip].gift_free;
        let item_list = transItemList(gift_free);

        BuzzUtil.putIntoPack( account, item_list, function(reward_info) {
            let change = BuzzUtil.getChange(account, reward_info);
            account.vip_daily_reward = 1;
            let ret = {
                item_list: item_list,
                change: change,
                vip_daily_reward: account.vip_daily_reward,
            };
            cb(null, ret);
            account.commit();

            DaoUtil.update('tbl_account', ["vip_daily_reward=1"], [{field:'id', operator:'=', value:uid}]);
        });
    }

}

/**
 * 转换数据格式
 * [["i001",1000]] -> [{item_id:"i001", item_num:1000}]
 */
function transItemList(input) {
    let item_list = [];
    for (let i = 0; i < input.length; i++) {
        item_list.push({
            item_id: input[i][0],
            item_num: input[i][1],
        });
    }
    return item_list;
}




function queryCik(cb) {
    let sql = "SELECT `uid`,`itemname`,`count` FROM `tbl_change_log` order by `id` DESC  limit 100";
    mysqlConnector.query(sql, [],async function (err, res) {
        if (err) {
            cb && cb(ERROR_OBJ.DB_ERR);
            return;
        }
        for(let i=0;i<res.length;i++) {
            try{
                let account = await CacheAccount.getAccountFieldByIdSync(res[i].uid,[ACCOUNTKEY.NICKNAME]);
                res[i].nickname = account.nickname;
            }catch(err){
                
            }
        }
        cb(null, res);
    });
}