////////////////////////////////////////////////////////////////////////////////
// Weapon Data Operation
// 武器数据的操作更新
// add_weapon_log
////////////////////////////////////////////////////////////////////////////////

//==============================================================================
// import
//==============================================================================
//------------------------------------------------------------------------------
// 工具(Tool)
//------------------------------------------------------------------------------
var BuzzUtil = require('../../src/utils/BuzzUtil');
var buzz_weapon = require('../../src/buzz/buzz_weapon');
var data_util = require('./data_util');
const logicResponse = require('../../../common/logicResponse');

var DEBUG = 0;
var ERROR = 1;

var TAG = "【data/weapon】";

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.add_weapon_log = add_weapon_log;
exports.levelup = levelup;
exports.buySkin = buySkin;
exports.equip = equip;

exports.upstar = upstar;
exports.vote = vote;
exports.querySkinVote = querySkinVote;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 添加武器升级记录
 */
async function add_weapon_log(data) {
    BuzzUtil.cacheLinkDataApi(data, "add_weapon_log");
    return new Promise(function (resolve, reject) {
        myDao.addWeaponLog(data, function (err, result) {
            if (err) {
                logger.error('更新玩家武器升级数据失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function levelup(data) {
    return new Promise(function (resolve, reject) {
        buzz_weapon.levelup(data, function (err, result) {
            if (err) {
                logger.error('武器升级 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

// yDONE: 97-皮肤升星
async function upstar(data) {
    return new Promise(function (resolve, reject) {
        buzz_weapon.upstar(data, function (err, result) {
            if (err) {
                logger.error('皮肤升星 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function buySkin(data) {
    return new Promise(function (resolve, reject) {
        buzz_weapon.buySkin(data, function (err, result) {
            if (err) {
                logger.error('武器皮肤购买 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function equip(data) {
    return new Promise(function (resolve, reject) {
        buzz_weapon.equip(data, function (err, result) {
            if (err) {
                logger.error('武器皮肤装备 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

// yDONE: 125-皮肤投票
async function vote(data) {
    return new Promise(function (resolve, reject) {
        buzz_weapon.vote(data, function (err, result) {
            if (err) {
                logger.error('皮肤支持率投票 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

// yDONE: 125-皮肤投票
async function querySkinVote(data) {
    return new Promise(function (resolve, reject) {
        buzz_weapon.querySkinVote(data, function (err, result) {
            if (err) {
                logger.error('查询投票排行榜 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}


