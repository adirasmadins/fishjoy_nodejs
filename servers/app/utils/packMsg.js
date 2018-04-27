const CryptoJS = require("crypto-js");
const session = require('../../config/session');

function packMsg(data, enc) {

    // console.time('packMsg');
    let _enc = enc || 'aes';
    _enc = null;
    let msg = {
        enc:_enc
    };

    if(_enc === 'aes'){
    // if(0){
        try {
            let encrypt_data = CryptoJS.AES.encrypt(JSON.stringify(data), session.secret);
            msg.data = encodeURIComponent(encrypt_data);  
        } catch (error) {
            logger.error('packMsg exction --- ', error);
            msg.data = '';
        }

    }else {
        msg.data = data;
    }
    // logger.info(msg.data.length);
    // console.timeEnd('packMsg');
    return msg;
}

module.exports = packMsg;