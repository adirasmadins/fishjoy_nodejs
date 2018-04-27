const gameConfig = require('../../../utils/imports').DESIGN_CFG;
const common_const_cfg = gameConfig.common_const_cfg;
const shop_shop_buy_type_cfg = gameConfig.shop_shop_buy_type_cfg;
const item_item_cfg = gameConfig.item_item_cfg;
const CstError = require('../../../consts/fish_error'),
    ERROR_OBJ = CstError.ERROR_OBJ;
const REDISKEY = require('../../../database').dbConsts.REDISKEY;

function itemType() {
    for (let item in item_item_cfg) {
        if (item == WorldMessage.COST_TYPE.ITEM) {
            return item.type;
        }
    }
}

class WorldMessage {
    constructor() {
        this._data = [];
    }

    send(data) {
        const account = data.account;
        const msg = data.msg;

    }

    getCurrentMsg(data) {
    }

    cost(account) {
        let package = account.package;
        let change = {};
        if (package[WorldMessage.COST_TYPE.ITEM_TYPE] &&
            package[WorldMessage.COST_TYPE.ITEM_TYPE][WorldMessage.COST_TYPE.ITEM] >= WorldMessage.ITEM_NUM) {
            package[WorldMessage.COST_TYPE.ITEM_TYPE][WorldMessage.COST_TYPE.ITEM] -= WorldMessage.ITEM_NUM;
            account.package = package;
            change.package = package;
            account.commit();
        }else if(account[WorldMessage.COST_TYPE.COIN_NAME]>=WorldMessage.COST_TYPE.COIN_NUM) {
            account[WorldMessage.COST_TYPE.COIN_NAME] = -WorldMessage.COST_TYPE.COIN_NUM;
            change[WorldMessage.COST_TYPE.COIN_NAME] = account[WorldMessage.COST_TYPE.COIN_NAME];
            account.commit();
        }else {
            throw ERROR_OBJ.CHAT_COST_ERROR;
        }

    }
}

WorldMessage.SIZE = 1000;
WorldMessage.COST_TYPE = {
    ITEM: "i006",
    ITEM_NUM: 1,
    ITEM_TYPE: itemType(),
    COIN: shop_shop_buy_type_cfg.CHAT_COST.id,  //i001 or i002 or ...
    COIN_NAME: shop_shop_buy_type_cfg.CHAT_COST.name,  //pearl or gold
    COIN_NUM: common_const_cfg.WORLD_LABA_PEARL
};
module.exports = new WorldMessage();