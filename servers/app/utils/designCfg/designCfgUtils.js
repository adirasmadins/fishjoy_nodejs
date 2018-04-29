const updateCfgsEvent = require('./updateCfgsEvent');
const DESIGN_CFG = require('../imports').DESIGN_CFG;
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;

class DesignCfgUtils{
    constructor() {
        this._cfgsMap = new Map();
    }

    updateCfg(name, value){
        for(let key of this._cfgsMap.keys()){
            let keys = key.split('@');
            if(name == keys[0] && value instanceof Array){
                this._toMap(value, name, keys[1]);
            }
        }
        updateCfgsEvent.emit(name, value);
    }

    getCfg(name) {
        let cfg = DESIGN_CFG[name];
        if (!cfg) {
            logger.error(`配置文件${name}不存在`);
            throw ERROR_OBJ.DESIGN_CFGS_NOT_EXIST;
        }
        return cfg;
    }

    /**
     * 获取配置表中某字段对应的值
     * @param name
     * @param key
     * @return {*}
     */
    getCfgMapValue(name, item, value) {
        let cfg = DESIGN_CFG[name];
        if (cfg instanceof Array) {
            let cfgMap = this._cfgsMap.get(this._getKey(name, item));
            if (!cfgMap) {
                cfg = this._toMap(cfg, name, item);
            }else {
                cfg = cfgMap;
            }
        }
        return cfg[value];
    }

    _toMap(cfg, name, item) {
        let cfgMap = {};
        for (let i = 0; i < cfg.length; i++) {
            cfgMap[cfg[i][item]] = cfg[i];
        }
        this._cfgsMap.set(this._getKey(name, item), cfgMap);
        return cfgMap;
    }

    _getKey(name, item) {
        return `${name}@${item}`;
    }
}

// let aa = new DesignCfgUtils();
// // console.log(aa.getCfg('active_active_cfg'));
// console.log(aa.getCfgMapValue('active_active_cfg', 'id', 15));

module.exports = new DesignCfgUtils();