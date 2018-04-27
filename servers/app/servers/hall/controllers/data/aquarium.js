//==============================================================================
// import
//==============================================================================
//------------------------------------------------------------------------------
// 工具(Tool)
//------------------------------------------------------------------------------
var buzz_cst_game = require('../../src/buzz/cst/buzz_cst_game');
//TODO LINYNG
// var buzz_cst_error = require('../../../../consts/fish_error');
var buzz_cst_error = require('../../../../consts/fish_error');
var data_util = require('./data_util');

// 水族馆逻辑
var buzz_aquarium = require('../../src/buzz/buzz_aquarium');
const logicResponse = require('../../../common/logicResponse');

var DEBUG = 0;
var ERROR = 1;

const TAG = "【data.aquarium】";

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.upgradePetfish = upgradePetfish;
exports.putPetfish = putPetfish;
exports.rewardPetfish = rewardPetfish;
exports.putGoddess = putGoddess;
exports.getAquarium = getAquarium;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
/**
 * 解锁或升级宠物鱼
 */
async function upgradePetfish(data) {
    return new Promise(function(resolve, reject){
        buzz_aquarium.upgradePetfish(data, function (err, account) {
            if(err){
                logger.error('解锁或升级宠物鱼 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(account));
        });
    });
}

/**
 * 放养宠物鱼
 */
async function putPetfish(data) {
    return new Promise(function(resolve, reject){
        buzz_aquarium.putPetfish(data, function (err, account) {
            if(err){
                logger.error('放养宠物鱼 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(account));
        });
    });
}

/**
 * 领取宠物鱼奖励
 */
async function rewardPetfish(data) {
    return new Promise(function(resolve, reject){
        buzz_aquarium.rewardPetfish(data, function (err, account) {
            if(err){
                logger.error('领取宠物鱼奖励 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(account));
        });
    });
}

/**
 * 放置女神
 */
async function putGoddess(data) {
    return new Promise(function(resolve, reject){
        buzz_aquarium.putGoddess(data, function (err, account) {
            if(err){
                logger.error('放置女神 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(account));
        });
    });
}

/**
 * 获取当前鱼缸和女神状态
 */
async function getAquarium(data) {
    return new Promise(function(resolve, reject){
        buzz_aquarium.getAquarium(data, function (err, aquarium) {
            if(err){
                logger.error('获取当前鱼缸和女神状态 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(aquarium));
        });
    });
}

//==============================================================================
// private
//==============================================================================

function _getDataObj(req, res) {
    const FUNC = TAG + "_getDataObj()---";

    var dataObj = {};
    if (!(dataObj = data_util.get_dao_data(req, res))) {
        return;
    }
    if (DEBUG) logger.info(FUNC + 'dataObj:\n', dataObj);
    return dataObj;
}

function _resultHandler(res, err, account, msg, aes) {
    const FUNC = TAG + "_resultHandler()---";

    if (err) {
        res.success({ type: 1, msg: msg + '失败', err: err });
    } else {
        if (DEBUG) logger.info(FUNC + 'account:\n', account);
        var res_data = buzz_cst_game.getResData(account, aes);
        if (DEBUG) logger.info(FUNC + 'res_data:\n', res_data);
        res.success({ type: 1, msg: msg + '成功', data: res_data, aes: aes });
    }
}