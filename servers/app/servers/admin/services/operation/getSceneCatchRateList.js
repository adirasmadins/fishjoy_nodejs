const _ = require('underscore');
const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;
const rpcSender = require('../../../../net/rpcSender');
const loadManagerCmd = require('../../../../cmd/loadManagerCmd');
const modules = require('../../../../modules');

/**
 * 获取场景捕获率(增加战斗服房间个数和玩家个数)
 * @param {*} data {uid:100} 
 */
exports.get = async function (data, ctx) {
    // console.log('data:', data);
    let ret = makeAccount(await fetchData());

    let realtimeStatus = await getFightStatus();

    _.extend(ret, realtimeStatus);

    return ret;
};

/**
 * 数据转换(Redis数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {Array} list 
 */
function makeAccount(list) {
    let ret = [];
    for (let key in list) {
        let nameKey = tools.CfgUtil.scene.getName(key);
        let name = tools.CfgUtil.string.get(nameKey, 'Unknown Scene');
        ret.push({
            name: name,
            key: key,
            value: list[key],
        });
    }
    return {
        sceneCatchRate: ret
    };
}

exports.getFightStatus = getFightStatus;

/**
 * 获取战斗服状态
 */
async function getFightStatus() {

    let fightRoomList = await rpcSender.invoke(rpcSender.serverType.loadManager, rpcSender.serverModule.loadManager.loadRemote,
        loadManagerCmd.remote.getGameLoad.route, {
            moduleId: modules.game.moduleId,
            serverType: rpcSender.serverType.game
        });

    logger.info('fightRoomList:\n', fightRoomList);

    let playerCount = 0;
    let roomCount = 0;
    if (fightRoomList)
    for (let i = 0; i < fightRoomList.length; i++) {
        let info = fightRoomList[i][1];
        playerCount += info.playerCount;
        roomCount += info.roomCount;
    }
    logger.info('战斗服玩家个数:', playerCount);
    logger.info('战斗服房间个数:', roomCount);

    /////
    let rankMatchRoomList = await rpcSender.invoke(rpcSender.serverType.loadManager, rpcSender.serverModule.loadManager.loadRemote,
        loadManagerCmd.remote.getGameLoad.route, {
            moduleId: modules.rankMatch.moduleId,
            serverType: rpcSender.serverType.rankMatch
        });

    logger.info('rankMatchRoomList:\n', rankMatchRoomList);

    let rankMatchPlayerCount = 0;
    let rankMatchRoomCount = 0;
    if (rankMatchRoomList)
    for (let i = 0; i < rankMatchRoomList.length; i++) {
        let info = rankMatchRoomList[i][1];
        rankMatchPlayerCount += info.playerCount;
        rankMatchRoomCount += info.roomCount;
    }
    logger.info('比赛服玩家个数:', rankMatchPlayerCount);
    logger.info('比赛服房间个数:', rankMatchRoomCount);

    return {
        playerCount: {
            name: '战斗玩家数',
            value: playerCount
        },
        roomCount: {
            name: '战斗房间数',
            value: roomCount
        },
        fightServerPlayerCount: {
            name: '战斗玩家数',
            value: playerCount
        },
        fightServerRoomCount: {
            name: '战斗房间数',
            value: roomCount
        },
        rankMatchPlayerCount: {
            name: '比赛玩家数',
            value: rankMatchPlayerCount
        },
        rankMatchRoomCount: {
            name: '比赛房间数',
            value: rankMatchRoomCount
        }
    };
}

// 获取战斗服状态gameLoad: {
//     "data": [
//       [
//         "game-1-1",
//         {
//           "playerCount": 0,
//           "roomCount": 0
//         }
//       ]
//     ]
//   }

/**
 * 获取场景捕获率.
 */
async function fetchData() {
    let sceneCatchRateList = await tools.RedisUtil.hgetall(REDISKEY.PLATFORM_DATA.SCENE_CATCHRATE) || {};
    logger.error('sceneCatchRateList:', sceneCatchRateList);
    let keys = _.keys(sceneCatchRateList);
    for (let key in SCENE_RATE_DEFAULT) {
        // 不存在就赋一个初始值
        if (!tools.ArrayUtil.contain(keys, key)) {
            sceneCatchRateList[key] = SCENE_RATE_DEFAULT[key];
        }
    }
    return sceneCatchRateList;
}

const SCENE_RATE_DEFAULT = {
    scene_mutiple_1: '1',
    scene_mutiple_2: '1',
    scene_mutiple_3: '1',
    scene_mutiple_4: '1',
    scene_goddess: '1'
};

// 初始化场景捕获率
// hset pair:scene:catchRate scene_mutiple_1 1
// hset pair:scene:catchRate scene_mutiple_2 1
// hset pair:scene:catchRate scene_mutiple_3 1
// hset pair:scene:catchRate scene_mutiple_4 1
// hset pair:scene:catchRate scene_goddess 1