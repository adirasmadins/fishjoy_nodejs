const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const vip_vip_cfg = DESIGN_CFG.vip_vip_cfg;

exports.getInfo = (vip_level) => {
    for (let i = 0; i < vip_vip_cfg.length; i++) {
        let info = vip_vip_cfg[i];
        if (vip_level == info.vip_level) {
            return info;
        }
    }
    return null;
};

exports.getVipFromRmb = (rmb) => {
    let curr_vip = 0;
    for (let key = 0; key < vip_vip_cfg.length; key++) {
        let value = vip_vip_cfg[key];
        if (value.vip_unlock <= rmb) {
            curr_vip = value.vip_level;
        }
    }
    return curr_vip;
};
