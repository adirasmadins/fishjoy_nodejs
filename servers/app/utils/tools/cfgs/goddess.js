const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const goddess_goddess_cfg = DESIGN_CFG.goddess_goddess_cfg;
const goddess_goddessup_cfg = DESIGN_CFG.goddess_goddessup_cfg;
const goddess_interact_cfg = DESIGN_CFG.goddess_interact_cfg;
const goddess_rankreward_cfg = DESIGN_CFG.goddess_rankreward_cfg;
const goddess_defend_cfg = DESIGN_CFG.goddess_defend_cfg;
const goddess_fishborn_cfg = DESIGN_CFG.goddess_fishborn_cfg;

exports.getGoddessInfo = (id) => {
    return this.getInfo(id, goddess_goddess_cfg);
};

exports.getInteractInfo = (id) => {
    return this.getInfo(id, goddess_interact_cfg);
};

exports.getInfo = (id, cfg) => {
    for(let i in cfg) {
        let info = cfg[i];
        if (id == info.id) {
            return info;
        }
    }
    return null;
};

exports.getGoddessUpInfo = (id, level) => {
    for(let i in goddess_goddessup_cfg) {
        let info = goddess_goddessup_cfg[i];
        if (id == info.id && level == info.level) {
            return info;
        }
    }
    return null;
};

exports.findGodProperty = (godId, godLevel, spId) => {
    for (let level = godLevel; level> 0; level--) {
        let info = this.getGoddessUpInfo(godId, level);
        if (spId == info.property) {
            return true;
        }
    }
    return false;
};