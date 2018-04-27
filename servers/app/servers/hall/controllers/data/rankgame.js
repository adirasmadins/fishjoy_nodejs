const buzz_rankgame = require('../../src/buzz/buzz_rankgame');
const buzz_charts = require('../../src/buzz/buzz_charts');
const logicResponse = require('../../../common/logicResponse');
const globalStatusData = require('../../../../utils/globalStatusData');
const constDef = require('../../../../consts/constDef');
const rpcDefs = require('../../../../net/rpcDefs');
const moment = require('moment');

exports.result = result;
exports.info = info;
exports.box = box;
exports.get_ranking = get_ranking;
exports.ongoing = ongoing;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 获取排位赛结算数据.
 */
async function result(data) {
    return new Promise(function (resolve, reject) {
        buzz_rankgame.result(data, function (err, results) {
            if (err) {
                logger.error('排位赛数据获取失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(results));
        });
    });
}

/**
 * 获取排位赛结算数据.
 */
async function info(data) {
    return new Promise(function (resolve, reject) {
        buzz_rankgame.info(data, function (err, results) {
            if (err) {
                logger.error('排位赛信息获取失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(results));
        });
    });
}

/**
 * 排位赛宝箱操作相关.
 */
async function box(data) {
    return new Promise(function (resolve, reject) {
        buzz_rankgame.box(data, function (err, results) {
            if (err) {
                logger.error('排位赛宝箱操作失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(results));
        });
    });
}

/**
 * 获取排行榜结算数据.
 */
async function get_ranking(data) {
    return new Promise(function (resolve, reject) {
        buzz_charts.getCharts(data, function (err, results) {
            if (err) {
                logger.error('获取排行榜失败 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(results));
        });
    });
}

/**
 * 获取是否有正在进行中的比赛.
 */
async function ongoing(data) {
    let result = {
        status:false
    }
    let rankMatchPos = await globalStatusData.queryData(constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_RANKMATCH_POS, rpcDefs.serverType.rankMatch, data.uid);
    if (rankMatchPos) {
        if(Date.now() - Number(rankMatchPos.time) < constDef.MATCH.MSECONDS){
            result.status = true;
        }else {
            await globalStatusData.delData(constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_RANKMATCH_POS, data.uid, rankMatchPos.serverId);
        }

    }
    return logicResponse.ask(result);
}
