//==============================================================================
// import
//==============================================================================
const crypto = require('crypto');


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.createSalt = createSalt;
exports.encodePassword = encodePassword;
exports.generateSessionToken = generateSessionToken;
exports.generateRandomKey = generateRandomKey;
exports.randomInt = randomInt;
exports.randomNum = randomNum;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
function createSalt() {
    return crypto.randomBytes(24).toString('hex');
}

function encodePassword(salt, password) {
    let sha = crypto.createHash('sha512');
    sha.update(salt);
    sha.update(password);

    let hv = sha.digest();
    let i;
    for (i = 0; i < 512; i++) {
        sha = crypto.createHash('sha512');
        sha.update(hv);
        hv = sha.digest();
    }

    return hv.toString('base64');
}

function generateSessionToken(userId) {
    return userId + '_' + crypto.randomBytes(24).toString('hex');
}

function generateRandomKey() {
    let str="", i=0, min=33, max=126;
    for(;i++<16;){
        let r = Math.random()*(max-min)+min <<0;
        // exclude ', ", \, /
        if (r == 34 || r == 39 || r == 47 || r == 92) {
            --i;
            continue;
        }
        str += String.fromCharCode(r);
    }
    return str;
}

function randomInt(maxNum) {
    return Math.floor(Math.random() * maxNum);
}

function randomNum(minNum,maxNum) {
    return parseInt(Math.random() * (maxNum-minNum+1)+minNum,10);
} 