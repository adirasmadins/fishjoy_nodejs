const omelo = require('omelo');
const redisAccountSync = require('./redisAccountSync');

class GlobalStatusData {
    constructor() {
        this._prefix = 'GlobalStatusData';
    }

    async addData(dataType, uid, sid, data) {
        if(data && typeof data == 'object'){
            data = JSON.stringify(data);
        }
        await redisAccountSync.oneCmdAsync(['hset', this._genKey(sid, dataType.name), uid, data]);
    }

    async delData(dataType, uid, sid) {
        await redisAccountSync.oneCmdAsync(['hdel', this._genKey(sid, dataType.name), uid]);
    }

    async queryData(dataType, serverType, uid) {
        let servers = omelo.app.getServersByType(serverType);
        if (!servers || servers.length === 0) {
            return;
        }
        for (let i = 0, len = servers.length; i < len; i++) {
            let cmd = ['hget', this._genKey(servers[i].id, dataType.name), uid];
            let data = await redisAccountSync.oneCmdAsync(cmd);
            if (data) {
                if(dataType.type == 'object'){
                    data = JSON.parse(data);
                }
                return data;
            }
        }
    }

    async clean() {
        let list = await redisAccountSync.oneCmdAsync(['keys', this._genCleanKey(omelo.app.getServerId())]);
        let cmds = [];
        for (let i = 0, len = list.length; i < len; i++) {
            cmds.push(['del', list[i]]);
        }
        logger.error('clean globalStatusData = ', cmds, list);
        await redisAccountSync.multiAsync(cmds);
    }

    _genKey(sid, dataType) {
        return `${this._prefix}:${sid}:${dataType}`;
    }

    _genCleanKey(sid) {
        return `${this._prefix}:${sid}*`;
    }
}

module.exports = new GlobalStatusData();