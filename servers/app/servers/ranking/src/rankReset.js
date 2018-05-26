const REDISKEY = require('../../../models/index').REDISKEY;
const redisAccountSync = require('../../../utils/redisAccountSync');
class RankReset {
    constructor() {

    }

    async handle(task) {
        let cmds = [];
        for (let platform of Object.values(REDISKEY.PLATFORM_TYPE)) {
            cmds.push(['del', `${task.redisKey}:${platform}`]);
        }
        if (task.delete && task.delete.length > 0) {
            task.delete.forEach(function (key) {
                cmds.push(['del', key]);
            });
        }
        await redisAccountSync.multiAsync(cmds);
    }
}

module.exports = RankReset;