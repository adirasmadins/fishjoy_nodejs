const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const string_strings_cfg = DESIGN_CFG.string_strings_cfg;

exports.get = function (key, defaultValue) {
    try {
        return string_strings_cfg[key].cn;
    } catch (err) {
        return defaultValue;
    }
}