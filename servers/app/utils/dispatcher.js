const crc = require('crc');

module.exports.dispatch = function (key, list) {
    let index = Number(key) % list.length;
    if(isNaN(index)){
        return;
    }
    return list[index];
};

module.exports.dispatchEx = function(key, list) {
    let sort_list = list.sort(function(a, b){
        return a.id > b.id ? 1 : -1;
    });
    let index = Math.abs(crc.crc32(key.toString())) % sort_list.length;
    if(isNaN(index)){
        return;
    }
    return sort_list[index];
};




