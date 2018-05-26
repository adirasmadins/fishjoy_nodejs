/**
 * 多版本玩家数据模型合并
 */
const baseModel = require('./keyTypeDef.base');
const versionsUtil = require('../../config/versionsUtil');
const VER_KEY = versionsUtil.getVerKey();

const PlayerModel = {};
const ArenaModel = {};
const DataModels = {};

setValue(baseModel);
setValueEx(baseModel);
try {
    setValue(require(`./keyTypeDef.${VER_KEY}`));
    setValueEx(require(`./keyTypeDef.${VER_KEY}`));
} catch (err) {
    //do nothing
}

function setValue(objs) {
    if (!objs) return;
    for (let item in objs.PlayerModel) {
        PlayerModel[item] = objs.PlayerModel[item];
    }
    for (let item in objs.ArenaModel) {
        ArenaModel[item] = objs.ArenaModel[item];
    }
}

function setValueEx(dataModels) {
    if (!dataModels) return;
    for(let tab_name in dataModels){
        let tab_cols = dataModels[tab_name];
        for(let item in tab_cols){
            DataModels[item] = tab_cols[item];
        }
    }
}

module.exports.PlayerModel = PlayerModel;
module.exports.ArenaModel = ArenaModel;
module.exports.DataModels = DataModels;