const _ = require('underscore');
const CstError = require('../../../../consts/fish_error');
const ERROR_OBJ = CstError.ERROR_OBJ;
const ObjUtil = require('./ObjUtil');
const ArrayUtil = require('../utils/ArrayUtil');
const BuzzUtil = require('../utils/BuzzUtil');
const RedisUtil = require('../utils/RedisUtil');
const RandomUtil = require('../utils/RandomUtil');
const DaoUtil = require('../utils/DaoUtil');
const DaoOperation = require('../dao/dao_operation');
const DaoChange = require('../dao/dao_change');
const CacheAccount = require('./cache/CacheAccount');
const REDISKEY = require('../../../../models/index').REDISKEY;
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const tools = require('../../../../utils/tools');
const SCENE = gameConfig.common_log_const_cfg;
const goldfish_goldlevel_cfg = gameConfig.goldfish_goldlevel_cfg;
const goldfish_goldfish_cfg = gameConfig.goldfish_goldfish_cfg;
const common_const_cfg = gameConfig.common_const_cfg;
const string_strings_cfg = gameConfig.string_strings_cfg;
const change_change_cfg = gameConfig.change_change_cfg;
const vip_vip_cfg = gameConfig.vip_vip_cfg;
const shop_shop_buy_type_cfg = gameConfig.shop_shop_buy_type_cfg;
const GameEventBroadcast = require('../../../../common/broadcast/GameEventBroadcast');
const pack = require('../../controllers/data/pack');
const itemDef = require('../../../../consts/itemDef');
const buzz_cik = require('./buzz_cik');

//==============================================================================
// const
//==============================================================================
let DEBUG = 0;
let ERROR = 1;
const TAG = "【buzz_recieve】";

exports.turntableDraw = turntableDraw;
exports.changeInKind = changeInKind;
exports.getCikLog = getCikLog;
exports.getCikInfo = getCikInfo;
exports.cancelCik = cancelCik;

exports.buyVipGift = buyVipGift;
exports.vipDailyReward = vipDailyReward;


/**
 * 转盘抽奖.
 */
function turntableDraw(dataObj, cb) {
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "turntable_draw");

    _didTurntableDraw(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_recieve", cb);
    }
}

function changeInKind(dataObj, cb) {
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "change_in_kind");

    _didChangeInKind(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'change_id'], "buzz_recieve", cb);
    }
}

function getCikLog(dataObj, cb) {
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "get_cik_log");

    _didGetCikLog(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_recieve", cb);
    }
}

function getCikInfo(dataObj, cb) {
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "get_cik_info");

    _didGetCikInfo(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_recieve.getCikInfo", cb);
    }
}

function cancelCik(dataObj, cb) {
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "cancel_cik");

    _didCancelCik(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'orderid'], "buzz_recieve", cb);
    }
}

//----------------------------------------------------------

function buyVipGift(dataObj, cb) {
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "buy_vip_gift");

    _buyVipGift(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_recieve.buyVipGift", cb);
    }
}

function vipDailyReward(dataObj, cb) {
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "vip_daily_reward");

    _vipDailyReward(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_recieve.vipDailyReward", cb);
    }

}

// 转盘抽奖
function _didTurntableDraw(dataObj, cb) {
    const FUNC = TAG + "_didTurntableDraw() --- ";
    let uid = dataObj.uid;

    if (!dataObj.goldlevel) {
        return cb && cb(ERROR_OBJ.PARAM_MISSING);
    }

    let goldlevel = "" + dataObj.goldlevel;

    doNext(dataObj.account);

    function doNext(account) {
        if (!_checkTurntableDraw(account, goldlevel, cb)) return;

        // record wintimes
        let bonus = account.bonus;
        if (!bonus.wintimes) {
            bonus.wintimes = [0, 0, 0, 0, 0, 0];
        }
        bonus.wintimes[goldlevel - 1]++;
        logger.info(`这是等级${goldlevel}的奖金鱼第${bonus.wintimes[goldlevel - 1]}次抽奖`);

        let reward_list = _getRewardList(goldlevel);
        let probability = _getRewardProbability(reward_list);

        logger.info(FUNC + "reward_list:\n", reward_list);
        logger.info(FUNC + "probability:\n", probability);

        let drop_info = {
            drop_id: reward_list,
            probability: probability,
        };
        let goldfish_info = RandomUtil.randomDrop(drop_info);

        // handle wintimes
        for (let i = 0; i < reward_list.length; i++) {
            let wintimes = reward_list[i].wintimes;
            if (ArrayUtil.contain(wintimes, bonus.wintimes[goldlevel - 1])) {
                goldfish_info = reward_list[i];
                break;
            }
        }

        let item_list = [{
            item_id: goldfish_info.item_id,
            item_num: goldfish_info.item_count,
        },];

        // 清除奖金鱼数据
        CacheAccount.setBonus(uid, {
            fish_count: 0,
            gold_count: 0,
            got: false,
            wintimes: bonus.wintimes
        });

        BuzzUtil.putIntoPack(account, item_list, function (reward) {
            let change = BuzzUtil.getChange(account, reward);
            let ret = {
                item_list: item_list,
                change: change,
                item: goldfish_info.item, // goldfish_goldfish_cfg表中的item字段, 用于客户端旋转到转盘的指定位置
                first_share: account.first_turntable_draw
            };
            cb(null, ret);
            // logBuilder.addGameLog(item_list, account, SCENE.GOLDFISH_GAIN, "奖金鱼抽奖抽到");
            logBuilder.addGoldAndItemLog(item_list, account, SCENE.GOLDFISH_GAIN);
        });
    }
}

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


//----------------------------------------------------------
// 实物兑换

function _didChangeInKind(dataObj, cb) {
    const FUNC = TAG + "_didChangeInKind() --- ";
    let uid = dataObj.uid;
    let change_id = "" + dataObj.change_id;

    doNext(dataObj.account);

    function doNext(account) {

        if (!_checkChangeInKind1(account, change_id, cb)) return;

        _checkChangeInKind2(account, change_id, cb, function () {
            afterCheck();
        });

        async function afterCheck() {

            let change_info = getChangeInfoFromId(change_id);

            // 兑换物品
            let item = change_info.item;
            let item_key = item[0];
            let item_num = item[1];

            let item_info = tools.CfgUtil.item_item.getInfo(item_key);
            let item_type = item_info.type;
            if (null == item_info) {
                logger.info(FUNC + "物品信息不存在——item_key:", item_key);
                cb(ERROR_OBJ.CIK_WRONG_ITEM);
                return;
            }

            if (change_info.type == 1 || change_info.type == 2) {
                cb(ERROR_OBJ.NOT_SUPPORT_SERVICE);
                return;
                // try {
                //     let ret = await changeConditionLock.lock(account, change_info.cost[0][1]);
                //     if (ret) {
                //         cb(ret);
                //         return;
                //     }
                //
                //     let payFromLast3Days = await getPayFromLast3Days(account.id) || 0;
                //     let cashFromLast3Days = await getCashFromLast3Days(account.id) || 0;
                //     //加入订单信息，后台管理员处理，不能自动发货
                //     // let isHand = payFromLast3Days * common_const_cfg.CHANGE_CASH_3 <= (cashFromLast3Days + change_info.cost) * common_const_cfg.CHANGE_CASH_4;
                //     let isHand = payFromLast3Days <= (cashFromLast3Days + change_info.cost[0][1]) / common_const_cfg.CHANGE_CASH_4;
                //     // WARNING: 临时处理，全部改为手动发货.
                //     isHand = true;
                //     let isCikAuto = await getCikAuto();
                //     // if (!isCikAuto) {
                //     if (isHand || !isCikAuto) {
                //         status = 0;
                //     } else {
                //         // let responseContent = await buyCardTest(change_info, account);
                //         let responseContent = await buyCard(change_info, account);
                //         let card_arr = JSON.parse(responseContent);
                //         card_num = card_arr[0].Serial;
                //         card_pwd = card_arr[0].Pin;
                //
                //         status = 2;
                //         account.cash = change_info.value; // 自动发货时才会增加此变量
                //     }
                //     // console.log('uid:', account.id);
                //
                //     await changeConditionLock.unLock(account.id, ChangeConditionLock.LOCK_STATE.OK);
                //
                //     // 添加公告22-生成提现订单成功
                //     let itemName = tools.CfgUtil.item_item.getName(item_key);
                //     let params = [account.nickname, itemName];
                //     let content = {
                //         type: GameEventBroadcast.TYPE.GAME_EVENT.NOTIFY_CHANGE_CARD,
                //         params: params,
                //     };
                //     new GameEventBroadcast(content).extra(account).add();
                //
                // } catch (err) {
                //     logger.error('err:', err);
                //     cb({
                //         code: 1172,
                //         msg: 'Mệnh giá thẻ này đang nâng cấp. Vui lòng đổi thẻ khác.'
                //     });
                //
                //     await changeConditionLock.setLockState(ChangeConditionLock.LOCK_STATE.FAIL);
                //     return;
                // }
            } else {
                let item_list = [{
                    item_id: item_key,
                    item_num: item_num,
                }];
                switch (item_type) {
                    // 兑换金币
                    case ItemType.GOLD:
                        {
                            account.gold = item_num;
                            break;
                        }
                    // 兑换钻石
                    case ItemType.PEARL:
                        {
                            account.pearl = item_num;
                            break;
                        }
                    // 兑换实物
                    case ItemType.CHANGE_FARE:
                    case ItemType.CHANGE_PHONE:
                        {
                            break;
                        }
                    // 兑换游戏道具
                    default:
                        {
                            if (typeof (account.package[item_type]) == "undefined") {
                                account.package[item_type] = {};
                            }
                            if (typeof (account.package[item_type][item_key]) == "undefined") {
                                account.package[item_type][item_key] = 0;
                            }
                            account.package[item_type][item_key] += item_num;
                            break;
                        }
                }
                logBuilder.addGameLog(item_list, account, SCENE.CIK, "话费券兑换获取");

            }

            let exchange_cost = change_info.cost[0];
            let cost = exchange_cost[1];
            if (exchange_cost[0] == itemDef.GOLD) {
                // 扣除相应的金币
                let logInfo = {
                    account_id: account.id,
                    log_at: new Date(),
                    gain: 0,
                    cost: exchange_cost,
                    duration: 0,
                    total: account.gold,
                    scene: SCENE.CIK,
                    nickname: 0,
                    level: account.level,
                };
                logBuilder.addGoldLogEx(logInfo);
                account.gold -= cost;
            } else if (exchange_cost[0] == itemDef.HUAFEIQUAN) {
                // 扣除相应的兑换券
                let tokens = account.package[ItemType.TOKENS][itemDef.HUAFEIQUAN];
                logger.info(FUNC + "需要消耗兑换券:", cost);
                account.package[ItemType.TOKENS][itemDef.HUAFEIQUAN] -= cost;
                let costItemList = {
                    item_id: itemDef.HUAFEIQUAN,
                    item_num: -cost,
                };
                logBuilder.addGameLog(costItemList, account, SCENE.CIK, "话费券兑换时消耗");

                account.package = account.package;
            }
            account.commit();

            if (change_info.type == 1 || change_info.type == 2) {
                //记录当天兑换dfc 2018/1/8
                RedisUtil.hincr(REDISKEY.CIK_NUM, account.id);
                RedisUtil.hincrby(REDISKEY.CIK_LIMIT, account.id, change_info.value || 0); // 部分配置中才有value这个值
                RedisUtil.hset(REDISKEY.CIK_TIME, account.id, new Date().getTime());
            }

            let data = {
                cid: change_id,
                value: 1,
            };

            prepareReturn();

            async function prepareReturn() {

                let dailyLeft = await tools.RedisUtil.hget(REDISKEY.CIK_DAILY_LEFT, change_id);
                if (null != dailyLeft && undefined != dailyLeft) {
                    dailyLeft = Number(dailyLeft);
                } else {
                    dailyLeft = tools.CfgUtil.change.getInfo(change_id).count;
                }
                dailyLeft--;
                await tools.RedisUtil.hset(REDISKEY.CIK_DAILY_LEFT, change_id, dailyLeft);

                let totalLeft = await tools.RedisUtil.hget(REDISKEY.CIK_TOTAL_LEFT, change_id);
                if (null != totalLeft && undefined != totalLeft) {
                    totalLeft = Number(totalLeft);
                } else {
                    totalLeft = tools.CfgUtil.change.getInfo(change_id).total;
                }
                totalLeft--;
                await tools.RedisUtil.hset(REDISKEY.CIK_TOTAL_LEFT, change_id, totalLeft);

                let ret = {};
                ret.item_list = [{
                    item_id: item_key,
                    item_num: item_num
                }];
                ret.change = {};
                ret.change.package = {
                    "9": {
                        "i003": account.package[ItemType.TOKENS][itemDef.HUAFEIQUAN]
                    },
                };
                logger.info(FUNC + "item_type:", item_type);
                // logger.info(FUNC + "ItemType.PEARL:", ItemType.PEARL);
                switch (item_type) {
                    case ItemType.GOLD:
                        {
                            ret.change.gold = account.gold;
                            break;
                        }
                    case ItemType.PEARL:
                        {
                            ret.change.pearl = account.pearl;
                            break;
                        }
                    // 兑换实物
                    case ItemType.CHANGE_FARE:
                    case ItemType.CHANGE_PHONE:
                        {
                            break;
                        }
                    default:
                        {
                            if (!ret.change.package[item_type]) {
                                ret.change.package[item_type] = {};
                            }
                            ret.change.package[item_type][item_key] = account.package[item_type][item_key];
                            break;
                        }
                }

                // 兑换记录
                // 可选参数
                let name = dataObj.name;
                let phone = dataObj.phone;
                let address = dataObj.address;
                let item_name_string_id = item_info.name;
                let item_name = string_strings_cfg[item_name_string_id].cn;

                let status = _initStatus(item_type);

                // 需要调用负载均衡服接口
                let data = {
                    uid: uid,
                    name: name,
                    phone: phone,
                    address: address,
                    created_at: new Date().getTime(),
                    // orderid: BuzzUtil.getOrderId(sn),
                    // sn: sn,
                    cid: change_id,
                    catalog: Math.floor(change_id / 1000),
                    count: item_num,
                    cost: cost,
                    itemname: item_name,
                    status: status,
                    icon: item_info.icon,
                };
                buzz_cik.addCikOrder(data, function (err, result) {
                    myDao.addChangeLog(result, async function () {
                        let op_data = {
                            cfg_id: change_id
                        };
                        await DaoOperation.update(op_data, function () {
                            cb(null, ret);
                        });
                    });
                });
            }

        }

        function _initStatus(item_type) {
            switch (item_type) {
                case ItemType.CHANGE_FARE:
                case ItemType.CHANGE_PHONE:
                    return 0;
                default:
                    return 2;
            }
        }
    }
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
    if (typeof (account.package[ItemType.TOKENS]) == "undefined") {
        cb(ERROR_OBJ.CIK_TOKEN_NOT_ENOUGH);
        return false;
    }
    if (typeof (account.package[ItemType.TOKENS][itemDef.HUAFEIQUAN]) == "undefined") {
        cb(ERROR_OBJ.CIK_TOKEN_NOT_ENOUGH);
        return false;
    }
    tokens = account.package[ItemType.TOKENS][itemDef.HUAFEIQUAN];

    // 需要的话费券是否足够判断
    logger.info(FUNC + "需要消耗兑换券:", change_info.cost[0][1]);
    logger.info(FUNC + "拥有兑换券:", tokens);
    if (change_info.cost[0][1] > tokens) {
        cb(ERROR_OBJ.CIK_TOKEN_NOT_ENOUGH);
        return false;
    }

    return true;
}


/**
 * 检查实物兑换是否满足条件.
 */
function _checkChangeInKind2(account, change_id, cb, next) {

    let change_info = getChangeInfoFromId(change_id);
    let data = {
        cid: change_info.id
    };

    // yxlTODO: 判断总库存是否足够
    buzz_cik.findValuesByCid(data, function (err, values) {
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
 * 获取实物兑换记录
 */
function _didGetCikLog(dataObj, cb) {
    let data = {
        uid: dataObj.uid
    };
    buzz_cik.getCikLog(data, function (err, res) {
        cb && cb(err, res);
    });
}

/**
 * 返回兑换数据中的每日剩余数量
 */
async function _didGetCikInfo(dataObj, cb) {
    let leftData = tools.CfgUtil.change.getDailyLeftData();
    let cikDailyLeft = await tools.RedisUtil.hgetall(REDISKEY.CIK_DAILY_LEFT);
    //logger.error('cikDailyLeft: ', cikDailyLeft);
    if (cikDailyLeft) {
        for (let cid in cikDailyLeft) {
            let redisRecord = Number(cikDailyLeft[cid]);
            if (!isNaN(redisRecord)) {
                leftData[cid] = {};
                leftData[cid].left = Number(cikDailyLeft[cid]);
            }
        }
    }
    cb(null, leftData);
}

/**
 * 玩家取消实物兑换
 */
async function _didCancelCik(dataObj, cb) {
    let orderid = dataObj.orderid;
    let account = dataObj.account;

    let orderData = await tools.SqlUtil.query('select * from tbl_change_log where id=?', [orderid]);
    let orderInfo = orderData[0];
    logger.error('orderInfo:', orderInfo);

    DaoChange.cancelCik(orderid, function (err, result) {

        if (err) {
            cb(ERROR_OBJ.CIK_CANCEL_FAIL);
            return;
        }

        logger.error('result:', result);

        // 返回兑换券
        let change_info = BuzzUtil.getChangeById(orderInfo.cid);
        let cost = change_info.cost[0][1];
        let item_list = [{
            item_id: itemDef.HUAFEIQUAN,
            item_num: cost,
        }];

        pack.exchange(dataObj, [], item_list, 56);
        // pack.exchange(dataObj, [], item_list, common_log_const_cfg.CHANGE_CANCEL);
        let ret = {
            item_list: item_list,
            change: {
                package: account.package
            },
        };
        cb(null, ret);
    });
}

/**
 * VIP礼包购买
 * @param {*} dataObj
 * @param {*} cb
 */
function _buyVipGift(dataObj, cb) {
    const FUNC = TAG + "_buyVipGift() --- ";
    let uid = dataObj.uid;
    let buyLevel = dataObj.buyLevel; //购买礼包的等级

    if (undefined == buyLevel) {
        return cb && cb(ERROR_OBJ.PARAM_MISSING);
    }

    let vipInfo = vip_vip_cfg[buyLevel];
    let giftPrice = vipInfo.gift_price2;

    let coinId = shop_shop_buy_type_cfg.BUY_VIPGIFT.id;
    let coinType = shop_shop_buy_type_cfg.BUY_VIPGIFT.name;

    doNext(dataObj.account);

    function doNext(account) {

        if (buyLevel > account.vip) {
            let extraErrInfo = {
                debug_info: 'Recharge and level up your VIP!'
            };
            cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.VIP_NOT_ENOUFH));
            return;
        }

        let accountCoin = account[coinType];
        if (giftPrice > accountCoin) {
            let extraErrInfo = {
                debug_info: 'Coin not enough, recharge first!'
            };
            cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.DIAMOND_NOT_ENOUGH));
            return;
        }

        if (!account.vip_gift) {
            account.vip_gift = [];
        }
        if (ArrayUtil.contain(account.vip_gift, buyLevel)) {
            let extraErrInfo = {
                debug_info: 'Already buy it, do not try to buy it again!'
            };
            cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.REPEAT_OPERATION));
            return;
        }
        let item_list = BuzzUtil.getItemList(vipInfo.gift_item);

        account.vip_gift.push(buyLevel);
        account.vip_gift = account.vip_gift; // 改变值必须用=显式赋值才会改变, 遇到对象要特别注意

        BuzzUtil.useCoin(account, coinId, giftPrice, function (err, res) {
            BuzzUtil.putIntoPack(account, item_list, function (rewardinfo) {
                let change = BuzzUtil.getChange(account, rewardinfo);
                change.vip_gift = account.vip_gift;
                change[coinType] = account[coinType];
                let ret = {
                    item_list: item_list,
                    change: change,
                };
                logger.info('ret:', ret);
                cb(null, ret);

                account.commit();

                // 增加金币或钻石的消耗日志
                let logInfo = {
                    account_id: uid,
                    log_at: new Date(),
                    gain: 0,
                    cost: giftPrice,
                    total: account[coinType],
                    scene: SCENE.VIPGIFT_BUY,
                    nickname: 0,
                };
                switch (coinType) {
                    case "pearl":
                        logger.info(FUNC + uid + "购买VIP" + buyLevel + "礼包消耗钻石" + giftPrice);
                        logBuilder.addPearlLogEx(logInfo);
                        break;
                    case "gold":
                        logger.info(FUNC + uid + "购买VIP" + buyLevel + "礼包消耗金币" + giftPrice);
                        logInfo.duration = 0;
                        logInfo.level = account.level;
                        account.cost = giftPrice; //其他消耗 购买VIP礼包累加
                        account.commit();
                        logBuilder.addGoldLogEx(logInfo);
                        break;
                }

                _addBroadcast(account);

                logBuilder.addGameLog(item_list, account, SCENE.VIPGIFT_BUY, "购买VIP礼包获取");
                logBuilder.addGoldAndItemLog([{
                    item_id: coinId,
                    item_num: giftPrice
                }], account, SCENE.VIPGIFT_BUY, -1);
                logBuilder.addGoldAndItemLog(item_list, account, SCENE.VIPGIFT_BUY);
            });
        });
    }
}

function _addBroadcast(account) {
    let params = [account.nickname, account.vip];
    let content = {
        type: GameEventBroadcast.TYPE.GAME_EVENT.VIP_GIFT,
        params: params,
    };
    new GameEventBroadcast(content).extra(account).add();
}

/**
 * 领取VIP每日奖励
 */
function _vipDailyReward(dataObj, cb) {

    let uid = dataObj.uid;
    doNext(dataObj.account);

    function doNext(account) {
        if (account.vip_daily_reward == 1) {
            cb(ERROR_OBJ.VIP_DAILY_REWARD_GOTTEN);
            return;
        }

        // 加载配置表数据
        let gift_free = vip_vip_cfg[account.vip].gift_free;
        let item_list = transItemList(gift_free);

        BuzzUtil.putIntoPack(account, item_list, function (reward_info) {
            let change = BuzzUtil.getChange(account, reward_info);
            account.vip_daily_reward = 1;
            let ret = {
                item_list: item_list,
                change: change,
                vip_daily_reward: account.vip_daily_reward,
            };
            cb(null, ret);
            account.commit();

            DaoUtil.update('tbl_account', ["vip_daily_reward=1"], [{
                field: 'id',
                operator: '=',
                value: uid
            }]);
            logBuilder.addGoldAndItemLog(item_list, account, SCENE.VIP_WELFARE);
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

// 是否自动发挥
function getCikAuto() {
    return new Promise(function (resolve, reject) {
        RedisUtil.get('global:switch:cik_auto', function (err, res) {
            if (err) {
                reject(err);
            } else {
                if (null == res) {
                    res = 0;
                } else {
                    res = parseInt(res);
                }
                resolve(res);
            }
        });
    });
}

//查询最近三天充值额度
function getPayFromLast3Days(id) {
    return new Promise(function (resolve, reject) {
        let sql = "SELECT SUM(money) as sum FROM `tbl_order` WHERE game_account_id=? AND status=0 AND created_at>= DATE_SUB(CURDATE(),INTERVAL 2 DAY)";
        mysqlConnector.query(sql, [id], function (err, res) {
            if (err) {
                reject(err);
            } else {
                resolve(res[0].sum);
            }
        });
    });
}

//查询最近三天兑换额度
function getCashFromLast3Days(id) {
    return new Promise(function (resolve, reject) {
        let sql = "SELECT SUM(cost) as cost FROM `tbl_change_log` WHERE uid=? AND status<3 AND created_at>= DATE_SUB(CURDATE(),INTERVAL 2 DAY)";
        mysqlConnector.query(sql, [id], function (err, res) {
            if (err) {
                reject(err);
            } else {
                resolve(res[0].cost);
            }
        });
    });
}


//----------------------------------------------------------
// 通用

let ItemType = require('./pojo/Item').ItemType;