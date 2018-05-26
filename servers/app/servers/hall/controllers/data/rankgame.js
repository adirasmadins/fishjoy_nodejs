const buzz_rankgame = require('../../src/buzz/buzz_rankgame');
const buzz_charts = require('../../src/buzz/buzz_charts');
const logicResponse = require('../../../common/logicResponse');
const globalStatusData = require('../../../../utils/globalStatusData');
const redisArenaSync = require('../../../../utils/redisArenaSync');
const ACCOUNTKEY = require('../../../../models').ACCOUNTKEY;
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const redisAccountSync = require('../../../../utils/redisAccountSync');
const constDef = require('../../../../consts/constDef');
const rpcDefs = require('../../../../net/rpcDefs');

exports.result = result;
exports.info = info;
exports.box = box;
exports.get_ranking = get_ranking;
exports.ongoing = ongoing;
exports.getPlayerMatch1v1Status = _getPlayerMatch1v1Status;
exports.acceptMatch1v1 = _acceptMatch1v1;
exports.queryMatch1v1Result = _queryMatch1v1Result;

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
        status: false
    };
    let rankMatchPos = await globalStatusData.queryData(constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_RANKMATCH_POS, rpcDefs.serverType.rankMatch, data.uid);
    if (rankMatchPos) {
        if (Date.now() - Number(rankMatchPos.time) < constDef.MATCH.MSECONDS) {
            result.status = true;
        } else {
            await globalStatusData.delData(constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_RANKMATCH_POS, data.uid, rankMatchPos.serverId);
        }

    }
    return logicResponse.ask(result);
}


/**
 * 查询玩家参加的1v1比赛状态信息、礼盒进度、星级
 * @param {*} data
 */
async function _getPlayerMatch1v1Status(data) {
    let account = data.account;
    let matchId = account.arena_matchid;
    let result = {
        state: 1, //1:完成, 2:继续对战, 3:邀请好友对战,4:好友挑战中
        arena_star: account.arena_star, //星星数123，每天重置0
        arena_box_state: account.arena_box_state, //初始0，-1已领取，1对战礼盒开启一次 2对战礼盒开启2次 3对战礼盒开启3次， 重置0
    };

    if (matchId) {
        try {
            let arena = await redisArenaSync.getArena(matchId);
            result.matchId = matchId;
            if (arena.arena_inviter.uid == data.uid) {
                if (arena.arena_inviter.state != constDef.ARENA_MATCH_STATE.FINISHED) {
                    result.state = 2;
                } else if (arena.arena_state == constDef.ARENA_MATCH_STATE.GOING) {
                    if(arena.arena_invitee.state == constDef.ARENA_MATCH_STATE.CREATED){
                        result.state = 3;
                    }else{
                        result.state = 4;
                    }
                    result.score = arena.arena_inviter.score; //本场对战获得分数
                }
            } else if (arena.arena_invitee.uid == data.uid && arena.arena_inviter.state != constDef.ARENA_MATCH_STATE.FINISHED) {
                result.state = 2;
            }

            if(arena.arena_state == constDef.ARENA_MATCH_STATE.FINISHED){
                account.arena_matchid = '';
                account.commit();
            }
        } catch (err) {
            account.arena_matchid = '';
            account.commit();
            logger.error('error _getMatch1v1Status = ', err);
        }
    }
    logger.error('_getPlayerMatch1v1Status result = ', result);
    return logicResponse.ask(result);
}

/**
 * 查询别人创建的比赛状态，即接受别人邀请的比赛状态
 * @param {*} data 
 */
async function _acceptMatch1v1(data) {
    if (data.matchId == null) {
        throw ERROR_OBJ.PARAM_MISSING;
    }
    let result = {
        state: 1, //1:完成, 2:发起对战, 3:对战已被挑战,4：挑战未完成，不能接受新的挑战
    };

    let account = data.account;
    let self_matchId = account.arena_matchid;
    if(self_matchId){
        let self_arena = null;
        try {
            self_arena = await redisArenaSync.getArena(self_matchId);
            if (self_arena.arena_inviter.uid == data.uid && self_arena.arena_inviter.state != constDef.ARENA_MATCH_STATE.FINISHED) {
                result.state = 4;
            } else if (self_arena.arena_invitee.uid == data.uid && self_arena.arena_invitee.state != constDef.ARENA_MATCH_STATE.FINISHED) {
                result.state = 4;
            }
        } catch (err) {
            account.arena_matchid = '';
            account.commit();
        }
    }

    if(result.state != 1){
        return logicResponse.ask(result);
    }

    let matchId = data.matchId;
    if (!await redisArenaSync.arenaMatchLocker(matchId)) {
        throw ERROR_OBJ.ARENA_MATCHID_BUSY;
    }

    let arena = null;
    try {
        arena = await redisArenaSync.getArena(matchId);
    } catch (err) {
        logger.error('获取对战信息失败 _acceptMatch1v1 err=', err);
        throw err;
    }

    if (arena.arena_inviter.uid == data.uid) {
        throw ERROR_OBJ.ARENA_MATCH_SELF;
    } else if (arena.arena_invitee.uid == data.uid && arena.arena_invitee.state != constDef.ARENA_MATCH_STATE.FINISHED) {
        result.state = 2;
    } else if (arena.arena_invitee.uid == -1) {
        result.state = 2;
        account.arena_matchid = matchId;
        account.commit();
        // arena.arena_invitee.uid = data.uid;
        // arena.arena_invitee = arena.arena_invitee;
        // await arena.commit();

    } else {
        result.state = 3;
    }

    await redisArenaSync.arenaMatchLocker(matchId, false);
    return logicResponse.ask(result);
}

async function _queryMatch1v1Result(data) {
    let account = data.account;
    let arena_matchid_list = account.arena_matchid_list;
    if(!arena_matchid_list || arena_matchid_list.length == 0){
        return logicResponse.ask([]);
    }

    for(let i=0; i< arena_matchid_list.length; i++){
        let matchId = arena_matchid_list[i];
        try{
            //let arena = await redisArenaSync.getArena(matchId);
        }catch (err){
            continue;
        }
    }
}