const utils = require('../utils');

/**
 * log写入redis
 */
class RedisLogInsert {

    constructor() {

    }


    /**
     * 通过事务批量刷入日志
     * @param sourceData
     * @param cb
     */
    flush(sourceData, cb) {
        for (let type in sourceData) {
            let datas = sourceData[type];
            if(datas.length === 0){
                continue;
            }

            // console.time('mysqlExec')
            let len = datas.length;

            let cmds = [];
            datas.forEach(function (item) {
                cmds.push(['LPUSH', `log:${type}`,JSON.stringify(item)]);
            });
            datas.splice(0, datas.length);
            redisConnector.cmd.multi(cmds).exec(function (err, result) {
                if(err){
                    logger.info('日志写入redis失败', err);
                }
                else {
                    logger.info('批量日志写入成功,数量', len);
                    // console.timeEnd('mysqlExec')
                    logger.info('日志写入redis成功');
                }
                utils.invokeCallback(cb, err, result);
            });
        }
    }


}

module.exports = new RedisLogInsert();