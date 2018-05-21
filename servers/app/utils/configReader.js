// //--[[
// description: 配置读取，将数组类型转成key-value，以更快得到数据
// author: scott (liuwenming@chufengnet.com)
// date: 20171129
// ATTENTION：
// //--]]

const GAMECFG = require('./imports').DESIGN_CFG;
const designCfgUtils = require('./designCfg/designCfgUtils');
const updateCfgsEvent = require('./designCfg/updateCfgsEvent');

//数组格式配置转key-value格式
const TB_KEYS = {
    skill_skill_cfg: 'id',
    skill_skill_fish_cfg: 'id',
    goddess_defend_cfg: 'id',
    goddess_fishborn_cfg: 'id',
    new_mini_game_coincatch_cfg: 'id',
    new_mini_game_crazyfugu_cfg: 'id',
    rank_rankgame_cfg: 'id',
    treasure_treasure_cfg: 'id',
    aquarium_petfish_cfg: 'id',
    daily_pirate_cfg: 'ID',
    vip_vip_cfg: 'vip_level',
    player_level_cfg: 'level',
};

//多字段转换一个关键字
const TB_KEYS_2 = [           
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

class ConfigReader {
    constructor() {
        this._cfg = {};
        this._transCfg();

        for (let i = 0; i < TB_KEYS_2.length; i ++) {
            let name = TB_KEYS_2[i].tbl;
            updateCfgsEvent.on(name, this._update.bind(this));
        }
    }

    _update(cfgs) {
        this._transCfg();
    }

    /**
     * 数组类型转换成key-value,且数组元素da带有‘id’字段
     * 注意：两个关键字决定一个新key
     */
    _transCfg() {
        for (let i = 0; i < TB_KEYS_2.length; i++) {
            let ts = TB_KEYS_2[i];
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
     * 根据表名+唯一标识取得配置
     */
    getValue(tbl, key) {
        let tbVal = this._cfg[tbl];
        if (!tbVal) {
            let itemKey = TB_KEYS[tbl];
            if (itemKey) {
                return designCfgUtils.getCfgValue(tbl, key, itemKey);
            }else {
                tbVal = GAMECFG[tbl];
            }
        }
        return tbVal[key];
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