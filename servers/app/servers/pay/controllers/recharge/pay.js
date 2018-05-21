const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const dao_shop = require('../../src/dao/dao_shop');
const tools = require('../../../../utils/tools');
const BuzzUtil = require('../../src/utils/BuzzUtil');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const ITEM_TYPE = gameConfig.shop_itemtype_const_cfg;
const shop_shop_buy_type_cfg = gameConfig.shop_shop_buy_type_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const RewardModel = require('../../../../utils/account/RewardModel');
const ObjUtil = require('../../src/buzz/ObjUtil');
const innerPay = require('./innerPay');
const itemDef = require('../../../../consts/itemDef');
const constDef = require('../../../../consts/constDef');
const payConsts = require('../consts/payConsts');

class Pay {
    /**
     * 获取支付订单
     * @param data
     * @return {Promise}
     */
    async createPayOrder(data) {
        try{
            if (data.itemid == null || data.itemtype == null) {
                throw ERROR_OBJ.PARAM_MISSING;
            }

            if(null == this._getShopItemInfo(data.itemid, data.itemtype)){
                throw ERROR_OBJ.BUY_WRONG_SHOP_ID;
            }

            let buyType = this.getBuyType(data.itemid);
            let isRmb = this.checkBuyRmb(buyType, data.itemid);
            if (!isRmb) {
                return {
                    game_order_id: constDef.GAME_INTER_PAY_ORDER_ID
                };
            }

            data.goods_name = this.getGoodsName(data.itemid, data.itemtype);
            data.goods_id = this.getGoodsId(data.itemid);
            let game_order_id = await dao_shop.createPayOrderItem(data);

            return {
                game_order_id: game_order_id
            };
        }catch (err){
            logger.error('支付订单创建失败,err=',err);
            throw ERROR_OBJ.ORDER_CREATE_FAIL;
        }
    }

    /**
     * 支付
     * @param data
     * @return {Promise.<*>}
     */
    async buy(data) {
        // logger.error('Pay buy data=', data);
        try {
            let orderInfo = await dao_shop.getOrderInfo(data.orderid);
            data.orderInfo = orderInfo;
            logger.error('Pay buy orderInfo=', orderInfo);
            let buyType = this.getBuyType(orderInfo.goods_id);
            logger.error('Pay buy buyType=', buyType);
            let isRmb = this.checkBuyRmb(buyType, orderInfo.goods_id);
            if (isRmb) {
                if (buyType == Pay.BUY_TYPE.CARD) {
                    let ret = this.isOwnCard(orderInfo.goods_id, data.account);
                    if (ret != ERROR_OBJ.OK) {
                        throw ret;
                    }
                }
                return await this.buyByRMB(data);
            }

            let func = innerPay[`buy_${buyType}`];
            if (func) {
                return await func.apply(innerPay, Array.prototype.slice.call(arguments, 0));
            } else {
                throw ERROR_OBJ.BUY_GOODS_ILLEGAL;
            }
        } catch (err) {
            logger.error('订单支付异常，err=', err);
            throw err;
        }

    }

    async buyByRMB(data) {
    }

    async callback(data) {
        return data;
    }

    async checkOrder(data) {
        await dao_shop.checkOrder(data.orderid);
    }

    getBuyType(itemid) {
        for (let k in Pay.BUY_TYPE_RANGE) {
            let range = Pay.BUY_TYPE_RANGE[k];
            if (itemid >= range[0] && itemid < range[1]) {
                return k;
            }
        }
        throw ERROR_OBJ.BUY_GOODS_ILLEGAL;
    }

    checkBuyRmb(buyType, itemid) {
        if (buyType == Pay.BUY_TYPE.RMB) {
            return true;
        }

        const cfgs = Pay.BUY_TYPE_CFG_MAP[buyType];
        let buyCost = this._getBuyCost(cfgs, itemid);
        if (!buyCost) {
            throw ERROR_OBJ.BUY_GOODS_ILLEGAL;
        }

        let buyCostType = buyCost[0];
        if (itemDef.RMB == buyCostType[0]) {
            return true;
        }


        return false;
    }

    _getBuyCost(cfgs, itemid) {
        for (let i = 0; i < cfgs.length; i++) {
            if (itemid == cfgs[i].id) {
                return cfgs[i].buyCost;
            }
        }
        return null;
    }

    _getShopItemInfo(itemid, itemtype) {
        let cfg = Pay.ITEM_TYPE_CFG_MAP[itemtype];
        for (let idx in cfg) {
            if (cfg[idx].id == itemid) {
                return cfg[idx];
            }
        }
    }

    getGoodsName(goods_id, itemtype) {
        let shopItemInfo = this._getShopItemInfo(goods_id, itemtype);
        return shopItemInfo.name;
    }

    getGoodsId(goods_id) {
        return goods_id;
    }

    //是否已经拥有月卡
    isOwnCard(itemid, account) {
        let hasCard = dao_shop.hasCard(itemid, account);
        if (hasCard) {
            if (itemid == 100) {
                return ERROR_OBJ.MONTH_CARD_NORMAL_ALREADY;
            } else if (itemid == 101) {
                return ERROR_OBJ.MONTH_CARD_SENIOR_ALREADY;
            } else if (itemid == 102) {
                return ERROR_OBJ.WEEK_CARD_ALREADY;
            }
            return ERROR_OBJ.BUY_WRONG_SHOP_ID;
        }
        return ERROR_OBJ.OK;
    }

    async buySuccess(data, shop_id, game_order_id, itemtype) {
        let item_type = ITEM_TYPE.IT_PEARL;
        let item_amount = 0;
        let total = 0;
        let item_list = [];
        let price = 0;
        let account = data.account;

        let buyType = this.getBuyType(shop_id);
        switch (buyType) {
            case Pay.BUY_TYPE.RMB: {
                if (itemtype == 0) {//真实货币购买钻石
                    let shop_pearl = BuzzUtil.getShopPearlById(shop_id);
                    if (null == shop_pearl) {
                        throw ERROR_OBJ.BUY_WRONG_SHOP_ID;
                    }
                    item_type = ITEM_TYPE.IT_PEARL;
                    total = account[shop_shop_buy_type_cfg.BUY_RMB.name];
                    item_amount = shop_pearl.item;
                    price = shop_pearl.price;
                    // first_buy判定进行首次充值的双倍发放.
                    let first_buy = account.first_buy;
                    if (typeof (first_buy["" + shop_id]) == "undefined") {
                        first_buy["" + shop_id] = 0;
                    }
                    if (first_buy["" + shop_id] == 0) {
                        // 玩家为首次购买
                        item_amount *= shop_pearl.firstratio;
                        first_buy["" + shop_id] = 1;
                    }
                    total += item_amount;
                    // yDONE: 取出对象操作后赋值给原数据.
                    account.first_buy = first_buy;
                    item_list = [{
                        item_id: shop_shop_buy_type_cfg.BUY_RMB.id,
                        item_num: item_amount,
                    }];
                } else if (itemtype == 1) {//真实货币购买金币
                    let shop_gold = tools.BuzzUtil.getShopGoldById(shop_id);
                    if (null == shop_gold) {
                        throw ERROR_OBJ.BUY_WRONG_SHOP_ID;
                    }
                    item_type = ITEM_TYPE.IT_GOLD;
                    total = account.gold;//todo !!!!dfc
                    item_amount = shop_gold.item;
                    price = shop_gold.price;
                    // first_buy判定进行首次充值的双倍发放.
                    let first_buy = account.first_buy;
                    let key = +shop_id + 100;
                    if (typeof (first_buy["" + key]) == "undefined") {
                        first_buy["" + key] = 0;
                    }
                    if (first_buy["" + key] == 0) {
                        // 玩家为首次购买
                        item_amount *= shop_gold.firstratio;
                        first_buy["" + key] = 1;
                    }
                    total += item_amount;
                    account.first_buy = first_buy;
                    item_list = [{
                        item_id: shop_shop_buy_type_cfg.BUY_GOLD_GAIN.id,
                        item_num: item_amount,
                    }];
                }
            }
                break;
            case Pay.BUY_TYPE.CARD: {
                let shop_card = BuzzUtil.getShopCardById(shop_id);
                if (null == shop_card) {
                    throw ERROR_OBJ.BUY_WRONG_SHOP_ID;
                }
                price = shop_card.price;
                item_type = ITEM_TYPE.IT_CARD;
                total = account.pearl;
                item_list = [{
                    item_id: itemDef.DIAMOND,
                    item_num: shop_card.diamond,
                }];
                item_amount = 1; //shop_card.diamond;
                total += shop_card.diamond;
            }
                break;
            case Pay.BUY_TYPE.COMEBACK: {
                let shop_fund = BuzzUtil.getShopFundById(shop_id);
                if (null == shop_fund) {
                    throw ERROR_OBJ.BUY_WRONG_SHOP_ID;
                }
                let accountComeback = ObjUtil.str2Data(account.comeback);
                let cb_id = accountComeback['cb_id'];
                if (cb_id) {
                    throw ERROR_OBJ.BUY_FUND_ALREADY;
                }

                let hitrate = shop_fund.hitrate;
                accountComeback.cb_id = shop_id;
                accountComeback.hitrate = hitrate;
                price = shop_fund.price;
                item_type = ITEM_TYPE.IT_FUND;
                // yxlTODO: 玩家剩余金币不为0时会导致购买后的金币金额错误
                total = account.gold;
                item_list = [{
                    item_id: itemDef.GOLD,
                    item_num: shop_fund.gold,
                }];
                item_amount = shop_fund.gold;
                total += shop_fund.gold;
                account.comeback = accountComeback;
                account.commit();
            }
                break;
            case Pay.BUY_TYPE.GIFT: {
                let shop_gift = BuzzUtil.getShopGiftById(shop_id);
                if (null == shop_gift) {
                    throw ERROR_OBJ.BUY_WRONG_SHOP_ID;
                }
                price = shop_gift.price;
                let cur_time = new Date().getTime();
                let start_time = new Date(shop_gift.starttime).getTime();
                let end_time = new Date(shop_gift.endtime).getTime();
                if (cur_time < start_time || cur_time > end_time) {
                    throw ERROR_OBJ.BUY_WRONG_GIFT_TIME;
                }

                let buycount = shop_gift.buycount;
                let activityGift = account.activity_gift;
                if (typeof (activityGift["" + shop_id]) == "undefined") {
                    activityGift["" + shop_id] = {
                        buycount: 0,
                        version: 1,
                    };
                }
                let my_buycount = activityGift["" + shop_id].buycount;
                if (my_buycount >= buycount) {
                    throw ERROR_OBJ.BUY_GIFT_COUNT_MAX;
                }
                let shop_gift_reward = shop_gift.item;
                item_type = ITEM_TYPE.IT_GIFT;
                if (shop_gift_reward && shop_gift_reward.length > 0) {
                    item_list = BuzzUtil.getItemList(shop_gift_reward);
                } else {
                    throw ERROR_OBJ.BUY_GIFT_CFG_ERR;
                }
                item_amount = shop_gift_reward;
                activityGift["" + shop_id].buycount += 1;
                // yDONE: 取出activity_gift再赋值回原数据
                account.activity_gift = activityGift;
            }
                break;
        }

        let log_data = {
            account_id: data.uid,
            token: data.token,
            item_id: shop_id,
            item_type: item_type,
            item_amount: item_amount,
            total: total,
            game_order_id: game_order_id,
            price: price
        };

        return await this._addBuyShopLog(log_data, account, item_list);
    }

    _addBuyShopLog(log_data, account, item_list) {
        return new Promise(function (resolve, reject) {
            dao_shop.addShopLog(log_data, account, function (err) {
                if (err) {
                    reject(err);
                    return;
                }

                account.commit();

                // 注意: addShopLog已经将购买的物品放入背包, 无需调用BuzzUtil.puIntoPack()
                let change = BuzzUtil.getChangeFromItemList(account, item_list);

                change.vip = account.vip;
                change.rmb = account.rmb;
                change.vip_gift = account.vip_gift;
                change.vip_daily_reward = account.vip_daily_reward;
                change.card = account.card;
                change.get_card = account.get_card;
                change.first_buy = account.first_buy;
                change.activity_gift = account.activity_gift;
                change.gold_shopping = account.gold_shopping;
                change.charm_point = account.charm_point;
                change.charm_rank = account.charm_rank;
                change.comeback = account.comeback;

                let ret = {
                    game_order_id: log_data.game_order_id,
                    item_list: item_list,
                    change: change,
                    itemId: log_data.shop_id,
                    itemType: log_data.item_type,
                };
                resolve(ret);

                let scene = common_log_const_cfg.TIMEGIFT_BUY;
                if (ITEM_TYPE.IT_FUND == log_data.item_type) scene = common_log_const_cfg.FUND_BUY;
                if (ITEM_TYPE.IT_PEARL == log_data.item_type) scene = common_log_const_cfg.STORE;
                if (ITEM_TYPE.IT_GOLD == log_data.item_type) scene = common_log_const_cfg.GOLD_BUY;
                if (ITEM_TYPE.IT_CARD == log_data.item_type) scene = common_log_const_cfg.CARD; //TODO DFC error
                let hint = '商城购买时获取';

                // yDONE: 金币数据记录
                let gain = 0;
                for (let i = 0; i < item_list.length; i++) {
                    let item = item_list[i];
                    let item_id = item.item_id;
                    let item_num = item.item_num;
                    if (itemDef.GOLD == item_id) {
                        gain += item_num;
                    }
                }
                if (gain > 0) {
                    logBuilder.addGameLog(item_list, account, scene, hint);
                }

                // yDONE: 钻石数据记录
                let diamondGain = 0;
                for (let i = 0; i < item_list.length; i++) {
                    let item = item_list[i];
                    let item_id = item.item_id;
                    let item_num = item.item_num;
                    if (itemDef.DIAMOND == item_id) {
                        diamondGain += item_num;
                    }
                }
                if (diamondGain > 0) {
                    // logBuilder.addGameLog(item_list, account, scene, hint);
                    logBuilder.addGoldAndItemLog(item_list, account, scene);// 商城中的钻石变化需要写入物品日志
                    //统计钻石充值dfc
                    let mission = new RewardModel(account);
                    const dayNth = tools.DateUtil.getDayNth(account.created_at);
                    mission.updateProcess(RewardModel.TaskType.CHARG_PEARL, log_data.price, dayNth);
                    mission.updateProcess(RewardModel.TaskType.GET_VIP_LV, account.vip);
                    mission.commit();
                    account.commit();
                }
            });
        });
    }
}

Pay.BUY_TYPE = {
    RMB: 'rmb', //在线支付
    CARD: 'card', //月卡
    COMEBACK: 'comeback', //翻盘基金
    GIFT: 'gift', //礼包
};

Pay.BUY_TYPE_RANGE = {};
Pay.BUY_TYPE_RANGE[Pay.BUY_TYPE.RMB] = [0, 100];
Pay.BUY_TYPE_RANGE[Pay.BUY_TYPE.CARD] = [100, 1000];
Pay.BUY_TYPE_RANGE[Pay.BUY_TYPE.COMEBACK] = [1000, 10000];
Pay.BUY_TYPE_RANGE[Pay.BUY_TYPE.GIFT] = [10000, 10000000];

Pay.BUY_TYPE_CFG_MAP = {};
Pay.BUY_TYPE_CFG_MAP[Pay.BUY_TYPE.CARD] = gameConfig.shop_card_cfg;
Pay.BUY_TYPE_CFG_MAP[Pay.BUY_TYPE.GIFT] = gameConfig.shop_gift_cfg;
Pay.BUY_TYPE_CFG_MAP[Pay.BUY_TYPE.COMEBACK] = gameConfig.shop_fund_cfg;

Pay.ORDER_STATUS = {
    SUCCESS: 0, //成功
    FAIL: 1, //失败
    PROCESSING: 2 //处理中
};

Pay.ITEM_TYPE = payConsts.ITEM_TYPE;

Pay.ITEM_TYPE_CFG_MAP = {};
Pay.ITEM_TYPE_CFG_MAP[Pay.ITEM_TYPE.PEARL] = gameConfig.shop_pearl_cfg;
Pay.ITEM_TYPE_CFG_MAP[Pay.ITEM_TYPE.GOLD] = gameConfig.shop_buygold_cfg;
Pay.ITEM_TYPE_CFG_MAP[Pay.ITEM_TYPE.CARD] = gameConfig.shop_card_cfg;
Pay.ITEM_TYPE_CFG_MAP[Pay.ITEM_TYPE.GIFT] = gameConfig.shop_gift_cfg;
Pay.ITEM_TYPE_CFG_MAP[Pay.ITEM_TYPE.FUND] = gameConfig.shop_fund_cfg;


module.exports = Pay;