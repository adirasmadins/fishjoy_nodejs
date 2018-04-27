var utils = require('../utils');
var DaoGold = require('../../dao/dao_gold');
var common_mathadjust_const_cfg = require('../../../../../utils/imports').DESIGN_CFG.common_mathadjust_const_cfg;

var ERROR = 1;
var DEBUG = 0;

var pump_water = 1;
var time_reset = new Date().getTime();
var time_special = new Date().getTime();
var weight_time1 = common_mathadjust_const_cfg.time1 * 1000;
var weight_time2 = common_mathadjust_const_cfg.time2 * 1000;
var weight_time3 = common_mathadjust_const_cfg.time3 * 1000;
var cur_extract = common_mathadjust_const_cfg.extract;

var TAG = "【pojo/Global】";


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.pumpWater = pumpWater;
exports.pumpBegin = pumpBegin;
exports.getDataWater = getDataWater;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
/**
 * 获取当前服务器的抽水值.
 */
function pumpWater() {
    return pump_water;
}

/**
 * 服务器进入抽水周期.
 */
function pumpBegin(pool, time1, time2, time3, x, addvalue, reducevalue) {
    const FUNC = TAG + "pumpBegin() --- ";
    // 开始后一周期后进行第一次抽水计算
    time_reset = new Date().getTime();
    setTimeout(function() {
        // _repeatMathWater(pool, time1, time2, time3, x, addvalue, reducevalue);
        _recursiveMathWater(pool, time1, time2, time3, x, addvalue, reducevalue);
    }, time1);
}

function getDataWater() {
    return {
        period: pump_water,
        cur_extract: cur_extract,
        time_reset: time_reset,
        time_special: time_special,
        weight_time1: weight_time1,
        weight_time2: weight_time2,
        weight_time3: weight_time3,
    };
}


//==============================================================================
// private
//==============================================================================
/**
 * 计算"玩家捕鱼总消耗/玩家捕鱼总收入"
 */
function _mathWater(pool, cb) {
    DaoGold.mathWater(pool, cb);
}

/**
 * @desperate
 * 定时计算抽水值...
 */
function _repeatMathWater(pool, time1, time2, time3, x, addvalue, reducevalue) {
    const FUNC = TAG + "_repeatMathWater() --- ";
    time_reset = new Date().getTime();
    setInterval(function() {
        _mathWater(pool, function(err, extract) {
            if (extract > x) {
                _countDown(FUNC, "进入出分周期", addvalue, time2);
            }
            else {
                _countDown(FUNC, "进入吃分周期", reducevalue, time3);
            }
        });
    }, time1);
}

/**
 * 递归计算抽水值...
 */
function _recursiveMathWater(pool, time1, time2, time3, x, addvalue, reducevalue) {
    const FUNC = TAG + "_recursiveMathWater() --- ";

    var random = utils.randomNum(1, 10);
    weight_time1 = time1 * random;
    weight_time2 = time2 * random;
    weight_time3 = time3 * random;

    if (DEBUG) {
        logger.info(FUNC + "random:", random);
        logger.info(FUNC + "weight_time1:", weight_time1);
        logger.info(FUNC + "weight_time2:", weight_time2);
        logger.info(FUNC + "weight_time3:", weight_time3);
    }
    
    _mathWater(pool, function(err, extract) {
        cur_extract = extract;
        if (extract > x) {
            _countDown(FUNC, "进入出分周期", addvalue, weight_time2);
        }
        else {
            _countDown(FUNC, "进入吃分周期", reducevalue, weight_time3);
        }
    });
    
    time_reset = new Date().getTime();
    setTimeout(function() {
        _recursiveMathWater(pool, time1, time2, time3, x, addvalue, reducevalue);
    }, weight_time1);
}

function _countDown(FUNC, hint, target_pump_water, timeout) {
    if (DEBUG) logger.info(FUNC + hint);
    pump_water = target_pump_water;

    time_special = new Date().getTime();
    setTimeout(function() {
        if (DEBUG) logger.info(FUNC + "进入普通周期");
        pump_water = 1;
    }, timeout);
}