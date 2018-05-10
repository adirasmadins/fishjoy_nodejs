/**
 * 首充类: 处理首充的相关操作
 */
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const common_const_cfg = gameConfig.common_const_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const BuzzUtil = require('../../src/utils/BuzzUtil');
const logicResponse = require('../../../common/logicResponse');
const GameEventBroadcast = require('../../../../common/broadcast/GameEventBroadcast');

/**
 * 首充礼包领取
 * @param {*} data
 */
async function reward(data) {
    return new Promise(function(resolve, reject){
        _reward(data, function (err, res) {
            if(err){
                logger.error('领取首充奖励失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(res));
        });
    });
}

function _reward(data, cb) {
    const FUNC = "FirstRecharge:reward --- ";
    const HINT = "首充奖励领取";

    BuzzUtil.cacheLinkDataApi(data, "first_recharge_reward");

    doNext(data.account);

    function doNext(account) {

        let uid = account.id;

        if (!_isPlayerCharge(account)) return;
        if (_isGiftGotten(account)) return;

        let item_list = [];
        for (let i = 0; i < common_const_cfg.FIRST_RECHARGE.length; i++) {
            let gift = common_const_cfg.FIRST_RECHARGE[i];
            item_list.push({
                item_id: gift[0],
                item_num: gift[1]
            });
        }
        logger.info(FUNC + 'item_list:', item_list);

        let req = { pool: mysqlConnector, dao: myDao };
        BuzzUtil.putIntoPack( account, item_list, function (rewardInfo) {
            account.first_buy_gift = 1;
            account.commit();
            let change = BuzzUtil.getChange(account, rewardInfo);
            let ret = {
                item_list: item_list,
                change: change,
            };
            cb(null, ret);
            // logBuilder.addGameLog(item_list, account, common_log_const_cfg.FIRST_BUY, '首充领取');
            logBuilder.addGoldAndItemLog(item_list, account, common_log_const_cfg.FIRST_BUY);

            // 发布公告12-领取首充奖励
            let params = [account.nickname];
            let content = {
                type: GameEventBroadcast.TYPE.GAME_EVENT.FIRST_RECHARGE,
                params: params,
            };
           new GameEventBroadcast(content).extra(account).add();
        });
    }

    // 玩家没有充值不允许领取
    function _isPlayerCharge(account) {
        if (0 == account.rmb) {
            let uid = account.id;
            let error = FUNC + `${uid}没有充值`;
            logger.error(error);
            cb(ERROR_OBJ.FIRST_RECHARGE_NO_RMB);
            return false;
        }
        return true;
    }

    // 玩家已经领取了首充礼包则返回错误信息
    function _isGiftGotten(account) {
        if (account.first_buy_gift) {
            let uid = account.id;
            let error = FUNC + `${uid}已经领取了首充大礼包`;
            logger.error(error);
            cb(ERROR_OBJ.FIRST_RECHARGE_ALREADY);
            return true;
        }
        return false;
    }

}

module.exports.reward = reward;