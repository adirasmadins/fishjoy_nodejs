const MathUtil = require('../MathUtil');
const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const drop_droplist_cfg = DESIGN_CFG.drop_droplist_cfg;
const drop_drop_cfg = DESIGN_CFG.drop_drop_cfg;

exports.getDropListInfo = (id) => {
    return drop_droplist_cfg[id];
};

exports.getDropInfo = (id) => {
    return drop_drop_cfg[id];
};

/**
 * 根据掉落ID获取掉落奖励, 返回值格式[{item_id:*,item_num:*}]
 * @param {*} dropid 
 * @return {item_id:*,item_num:*}
 */
exports.getReward = (dropid) => {
    let dropListInfo = this.getDropListInfo(dropid);
    let drop_id = dropListInfo.drop_id;
    let probability = dropListInfo.probability;
    let idx = MathUtil.getRandomIdx(probability);
    if (null != idx) {
        let dropItemInfo = this.getDropInfo(drop_id[idx]);
        // return [dropItemInfo.item_id, dropItemInfo.item_num];
        return [{
            item_id: dropItemInfo.item_id, 
            item_num: dropItemInfo.item_num
        }];
    }
    return [];
};