const logger = require('omelo-logger').getLogger(__filename);

class RankMatchModule {
    constructor(opts) {
        opts = opts || {};
        this.app = opts.app;
        this.type = opts.type || 'pull';
        this.interval = opts.interval || 5;
        logger.error('-----------------RankMatchModule');
    }

    monitorHandler(agent, msg) {
        if (this.app.getServerType() !== 'rankMatch') {
            logger.error('not support type: %j', agent.id);
            return;
        }

        let loadInfo = this.app.entry.getLoadInfo();
        agent.notify(module.exports.moduleId, {
            serverId: agent.id,
            load: loadInfo
        });
    }

    masterHandler(agent, msg) {
        if (!msg) {
            let list = agent.typeMap['rankMatch'];
            if (!list || list.length === 0) {
                return;
            }
            agent.notifyByType('rankMatch', module.exports.moduleId);
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
        cb && cb(null, agent.get(module.exports.moduleId));
    }
}

module.exports = function (opts) {
    return new RankMatchModule(opts);
};
module.exports.moduleId = 'rankMatch';