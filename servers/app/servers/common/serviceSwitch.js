const redisKey = require('../../database/index').dbConsts.REDISKEY;
class ServiceSwitch{
    constructor(){
        this._status = 0;
        this._msg = '';
        this._apiSet = new Set();
    }

    get status(){
        return this._status;
    }

    get msg(){
        return this._msg;
    }

    getApiLockStatus(api){
        return this._apiSet.has(api);
    }

    async _getSwitchStatus(){
        let result = await redisConnector.get(redisKey.SWITCH.SERVICE);
        if(result){
            logger.error('switchStatus=', result);
            if(!Number.isNaN(Number(result.status))){
                this._status = Number(result.status);
                this._msg = result.msg || '';
            }
        }
    }

    async _getApiSwitchList(){
        let self = this;
        let results = await redisConnector.hgetall(redisKey.SWITCH.API);
        if(results){
            for(let api in results){
                if(Number(results[api]) == 0){
                    logger.error('lock api switch=', api, results[api]);
                    self._apiSet.add(api);
                }
            }
        }
    }

    _openSwitch(){
        redisConnector.sub(redisKey.DATA_EVENT_SYNC.PLATFORM_SERVICE_SWITCH, this._platform_service_switch.bind(this));
        redisConnector.sub(redisKey.DATA_EVENT_SYNC.PLATFORM_API_SWITCH, this._platform_api_switch.bind(this));
    }

    _platform_service_switch(value){
        logger.error('收到服务器维护指令', value);
        if(value){
            if(!Number.isNaN(Number(value.status))){
                this._status = Number(value.status);
                this._msg = value.msg || '';
            }
        }
    }

    _platform_api_switch(value){
        if(value.switch == 0){
            this._apiSet.add(value.api);
        }else {
            this._apiSet.delete(value.api);
        }

    }

    async enableSwitch(){
        await this._getSwitchStatus();
        await this._getApiSwitchList();
        this._openSwitch();
    }
}

module.exports = new ServiceSwitch();