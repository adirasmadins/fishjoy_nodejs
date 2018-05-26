const DataModels = require('./keyTypeDef').DataModels;
const ArenaModel = require('./keyTypeDef').ArenaModel;
const PlayerModel = require('./keyTypeDef').PlayerModel;

let DataModelsFields = new Set();
let PlayerModelFields = new Set();
let ArenaModelFields = new Set();
let dataModuleDefs = {};

for(let item in DataModels){
    dataModuleDefs[item] = DataModels[item];
    DataModelsFields.add(item);
}

for(let item in PlayerModel){
    PlayerModelFields.add(item);
}

for(let item in ArenaModel){
    ArenaModelFields.add(item);
}

function _getFieldDef(field) {
    return dataModuleDefs[field];
}

module.exports.getFieldDef = _getFieldDef;
module.exports.DataModelsFields = DataModelsFields;
module.exports.PlayerModelFields = PlayerModelFields;
module.exports.ArenaModelFields = ArenaModelFields;