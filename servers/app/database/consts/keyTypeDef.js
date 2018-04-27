/**
 * 玩家信息字段及默认值，以下数据从数据库导出所得
 * TODO: 表过于臃肿，待拆分:女神数据，凡是单个字段
 */
const base = require('./keytypeDef.base');
const version = require('../../../config/versions');

let AccountDef = {};
let OtherDef = {};
setValue(base);
try {
    setValue(require(`./keyTypeDef.${version.VER_KEY[version.PUB]}`));
} catch (err) {
    //do nothing
}

function setValue(objs) {
    if (!objs) return;
    for (let obj in objs.AccountDef) {
        AccountDef[obj] = objs.AccountDef[obj];
    }
    for (let obj in objs.OtherDef) {
        OtherDef[obj] = objs.OtherDef[obj];
    }
}

module.exports.AccountDef = AccountDef;
module.exports.OtherDef = OtherDef;

/**
 * 返回指定字段类型和默认值[type, def]
 */
module.exports.getField = function (field) {
    var af = module.exports.AccountDef[field];
    af = af || module.exports.OtherDef[field];
    return af;
};