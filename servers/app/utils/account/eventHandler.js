const ACCOUNT_EVENT_TYPE = require('../../database/consts/consts').ACCOUNT_EVENT_TYPE;
const common_const_cfg = require('../../utils/imports').DESIGN_CFG.common_const_cfg;
const ACCOUNTKEY = require('../../database/consts').ACCOUNTKEY;
const REDISKEY = require('../../database/consts').REDISKEY;
const RewardModel = require('./RewardModel');
const omelo = require('omelo');
const rpcSender = require('../../net/rpcSender');
const fishCmd = require('../../cmd/fishCmd');

class EventHandler {
    constructor() {
        this.events = {};
        this.gainLossKeys = new Map([
            [ACCOUNTKEY.RECHARGE, 1],
            [ACCOUNTKEY.CASH, 1],
            [ACCOUNTKEY.COST, 1],
            [ACCOUNTKEY.GOLD, 1]
        ]);
        this.missionKeys = new Map([
            [ACCOUNTKEY.GOLD, 1],
            [ACCOUNTKEY.PEARL, 1],
        ]);
        this.accountChangeKeys = new Map([
            [ACCOUNTKEY.GOLD, 1],
            [ACCOUNTKEY.PEARL, 1],
            [ACCOUNTKEY.WEAPON, 1],
            [ACCOUNTKEY.WEAPON_ENERGY, 1],
            [ACCOUNTKEY.WEAPON_SKIN, 1],
            [ACCOUNTKEY.SKILL, 1],
            [ACCOUNTKEY.VIP, 1],
            [ACCOUNTKEY.COMEBACK, 1],
            [ACCOUNTKEY.MISSION_DAILY_RESET, 1],
            [ACCOUNTKEY.MISSION_ONLY_ONCE, 1],
        ]);
    }

    addEvent(type, account, fields) {
        switch (type) {
            case ACCOUNT_EVENT_TYPE.GAIN_LOST:

                if (!this.events[type]) {
                    this.events[type] = EventHandler.genGainLossFunc(account);
                }
                break;
            case ACCOUNT_EVENT_TYPE.DATA_SYNC:
                if (!this.events[type]) {
                    this.events[type] = EventHandler.genSyncFunc(account.id, fields);
                }
                break;
            case ACCOUNT_EVENT_TYPE.MISSION:
                if (!this.events[type]) {
                    this.events[type] = EventHandler.missionFunc(account);
                }
                break;
            case ACCOUNT_EVENT_TYPE.PLAYER_DATA_CHANGE_SYNC:
                if (omelo.app.getServerType() != rpcSender.serverType.game && !this.events[type]) {
                    logger.error('PLAYER_DATA_CHANGE_SYNC:', fields);
                    this.events[type] = EventHandler.playerDataSyncFunc(account);
                }
                break;
            default:
                break;
        }
    }

    listenKey(keys, account) {
        keys.forEach(function (key) {
            let tk = key[0];
            // if (this.gainLossKeys.has(tk)) {
            //     this.addEvent(ACCOUNT_EVENT_TYPE.GAIN_LOST, account);
            // }
            if (this.missionKeys.has(tk)) {
                this.addEvent(ACCOUNT_EVENT_TYPE.MISSION, account);
            }
            if (this.accountChangeKeys.has(tk)) {
                this.addEvent(ACCOUNT_EVENT_TYPE.PLAYER_DATA_CHANGE_SYNC, account, tk);
            }
        }.bind(this));
    }

    //计算盈亏系数
    _calcGainLoss(account) {
        if (isNaN(account.cash) || isNaN(account.gold) || isNaN(account.cost) || isNaN(account.recharge)) {
            logger.error('_calcGainLoss--- 参数异常');
            logger.error(`[Error]玩家${account.id}的盈亏计算错误:cash:${account.cash}, gold:${account.gold}, recharge:${account.recharge}`);
            return null;
        }

        // author YXL
        // 盈亏计算公式错误
        return Math.round(Number(account.cash) + Number(account.gold) / common_const_cfg.CHANGE_CASH_4 - Number(account.recharge));
    }

    static genGainLossFunc(account) {
        let self = this;
        return async function () {
            let v = self._calcGainLoss(account);
            if (v) {
                let tmpV = account.gain_loss;
                account.gain_loss = v;
                if (account.gain_loss_limit != 0 && account.gain_loss_snapshot == 0) {
                    account.gain_loss_snapshot = account.gain_loss;
                } else if (account.gain_loss_limit == 0 && account.gain_loss_snapshot != 0) {
                    account.gain_loss_snapshot = 0;
                }
                if (tmpV != v) {
                    redisConnector.cmd.zadd('rank:gain', v, account.id);
                    redisConnector.cmd.zadd('rank:loss', v, account.id);
                    account.commit();
                }
            }
        };
    }

    static genSyncFunc(uid, fields) {
        return async function () {
            redisConnector.cmd.sadd(`${REDISKEY.UPDATED_DELTA_FIELDS}:${uid}`, fields, function (err) {
                if (err) {
                    logger.error(err);
                    logger.error(fields);
                    return;
                }
                redisConnector.cmd.sadd(REDISKEY.UPDATED_DELTA_UIDS, uid, function (err) {
                    if (err) {
                        logger.error(err);
                        logger.error(fields);
                    }
                });
            });

        };
    }

    static missionFunc(account) {
        let updates = [];
        updates = updates.concat(account.update);
        //统计金币变化dfc
        let mission = null;

        return async function () {
            let mark = false;
            for (let i = 0; i < updates.length; i++) {
                let key = updates[i][0];
                let value = updates[i][1];
                if (value && 'gold' == key) {
                    mission = mission || new RewardModel(account);
                    value > 0 ? mission.updateProcess(RewardModel.TaskType.GET_GOLD, value) :
                        mission.updateProcess(RewardModel.TaskType.USE_GOLD, Math.abs(value));
                }
                if ('pearl' == key && value < 0) {
                    mission = mission || new RewardModel(account);
                    mission.updateProcess(RewardModel.TaskType.USE_DIAMOND, Math.abs(value));
                }
            }
            mission && mission.commit(); //等价account.commit()
        };
    }

    static playerDataSyncFunc(account) {
        return async function () {
                await rpcSender.invokeFront(rpcSender.serverType.game, rpcSender.serverModule.game.playerRemote, fishCmd.remote.playerDataChange.route, account.id, {uid: account.id});
        };
    }

    async exec() {
        for (let key in this.events) {
            let func = this.events[key];
            this.events[key] = null;
            if(func){
                func();
            }
        }
    }
}

module.exports = EventHandler;