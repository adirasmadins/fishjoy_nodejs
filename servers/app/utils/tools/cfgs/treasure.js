const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const treasure_treasure_cfg = DESIGN_CFG.treasure_treasure_cfg;
const string_strings_cfg = DESIGN_CFG.string_strings_cfg;

exports.getInfo = (id) => {
    for (let i = 0; i < treasure_treasure_cfg.length; i++) {
        let treasureInfo = treasure_treasure_cfg[i];
        if (id == treasureInfo.id) {
            return treasureInfo;
        }
    }
    return null;
};

exports.getName = (id) => {
    let info = this.getInfo(id);
    if (info) {
        return string_strings_cfg[info.name].cn;
    }
};