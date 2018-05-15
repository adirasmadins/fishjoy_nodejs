const omelo = require('omelo');
const moment = require('moment');
const EventEmitter = require('events').EventEmitter;
const SERVER_PERIOD = require('../../consts/constDef').SERVER_PERIOD;
const redisKey = require('../../database/index').dbConsts.REDISKEY;
const tools = require('../../utils/tools');
const common_log_const_cfg = require('../../utils/imports').DESIGN_CFG.common_log_const_cfg;
const common_mathadjust_const_cfg = require('../../utils/imports').DESIGN_CFG.common_mathadjust_const_cfg;

class Pumpwater extends EventEmitter {

    async start() {
        const settings = await tools.BuzzUtil.getPumpwaterAsync();
        this.weight_time1 = settings.durationNormal;
        this.weight_time2 = settings.durationGive;
        this.weight_time3 = settings.durationGain;
        this.cur_extract = settings.extract;

        this._serverPeriodState = SERVER_PERIOD.GENERAL; //服务器周期状态
        this.period_start_time = Date.now(); //周期开始时间
        this.period_duration = this.weight_time1;

        this.pumpWater = 1;
        this.bakDBName = `${omelo.app.get('mysql').server.database}_bak`;
        // 开始后一周期后进行第一次抽水计算
        setTimeout(function () {
            this._recursiveMathWater();
        }.bind(this), this.weight_time1);

        // setInterval(function(){
        //     this._mathWater();
        //     logger.error('-------------- _mathWater')
        //     this.pumpWater = 1;
        // }.bind(this),1000);
    }

    set pumpWater(value) {
        this.period_start_time = Date.now(); //周期开始时间
        this._pumpWater = value;
        let perioid_info = {
            server_period: this._serverPeriodState,
            extract: this.cur_extract,
            pumpWater: this._pumpWater,
            start_time: this.period_start_time,
            duration: this.period_duration
        };

        logger.info('平台抽水系数计算结果:', perioid_info);
        redisConnector.cmd.set(redisKey.PLATFORM_DATA.PUMPWATER, JSON.stringify(perioid_info));
        redisConnector.pub(redisKey.DATA_EVENT_SYNC.PUMPWATER, perioid_info);
    }

    /**
     * 递归计算抽水值...
     */
    async _recursiveMathWater() {
        const settings = await tools.BuzzUtil.getPumpwaterAsync();
        let random = utils.random_int(1, 10);
        this.weight_time1 = settings.durationNormal * random;
        this.weight_time2 = settings.durationGive * random;
        this.weight_time3 = settings.durationGain * random;
        let x = settings.extract;
        let addvalue = settings.catchRateGive;
        let reducevalue = settings.catchRateGain;

        this._mathWater(function (err, extract) {
            if (err) {
                logger.error('计算抽水值发生错误,err:', err);
                return;
            }
            this.cur_extract = extract;
            if (extract > x) {
                //进入出分周期
                this._serverPeriodState = SERVER_PERIOD.OUT_SCORE;
                this._countDown(addvalue, this.weight_time2);
            } else {
                //进入吃分周期
                this._serverPeriodState = SERVER_PERIOD.EATE_SCORE;
                this._countDown(reducevalue, this.weight_time3);
            }
        }.bind(this));

        setTimeout(function () {
            this._recursiveMathWater();
        }.bind(this), this.weight_time1);
    }

    async _getTableInfo(isYesterday = false) {
        let tab = await mysqlConnector.query(`SHOW TABLES FROM ${this.bakDBName}`);
        let timeTag = moment(new Date()).format('YYYYMMDD');
        if (isYesterday) {
            timeTag = moment();
            timeTag.date(timeTag.date() - 1);
            timeTag = timeTag.format('YYYYMMDD');
        }

        let index = 0;
        for (let k in tab) {
            let tablename = tab[k][`Tables_in_${this.bakDBName}`];
            if (tablename.search(`tbl_gold_log_${timeTag}`) >= 0) {
                index++;
            }
        }
        return {
            table: `tbl_gold_log_${timeTag}`,
            index: index
        };
    }

    async _queryGainCostValue(params) {
        logger.info('_queryGainCostValue:', params);
        let sql = `SELECT SUM(gain) AS gain, SUM(cost) AS cost FROM 
            ${params[0]} WHERE level > 15 AND log_at > '${params[1]}' AND scene IN (
                ${common_log_const_cfg.GAME_FIGHTING},
                ${common_log_const_cfg.GOLDFISH_GAIN},
                ${common_log_const_cfg.FISH_BOMB},
                ${common_log_const_cfg.FISH_LIGHTING},
                ${common_log_const_cfg.NUCLER_LASER})`;
        if (tools.BuzzUtil.isVersionGambling()) {
            sql = `${common_log_const_cfg.NUCLER_DROP},
                ${common_log_const_cfg.ACTIVE_DRAW},
                ${common_log_const_cfg.NUCLER_COST},
                ${common_log_const_cfg.ACTIVE_COST})`;
        }

        let gain = 0;
        let cost = 0;
        let results = await mysqlConnector.query(sql);
        if (results && results[0]) {
            gain = results[0].gain || 0;
            cost = results[0].cost || 0;
        }

        return {
            gain: gain,
            cost: cost
        };
    }

    /**
     * 计算"玩家捕鱼总消耗/玩家捕鱼总收入"
     */
    async _mathWater(cb) {
        let oneday = moment();
        oneday.date(oneday.date() - 1);
        oneday = oneday.format('YYYY-MM-DD HH:mm:ss');

        try {
            let {
                table,
                index
            } = await this._getTableInfo();
            let gains = 0;
            let costs = 0;
            for (let i = index; i > 0; i--) {
                let {
                    gain,
                    cost
                } = await this._queryGainCostValue([`${this.bakDBName}.${table}_${i}`, oneday]);
                logger.info('gain,cost', gain, cost);
                logger.info('gain,cost', `${table}_${i}`);
                gains += gain;
                costs += cost;
            }

            {
                let {
                    table,
                    index
                } = await this._getTableInfo(true);
                for (let i = index; i > 0; i--) {
                    let {
                        gain,
                        cost
                    } = await this._queryGainCostValue([`${this.bakDBName}.${table}_${i}`, oneday]);
                    if (gain === 0 && cost === 0) {
                        break;
                    }
                    gains += gain;
                    costs += cost;
                }
            }

            {
                let {
                    gain,
                    cost
                } = await this._queryGainCostValue(['tbl_gold_log', oneday]);
                gains += gain;
                costs += cost;
            }
            let extract = common_mathadjust_const_cfg.extract;
            if (gains != 0 && costs != 0) {
                extract = (1 - gains / costs);
            }

            logger.info('计算抽水值:', extract);
            cb && cb(null, extract);
        } catch (e) {
            logger.error('计算抽水值发生错误', e);
            cb && cb(e);
        }
    }

    _countDown(target_pump_water, timeout) {
        this.period_duration = timeout;
        logger.error('-------------- _mathWater', target_pump_water);
        this.pumpWater = target_pump_water;
        setTimeout(function () {
            this.period_duration = this.weight_time1 - timeout;
            this._serverPeriodState = SERVER_PERIOD.GENERAL; //服务器周期状态
            this.pumpWater = 1;
        }.bind(this), timeout);
    }
}

module.exports = new Pumpwater();