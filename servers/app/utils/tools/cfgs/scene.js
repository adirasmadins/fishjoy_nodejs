const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const scene_scenes_cfg = DESIGN_CFG.scene_scenes_cfg;

exports.getName = (key) => {
    return scene_scenes_cfg[key].name;
};