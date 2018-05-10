global.logger = console;
const {MysqlConnector, RedisConnector} = require('../app/database/dbclient/');
const RewardModel = require('../app/utils/account/RewardModel');
const designCfgUtils = require('../app/utils/designCfg/designCfgUtils');
const redisAccountSync = require('../app/utils/redisAccountSync');
const REDISKEY = require('../app/database/consts').REDISKEY;
const {mysql, redis} = require('../config/db');

class MissionTaskTransfer {
    async start() {
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

        this._transfer_redis(function () {
            logger.error('redis 玩家数据转移完成...');
        });

        await this._transfer_mysql(0, 1000);
    }

    _transfer_redis(cb) {
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
                                    let item = designCfgUtils.getCfgMapValue('daily_quest_cfg', 'id', taskId);
                                    if (item) {
                                        let taskKey = RewardModel.EXPORT_TOOLS.getTaskKey(RewardModel.EXPORT_TOOLS.TASK_PREFIX.MISSION_TASK_ONCE, item.type,
                                            item.condition, item.value1);
                                        cmds.push(['HSET', taskKey, uid, processValue]);
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

            } else {
                next();
            }
        }, function () {
            cb();
        });
    }

    async _transfer_mysql(skip, limit) {
        let sql = `SELECT id, mission_only_once FROM tbl_account LIMIT ${skip},${limit}`;
        let res = await mysqlConnector.query(sql);
        if(res.length > 0){
            for(let i = 0; i<res.length;i++){
                try{
                    let inser_sql = `INSERT INTO tbl_mission (id, mission_task_once) VALUES (${res[i].id},'${res[i].mission_only_once}') ON DUPLICATE KEY UPDATE id = VALUES(id)`
                    await mysqlConnector.query(inser_sql);
                }catch (err){
                    err;
                }
            }
            logger.error('成功转移MYSQL数据, len=', res.length);
            await this._transfer_mysql(skip+limit, limit);
        }
    }
}

let test = new MissionTaskTransfer();
test.start();