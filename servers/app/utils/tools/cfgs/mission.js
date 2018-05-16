const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const active = require('./active');
const daily = require('./daily');

exports.getMissionInfo = (id) => {
    if (id < 100000) {
        return active.getNewbieInfo(id);
    }
    else {
        return daily.getQuestInfo(id);
    }
    return null;
};