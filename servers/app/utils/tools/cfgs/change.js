// 实物兑换表
const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const change_change_cfg = DESIGN_CFG.change_change_cfg;

exports.getInfo = (id) => {
    for (let i = 0; i < change_change_cfg.length; i++) {
        let info = change_change_cfg[i];
        if (id == info.id) {
            return info;
        }
    }
    return null;
};

exports.getLeftData = () => {
    let ret = {};
    for (let i = 0; i < change_change_cfg.length; i++) {
        let info = change_change_cfg[i];
        ret[info.id] = {
            dailyLeft: info.count,
            totalLeft: info.total,
        };
    }
    return ret;
};

exports.getDailyLeftData = () => {
    let ret = {};
    for (let i = 0; i < change_change_cfg.length; i++) {
        let info = change_change_cfg[i];
        ret[info.id] = { left: info.count };
    }
    return ret;
};