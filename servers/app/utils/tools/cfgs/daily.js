const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const daily_quest_cfg = DESIGN_CFG.daily_quest_cfg;

exports.getQuestInfo = (id) => {
    for (let i in daily_quest_cfg) {
        let info = daily_quest_cfg[i];
        if (id == info.id) {
            return info;
        }
    }
    return null;
};

exports.getQuestReward = (id) => {
    let info = this.getQuestInfo(id);
    if (info) {
        return info.reward;
    }
    else {
        return [];
    }
};