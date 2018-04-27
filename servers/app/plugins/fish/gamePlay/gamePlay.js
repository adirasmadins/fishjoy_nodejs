const Cost = require('./cost');
const versions = require('../../../utils/imports').versions;

class GamePlay {
    constructor() {
        let ver = versions.VER_KEY[versions.PUB];
        try {
            let COST_CLASS = require(`./cost.${ver}`);
            this._cost = new COST_CLASS();
        }catch (err){
            this._cost = new Cost();
        }
    }

    get cost() {
        return this._cost;
    }
}

module.exports = new GamePlay();