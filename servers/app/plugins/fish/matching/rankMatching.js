const omelo = require('omelo');
const config = require('../config');
const MatchingUser = require('./matchingUser');
const MatchingRobotUser = require('./matchingRobotUser');
const messageService = require('../../../net/messageService');
const matchingCmd = require('../../../cmd/matchingCmd');
const rankMatchCmd = require('../../../cmd/rankMatchCmd');
const robotBuilder = require('../robot/robotBuilder');
const AiData = require('./AiData');
const fishCode = CONSTS.SYS_CODE;
const omeloNickname = require('omelo-nickname');
const consts = require('../consts');
const versionsUtil = require('../../../utils/imports').versionsUtil;
const rpcSender = require('../../../net/rpcSender');
const loadManagerCmd = require('../../../cmd/loadManagerCmd');
const modules = require('../../../modules');
const designCfgUtils = require('../../../utils/designCfg/designCfgUtils');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;

class RankMatching {
    constructor() {
        this._users = new Map();
        this._canRun = true;

        if (versionsUtil.getVerKey().search('vietnam') >= 0) {
            omeloNickname.setLan(omeloNickname.lan.vietnam);
        }
    }

    runTask() {
        if (!this._canRun) return;
        setTimeout(function () {
            this._mate();
            this.runTask();
        }.bind(this), config.MATCH.MATE_INTERVAL);
    }

    start() {
        this.runTask();
        AiData.start();
    }

    stop() {
        this._canRun = false;
    }

    request(route, msg, session, cb) {
        if (!this[route]) {
            utils.invokeCallback(cb, fishCode.INTERFACE_DEVELOPPING);
            return;
        }
        this[route](msg, session, cb);
    }

    remoteRpc(method, data, cb) {
        if (!this[method]) {
            cb(fishCode.INTERFACE_DEVELOPPING);
            return;
        }
        this[method](data, function (err, result) {
            utils.invokeCallback(cb, err, result);
        });
    }

    rpc_cancle_sigup(data, cb) {
        this._users.delete(data.uid);
        cb();
        logger.info('剔除报名--', data.uid);
    }

    //排位赛玩家报名
    async c_signup(msg, session, cb) {
        try {
            session.set('matching', true);
            session.push('matching');
            msg.sid = session.frontendId;
            let user = await MatchingUser.allocUser(msg);
            let rmMinLevel = designCfgUtils.getCfgValue('common_const_cfg', 'RMATCH_OPEN_LIMIT');
            let curMaxWpLv = omelo.app.entry.instance.gamePlay.cost.getWpLevelMax(user.account.weapon_energy);
            logger.error('有人报名--curMaxWpLv = ', curMaxWpLv);
            if (curMaxWpLv < rmMinLevel || user.account.weapon < rmMinLevel) {
                utils.invokeCallback(cb, ERROR_OBJ.RM_WEAPON_LEVEL_LIMIT);
                this.c_cancel(msg, session, cb);
                logger.error('服务器排位赛最细要求，取消报名,提醒玩家切换到至少100倍 msg.uid = ', msg.uid);
                return;
            }
            
            this._users.set(msg.uid, user);
            let waitMs = user.getMaxWaitMSeconds();
            utils.invokeCallback(cb, null, {
                waitMs: waitMs,
            });
        } catch (err) {
            logger.error('err:', err);
            cb(err);
        }
    }

    //取消报名
    c_cancel(msg, session, cb) {
        session.set('matching', false);
        session.push('matching');
        this._users.delete(msg.uid);
        cb();
        logger.error('取消报名--', msg.uid);
    }

    _searchEnemy(user, levels) {
        let mate_enemy = null;
        for (let i = 0; i < levels.length; i++) {
            if (!levels[i]) continue;
            let enemy = levels[i][1];
            if (user.canMatch(enemy.sword)) {
                if (enemy.canMatch(user.sword)) {
                    mate_enemy = enemy;
                    levels[i] = null;
                    break;
                }

            } else {
                break;
            }
        }
        return mate_enemy;
    }

    //分配机器人
    async _allocRobotEnemy(user) {
        let baseInfo = omeloNickname.gen_random();
        let weapon_skin = robotBuilder._genOwnWeaponSkin();
        // yxlDONE:计算机器人的段位
        let match_rank = robotBuilder._calcRank(user.account.match_rank);
        let ior = AiData.getIOR(match_rank);
        let vip = robotBuilder._calcVip(user.account.vip);
        let charmPoint = robotBuilder.calcCharmPoint(user.account.charm_point);
        let robotInfo = {
            baseInfo: baseInfo,
            weapon_skin: weapon_skin,
            match_rank: match_rank,
            ior: ior,
            vip: vip,
            charm_point: charmPoint,
        };

        let robot = MatchingRobotUser.allocUser(user, robotInfo);
        return robot;
    }

    /**
     * 匹配玩家、段位、武器等级、VIP等
     */
    async _mate() {
        const FUNC = "\n_mate() --- ";
        let levels = [...this._users];
        levels.sort(function (userA, userB) {
            if (userA.sword != userB.sword) {
                return userA.sword < userB.sword;
            } else {
                return userA.sigupTime > userB.sigupTime;
            }
        });

        for (let i = 0; i < levels.length; i++) {
            if (!levels[i]) continue;

            let user = levels[i][1];
            levels[i] = null;

            let enemy = this._searchEnemy(user, levels);
            if (!enemy) {
                if (user.isMatchingRobotNow()) {
                    enemy = await this._allocRobotEnemy(user);
                }
            }

            if (enemy) {
                let uids = this._getUids([user, enemy]);
                try {
                    let serverId = await this._allocMatchServer();
                    let matchInfo = await this._joinMatchRoom(serverId, {
                        users: [user.account, enemy.account],
                        serverId: serverId
                    });
                    let mateResult = {
                        rankMatch: {
                            serverId: serverId,
                            roomId: matchInfo.roomId,
                        },
                        players: [user.getMatchingInfo(), enemy.getMatchingInfo()],
                    };
                    logger.debug(FUNC + 'mateResult:\n', mateResult);

                    logger.error('----------sigup data=', mateResult, uids);
                    this._responseMateResult(null, mateResult, uids);
                    this._remQueue(uids);
                } catch (err) {
                    logger.error('排位赛加入异常', err);
                    this._responseMateResult(err, null, uids);
                    this._remQueue(uids);
                }
            }
        }
    }

    _remQueue(uids) {
        uids.forEach(function (item) {
            this._users.delete(item.uid);
        }.bind(this));
    }

    _getUids(users) {
        let uids = [];
        users.forEach(user => {
            if (user.account.kindId == consts.ENTITY_TYPE.PLAYER) {
                uids.push({
                    uid: user.account.uid,
                    sid: user.account.sid
                });
            }
        });
        return uids;
    }

    async _allocMatchServer() {
        let serverInfo = await rpcSender.invoke(rpcSender.serverType.loadManager, rpcSender.serverModule.loadManager.loadRemote,
            loadManagerCmd.remote.allock_server.route, {
                moduleId: modules.rankMatch.moduleId,
                serverType: rpcSender.serverType.rankMatch
            });
        return serverInfo.id;
    }

    //加入比赛房间
    async _joinMatchRoom(serverId, data) {
        return await rpcSender.invoke(rpcSender.serverType.rankMatch, rpcSender.serverModule.rankMatch.rankMatchRemote,
            rankMatchCmd.remote.join.route, data, serverId);
    }

    //回应匹配结果
    _responseMateResult(err, info, uids) {
        let data = {};
        if (err) {
            data.err = err;
        } else {
            data.matchingInfo = info;
        }
        messageService.broadcast(matchingCmd.push.matchingResult.route, data, uids);
    }
}

module.exports = RankMatching;