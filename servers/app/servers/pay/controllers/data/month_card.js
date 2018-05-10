const moment = require('moment');
const CacheAccount = require('../../src/buzz/cache/CacheAccount');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const shop_card_cfg = gameConfig.shop_card_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const string_strings_cfg = gameConfig.string_strings_cfg;
const BuzzUtil = require('../../src/utils/BuzzUtil');
const logicResponse = require('../../../common/logicResponse');

const tools = require('../../../../utils/tools');
const GameEventBroadcast = require('../../../../common/broadcast/GameEventBroadcast');
const pack = require('../data/pack');

const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;

let CARD_DATA = {};
for (let i = 0; i < shop_card_cfg.length; i++) {
    let cfg = shop_card_cfg[i];
    CARD_DATA[cfg.id] = cfg;
}

const CRAD_TYPE_NAME = {
    NORMAL: 'normal',
    SENIOR: 'senior',
    WEEK: 'week',
};

const CRAD_TYPE = {
    100: CRAD_TYPE_NAME.NORMAL,
    101: CRAD_TYPE_NAME.SENIOR,
    102: CRAD_TYPE_NAME.WEEK,
};

let CARD_BROADCAST_TYPE_MAP = [];
CARD_BROADCAST_TYPE_MAP[CRAD_TYPE_NAME.NORMAL] = GameEventBroadcast.TYPE.GAME_EVENT.MONTH_CARD;
CARD_BROADCAST_TYPE_MAP[CRAD_TYPE_NAME.SENIOR] = GameEventBroadcast.TYPE.GAME_EVENT.MONTH_CARD1;
CARD_BROADCAST_TYPE_MAP[CRAD_TYPE_NAME.WEEK] = GameEventBroadcast.TYPE.GAME_EVENT.MONTH_CARD2;

const CARD_ERR_ALREADY = {};
CARD_ERR_ALREADY[CRAD_TYPE_NAME.NORMAL] = ERROR_OBJ.MONTH_CARD_NORMAL_ALREADY;
CARD_ERR_ALREADY[CRAD_TYPE_NAME.SENIOR] = ERROR_OBJ.MONTH_CARD_SENIOR_ALREADY;
CARD_ERR_ALREADY[CRAD_TYPE_NAME.WEEK] = ERROR_OBJ.WEEK_CARD_ALREADY;

async function reward(data) {
    return new Promise(function (resolve, reject) {
        _reward(data, function (err, res) {
            if (err) {
                logger.error('领取月卡奖励失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(res));
        });
    });
}

async function buyMonthCard(data) {
    return new Promise(function (resolve, reject) {
        _buyMonthCard(data, function (err, res) {
            if (err) {
                logger.error('游戏币购买月卡失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(res));
        });
    });
}

async function buy(data) {
    let account = data.account;
    return new Promise(function (resolve, reject) {
        _buyMonthCard(data, function (err, res) {
            if (err) {
                logger.error('游戏币购买月卡失败 err:', err);
                reject(err);
                return;
            }
            let ret = {};
            ret.item_list = res.item_list;
            ret.change = res.change;
            ret.change.card = res.card;
            ret.change.get_card = res.get_card;
            ret.itemId = data.itemId;
            ret.itemType = data.itemtype;

            ret.change.package = account.package;
            ret.change.skill = account.skill;
            ret.change.charm_point = account.charm_point;
            ret.change.charm_rank = account.charm_rank;
            ret.change.first_buy = account.first_buy;
            ret.change.vip = account.vip;
            ret.change.rmb = account.rmb;
            resolve(ret);
        });
    });
}

function _buyMonthCard(data, cb) {
    const HINT = "购买月卡";
    let itemId = data.itemId;
    let cardCfg = tools.CfgUtil.shop_card.getInfo(itemId);
    if (!cardCfg) {
        return cb && cb(ERROR_OBJ.WRONG_JSON_FORMAT);
    }
    let account = data.account;
    let cType = CRAD_TYPE[itemId];
    let newCard = account.card;

    // 判断月卡是否存在
    if (newCard && newCard[cType] && newCard[cType]['start_date']) {
        logger.error('newCard:', newCard);
        return cb && cb(CARD_ERR_ALREADY[cType]);
    }

    const buyCost = tools.BuzzUtil.getItemList(cardCfg.buyCost);
    const buyGain = tools.BuzzUtil.getItemList(cardCfg.buyGain);
    pack.exchange(data, buyCost, buyGain, common_log_const_cfg.CARD);

    //获得月卡
    tools.ObjUtil.makeDeepObj(newCard, [cType, 'start_date'], moment().format('YYYY-MM-DD'));
    CacheAccount.setCard(account, newCard, function (chs) {
        let change = {
            gold: account.gold,
            pearl: account.pearl,
        };
        if (chs && chs.length == 2) {
            let charmPoint = chs[0];
            let charmRank = chs[1];
            charmPoint >= 0 && (change.charm_point = charmPoint);
            charmRank >= 0 && (change.charm_rank = charmRank);
        }
        let result = {
            item_list: buyGain,
            change: change,
            card: newCard,
            get_card: {
                normal: false,
                senior: false,
            },
        };
        cb(null, result);

        // 发送公告
        let params = [account.nickname];
        let content = {
            type: CARD_BROADCAST_TYPE_MAP[cType],
            params: params,
        };
       new GameEventBroadcast(content).extra(account).add();
    });
}

function _reward(data, cb) {
    const FUNC = "MonthCard:reward --- ";
    const HINT = "领取月卡每日奖励";

    BuzzUtil.cacheLinkDataApi(data, "month_card_reward");

    let itemId = 100 + Number(data.itemId);
    let type = CRAD_TYPE[itemId]; //normal | senior | week

    doNext(data.account);

    function doNext(account) {
        let uid = account.id;
        let get_card = account.get_card;
        let card = account.card;
        let item_list = [];
        if (card[type]) {
            logger.info(`${uid}的${type}卡有效`);
            if (get_card[type]) {
                let error = `${uid}已经领取${type}卡奖励, 请勿重复领取`;
                logger.error(error, get_card, get_card[type]);
                cb(error);
                return;
            } else {
                get_card[type] = true;
                item_list = tools.CfgUtil.shop_card.getEverydayItemList(itemId);
            }
        } else {
            let error = FUNC + `${uid}没有购买${type}月卡`;
            logger.error(error);
            cb(error);
            return;
        }

        BuzzUtil.putIntoPack(account, item_list, function (rewardInfo) {
            account.get_card = get_card;
            account.commit();
            let change = BuzzUtil.getChange(account, rewardInfo);
            change.card = account.card;
            change.get_card = account.get_card;
            let ret = {
                item_list: item_list,
                change: change,
            };
            cb(null, ret);
            // logBuilder.addGameLog(item_list, account, common_log_const_cfg.CARD_REWARD, '月卡每日领取获得');
            logBuilder.addGoldAndItemLog(item_list, account, common_log_const_cfg.CARD_REWARD);
        });
    }

}

module.exports.reward = reward;
module.exports.buyMonthCard = buyMonthCard;
module.exports.buy = buy;