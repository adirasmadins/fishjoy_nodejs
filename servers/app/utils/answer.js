const CryptoJS = require("crypto-js");
const session = require('../../config/session');

function ResponseNoData(result) {
    let res = {};
    result.code !== 200  && (res.result = result);
    return res;
}

ResponseNoData.prototype.toString = function () {
    return JSON.stringify(this);
};

function ResponseData(data,enc) {
    return data;
}

ResponseData.prototype.toString = function () {
    return JSON.stringify(this);
};

function HttpResponse(data, aes, isError = false){
    let res = {};
    if(!isError){
        if (aes == 'false') {
            aes = false;
        }
        if(aes){
            res.aes = aes;
            let encrypt_data = CryptoJS.AES.encrypt(JSON.stringify(data), session.secret);
            res.data = encodeURIComponent(encrypt_data);
        }else{
            res.data = data;
        }

    }else{
        res.err = data;
    }
    return res;
}

module.exports.respNoData = ResponseNoData;
module.exports.respData = ResponseData;
module.exports.httpResponse = HttpResponse;