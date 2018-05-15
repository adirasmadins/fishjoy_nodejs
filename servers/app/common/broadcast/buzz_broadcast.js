// vi /opt/fishjoy/servers/app/common/broadcast/buzz_broadcast.js
const FamousOnlineBroadcast = require('./FamousOnlineBroadcast');
const redisAccountSync = require('../../utils/redisAccountSync');
const cache = require('../../servers/hall/src/rankCache/cache');
const RANK_TYPE = require('../../servers/hall/src/rankCache/cacheConf').RANK_TYPE;
const REDISKEY = require('../../database').dbConsts.REDISKEY;
const TimeQueue = require('./TimeQueue');
const tools = require('../../utils/tools');

const PLATFORM = {
    ANDROID: 1,
    IOS: 2,
};

const FAMOUS_ONLINE_CHARTS_TYPE = [
    'CHARM',// 万人迷上线公告
    'MATCH',// 排位赛第一名上线公告
    'GODDESS',// 新增保卫女神第一名上线公告
    'AQUARIUM',// 新增水族馆第一名上线公告
];

let broadcast_server = null;//{timestamp: _timestamp(), content: {txt: 'Welcome!', times: 1}};
let broadcast_cfgsupdate = null;//{timestamp: _timestamp(), content: {txt: 'Welcome!', times: 1}};
// android和ios分离
let broadcast_gameevent_android = new TimeQueue(5000, 60000, 10, 500);
let broadcast_famousonline_android = new TimeQueue(5000, 60000, 3, 10);
let broadcast_draw_android = new TimeQueue(5000, 100000000, 20, 100);
let broadcast_rewardpeople_android = new TimeQueue(5000, 6000, 1, 100);
let broadcast_gameevent_ios = new TimeQueue(5000, 60000, 10, 500);
let broadcast_famousonline_ios = new TimeQueue(5000, 60000, 3, 10);
let broadcast_draw_ios = new TimeQueue(5000, 100000000, 20, 100);
let broadcast_rewardpeople_ios = new TimeQueue(5000, 6000, 1, 100);

/**
 * 排行榜第一名上线公告.
 * @param {*} account 用户信息
 */
exports.addFamousOnlineBroadcast = (account) => {
    let uid = account.uid;
    let nickname = account.channel_account_name;
    if (!nickname) nickname = account.nickname;
    if (!nickname) nickname = account.tempname;
    let vip = account.vip;
    let charm = account.charm_rank && parseInt(account.charm_rank) || 0;
    for (let i in FAMOUS_ONLINE_CHARTS_TYPE) {
        let type = FAMOUS_ONLINE_CHARTS_TYPE[i];
        let chartList = cache.getChart(account.platform, RANK_TYPE[type], 0, 1);
        if (chartList && chartList.length > 0 && uid == chartList[0].uid) {
            let content = {
                type: FamousOnlineBroadcast.TYPE.FAMOUS_ONLINE[type],
                params: [nickname, vip, charm],
            };
            new FamousOnlineBroadcast(content).extra(account).add();
        }
    }
};

exports.getBroadcast = (dataObj, cb) => {
    let lServer = _getBroadcastServer(dataObj.server);
    let lGameEvent = _getBroadcastGameEvent(dataObj.gameevent, dataObj.platform);
    let lFamousOnline = _getBroadcastFamousOnline(dataObj.famousonline, dataObj.platform);
    let lDraw = _getBroadcastDraw(dataObj.draw, dataObj.platform);
    let lRewardPeople = _getBroadcastRewardPeople(dataObj.rewardpeople, dataObj.platform);

    let token = dataObj.token;
    let cik_on = 0;
    if (token != null) {
        let uid = token.split('_')[0];
        redisAccountSync.getAccount(uid, async function (err, account) {
            let res = await tools.RedisUtil.get(REDISKEY.SWITCH.CIK);
            if (null == res) {
                res = 1;
            }
            let switch_cik = parseInt(res);
            if (account != null) {
                let account_cik_on = account.cik_on;
                cik_on = switch_cik && account_cik_on;

                if (tools.BuzzUtil.isCheat(account)) {
                    cik_on = 0;
                }

                cb && cb(null, {
                    server: lServer,
                    gameevent: lGameEvent,
                    famousonline: lFamousOnline,
                    draw: lDraw,
                    cik_on: cik_on,
                    rewardpeople: lRewardPeople
                });
            }
        });
    }
};

exports.redisNotifyBroadcast = (channel, message) => {
    switch (channel) {
        case REDISKEY.CH.BROADCAST_SERVER:
        {
            broadcast_server = message;
            break;
        }
        case REDISKEY.CH.BROADCAST_CFGS_UPDATE: 
        {
            broadcast_cfgsupdate = message;
            break;
        }
        case REDISKEY.CH.BROADCAST_GAME_EVENT:
        case REDISKEY.CH.BROADCAST_FAMOUS_ONLINE:
        case REDISKEY.CH.BROADCAST_DRAW:
        case REDISKEY.CH.BROADCAST_REWARD_PEOPLE:
        {
            let platform = message.content.platform;
            let broadcastQueue = getBroadcastQueue(channel, platform);
            broadcastQueue && broadcastQueue.push(message);
            if (!broadcastQueue) {
                logger.error("channel:", channel);
                logger.error("platform:", platform);
            }
            break;
        }
    }
};

function getBroadcastQueue(channel, platform) {
    if (REDISKEY.CH.BROADCAST_GAME_EVENT == channel)
        switch (platform) {
            case PLATFORM.IOS:
                return broadcast_gameevent_ios;
            default:
                return broadcast_gameevent_android;
        }

    if (REDISKEY.CH.BROADCAST_FAMOUS_ONLINE == channel)
        switch (platform) {
            case PLATFORM.IOS:
                return broadcast_famousonline_ios;
            default:
                return broadcast_famousonline_android;
        }

    if (REDISKEY.CH.BROADCAST_DRAW == channel)
        switch (platform) {
            case PLATFORM.IOS:
                return broadcast_draw_ios;
            default:
                return broadcast_draw_android;
        }

    if (REDISKEY.CH.BROADCAST_REWARD_PEOPLE == channel)
        switch (platform) {
            case PLATFORM.IOS:
                return broadcast_rewardpeople_ios;
            default:
                return broadcast_rewardpeople_android;
        }
}

// DONE: 只取客户端时间戳之后的数据
function _getBroadcastServer(timestamp) {
    if (!broadcast_server) {
        return null;
    }
    if (!timestamp || timestamp < broadcast_server.timestamp) {
        return broadcast_server;
    }
    return null;
}

function _getBroadcastGameEvent(timestamp, platform) {
    switch (platform) {
        case PLATFORM.IOS:
            return broadcast_gameevent_ios.getRecent(timestamp);
        default:
            return broadcast_gameevent_android.getRecent(timestamp);
    }
}

function _getBroadcastFamousOnline(timestamp, platform) {
    switch (platform) {
        case PLATFORM.IOS:
            return broadcast_famousonline_ios.getRecent(timestamp);
        default:
            return broadcast_famousonline_android.getRecent(timestamp);
    }
}

function _getBroadcastDraw(timestamp, platform) {
    switch (platform) {
        case PLATFORM.IOS:
            return broadcast_draw_ios.getRecent(timestamp);
        default:
            return broadcast_draw_android.getRecent(timestamp);
    }
}

function _getBroadcastRewardPeople(timestamp, platform) {
    switch (platform) {
        case PLATFORM.IOS:
            return broadcast_rewardpeople_ios.getRecent(timestamp);
        default:
            return broadcast_rewardpeople_android.getRecent(timestamp);
    }
}