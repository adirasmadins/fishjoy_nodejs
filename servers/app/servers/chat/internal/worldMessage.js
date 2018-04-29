const gameConfig = require('../../../utils/imports').DESIGN_CFG;
const common_const_cfg = gameConfig.common_const_cfg;
const shop_shop_buy_type_cfg = gameConfig.shop_shop_buy_type_cfg;
const item_item_cfg = gameConfig.item_item_cfg;
const CstError = require('../../../consts/fish_error'),
    ERROR_OBJ = CstError.ERROR_OBJ;
const REDISKEY = require('../../../database').dbConsts.REDISKEY;
const moment = require('moment');
const constDef = require('../../../consts/constDef');

class WorldMessage {
    constructor() {
        this._data = {};
        this._data[constDef.PLATFORM_TYPE.IOS] = [];
        this._data[constDef.PLATFORM_TYPE.ANDROID] = [];
    }

    start() {
        let self = this;
        redisConnector.sub(this.getPubKey(constDef.PLATFORM_TYPE.IOS), function (data) {
            self.saveMsg(constDef.PLATFORM_TYPE.IOS, data);
        });
        redisConnector.sub(this.getPubKey(constDef.PLATFORM_TYPE.ANDROID), function (data) {
            self.saveMsg(constDef.PLATFORM_TYPE.ANDROID, data);
        });
    }

    async send(data) {
        const account = data.account;
        const msg = data.msg;
        this.checkMsg(msg);
        const ret = this.cost(account);
        const horn_used = await this.afterRecordData(account);
        if (horn_used < WorldMessage.HORN_USED_LIMIT) {
            const {charm_point, charm_rank} = this.afterResetCharm(account);
            ret.change.charm_point = charm_point;
            ret.change.charm_rank = charm_rank;
        }
        await this.publishMsg(account, msg);
        return ret;
    }

    getCurrentMsg(data) {
        let mid = data.mid || moment().format('YYYYMMDD') + "-" + 0;
        let count = data.count || 10;
        let account = data.account;
        let test = account.test;
        let uid = account.uid;
        let datum = this._data[account.platform];
        let len = datum.length;
        let result = [];
        let n = 0;
        let split = mid.split('-');
        let date = +split[0];
        let date_id = +split[1];
        if(isNaN(date) || isNaN(date_id)) {
            throw ERROR_OBJ.PARAM_WRONG_TYPE;
        }
        for (let i = 0; i < len; i++) {
            let msg = datum[i];
            let msg_date = msg.mid;
            let msg_split = msg_date.split('-');
            if (+msg_split[0] > date || +msg_split[1] > date_id) {
                if (test >= 0 || (test < 0 && uid == msg.sender)) {
                    result.push(msg);
                    n++;
                }
                if (n > count) break;
            }
        }
        if (result.length === 0) return null;
        result.reverse();
        return result;
    }

    //临时自己处理物品扣除，后续需要封装，不能直接操作物品
    cost(account) {
        let account_package = account.package;
        let ret = {};//返回客户端数据
        let item_id = WorldMessage.ITEM;
        let item_num = WorldMessage.ITEM_NUM;
        ret.change = {};
        if (account_package[WorldMessage.ITEM_TYPE] &&
            account_package[WorldMessage.ITEM_TYPE][WorldMessage.ITEM] >= WorldMessage.ITEM_NUM) {
            account_package[WorldMessage.ITEM_TYPE][WorldMessage.ITEM] -= WorldMessage.ITEM_NUM;
            account.package = account_package;
            ret.change.package = account_package;
            account.commit();
        } else if (account[WorldMessage.COIN_NAME] >= WorldMessage.COIN_NUM) {
            account[WorldMessage.COIN_NAME] = -WorldMessage.COIN_NUM;
            ret.change[WorldMessage.COIN_NAME] = account[WorldMessage.COIN_NAME];
            item_id = WorldMessage.COIN_NAME;
            item_num = account[WorldMessage.COIN_NAME];
            account.commit();
        } else {
            throw ERROR_OBJ.CHAT_COST_ERROR;
        }
        ret.item_list = [{item_id: item_id, item_num: item_num}];
        return ret;
    }

    afterRecordData(account) {
        return new Promise((resolve, reject) => {
            redisConnector.cmd.hincrby(REDISKEY.HORN_USED, account.id, (err, res) => {
                if (err) {
                    reject(ERROR_OBJ.DB_ERR);
                } else {
                    resolve(res);
                }
            });
        });
    }

    afterResetCharm(account) {
        return {charm_point: account.charm_point, charm_rank: account.charm_rank};
    }

    async publishMsg(account, msg) {
        msg.mid = await this.generateMsgId(account.platform);
        redisConnector.pub(this.getPubKey(account.platform), msg);
    }

    async saveMsg(platform, data) {
        let msg = data.msg;
        this._data[platform].push(msg);
        if (this._data[platform].length > WorldMessage.SIZE) {
            this._data[platform].shift();
        }
    }

    getPubKey(platform) {
        return `${REDISKEY.CH.WORLD_CHAT}:${platform}`;
    }

    getIncrKey(account) {
        const time = moment().format('YYYYMMDD');
        return `${time}-wm-${account.platform}`;
    }

    /**
     * id生成规则   YYYYMMDD-1
     * @param account
     * @returns {Promise}
     */
    generateMsgId(account) {
        return new Promise((resolve, reject) => {
            let incrKey = this.getIncrKey(account);
            redisConnector.cmd.incr(incrKey, function (err, res) {
                if (err) {
                    reject(ERROR_OBJ.DB_ERR);
                } else {
                    redisConnector.expire(incrKey, WorldMessage.EXPIRE_TIME);
                    resolve(moment().format('YYYYMMDD') + "-" + res);
                }
            });
        });
    }

    checkMsg(msg) {
        for (let i in WorldMessage.MSG_DESCRIPTION) {
            if (!msg[WorldMessage.MSG_DESCRIPTION[i]]) {
                throw ERROR_OBJ.PARAM_MISSING;
            }
        }
    }
}

function itemType() {
    for (let item in item_item_cfg) {
        if (item == WorldMessage.ITEM) {
            return item.type;
        }
    }
}

WorldMessage.SIZE = 1000;  //世界聊天消息存储长度
WorldMessage.ITEM = "i006";//世界聊天消耗物品id
WorldMessage.ITEM_NUM = 1;//世界聊天消耗物品数量
WorldMessage.ITEM_TYPE = itemType();//世界聊天消耗物品type  主要是为了在背包中直接操作物品
WorldMessage.COIN = shop_shop_buy_type_cfg.CHAT_COST.id; //i001 or i002 or ...  游戏主要货币
WorldMessage.COIN_NAME = shop_shop_buy_type_cfg.CHAT_COST.name; //pearl or gold  游戏货币名称
WorldMessage.COIN_NUM = common_const_cfg.WORLD_LABA_PEARL;//聊天扣除货币时的扣除数量
WorldMessage.HORN_USED_LIMIT = 3000;//聊天魅力值上限
WorldMessage.EXPIRE_TIME = 3600 * 24 * 2;//计数过期时间
WorldMessage.MSG_DESCRIPTION = ['sender'];

module.exports = new WorldMessage();