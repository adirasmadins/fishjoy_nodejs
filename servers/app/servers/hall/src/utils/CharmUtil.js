const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const player_charmlevel_cfg = gameConfig.player_charmlevel_cfg;
const player_charm_cfg = gameConfig.player_charm_cfg;
const RedisUtil = require('./RedisUtil');
const ArrayUtil = require('./ArrayUtil');
const redisKeys = require('../../../../database').dbConsts.REDISKEY;
const vip_vip_cfg = gameConfig.vip_vip_cfg;


const TAG = "【CarmUtil】";


//构造需要的关键数据：现将复杂数据简化放入内存
//vip
let _vipChs = {};
for (let i = 0; i < vip_vip_cfg.length; i++) {
    let cfg = vip_vip_cfg[i];
    _vipChs[cfg.vip_level] = cfg.charm;
}

//weapon
const newweapon_upgrade_cfg = gameConfig.newweapon_upgrade_cfg;
let _weaponChs = {};
for (let i in newweapon_upgrade_cfg) {
    let cfg = newweapon_upgrade_cfg[i];
    _weaponChs[cfg.weaponlevel] = cfg.charm;
}

//weapon skin
const newweapon_weapons_cfg = gameConfig.newweapon_weapons_cfg;
let _wpskinChs = {};
for (let i in newweapon_weapons_cfg) {
    let cfg = newweapon_weapons_cfg[i];
    _wpskinChs[i] = cfg.charm;
}

// weapon star
// yDONE: 97-皮肤升星
const newweapon_star_cfg = gameConfig.newweapon_star_cfg;
let _wpstarChs = {};
for (let i in newweapon_star_cfg) {
    let cfg = newweapon_star_cfg[i];
    // 1589表示15号皮肤89级星...
    _wpstarChs[cfg.id * 100 + cfg.star] = cfg.charm;
}

//petfish
const aquarium_petup_cfg = gameConfig.aquarium_petup_cfg;
let _pfChs = {};
for (let i = 0; i < aquarium_petup_cfg.length; i++) {
    let cfg = aquarium_petup_cfg[i];
    _pfChs[cfg.level] = cfg.charm;
}

//god:charm
const goddess_goddessup_cfg = gameConfig.goddess_goddessup_cfg;
let _godChs = {};
for (let i = 0; i < goddess_goddessup_cfg.length; i++) {
    let cfg = goddess_goddessup_cfg[i];
    if (!_godChs[cfg.id]) {
        _godChs[cfg.id] = [];
    }
    _godChs[cfg.id].push(cfg.charm);
}

//rankgame
let rank_rankgame_cfg = gameConfig.rank_rankgame_cfg;
let _rmChs = {};
for (let i = 0; i < rank_rankgame_cfg.length; i++) {
    let cfg = rank_rankgame_cfg[i];
    _rmChs[cfg.id] = cfg.charm;
}

//计算当前拥有的女神的魅力值
let _catGodTotalCharm = function (curGod) {
    let oT = 0;
    for (let i = 0; i < curGod.length; i++) {
        let god = curGod[i];
        let charm = _godChs[god.id][god.level];
        oT += charm;
    }
    return oT;
};

//计算当前拥有的宠物鱼的魅力值
let _catPetFishTotalCharm = function (curPetFish) {
    let oT = 0;
    for (let k in curPetFish) {
        let pf = curPetFish[k];
        oT += _pfChs[pf.level];
    }
    return oT;
};

/**
 * 魅力值途径标记值: -1则从对应配置取得具体值，反之为取当前值
 *  1        VIP等级
 2        炮倍率
 3        皮肤
 4        皮肤星级
 5        收到鲜花每朵
 6        使用喇叭每个
 7        段位
 8        好友每个
 9        宠物鱼等级
 10        女神等级
 11        月卡
 12        月卡·壕
 */
function _getCharmWayCfgValue(wayIdx) {
    for (let i = 0; i < player_charm_cfg.length; i++) {
        let cfg = player_charm_cfg[i];
        if (cfg.id == wayIdx) {
            return cfg.charm;
        }
    }
    return -1;
}

/**
 * 新玩家默认武器魅力值
 */
let _getNewAccountCharmPointByWeapon = function (defaultWp) {
    defaultWp = defaultWp || 1;
    let c1 = _weaponChs[defaultWp];
    return c1;
};

/**
 * 新玩家默认女神魅力值,第一个女神默认1级
 */
let _getNewAccountCharmPointByGod = function (defaultGodId, defaultGodLv) {
    defaultGodId = defaultGodId || 1;
    defaultGodLv = defaultGodLv || 1;
    let charm = _godChs[defaultGodId][defaultGodLv];
    return charm || 0;
};

/**
 * 新玩家默认魅力值
 */
exports.getNewAccountCharmPointDefault = function (defaultWp, defaultGodId, defaultGodLv) {
    let c1 = _getNewAccountCharmPointByWeapon(defaultWp);
    c1 += _getNewAccountCharmPointByGod(defaultGodId, defaultGodLv);
    return c1;
};

/**
 * 玩家当前应该具备的魅力值
 * 及时计算
 */
exports.getCurrentCharmPoint = function (account, cb) {
    const FUNC = TAG + "getCurrentCharmPoint() --- ";
    let flowerC = account.flower_receive;
    let friendC = account.game_friend;
    let hornC = account.horn_used;
    let matchRank = account.match_rank;
    let flowerSendC = account.flower_send;//送出鲜花
    let cp = 0;
    //vip
    cp += _vipChs[account.vip] || 0;

    //weapon level
    cp += _weaponChs[account.weapon];

    //weapon skin
    let own = account.weapon_skin.own;
    // yTODO: 为什么own为空
    if (own && own.length) {
        own = ArrayUtil.delRepeat(own);
        for (let i = 0; i < own.length; i++) {
            let k = own[i];
            cp += _wpskinChs[k];
        }
    }

    // yDONE: 97-皮肤升星
    let star = account.weapon_skin.star;
    if (star) {
        logger.info(FUNC + "计算武器升星的魅力值");
        for (let weaponId in star) {
            let weaponStar = star[weaponId];
            logger.info(FUNC + "weaponStar:", weaponStar);
            let idx = weaponId * 100 + weaponStar;
            logger.info(FUNC + "idx:", idx);
            let oneCharm = _wpstarChs[idx];
            logger.info(FUNC + "oneCharm:", oneCharm);
            cp += oneCharm;
        }
    }

    //flower
    let fVal = _getCharmWayCfgValue(5);
    fVal *= flowerC;
    if (fVal > 3000) {
        fVal = 3000;
    }
    cp += fVal;

    //送出鲜花
    //todo 当前并无配置表，后续改为配置表
    fVal = 1;
    fVal *= flowerSendC;
    if (fVal > 3000) {
        fVal = 3000;
    }
    cp += fVal;

    //horn
    fVal = _getCharmWayCfgValue(6);
    fVal *= hornC;
    if (fVal > 3000) {
        fVal = 3000;
    }
    cp += fVal;

    //rm level
    matchRank > 0 && (cp += _rmChs[matchRank]);

    //friend
    fVal = _getCharmWayCfgValue(8);
    fVal *= friendC;
    if (fVal > 3000) {
        fVal = 3000;
    }
    cp += fVal;

    //petfish
    if (account.aquarium.petfish) {
        fVal = _catPetFishTotalCharm(account.aquarium.petfish);
        cp += fVal;
    }

    //goddess
    fVal = _catGodTotalCharm(account.goddess);
    cp += fVal;

    //month card/普通月卡
    if (account.card && account.card.normal) {
        cp += _getCharmWayCfgValue(11);
    }

    //month card 土豪月
    if (account.card && account.card.senior) {
        cp += _getCharmWayCfgValue(12);
    }

    //week card 周卡
    if (account.card && account.card.week) {
        cp += _getCharmWayCfgValue(13);
    }

    cb && cb(cp);
};

/**
 * 根据点数和排名获取配置魅力等级
 */
exports.getCharmCfgLevel = function (charmPoint, charmRank) {
    let i = player_charmlevel_cfg.length;
    while (i > 0 && i--) {
        let cfg = player_charmlevel_cfg[i];
        let rks = cfg.rank;
        if (rks.length == 1) {
            if (charmRank == rks[0] && charmPoint >= cfg.charm) {
                return cfg.level;
            }
        } else if (rks.length == 2) {
            let min = rks[0];
            let max = rks[1];
            if (charmRank >= min && charmRank <= max && charmPoint >= cfg.charm) {
                return cfg.level;
            }
        } else {
            if (charmPoint >= cfg.charm) {
                return cfg.level;
            }
        }
    }
    return 0;
};









