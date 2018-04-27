const redisAccountSync = require('../../utils/redisAccountSync');
const ACCOUNTKEY = require('../../database/consts').ACCOUNTKEY;
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const omelo = require('omelo');
const versions = omelo.app.get('versions');
const cheat_broken = versions.CHEAT_BROKEN;
const broken = cheat_broken.indexOf(versions.PUB) !== -1;

module.exports = async function (uid, token) {
    let account = await redisAccountSync.getAccountAsync(uid, [ACCOUNTKEY.TOKEN, ACCOUNTKEY.TEST]);
    if (account.token == "daily_reset") {
        throw ERROR_OBJ.DAILY_RESET;
    } else if (account.test < 0 && broken || account.token.search('cheat') >= 0) {
        throw ERROR_OBJ.PLAYER_CHEAT;
    }
    else if (account.token != token) {
        throw ERROR_OBJ.TOKEN_INVALID;
    }
};