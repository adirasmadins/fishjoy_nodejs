const Cost = require('./cost');
const versionsUtil = require('../../../utils/imports').versionsUtil;

class GamePlay {
    constructor() {
        let ver = versionsUtil.getVerKey();
        try {
            let COST_CLASS = require(`./cost.${ver}`);
            this._cost = new COST_CLASS();
        }catch (err){
            this._cost = new Cost();
        }
        logger.error('-----------------GamePlay');
    }

    get cost() {
        return this._cost;
    }
}

module.exports = GamePlay;