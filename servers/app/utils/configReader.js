// //--[[
// description: 配置读取，将数组类型转成key-value，以更快得到数据
// author: scott (liuwenming@chufengnet.com)
// date: 20171129
// ATTENTION：
// //--]]

const GAMECFG = require('./imports').DESIGN_CFG;

class ConfigReader {
    constructor() {
        this._cfg = {};
        this._transCfg();
    }

    /**
     * 数组类型转换成key-value,且数组元素da带有‘id’字段
     */
    _transCfg() {
        const toTrans = [{
                tbl: 'skill_skill_cfg',
                tkey: 'id'
            },
            {
                tbl: 'skill_skill_fish_cfg',
                tkey: 'id'
            },
            {
                tbl: 'vip_vip_cfg',
                tkey: 'vip_level'
            },
            {
                tbl: 'player_level_cfg',
                tkey: 'level'
            },
            {
                tbl: 'goddess_defend_cfg',
                tkey: 'id'
            },
            {
                tbl: 'goddess_fishborn_cfg',
                tkey: 'id'
            },
            {
                tbl: 'new_mini_game_coincatch_cfg',
                tkey: 'id'
            },
            {
                tbl: 'new_mini_game_crazyfugu_cfg',
                tkey: 'id'
            },
            {
                tbl: 'daily_pirate_cfg',
                tkey: 'ID'
            },
            {
                tbl: 'rank_rankgame_cfg',
                tkey: 'id'
            },
            {
                tbl: 'treasure_treasure_cfg',
                tkey: 'id'
            },
            {
                tbl: 'aquarium_petfish_cfg',
                tkey: 'id'
            },
            

            {
                tbl: 'goddess_goddessup_cfg',
                tkey: 'id',
                tkey1: 'level'
            },
            {
                tbl: 'newweapon_star_cfg',
                tkey: 'id',
                tkey1: 'star'
            },

        ];

        for (let i = 0; i < toTrans.length; i++) {
            let ts = toTrans[i];
            let tbl = ts.tbl;
            let tkey = ts.tkey;
            let tkey1 = ts.tkey1;
            const CFG = GAMECFG[tbl];
            if (CFG instanceof Array) {
                let tdata = {};
                for (let i = 0; i < CFG.length; i++) {
                    let data = CFG[i];
                    let key = data[tkey];
                    if (tkey1) {
                        let key1 = data[tkey1];
                        key += ('_' + key1);
                    }
                    // logger.error('tbl = ', tbl, 'key = ', key);
                    tdata[key] = data;
                }
                this._cfg[tbl] = tdata;
            }
        }
    }

    /**
     * 根据表名，取得配置项个数
     */
    getLength(tbl) {
        let tbVal = this._cfg[tbl] || GAMECFG[tbl];
        return tbVal && Object.keys(tbVal).length || tbVal.length;
    }

    /**
     * 根据表名+唯一标识取得配置
     */
    getValue(tbl, key) {
        let tbVal = this._cfg[tbl] || GAMECFG[tbl];
        // logger.error('===this._cfg', tbVal);
        // logger.error('===tbl key', tbl, key);
        return tbVal[key];
    }

    /**
     * 根据 表名 + 唯一标识 + 字段名 取得配置
     */
    getField(tbl, key, field) {
        let val = this.getValue(tbl, key);
        return val[field];
    }

    /**
     * 根据 表名 + 标识1 + 标识2 取得配置
     */
    getValueByKey1(tbl, key, key1) {
        let tkey = key + '_' + key1;
        return this.getValue(tbl, tkey);
    }

    /**
     * 获取指定女神指定等级配置
     */
    getGodLevelData(godId, godLevel) {
        return this.getValueByKey1('goddess_goddessup_cfg', godId, godLevel);
    }

    /**
     * 获取武器升星配置，指定武器指定星级
     */
    getWeaponStarData(weaponSkinId, star) {
        return this.getValueByKey1('newweapon_star_cfg', weaponSkinId, star);
    }
}

module.exports = new ConfigReader();