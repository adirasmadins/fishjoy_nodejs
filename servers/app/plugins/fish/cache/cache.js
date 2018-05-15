const redisKey = require('../../../database/index').dbConsts.REDISKEY;
const redisAccountSync = require('../../../utils/redisAccountSync');
const platform_data_conf = require('../../../utils/imports').sysConfig.PLATFORM_DATA_CONF;
const SubGameData = require('./subGameData');

class Cache{
    constructor(){
        this._data = new Map();
        logger.error('-----------------Cache');
    }

    async start(){
        await this._loadData();
        this._subGameData = new SubGameData();
        this._subGameData.listen(this.set.bind(this));
    }

    async _loadData(){

        let cmds = [];
        cmds.push(['GET', redisKey.PLATFORM_DATA.PUMPWATER]);
        cmds.push(['GET', redisKey.PLATFORM_DATA.PLATFORM_CATCHRATE]);
        cmds.push(['GET', redisKey.PLATFORM_DATA.PLATFORM_CATCH_REVISE]);
        try{
            let values = await redisAccountSync.multiAsync(cmds);

            if(values[0] == undefined || values[0] == null){
                this.set(redisKey.PLATFORM_DATA.PUMPWATER, 1);
            }
            else {
                let range = platform_data_conf.PUMPWATER.RANGE;
                let pumpWater_info = JSON.parse(values[0]); 
                let pump = pumpWater_info.pumpWater;
                if(pump >= range[0] && pump <= range[1]){
                    this.set(redisKey.PLATFORM_DATA.PUMPWATER, pump);
                }else {
                    logger.error('平台抽水系数异常, 请检查数据配置');
                }
            }


            if(values[1] == undefined || values[1] == null){
                this.set(redisKey.PLATFORM_DATA.PLATFORM_CATCHRATE, 1);
            }
            else {
                let range = platform_data_conf.PLATFORM_CATCHRATE.RANGE;
                if(values[1] >= range[0] && values[1] <= range[1]){
                    this.set(redisKey.PLATFORM_DATA.PLATFORM_CATCHRATE, values[1]);
                }else {
                    logger.error('平台捕获率异常, 请检查数据配置');
                }
            }
            // this.set(redisKey.PLATFORM_DATA.PLATFORM_CATCH_REVISE, values[2] || 1);
            //TODO 需求临时调整为统一使用默认值1
            this.set(redisKey.PLATFORM_DATA.PLATFORM_CATCH_REVISE, 1);

            //加载房间捕获率
            redisConnector.cmd.hgetall(redisKey.PLATFORM_DATA.SCENE_CATCHRATE, function (err, result) {
                if (!err && result) {
                    for (let key in result) {
                        let value = Number(result[key]);
                        let range_pcatch = platform_data_conf.PLATFORM_CATCHRATE.RANGE;
                        if (value >= range_pcatch[0] && value <= range_pcatch[1]) {
                            this.set(redisKey.PLATFORM_DATA.SCENE_CATCHRATE + key, Number(result[key]));
                        }
                    }
                }
            }.bind(this));
        } catch (err) {
            logger.error('加载平台初始数据失败', err);
        }

    }

    get(key){
        return this._data.get(key);
    }

    set(key, value){
        this._data.set(key, value);
    }

}

module.exports = Cache;