const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const item_itemtype_cfg = DESIGN_CFG.item_itemtype_cfg;
const item_item_cfg = DESIGN_CFG.item_item_cfg;
const string_strings_cfg = DESIGN_CFG.string_strings_cfg;

exports.getInfo = (id) => {
    return item_item_cfg[id];
};

/**
 * 获取物品名名字(不仅是物品名的id)
 * @param {*} id 
 */
exports.getName = (id) => {
    const info = this.getInfo(id);
    if (info) {
        let name = info.name;
        return string_strings_cfg[name].cn;
    }
    return null;
};

exports.ITEM_TYPE = () => {
    return item_itemtype_cfg;
};

exports.getType = (id) => {
    const info = this.getInfo(id);
    if (info) {
        return info.type;
    }
    return null;
};

exports.getSkillId = (id) => {
    const info = this.getInfo(id);
    if (info) {
        return info.id;
    }
    return null;
};