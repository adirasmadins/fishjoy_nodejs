const versions = require('../../config/versions');
const versionsUtil = require('../../config/versionsUtil');

module.exports = {
    DESIGN_CFG: require('../../config/design_cfg'),
    versions: versions,
    versionsUtil: versionsUtil,
    dbCfg: require('../../config/db'),
    sysConfig: require('../../config/sysConfig'),
    payConfig: require(`../../config/service/${versions.VER_KEY[versions.PUB]}/payConfig`)
};