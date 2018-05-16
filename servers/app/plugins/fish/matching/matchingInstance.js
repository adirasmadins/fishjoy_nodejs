const RankMatching = require('./rankMatching');
const GamePlay = require('../gamePlay/gamePlay');
class MatchingInstance{
    constructor(){
        this._rankMatching = new RankMatching();
        this._gamePlay = new GamePlay();
        logger.error('-----------------MatchingInstance'); 
    }

    get gamePlay(){
        return this._gamePlay;
    }
    
    start(){
        this._rankMatching.start();
    }

    stop(){
        this._rankMatching.stop();
    }

    request(route, msg, session, cb) {
        this._rankMatching.request(route, msg, session, cb);
    }
    
    remoteRpc(method, data, cb){
        this._rankMatching.remoteRpc(method, data, cb);
    }
    
}

module.exports = MatchingInstance;

