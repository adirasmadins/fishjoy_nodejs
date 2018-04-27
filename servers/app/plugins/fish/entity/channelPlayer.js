const FishPlayer = require('./player');
const versions = require('../../../utils/imports').versions;

function getChannelPlayer() {
    let ver = versions.VER_KEY[versions.PUB];
    let ChannelPlayer = null;
    try {
        ChannelPlayer = require(`./player.${ver}`);
    }catch (err){
        ChannelPlayer = FishPlayer;
    }
    return ChannelPlayer;
}

module.exports = getChannelPlayer();