const config = require('../config');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const redisArenaSync = require('../../../utils/redisArenaSync');
const ACCOUNTKEY = require('../../../models').ACCOUNTKEY;

class MatchStore {
    constructor() {
        this._matchId = null;
        this._isRealtime = false;
        this._arena = null;
        this._canSettlement = false;
    }

    get arena() {
        return this._arena;
    }

    set isRealtime(is) {
        this._isRealtime = is;
        let arena_inviter = this._arena.arena_inviter;
        arena_inviter.isRealtime = is;
        this._arena.arena_inviter = arena_inviter;
        this._arena.commit();
    }

    get matchId() {
        return this._matchId;
    }

    _isInviter(uid) {
        if (uid == this._arena.arena_inviter.uid) {
            return true;
        }
        return false;
    }

    getMatchInfo(uid) {
        if (this._isInviter(uid)) {
            return this._arena.arena_inviter;
        } else {
            return this._arena.arena_invitee;
        }
    }

    async create(matchId, uid) {
        this._matchId = matchId;
        let matchInfo = {
            arena_created_at: Date.now(), //创建时间
            arena_inviter: { //邀请人
                uid: -1,
                state: config.ARENA.MATCH_STATE.CREATED,
                score: 0, //当前总得分
                fire: config.ARENA.FIRE, //剩余子弹数
                fish_account: {}, //普通开炮打死什么鱼,供查询结果所用,下同
                nuclear_fish_count: -1, //核弹打死条数,-1默认取消核弹，核弹可能存在打不死鱼,供查询结果所用
                nuclear_score: -1, //核弹打死鱼总得分,供查询结果所用
                finishtime: 0, //完成时间戳,
                fire_records: [], //没一炮开炮详情 [{wpBk: '1_1_12',interval: 100, score: 5}, ...], 供异步模拟所用
                isQuery: false, //是否已经查看战绩
            },
            arena_invitee: { //被邀请人
                uid: -1,
                state: config.ARENA.MATCH_STATE.CREATED,
                score: 0, //当前总得分
                fire: config.ARENA.FIRE, //剩余子弹数
                fish_account: {}, //普通开炮打死什么鱼，得多少分
                nuclear_fish_count: -1, //核弹打死条数,-1默认取消核弹，核弹可能存在打不死鱼
                nuclear_score: -1, //核弹打死鱼总得分
                finishtime: 0, //完成时间戳
                isQuery: false, //是否已经查看战绩
            },
            arena_state: config.ARENA.MATCH_STATE.GOING,
        };

        matchInfo.arena_inviter.uid = uid;
        await redisArenaSync.setArena(matchId, matchInfo);
        this._arena = await redisArenaSync.getArena(matchId);
    }

    async load(matchId) {
        if (!this._isRealtime) {
            this._matchId = matchId;
            this._arena = await redisArenaSync.getArena(matchId);
        }
    }

    async bindInvitee(uid) {
        let _arena = await redisArenaSync.getArena(this._matchId, [ACCOUNTKEY.ARENA_INVITEE]);
        let arena_invitee = _arena.arena_invitee;
        if (arena_invitee.uid == -1) {
            arena_invitee.uid = uid;
            this._arena.arena_invitee = arena_invitee;
            await this._arena.commit();
        }else if(arena_invitee.uid != uid){
            throw  ERROR_OBJ.ARENA_OTHER_PLAYER_MATCHING;
        }
    }

    async getPKResult() {
        let arena_inviter = this._arena.arena_inviter;
        let arena_invitee = this._arena.arena_invitee;

        let pkResultInfo = {
            winnerUID: -1,
            failUID: -1,
            record: {}
        };

        let record = pkResultInfo.record;
        record[arena_inviter.uid] = {
            score: arena_inviter.score,
            fish_account: arena_inviter.fish_account,
            nuclear_fish_count: arena_inviter.nuclear_fish_count,
            nuclear_score: arena_inviter.nuclear_score
        };

        if (this._canSettlement) {
            if (arena_inviter.score > arena_invitee.score ||
                arena_inviter.score == arena_invitee.score && arena_inviter.finishtime < arena_invitee.finishtime) {
                pkResultInfo.winnerUID = arena_inviter.uid;
                pkResultInfo.failUID = arena_invitee.uid;
            } else {
                pkResultInfo.winnerUID = arena_invitee.uid;
                pkResultInfo.failUID = arena_inviter.uid;
            }

            pkResultInfo.winnerUID = arena_inviter.score > arena_invitee.score ? arena_inviter.uid : arena_invitee.uid;
            pkResultInfo.failUID = arena_inviter.score > arena_invitee.score ? arena_inviter.uid : arena_invitee.uid;
            record[arena_invitee.uid] = {
                score: arena_invitee.score,
                fish_account: arena_invitee.fish_account,
                nuclear_fish_count: arena_invitee.nuclear_fish_count,
                nuclear_score: arena_invitee.nuclear_score
            };
        }
        await this._arena.commit();
        return pkResultInfo;
    }

    /**
     * 加载邀请人异步PK信息供客户端模拟开火
     * @param {*} skip  注意：该值服务器需要存档
     * @param {*} limit 
     */
    async getAsyncPKInfo(skip, limit = 10) {
        let arena_inviter = await redisArenaSync.getArena(this._matchId, [ACCOUNTKEY.ARENA_INVITER]);
        this._arena.arena_inviter = arena_inviter;
        let fire_records = arena_inviter.fire_records;
        if (fire_records.length - skip < 10) {
            return;
        }

        let asyncPKInfo = {
            score: arena_inviter.score,
            fire: arena_inviter.fire,
            nuclear_fish_count: arena_inviter.nuclear_fish_count,
            nuclear_score: arena_inviter.nuclear_score,
            fire_records: fire_records.slice(skip, skip + limit)
        };
        return asyncPKInfo;
    }

    /**
     * 
     * @param {*} uid 玩家标识
     * @param {*} info 详情
     * @param {*} flag 标记，1普通开炮信息 2捕获信息 3使用核弹捕获信息 4取消核弹
     */
    async recordPKInfo(uid, info, flag) {
        let arenaData = null;
        let isCreator = this._isInviter(uid);
        if (isCreator) {
            arenaData = this._arena.arena_inviter;
        } else {
            arenaData = this._arena.arena_invitee;
        }
        if (flag === 4) {
            arenaData.finishtime = Date.now();
            arenaData.state = config.ARENA.MATCH_STATE.FINISHED;
        } else if (flag === 3 || info.nbomb) {
            arenaData.score = info.score;
            arenaData.nuclear_fish_count = info.nbomb.num;
            arenaData.nuclear_score = info.nbomb.point;
            arenaData.finishtime = Date.now();
            arenaData.state = config.ARENA.MATCH_STATE.FINISHED;
        } else if (flag === 2) {
            arenaData.score = info.score;
            arenaData.fire = info.fire;
            let fishes = info.fish_list;
            if (fishes) {
                arenaData.fish_account = arenaData.fish_account || {};
                for (let i = 0; i < fishes.length; i++) {
                    let temp = fishes[i];
                    let k = temp.name;
                    if (!arenaData.fish_account[k]) {
                        arenaData.fish_account[k] = {
                            num: 0,
                            point: 0,
                        };
                    }
                    arenaData.fish_account[k].num += temp.num;
                    arenaData.fish_account[k].point += temp.point;
                }
            }
        } else if (flag === 1) {
            arenaData.fire_records = info; //注意和player中的数格式匹配
        }

        if (isCreator) {
            this._arena.arena_inviter = arenaData;
            if (!this._isRealtime) {
                //同步PKInfo，供异步模式被邀请人挑战比赛
                await redisArenaSync.setArena(this._matchId, {
                    arena_inviter: arenaData
                });
            }
        } else {
            this._arena.arena_invitee = arenaData;
        }
        let res = info;
        res.uid = uid;
        await this._arena.commit();
        return res;
    }

    async setMatchState(uid, state) {
        if (this._isInviter(uid)) {
            let arena_inviter = this._arena.arena_inviter;
            arena_inviter.state = state;
            if (state == config.ARENA.MATCH_STATE.FINISHED) {
                arena_inviter.finishtime = Date.now();
            }
            this._arena.arena_inviter = arena_inviter;
        } else {
            let arena_invitee = this._arena.arena_invitee;
            arena_invitee.state = state;
            if (state == config.ARENA.MATCH_STATE.FINISHED) {
                arena_invitee.finishtime = Date.now();
            }
            this._arena.arena_invitee = arena_invitee;
        }
        await this._arena.commit();
    }

    async forceOverByTimeout(uid) {
        let arena_inviter = this._arena.arena_inviter;
        arena_inviter.finishtime = Date.now();
        arena_inviter.state = config.ARENA.MATCH_STATE.FINISHED;
        this._arena.arena_inviter = arena_inviter;

        if (!this._isInviter(uid)) {
            let arena_invitee = this._arena.arena_invitee;
            arena_invitee.finishtime = Date.now();
            arena_invitee.state = config.ARENA.MATCH_STATE.FINISHED;
            this._arena.arena_invitee = arena_invitee;
        }
        await this._arena.commit();
    }

    async isOver(uid) {
        if (this._arena.arena_inviter.state == config.ARENA.MATCH_STATE.FINISHED && this._arena.arena_invitee.state == config.ARENA.MATCH_STATE.FINISHED) {
            this._canSettlement = true;
            this._arena.arena_state = config.ARENA.MATCH_STATE.FINISHED;
            await this._arena.commit()
            return true;
        } else if (this._isInviter(uid) && this._arena.arena_inviter.state == config.ARENA.MATCH_STATE.FINISHED) {
            return true;
        }
        return false;
    }


    //对战完成清理战场信息
    async clearnArena() {
        if (this._isRealtime) {
            await redisArenaSync.delArena(this._matchId);
        }
    }

}

module.exports = MatchStore;