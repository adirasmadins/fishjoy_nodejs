global.logger = console;
const {MysqlConnector, RedisConnector} = require('../app/database/dbclient/');
const RewardModel = require('../app/utils/account/RewardModel');
const designCfgUtils = require('../app/utils/designCfg/designCfgUtils');
const redisAccountSync = require('../app/utils/redisAccountSync');
const REDISKEY = require('../app/models/index').REDISKEY;
const {mysql, redis} = require('../config/db');
const fs = require('fs');

class MissionTaskTransfer {
    async start() {
        this._total = 0;
        this._redisConnector = new RedisConnector();
        let result = await this._redisConnector.start(redis);
        if (!result) {
            process.exit(0);
            return;
        }

        this._mysqlConnector = new MysqlConnector();
        result = await this._mysqlConnector.start(mysql);
        if (!result) {
            process.exit(0);
            return;
        }
        //
        let self = this;
        this._transfer_onlyonce_redis(function () {
            self._total = 0;
            self._transfer_dailyreset_redis(function () {
                logger.error('转换全部完成');
            });
        });
        //
        // await this._transfer_mysql(0, 1000);
        // this._getMissionInfo(19088);
        // this._loadExceptionLog(0, 1000);
    }

    async _loadExceptionLog(skip, limit){

        let {cursor, result} = await redisConnector.sscan('log:exception:user', skip, limit);
        skip = cursor;
        this._total += result.length;
        fs.appendFileSync('log_exceptions_user.txt', result);
        if(result.length == 0){
            logger.error('log_exceptions_user.txt 捞取完成....', this._total);
            return;
        }
        this._loadExceptionLog(skip, limit);
    }

    async _getMissionInfo(uid){
        try{
            let account = await redisAccountSync.getAccountAsync(uid);
            let info = await RewardModel.getMissionTaskProcessInfo(account);
            logger.error('uid = ', uid);
            logger.error('mission_only_once = ', account.mission_only_once);
            logger.error('missionInfo = ', info);
        }catch(err) {
            logger.error('err = ', err);
        }

    }

    _transfer_onlyonce_redis(cb) {
        let self = this;
        redisAccountSync.getHashValueLimit(REDISKEY.MISSION_ONLY_ONCE, 0, 1000, async (res, next) => {
            if (!!res && res.length > 0) {
                let cmds = [];
                for (let i = 0; i < res.length; i += 2) {
                    if (res[i] != null && !Number.isNaN(Number(res[i]))) {
                        if (res[i + 1] != null) {
                            try {
                                let uid = Number(res[i]);
                                let only_once = JSON.parse(res[i + 1]);
                                for (let id in only_once) {
                                    let taskId = Number(id);
                                    if (Number.isNaN(taskId)) {
                                        continue;
                                    }

                                    if (Number.isNaN(Number(only_once[id]))) {
                                        continue;
                                    }

                                    let processValue = Number(only_once[id]);
                                    let item = designCfgUtils.getCfgValue('daily_quest_cfg', taskId, 'id');
                                    if (item) {
                                        let taskKey = RewardModel.EXPORT_TOOLS.getTaskKey(RewardModel.EXPORT_TOOLS.TASK_PREFIX.MISSION_TASK_ONCE, item.type,
                                            item.condition, item.value1);
                                        cmds.push(['HSET', taskKey, uid, processValue]);
                                        self._total++;
                                        if(this._total % 30000 == 0){
                                            fs.appendFileSync('only_once.log', JSON.stringify({total_process:self._total}) + '\r\n');
                                        }
                                    }

                                }

                            } catch (err) {
                                logger.error('用户数据异常，不做数据迁移', res[i], res[i + 1]);
                            }
                        }
                    }
                }
                await redisConnector.multi(cmds);
                logger.error('成功转移玩家成就REDIS数据到新的数据结构,len= ', cmds.length);

                next();
            }
        }, function () {
            logger.error('only_once转移完成');
            fs.appendFileSync('only_once.log', JSON.stringify({total:self._total}) + '\r\n');
            cb();
        });
    }

    _transfer_dailyreset_redis(cb) {
        let self = this;
        redisAccountSync.getHashValueLimit(REDISKEY.MISSION_DAILY_RESET, 0, 1000, async (res, next) => {
            if (!!res && res.length > 0) {
                let cmds = [];
                for (let i = 0; i < res.length; i += 2) {
                    if (res[i] != null && !Number.isNaN(Number(res[i]))) {
                        if (res[i + 1] != null) {
                            try {
                                let uid = Number(res[i]);
                                let only_once = JSON.parse(res[i + 1]);
                                for (let id in only_once) {
                                    let taskId = Number(id);
                                    if (Number.isNaN(taskId)) {
                                        continue;
                                    }

                                    if (Number.isNaN(Number(only_once[id]))) {
                                        continue;
                                    }

                                    let processValue = Number(only_once[id]);
                                    let item = designCfgUtils.getCfgMapValue('daily_quest_cfg', 'id', taskId);
                                    if (item) {
                                        let taskKey = RewardModel.EXPORT_TOOLS.getTaskKey(RewardModel.EXPORT_TOOLS.TASK_PREFIX.MISSION_TASK_DAILY, item.type,
                                            item.condition, item.value1);
                                        cmds.push(['HSET', taskKey, uid, processValue]);
                                        self._total++;
                                        if(this._total % 30000 == 0){
                                            fs.appendFileSync('daily_reset.log', JSON.stringify({total_process:self._total}) + '\r\n');
                                        }
                                    }

                                }

                            } catch (err) {
                                logger.error('用户数据异常，不做数据迁移', res[i], res[i + 1]);
                            }
                        }
                    }
                }
                await redisConnector.multi(cmds);
                logger.error('成功转移玩家成就REDIS数据到新的数据结构,len= ', cmds.length);

                next();
            }
        }, function () {
            logger.error('daily_reset转移完成');
            fs.appendFileSync('daily_reset.log', JSON.stringify({total:self._total}) + '\r\n');
            cb();
        });
    }

    async _transfer_mysql(skip, limit) {
        let sql = `SELECT id, mission_only_once FROM tbl_account LIMIT ${skip},${limit}`;
        let res = await mysqlConnector.query(sql);
        if(res.length > 0){
            for(let i = 0; i<res.length;i++){
                try{
                    let inser_sql = `INSERT INTO tbl_mission (id, mission_task_once) VALUES (${res[i].id},'${res[i].mission_only_once}') ON DUPLICATE KEY UPDATE id = VALUES(id)`;
                    await mysqlConnector.query(inser_sql);
                    this._total ++;
                    if(this._total % 3000 == 0){
                        fs.appendFileSync('transfer_mysql.log', JSON.stringify({total_process:this._total}) + '\r\n');
                    }
                }catch (err){
                    err;
                }
            }
            logger.error('成功转移MYSQL数据, len=', res.length);
            return await this._transfer_mysql(skip+limit, limit);
        }
        fs.appendFileSync('transfer_mysql.log', JSON.stringify({total:this._total}));
    }
}

let test = new MissionTaskTransfer();
test.start();