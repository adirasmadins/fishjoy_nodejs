const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const rank_rankgame_cfg = DESIGN_CFG.rank_rankgame_cfg;
const string_strings_cfg = DESIGN_CFG.string_strings_cfg;

/**
 * 根据rankid获取段位信息
 * @param {*} rankid 
 */
exports.getInfo = (rankid) => {
    for (let i = rank_rankgame_cfg.length - 1; i > 0; i--) {
        let rankInfo = rank_rankgame_cfg[i];
        if (rankid == rankInfo.id) {
            return rankInfo;
        }
    }
};

/**
 * 从玩家的比赛积分计算玩家的段位
 */
exports.getRankIdFromPoints = (points) => {
    for (let i = rank_rankgame_cfg.length - 1; i > 0; i--) {
        let rankInfo = rank_rankgame_cfg[i];
        if (points >= rankInfo.integral) {
            return rankInfo.id;
        }
    }
};

/**
 * 从玩家段位rankid 获取段位名字
 * @param {*} rankid 
 */
exports.getRankNameFromId = (rankid) => {
    let info = this.getInfo(rankid);
    if (info) {
        let name = info.name;
        return string_strings_cfg[name].cn;
    }
};