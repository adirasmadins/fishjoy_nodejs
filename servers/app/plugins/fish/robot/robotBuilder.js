const config = require('../config');
const consts = require('../consts');
const randomUtil = require('../../../utils/RandomUtil');
const omeloNickname = require('omelo-nickname');
const GAMECFG = require('../../../utils/imports').DESIGN_CFG;
const versionsUtil = require('../../../utils/imports').versionsUtil;

class RobotBuilder {
    constructor() {
        this._weaponLevels = Object.keys(GAMECFG.newweapon_upgrade_cfg);
        for (let k in this._weaponLevels) {
            this._weaponLevels[k] = parseInt(this._weaponLevels[k]);
        }

        this._weaponSkins = Object.keys(GAMECFG.newweapon_weapons_cfg);
        this._roleMaxLevel = GAMECFG.player_level_cfg.length;

        if(versionsUtil.getVerKey().search('vietnam') >= 0){
            omeloNickname.setLan(omeloNickname.lan.vietnam);
        }
    }

    /**
     * 计算机器人武器等级、武器能量、武器皮肤
     * @param level
     * @returns {*}
     * @private
     */
    _calcWeapon(level, minLevel) {
        let weapon = {
            level: level,
            weapon_energy:{},
            skin:{}
        };

        let levels = Array.from(this._weaponLevels);
        levels.sort(function (a, b) {
            return a - b;
        });

        let newLevel = level;
        for (let i = 0; i < levels.length; ++i) {
            if (levels[i] >= level) {
                let rm = utils.random_int(config.ROBOT.WEAPON_LEVEL_RANDOM[0], config.ROBOT.WEAPON_LEVEL_RANDOM[1]);
                i += rm;
                i = i >= levels.length ? levels.length - 1 : i;
                i = i < 0 ? 0 : i;
                newLevel = levels[i];
                break;
            }
        }
        newLevel = newLevel < minLevel ? minLevel : newLevel;
        weapon.level = newLevel;

        let level_filter = this._weaponLevels.filter(function (item) {
            return item <= newLevel;
        });

        level_filter.forEach(function (item) {
            weapon.weapon_energy[item] = utils.random_int(100, 3000);
        });
        weapon.skin = this._genOwnWeaponSkin();

        return weapon;
    }

    /**
     * 计算角色等级
     * @param level
     * @returns {*}
     * @private
     */
    _calcRoleLevel(level, minLevel) {
        let newLevel = level;
        newLevel += utils.random_int(config.ROBOT.ROLE_LEVEL_RANDOM[0], config.ROBOT.ROLE_LEVEL_RANDOM[1]);
        newLevel = newLevel < 1 ? 1 : newLevel;
        newLevel = newLevel > this._roleMaxLevel ? this._roleMaxLevel : newLevel;
        newLevel = newLevel < minLevel ? minLevel : newLevel;
        return newLevel;
    }

    /**
     * 计算武器皮肤
     * @returns {{own: [number], equip: number, star: {}}}
     * @private
     */
    _genOwnWeaponSkin() {
        let weapon_skin = {
            own: [1],
            equip: 12,
            star: {}
        };

        let randomMap = new Map();
        for (let i = 0; i < 5; i++) {
            let index = utils.random_int(1, this._weaponSkins.length - 1);
            randomMap.set(index, this._weaponSkins[index]);
        }

        for (let skin of randomMap.values()) {
            weapon_skin.own.push(skin);
        }

        let equip_index = utils.random_int(0, weapon_skin.own.length - 1);
        weapon_skin.equip = weapon_skin.own[equip_index];

        return weapon_skin;
    }

    calcCharmPoint(cp) {
        let rcp = 100 + randomUtil.randomNum(0, cp);
        return rcp;
    }

    _calcVip (vip) {
        let rvip = randomUtil.randomNum(0, vip);
        return rvip;
    }

    _calcRank(rank) {
        let random = randomUtil.randomNum(-3, 2);
        rank = rank + random;
        if (rank < 1) {
            rank = 1;
        }
        // 白银五段(暂定, 以后改为排行榜第20名的段位)
        if (rank > 24) {
            rank = 24;
        }
        return rank;
    }

    _calcGold(num, minNum){
        let gold = num + utils.random_int(config.ROBOT.GOLD_RANDOM[0], config.ROBOT.GOLD_RANDOM[1]) * config.ROBOT.GOLD_STEP;
        gold = gold <= 0 ? config.ROBOT.GOLD_DEFAULT : gold;
        if (gold < minNum) {
            gold = minNum;
        }
        return gold;
    }

    _calcPearl(num){
        let pearl = num + utils.random_int(config.ROBOT.PEARL_RANDOM[0], config.ROBOT.PEARL_RANDOM[1]) * config.ROBOT.PEARL_STEP;
        pearl = pearl <= 0 ? config.ROBOT.PEARL_DEFAULT : pearl;
        return pearl;
    }

    async genAccount(room) {
        let minLevel = 0;
        let minGold = 0;
        let sceneCfg = GAMECFG.scene_scenes_cfg[room.sceneId];
        let minWeaponLevel = sceneCfg.min_level;
        if (room.roomType == consts.ROOM_TYPE.RANK_MATCH) {
            minLevel = GAMECFG.common_const_cfg.RMATCH_ROLE_LV;
            minWeaponLevel = GAMECFG.common_const_cfg.RMATCH_OPEN_LIMIT;
        }else{
            minGold = sceneCfg.needgold;
        }
        let robot_Level = this._calcRoleLevel(room.avgLevel, minLevel);
        let robot_weapon = this._calcWeapon(room.avgWeaponLevel, minWeaponLevel);
        let gold = this._calcGold(room.avgGold, minGold);
        let pearl = this._calcPearl(room.avgPearl);
        let exp = room.avgExp;
        let vip = room.avgVIP;
        let robotInfo = omeloNickname.gen_random();

        let account = {
            figure_url: robotInfo.headUrl,
            nickname: robotInfo.nickname,
            sex: robotInfo.sex,
            level: robot_Level,
            weapon_skin: robot_weapon.skin,
            weapon: robot_weapon.level,
            gold: gold,
            pearl: pearl,
            vip: vip,
            comeback:{},
            weapon_energy: robot_weapon.weapon_energy,
            heartbeat: 100,
            roipct_time: 100,
            skill: {1: 2, 2: 8, 3: 8, 4: -1, 8: 2, 9: 0, 10: 0},
            exp: exp
        };

        return account;
    }

}

module.exports = new RobotBuilder();









