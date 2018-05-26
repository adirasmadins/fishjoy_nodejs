const moment = require('moment');
const rankMatchCmd = require('../../../cmd/rankMatchCmd');
const consts = require('../consts');
const config = require('../config');
const fishCode = CONSTS.SYS_CODE;
const RankMatchRobotPlayer = require('./rankMatchRobotPlayer');
const omelo = require('omelo');
const rpcSender = require('../../../net/rpcSender');
const fishCmd = require('../../../cmd/fishCmd');
const redisKey = require('../../../database').dbConsts.REDISKEY;
const Room = require('../entity/room');
const constDef = require('../../../consts/constDef');
let calculateMatchRank = require('./calculateMatchRank');

class RankMatchRoom extends Room {
    constructor(opts) {
        opts.gamePosType = constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_RANKMATCH_POS;
        super(opts);
        this._playerMap = new Map();
        this._countdown = config.MATCH.MSECONDS;
        this._state = consts.MATCH_ROOM_STATE.WAIT;
        this._lastUpdateTime = Date.now();
        this._robot = null;
        this._serverId = omelo.app.getServerId();
        this._runSettlementDt = 10 * 1000; //结算超时时间,毫秒
        this._runSettlement = false;
    }

    get countdown() {
        return this._countdown;
    }

    get state() {
        return this._state;
    }

    init(users, playerFactory) {
        super.start();
        let cp = 0;
        let maxCharmUid = -1;
        users.forEach(async function (user) {
            if (user.charm_point > cp) {
                maxCharmUid = user.uid;
                cp = user.charm_point;
                logger.error('cp = ', cp, ' maxCharmUid = ', maxCharmUid)
            }
        });
        let i = 0;
        users.forEach(async function (user) {
            let uid = user.uid;
            let player = null;
            if (user.kindId === consts.ENTITY_TYPE.ROBOT) {
                player = this._genRobot(user);
            } else {
                let sid = user.sid;
                player = await playerFactory.createPlayer({
                    uid: uid,
                    sid: sid,
                    roomType: consts.ROOM_TYPE.RANK_MATCH
                }, consts.PLAYER_TYPE.RANK_MATCH);
                this.addMsgChannel(uid, sid);
                this.addGamePos(uid, this._serverId, {serverId: this._serverId, roomId: this.roomId, roomType:this.roomType, time:Date.now()});
            }
            player.setProvocativeEnabled(maxCharmUid == uid);
            this._playerMap.set(uid, player);
            i++;
            if (i === 2) {
                this._startMatch({
                    serverId: this._serverId,
                    roomId: this.roomId,
                });
            }
        }.bind(this));
    }

    _unInit() {
        for (let player of this._playerMap.values()) {
            this.leaveMsgChannel(player.uid, player.sid);
            this.delGamePos(player.uid, this._serverId);
        }
        this._playerMap.clear();
        super.stop();
    }

    /**
     * 创建一个排位赛机器人
     * 机器人默认准备就绪
     * @param {*} user
     */
    _genRobot(user) {
        const OPT = consts.RMATCH_ROBOT_OPT;
        let player = new RankMatchRobotPlayer({
            ior: user.ior,
            uid: user.uid,
            account: user,
            kindId: consts.ENTITY_TYPE.ROBOT,
        });
        this._robot = player;
        this._robot.registerUpdateFunc(async function (type, data) {
            switch(type) {
                case OPT.WEAPON_CHANGE:
                    this.weaponChange(data);
                break;

                case OPT.FIGHTING:
                    this.setFightInfo(data);
                break;

                case OPT.USE_NBOMB:
                    await this.useNbomb(data);
                break;

                case OPT.CANCEL_NBOMB:
                    await this.cancelNbomb(data);
                break;

                case OPT.RANDOM_CHAT:
                    this.rmatchChat(data);
                break;

                case OPT.PROVOCATIVE:
                    this.provocative(data);
                break;

                default:
                break;
            }
        }.bind(this));

        return player;
    }

    _flushCountdown() {
        let subTime = Date.now() - this._lastUpdateTime;
        return subTime;
    }

    //机器人开火
    _robot_fire(dt) {
        this._robot && this._robot.fire(dt);
    }

    async update(dt) {
        if (this._state != consts.MATCH_ROOM_STATE.DOING) {
            return;
        }
        //更新倒计时        
        let subTime = this._flushCountdown();
        if (subTime >= 1000) {
            this._countdown -= 1000;
            this._countdown = Math.max(this._countdown, 0);
            this._sendCountdown();
        }
        this._robot_fire(dt);
        await this._try2Settlement();

        //比赛结算超时强制结算
        if (this._runSettlement) {
            this._runSettlementDt -= dt;
            if (this._runSettlementDt <= 0) {
                this.roomBroadcast(rankMatchCmd.push.pkResult.route, {settlementTimeout: 1});
                this._matchFinish();
                logger.error('结算超时');
            }
        } 
    }

    isGameOver() {
        return this._state === consts.MATCH_ROOM_STATE.OVER;
    }

    getRamtchInfo() {
        let players = [];
        for (let player of this._playerMap.values()) {
            players.push(player.getCurrentMatchInfo());
        }
        return {
            players: players,
            countdown: this._countdown,
        };
    }

    weaponChange(data) {
        let player = this._playerMap.get(data.uid);
        if (!player) {
            return fishCode.MATCH_ROOM_NOPLAYER;
        }
        this.roomBroadcast(rankMatchCmd.push.weaponChange.route, data);
    }

    setFightInfo(data) {
        let player = this._playerMap.get(data.uid);
        if (!player) {
            return fishCode.MATCH_ROOM_NOPLAYER;
        }
        player.setFightInfo(data);
        if (player.statistics.provocativeVal > 0) {
            data.score = data.score - player.statistics.provocativeVal;
        }
        this.roomBroadcast(rankMatchCmd.push.fightInfo.route, data);
    }

    async useNbomb(data) {
        let player = this._playerMap.get(data.uid);
        if (!player) {
            return fishCode.MATCH_ROOM_NOPLAYER;
        }
        player.useNbomb(data);
        this.roomBroadcast(rankMatchCmd.push.useNbomb.route, data);
        await this._try2Settlement();
    }

    async cancelNbomb(data) {
        let player = this._playerMap.get(data.uid);
        if (!player) {
            return fishCode.MATCH_ROOM_NOPLAYER;
        }
        player.cancelNbomb(data);
        this.roomBroadcast(rankMatchCmd.push.cancelNbomb.route, data);
        await this._try2Settlement();
    }

    rmatchChat(data) {
        let player = this._playerMap.get(data.uid);
        if (!player) {
            return fishCode.MATCH_ROOM_NOPLAYER;
        }
        this.roomBroadcast(rankMatchCmd.push.rmatchChat.route, data);
    }

    provocative(data) {
        let player = this._playerMap.get(data.uid);
        if (!player) {
            return fishCode.MATCH_ROOM_NOPLAYER;
        }
        //找出对方的当前的分数,校验是否可以魅惑对手
        let hisScore = 0;
        let he = null;
        for (let p of this._playerMap.values()) {
            if (p.uid != player.uid) {
                hisScore = p.statistics.score;
                he = p;
                break;
            }
        }
        if (player.provocative(hisScore)) {
            he.beProvocatived(data.provocativeVal)
        }else{
            data.provocativeVal = 0;
        }
        this.roomBroadcast(rankMatchCmd.push.provocative.route, data);
    }

    /**
     * 尝试结算
     * 时间到或双方都已开炮完毕则可以结算，反之不可结算
     */
    async _try2Settlement() {
        if (this._canOVer()) {
            try{
                await this._settlement();
            }catch (err){
                logger.error('排位赛结算异常, err=', err);
                this._unInit();
            }
        }
    }

    _canOVer() {
        if (this._countdown === 0) {
            return true;
        }
        for (let player of this._playerMap.values()) {
            if (!player.isOver()) {
                return false;
            }
        }
        return true;
    }

    //战斗结算
    async _settlement() {
        // 已经执行过_settlement()就不要再次执行了
        if (this._runSettlement) {
            return;
        }
        this._runSettlement = true;
        const FUNC = '\n_settlement() --- ';
        let players = [...this._playerMap];
        let p1 = players[0][1];
        let p2 = players[1][1];
        await p1.updateAccount();
        await p2.updateAccount();
        let p1_points = await p1.setResult(p2);
        let p2_points = await p2.setResult(p1);
        let match_rank_data = await calculateMatchRank.calculateAll(p1, p1_points, p2, p2_points);
        p1.afterSetResult(match_rank_data.p1_data);
        p2.afterSetResult(match_rank_data.p2_data);

        let data = {
            time: moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss'),
        };
        let playerIdx = 1;

        for (let player of this._playerMap.values()) {
            let matchDetail = player.getRMatchDetail();
            let recordUid = matchDetail.uid;
            data['player' + playerIdx] = matchDetail.uid;
            data['nickname' + playerIdx] = matchDetail.nickname;
            data['winning_rate' + playerIdx] = matchDetail.winning_rate;
            data['wait_time' + playerIdx] = 10; // TODO
            data['rank' + playerIdx] = matchDetail.rank;
            data['firetime' + playerIdx] = new Date().getTime(); // TODO: 开火结束时间
            data['fish_account' + playerIdx] = matchDetail.fish_account;
            data['figureurl' + playerIdx] = matchDetail.figure_url;
            let bulletScore = 0;
            for (let fishname in matchDetail.fish_account) {
                let fish = matchDetail.fish_account[fishname];
                bulletScore += fish.point;
            }
            data['bullet_score' + playerIdx] = bulletScore;
            data['used_bullet' + playerIdx] = 100; // TODO
            data['nuclear_score' + playerIdx] = matchDetail.nuclear_score;
            data['nuclear_exploded' + playerIdx] = matchDetail.nuclear_score != -1;
            data['nuclear_fish_count' + playerIdx] = matchDetail.nuclear_fish_count;

            data['score' + playerIdx] = data['bullet_score' + playerIdx] + data['nuclear_score' + playerIdx] + (matchDetail.star ? matchDetail.star.score : 0);
            data['star' + playerIdx] = matchDetail.star;
            data['vip' + playerIdx] = matchDetail.vip;
            data['provocativeVal' + playerIdx] = matchDetail.provocativeVal;
            playerIdx++;
        }

        data.result = {
            player1: {
                nickname: data.nickname1,
                winning_rate: data.winning_rate1,
                uid: data.player1,
                rank: data.rank1,
                score: data.score1,
                bullet: data.used_bullet1,
                nuclear_exploded: data.nuclear_exploded1,
                nuclear_canceled: !data.nuclear_exploded1,
                firetime: data.firetime1,
                bullet_score: data.bullet_score1,
                nuclear_score: data.nuclear_score1,
                fish_account: data.fish_account1,
                figure_url: data.figureurl1,
                nuclear_fish_count: data.nuclear_fish_count1,
                star: data.star1,
                vip: data.vip1,
                provocativeVal: data.provocativeVal1
            },
            player2: {
                nickname: data.nickname2,
                winning_rate: data.winning_rate2,
                uid: data.player2,
                rank: data.rank2,
                score: data.score2,
                bullet: data.used_bullet2,
                nuclear_exploded: data.nuclear_exploded2,
                nuclear_canceled: !data.nuclear_exploded2,
                firetime: data.firetime2,
                bullet_score: data.bullet_score2,
                nuclear_score: data.nuclear_score2,
                fish_account: data.fish_account2,
                figure_url: data.figureurl2,
                nuclear_fish_count: data.nuclear_fish_count2,
                star: data.star2,
                vip: data.vip2,
                provocativeVal: data.provocativeVal2
            },
            winner: data.score1 > data.score2 ? 1 : 2,
        };

        //统计排位赛胜利dfc
        for (let player of this._playerMap.values()) {
            let pd = player.getPrivateDetail();
            let uid = Number(pd.uid);
            if (uid > 0) {
                if (data.player1 == uid) {
                    data.result.player1.point_change = pd.point_change;
                    data.result.player1.rank_change = pd.rank_change;
                }
                if (data.player2 == uid) {
                    data.result.player2.point_change = pd.point_change;
                    data.result.player2.rank_change = pd.rank_change;
                }
            }

            player.clear();
        }
        this.roomBroadcast(rankMatchCmd.push.pkResult.route, {});

        // yxlTODO: 将玩家信息写入数据库
        this._addRankgameLog([data], 1, function (err, rows) {
            if (err) {
                this._matchFinish();
                logger.error('---db error = ', err);
                return;
            }
            if (!rows) {
                this._matchFinish();
                logger.error(FUNC + 'rows == null');
            } else {
                let rankgame_log_id = rows.insertId;
                let uid1 = data.result.player1.uid;
                let uid2 = data.result.player2.uid;
                this._setMatchUnfinish(uid1, rankgame_log_id, function () {
                    logger.debug(FUNC + `uid1${uid1}的match_unfinish字段已经设置为${rankgame_log_id}`);
                    this._setMatchUnfinish(uid2, rankgame_log_id, function () {
                        logger.debug(FUNC + `uid2${uid2}的match_unfinish字段已经设置为${rankgame_log_id}`);
                        this._matchFinish();
                    }.bind(this));
                }.bind(this));
            }
        }.bind(this));
    }

    _setMatchUnfinish(uid, rankgame_log_id, cb) {
        // 机器人无需设置此字段
        if (uid > 0) {
            redisConnector.cmd.hset(redisKey.MATCH_UNFINISH, uid, rankgame_log_id, cb);
        } else {
            cb();
        }
    }

    _addRankgameLog(data, num, cb) {
        const FUNC = '【room】 _addRankgameLog() --- ';
        if (data.length > 0) {
            let sql = "INSERT INTO `tbl_rankgame_log` ";
            sql += "(`time`, ";
            sql += "`player1`, `wait_time1`, `rank1`, `bullet_score1`, `used_bullet1`, `nuclear_score1`, `nuclear_exploded1`, ";
            sql += "`player2`, `wait_time2`, `rank2`, `bullet_score2`, `used_bullet2`, `nuclear_score2`, `nuclear_exploded2`, ";
            sql += "`result`) ";
            sql += "VALUES ";
            for (let i = 0; i < data.length; i++) {
                if (i > 0) sql += ",";
                sql += '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
            }

            let sql_data = [];
            for (let i = 0; i < num; i++) {
                let record = data.shift();

                sql_data.push(record.time);

                sql_data.push(record.player1);
                sql_data.push(record.wait_time1);
                sql_data.push(record.rank1);
                sql_data.push(record.bullet_score1);
                sql_data.push(record.used_bullet1);
                sql_data.push(record.nuclear_score1);
                sql_data.push(record.nuclear_exploded1);

                sql_data.push(record.player2);
                sql_data.push(record.wait_time2);
                sql_data.push(record.rank2);
                sql_data.push(record.bullet_score2);
                sql_data.push(record.used_bullet2);
                sql_data.push(record.nuclear_score2);
                sql_data.push(record.nuclear_exploded2);

                sql_data.push(JSON.stringify(record.result));

                // 记录玩家最近的10个对手(Only Redis)
                this._recordRecentEnemy10(record.player1, record.player2);
                this._recordRecentEnemy10(record.player2, record.player1);
            }


            logger.debug(FUNC + 'sql:\n', sql);
            logger.debug(FUNC + 'sql_data:\n', sql_data);

            this._handlePoolQuery(sql, sql_data, FUNC, cb);
        } else {
            cb && cb(null, null);
        }
    }

    _recordRecentEnemy10(uid1, uid2) {
        const FUNC = '【room】 _recordRecentEnemy10() --- ';
        // 真实玩家才记录
        if (uid1 > 0) {
            redisConnector.cmd.hget(redisKey.RECENT_ENEMY_10, uid1, function (err, res) {
                if (err) logger.error(FUNC + 'err:', err);
                if (!res) {
                    res = '[]';
                }
                res = JSON.parse(res);
                res.push(parseInt(uid2));
                if (res.length > 10) {
                    res.shift();
                }
                redisConnector.cmd.hset(redisKey.RECENT_ENEMY_10, uid1, JSON.stringify(res));
            });
        }
    }

    _handlePoolQuery(sql, sql_data, FUNC, cb) {
        mysqlConnector.query(sql, sql_data, function (err, results) {
            if (err) {
                logger.error(FUNC + 'err:\n', err);
                logger.error(FUNC + 'sql:\n', sql);
                logger.error(FUNC + 'sql_data:\n', sql_data);
                cb(err);
                return;
            }
            cb(null, results);
        });
    }

    //发送倒计时
    _sendCountdown() {
        this.roomBroadcast(rankMatchCmd.push.timer.route, {
            countdown: this._countdown
        });
        this._lastUpdateTime = Date.now();
    }

    //双方准备就绪，正式开始
    async _startMatch(data) {
        if (this._state != consts.MATCH_ROOM_STATE.WAIT) {
            return;
        }
        this.roomBroadcast(rankMatchCmd.push.start.route, {
            countdown: this._countdown
        });
        this._state = consts.MATCH_ROOM_STATE.DOING;
        this._lastUpdateTime = Date.now();
        for (let player of this._playerMap.values()) {
            if(player.isPlayer()){
                await rpcSender.invokeFront(rpcSender.serverType.game, rpcSender.serverModule.game.playerRemote, fishCmd.remote.matchStart.route, player.account.id, {
                    uid: player.account.id,
                    nbomb_cost: player.nbomb_cost,
                    serverId: data.serverId,
                    roomId: data.roomId,
                });
            }
        }
    }

    /**
     * 比赛结束
     */
    async _matchFinish() {
        for (let player of this._playerMap.values()) {
            if (player.isPlayer()) {
                try{
                    await rpcSender.invokeFront(rpcSender.serverType.game, rpcSender.serverModule.game.playerRemote, fishCmd.remote.matchFinish.route, player.account.id, {
                        uid: player.account.id
                    });
                }catch(err){
                    logger.error('排位赛服发送排位赛结束事件结束');
                }
            }
        }
        this._state = consts.MATCH_ROOM_STATE.OVER;
        this._robot = null;
        this._unInit();
    }

}

module.exports = RankMatchRoom;