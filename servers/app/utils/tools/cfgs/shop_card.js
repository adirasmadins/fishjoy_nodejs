const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const shop_card_cfg = DESIGN_CFG.shop_card_cfg;

exports.getInfo = (id) => {
    for (let i = 0; i < shop_card_cfg.length; i++) {
        if (shop_card_cfg[i].id == id) {
            return shop_card_cfg[i];
        }
    }
    return null;
};

/**
 * 获取月卡每日领取的奖励
 * @param {*} id 
 */
exports.getEverydayItemList = (id) => {
    // console.log('id:', id);
    let info = this.getInfo(id);
    let item_list = [];
    if (info) {
        const everyday = info.everyday;
        for (let i = 0; i < everyday.length; i++) {
            item_list.push({
                item_id: everyday[i][0],
                item_num: everyday[i][1],
            });
        }
    }
    return item_list;
};