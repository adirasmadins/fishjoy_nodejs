const loadSync = require('../internal/loadSync');
const logicResponse = require('../../common/logicResponse');
const modules = require('../../../modules');

class ServerLoad{
    async getGameLoad(data){
        return logicResponse.ask(loadSync.getLoad(modules.game.moduleId));
    }

    async rankMatchLoad(data){
        return logicResponse.ask(loadSync.getLoad(modules.rankMatch.moduleId));
    }
}


module.exports = new ServerLoad();