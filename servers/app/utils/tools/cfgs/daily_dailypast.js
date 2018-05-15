const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const daily_dailypast_cfg = DESIGN_CFG.daily_dailypast_cfg;

exports.getInfo = (id) => {
    for (let i = 0; i < daily_dailypast_cfg.length; i++) {
        let info = daily_dailypast_cfg[i];
        if (id == info.id) {
            return info;
        }
    }
    return null;
};

exports.getReward = (id) => {
    let info = this.getInfo(id);
    if (info) {
        return info.reward;
    }
};
