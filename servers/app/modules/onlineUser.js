const logger = require('omelo-logger').getLogger(__filename);

class OnlineUserModule {
    constructor(opts) {
        opts = opts || {};
        this.app = opts.app;
        this.type = opts.type || 'pull';
        this.interval = opts.interval || 5;
        logger.error('-----------------OnlineUserModule');
    }

    monitorHandler(agent, msg) {
        let connectionService = this.app.components.__connection__;
        if (!connectionService) {
            logger.error('not support connection: %j', agent.id);
            return;
        }

        let statisticsInfo = connectionService.getStatisticsInfo();
        agent.notify(module.exports.moduleId, {
            serverId: statisticsInfo.serverId,
            load: {
                playerCount: statisticsInfo.totalConnCount,
                loginedCount: statisticsInfo.loginedCount,
            }
        });
    }

    masterHandler(agent, msg) {
        if (!msg) {
            let list = agent.typeMap['connector'];
            if (!list || list.length === 0) {
                return;
            }
            agent.notifyByType('connector', module.exports.moduleId);
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
    return new OnlineUserModule(opts);
};
module.exports.moduleId = 'onlineUser';