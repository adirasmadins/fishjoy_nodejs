
let cacheFields = new Set();
let dataModuleDefs = {};

let _addDataDef = function (dataDefs) {
    for (let key in dataDefs) {
        cacheFields.add(key);
        dataModuleDefs[key] = dataDefs[key];
    }
};

let _getFieldDef = function (field) {
    return dataModuleDefs[field];
};

module.exports.addDataDef = _addDataDef;
module.exports.getFieldDef = _getFieldDef;
module.exports.cacheFields = cacheFields;