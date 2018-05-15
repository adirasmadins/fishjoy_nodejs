const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const newweapon_weapons_cfg = DESIGN_CFG.newweapon_weapons_cfg;

exports.getWeapnInfo = (id) => {
    return newweapon_weapons_cfg[id];
};