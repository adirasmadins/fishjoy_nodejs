const logger = require('omelo-logger').getLogger(__filename);

class GameModule {
    constructor(opts) {
        opts = opts || {};
        this.app = opts.app;
        this.type = opts.type || 'pull';
        this.interval = opts.interval || 5;
        logger.error('-----------------GameModule');
    }

    monitorHandler(agent, msg) {
        if (this.app.getServerType() !== 'game') {
            logger.error('not support type: %j', agent.id);
            return;
        }
        
        let loadInfo = this.app.entry.getLoadInfo();

        agent.notify(module.exports.moduleId, {
            serverId: agent.id,
            load:loadInfo
        });
    }

    masterHandler(agent, msg) {
        if (!msg) {
            let list = agent.typeMap.game;
            if (!list || list.length === 0) {
                return;
            }
            agent.notifyByType('game', module.exports.moduleId);
            return;
        }

        let data = agent.get(module.exports.moduleId);
        if (!data) {
            data = {};
            agent.set(module.exports.moduleId, data);
        }
        data[msg.serverId] = msg;
    }

    clientHandler(agent, msg, cb) {
        let data = agent.get(module.exports.moduleId);
        let sData = {};
        let list = agent.typeMap.game;
        if(!list || !data){
            cb && cb(null, sData);
            return;
        }
        for (let i = 0; i < list.length; ++i) {
            sData[list[i].id] = data[list[i].id];
        }
        cb && cb(null, sData);
    }
}

module.exports = function(opts) {
    return new GameModule(opts);
};
module.exports.moduleId = 'game';