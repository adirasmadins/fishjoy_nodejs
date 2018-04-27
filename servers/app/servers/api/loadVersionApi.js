const versions = require('../../../config/versions');

module.exports = function (list, tag) {
    let ver = versions.GAMEPLAY[versions.PUB];
    try {
        const ver_api_list = require(`./${tag}.${ver}`);
        for(let key in ver_api_list){
            list[key] = ver_api_list[key];
        }
    } catch (err) {
        err;
    }
};