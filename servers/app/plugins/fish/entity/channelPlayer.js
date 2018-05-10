const FishPlayer = require('./player');
const versionsUtil = require('../../../utils/imports').versionsUtil;

function getChannelPlayer() {
    let ver = versionsUtil.getVerKey();
    let ChannelPlayer = null;
    try {
        ChannelPlayer = require(`./player.${ver}`);
    }catch (err){
        ChannelPlayer = FishPlayer;
    }
    return ChannelPlayer;
}

module.exports = getChannelPlayer();