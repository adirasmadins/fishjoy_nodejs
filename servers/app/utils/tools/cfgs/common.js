// 实物兑换表
const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const common_mathadjust_const_cfg = DESIGN_CFG.common_mathadjust_const_cfg;
const common_log_const_cfg = DESIGN_CFG.common_log_const_cfg;
const common_const_cfg = DESIGN_CFG.common_const_cfg;

exports.getPumpWater = (id) => {
    return {
        durationNormal: common_mathadjust_const_cfg.time1,
        durationGive: common_mathadjust_const_cfg.time2,
        durationGain: common_mathadjust_const_cfg.time3,
        extract: common_mathadjust_const_cfg.extract,
        catchRateGive: common_mathadjust_const_cfg.addvalue,
        catchRateGain: common_mathadjust_const_cfg.reducevalue,
    };
};

exports.getMathAdjustConsts = () => {
    return common_mathadjust_const_cfg;
};

exports.getLogConsts = () => {
    return common_log_const_cfg;
};

exports.getConsts = () => {
    return common_const_cfg;
};