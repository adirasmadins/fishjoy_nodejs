// vi /opt/fishjoy/servers/app/servers/hall/src/buzz/buzz_reward_people.js
/**
 * 打赏
 * Created by zhenghang on 2017/9/8.
 */
const BuzzUtil = require('../utils/BuzzUtil');
const dao_reward = require('../dao/dao_reward');
const DateUtil = require('../utils/DateUtil');
const RedisUtil = require('../utils/RedisUtil');
const async = require('async');
const redisAccountSync = require('../../../../utils/redisAccountSync');
const CacheAccount = require('./cache/CacheAccount');
const buzz_mail = require('./buzz_mail');
const buzz_cst_game = require('./cst/buzz_cst_game');
const CstError = require('../../../../consts/fish_error');
const buzz_receive_flower = require('./buzz_receive_flower');
const ERROR_OBJ = CstError.ERROR_OBJ;
const redisKeys = require('../../../../database').dbConsts.REDISKEY;
const DESIGN_CFG = require('./../../../../utils/imports').DESIGN_CFG;
const common_log_const_cfg = DESIGN_CFG.common_log_const_cfg;
const shop_shop_buy_type_cfg = DESIGN_CFG.shop_shop_buy_type_cfg;
const i18n = DESIGN_CFG.string_strings_cfg;
const lan = 'cn';
const tools = require('../../../../utils/tools');
const GameEventBroadcast = require('../../../../common/broadcast/GameEventBroadcast');
exports.give_reward = give_reward;

const TAG = "【buzz_reward_people】";

function give_reward(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    _give_reward(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'items', 'id'], "buzz_reward_people", cb);
    }
}

function _give_reward(dataObj, cb) {
    const FUNC = TAG + "_give_reward() --- ";
    logger.info(FUNC + "CALL...");
    let uid = dataObj.uid;
    let needitem = dataObj.items;
    let id = dataObj.id;
    if (id == uid) {
        cb(i18n.REWARD_SELF[lan]);
        return;
    }
    let account = dataObj.account;
    let itemid = needitem[0][0];
    let itemcount = needitem[0][1];
    //获取中文名
    let name = BuzzUtil.getCNName(BuzzUtil.getItemById(itemid).name);
    logger.info("dataObj", dataObj);

    //检查物品是否可以打赏
    if (!BuzzUtil.isCanGiveItem(needitem)) {
        cb(ERROR_OBJ.PARAM_MISSING);
        return;
    }
    let charm_change = false;

    async.waterfall([function (cb) {
            if (BuzzUtil.isBomb(itemid) && BuzzUtil.getVipGiveItem(account.vip) != 1) {
                cb(ERROR_OBJ.VIP_NOT_ENOUFH);
                return;
            }
            RedisUtil.hget(redisKeys.MSG.IS_REWARD_PEOPLE, uid, function (err, rows) {
                cb(err, rows, account);
            });
        }, function (rows, account, cb) {
            rows = rows && JSON.parse(rows) || {};
            if (rows[id + "_" + itemid + "_" + itemcount] == 1) {
                cb(ERROR_OBJ.CHAT_REWARD_ERROR);
                return;
            }
            costRewardPeople(account, needitem, true, function (cost_info) {
                if (cost_info == 1 || cost_info == 2) {
                    cb(ERROR_OBJ.CHAT_REWARD_LESS_ERROR);
                    return;
                }
                cb(null, rows, account, cost_info);
            });
        }, function (rows, account, cost_info, cb) {
            let nick = account.nickname;
            //将i400修改为i410
            let sendMailItem = [[itemid == 'i400' ? 'i410' : itemid, itemcount]];
            let need = JSON.stringify(sendMailItem);
            let data = {
                player_list: "" + id,
                type: 3,
                title: i18n.FRIEND_REWARD[lan],
                content: nick + "玩家打赏了你" + name + " x " + itemcount,
                reward: need
            };
            if(tools.BuzzUtil.isVersionVietnam()) {
                data.content = `${nick}${i18n.FRIEND_REWARD_TXT[lan]} x ${itemcount} ${name}`;
            }
            buzz_mail.sendMail(data, function (err, res) {
                cb(err, rows, account, cost_info, sendMailItem);
            });
        }, function (rows, account, cost_info, sendMailItem, cb) {
            let val = id + "_" + itemid + "_" + itemcount;
            rows[val] = 1;
            RedisUtil.hset(redisKeys.MSG.IS_REWARD_PEOPLE, uid, JSON.stringify(rows));
            RedisUtil.expire(redisKeys.MSG.IS_REWARD_PEOPLE, DateUtil.getNexyDayBySeconds());
            //统计送出的鲜花
            buzz_receive_flower.flower_send(uid, sendMailItem, function (total) {
                //增加送出鲜花上限3000点
                if (total <= 3000) {
                    CacheAccount.resetCharmPoint(account);
                    charm_change = true;
                }
            });
            redisAccountSync.getAccount(id, function (err, res) {
                if (BuzzUtil.isNotice(needitem)) {
                    cb(err, res, account, cost_info);
                } else {
                    cb(null, null, account, cost_info);
                }
            });
        }, function (res, account, cost_info, cb) {
            if (res) {
                let nick1 = res.nickname;
                //参数顺序是：打赏人名字，物品name，物品数量，被打赏人名字，vip,  魅力等级
                let nick = account.nickname;
                let params = [nick, name, itemcount, nick1, account.vip, account.charm_rank];
                let content = {
                    type: GameEventBroadcast.TYPE.GAME_EVENT.GUERDON,
                    params: params,
                };
                new GameEventBroadcast(content).extra(account).add();
            }
            cb(null, account, cost_info);
        }], function (err, account, cost_info) {
            if (err) {
                cb(err);
                return;
            }
            let change = BuzzUtil.getChange(account, cost_info);
            if (charm_change) {
                change.charm_point = account.charm_point;
                change.charm_rank = account.charm_rank;
            }
            let ret = {
                //item_list: item_list,
                change: change
            };
            cb(null, ret);
        }
    );

}

function costRewardPeople(account, needitem, is_cost_coin, cb) {
    const FUNC = TAG + "costRewardPeople() --- ";
    //判断是否足够
    let extraCost = tools.BuzzUtil.extraCost(needitem);
    let coinId = shop_shop_buy_type_cfg.REWARD_PEOPLE.id;
    if (dao_reward.enough(account, needitem)) {
        //物品扣除
        let item_list = [{
            item_id: needitem[0][0],
            item_num: needitem[0][1]
        }];
        if (item_list.item_id == coinId) {
            if (account.gold < needitem[0][1] + extraCost) {
                cb(1);
                return;
            } else {
                item_list.item_num = needitem[0][1] + extraCost;
            }
        }
        if (item_list.item_id != coinId) {
            if (account.gold < extraCost) {
                cb(1);
                return;
            } else {
                item_list.push({item_id: coinId, item_num: extraCost});
            }
        }
        BuzzUtil.removeFromPack( account, item_list, cb);
        logBuilder.addGoldAndItemLog(item_list, account, common_log_const_cfg.REWARD_PEOPLE, -1);
    }
    //判断是否使用游戏币购买道具打赏
    else if (is_cost_coin) {
        let cost = BuzzUtil.rewardPeopleCostByDiamonds(needitem) + extraCost;
        if (cost && dao_reward.enough(account, [[coinId, cost]])) {
            let item_list = [{
                item_id: coinId,
                item_num: cost
            }];
            BuzzUtil.removeFromPack( account, item_list, cb);
            logBuilder.addGoldAndItemLog(item_list, account, common_log_const_cfg.REWARD_PEOPLE, -1);
        } else {
            //钻石不足，返回
            cb(1);
        }
    }
    //物品不足，返回
    else {
        cb(2);
    }
}