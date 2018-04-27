const Task = require('../../../utils/task/task');
const async = require('async');
const utils = require('../../../utils/utils');

//TODO LINYNG@DFC 未完成
/**
 * 用户数据重置
 */
class ActiveResetTask extends Task {
    constructor(conf) {
        super(conf);
    }


    _build(task, cb){
        utils.invokeCallback(cb, null);
    }
    _exeTask(cb) {
        logger.info('活动重置开始');
        let tasks = this.taskConf.subTask;
        async.mapSeries(tasks, this._build.bind(this), function (err, results) {
            logger.info('活动重置完成');
            utils.invokeCallback(cb, null);
        });
    }
}



let field_def = [
    'active',
    // 'active_daily_reset',
    // 'active_stat_once',
    // 'active_stat_reset'
    'active:daily',
    'active:stat:once',
    'active:stat:reset'
];

const activeReset_sql = 'UPDATE tbl_account SET active = \'{}\', active_daily_reset = \'{}\', active_stat_once = \'{}\',active_stat_reset = \'{}\'';

exports.resetDB = resetDB;

function resetDB(myPool) {
    myPool.query(activeReset_sql, function (err, result) {
        if(err){
            logger.error('mysql 活动数据重置失败:', err);
        }else {
            logger.info('mysql 活动数据重置成功');
        }
    });

    let cmds = [];

    field_def.forEach(function (item) {
        cmds.push(['hkeys', `pair:uid:${item}`]);
        // cmds.push(['hvals', `pair:uid:${item}`])
        // cmds.push(['hset', `pair:uid:${item}`, item, 1000])
    });

    redisConnector.multi(cmds, function (err, results) {
        if (err) {
            logger.error('redis 获取活动数据异常:', err);
            return;
        }

        for (let i = 0; i< results.length; ++i){
            let subCmds = [];
            let items = results[i];

            items.forEach(function (item) {
                subCmds.push(['hset', `pair:uid:${field_def[i]}`, item, '{}']);
            });

            if(subCmds.length > 0){
                redisConnector.multi(subCmds, function (err, results) {
                    if (err) {
                        logger.error('redis 重置活动数据异常:', err);
                        return;
                    }
                    logger.info('redis 重置活动数据成功');
                });
            }
        }

    });

    CacheAccount.resetActive(function() {
        logger.info('缓存 重置活动数据成功');
    });

}


function runActiveReset(myPool) {
    active_cfg.forEach(function (item) {

        let eTime = new Date(item.endtime.replace('&', ' '));
        let time_str = `${eTime.getSeconds()} ${eTime.getMinutes()} ${eTime.getHours()} ${eTime.getDate()} ${eTime.getMonth()+1} ${eTime.getDay()}`;
        logger.info('启动活动结束重置数据模块', time_str);

        this.schedule = schedule.scheduleJob(time_str, function(){
            logger.info('执行活动结束重置数据业务');
            resetDB(myPool);
        });

    });
}

module.exports = ActiveResetTask;