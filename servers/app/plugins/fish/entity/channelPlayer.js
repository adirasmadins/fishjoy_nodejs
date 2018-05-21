const FishPlayer = require('./player');
const versionsUtil = require('../../../utils/imports').versionsUtil;

function getChannelPlayer() {
    let VER = versionsUtil.getVerKey();
    let ChannelPlayer = null;
    try {
        ChannelPlayer = require(`./player.${VER}`);
    }catch (err){
        ChannelPlayer = FishPlayer;
    }
    return ChannelPlayer;
}

module.exports = getChannelPlayer();