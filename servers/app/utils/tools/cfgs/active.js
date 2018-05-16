const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const active_newbie_cfg = DESIGN_CFG.active_newbie_cfg;

exports.getNewbieInfo = (id) => {
    for (let i = 0; i < active_newbie_cfg.length; i++) {
        let info = active_newbie_cfg[i];
        if (id == info.id) {
            return info;
        }
    }
    return null;
};