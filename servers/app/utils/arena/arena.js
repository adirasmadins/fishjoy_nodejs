const ArenaCommit = require('./arenaCommit');
const REDISKEY = require('../../models/index').REDISKEY;
const redisDataParser = require('../../models/redisDataParser');

class Arena extends ArenaCommit{
    constructor(id) {
        super(id);
    }

    /**
     * 序列化数据为Arena模型对象
     * @param uid
     * @param data
     * @returns {Account}
     */
    static parse(uid, data) {
        let arena = new Arena(uid);
        for (let key in data) {
            arena.appendValue(key, data[key]);
        }
        return arena;
    }

    async commit() {
        let fields = this.__update;

        if (fields.length === 0) {
            return;
        }

        let cmds = [];

        fields.forEach(function (key) {
            let tk = key[0];
            let cmd = Arena.getCmd(tk);
            if (cmd) {
                let v = redisDataParser.serializeValue(tk, key[1]);
                if (v != null) {
                    cmds.push([cmd, REDISKEY.getArenaKey(tk), this.id, v]);
                }
            }
        }.bind(this));

        this.__update = [];

        return await redisConnector.multi(cmds);
    }
}

module.exports = Arena;