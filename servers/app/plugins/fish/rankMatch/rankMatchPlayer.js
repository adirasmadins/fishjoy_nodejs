const BasePlayer = require('../entity/basePlayer');
const consts = require('../consts');
const configReader = require('../../../utils/configReader');
const SECONDS_IN_ONE_DAY = 86400;
const import_def = require('../../../models/index');
const ACCOUNTKEY = import_def.ACCOUNTKEY;
const REDISKEY = import_def.REDISKEY;
const GAMECFG = require('../../../utils/imports').DESIGN_CFG;
const RewardModel = require('../../../utils/account/RewardModel');
const config = require('../config');
const tools = require('../../../utils/tools');
const GameEventBroadcast = require('../../../common/broadcast/GameEventBroadcast');
const redisAccountSync = require('../../../utils/redisAccountSync');

class RankMatchPlayer extends BasePlayer {
    /**
     * {
     * kindId:0,
     * sid:0,
     * uid:0,
     * account:{}
     * ready:false
     * 
     * }
     * @param {*} opts 
     */
    constructor(opts) {
        super(opts);
        this._ready = false;
        this._over = false;
        this._gameSid = '0';
        this.account = opts.account;

        this._statistics = {
            score: 0, //当前总得分
            fire: config.MATCH.FIRE, //剩余子弹数
            fish_account: {}, //普通开炮打死什么鱼，得多少分
            nuclear_fish_count: -1, //核弹打死条数,-1默认取消核弹，核弹可能存在打不死鱼
            nuclear_score: -1, //核弹打死鱼总得分
            firetime: 0, //统计时间戳
            provocativeVal: 0, //被魅惑的分值
        };
        this._pointChange = 0; //点数变化值
        this._winStreak = this.account.match_winning_streak; //连胜次数
        this._win = this.account.match_win; //胜利次数
        this._fail = this.account.match_fail; //失败次数
        this._charmPoint = this.account.charm_point; //魅力点数
        this._charmRank = this.account.charm_rank; //魅力等级
        this._matchRank = this.account.match_rank; //排位赛段位
        this._rankChange = 0; //段位变化
        this._firstWinBox = null; //首胜宝箱id
        this._box = null; //本次获得宝箱
        this._seasonWin = this.account.match_season_win; //赛季胜利次数
        this._mission = null;
        this._winner = 0;
        this._isProvocativeEnabled = false;
    }

    set gameSid(val) {
        this._gameSid = val;
    }

    get gameSid() {
        return this._gameSid;
    }

    get statistics() {
        return this._statistics;
    }

    get nbomb_cost() {
        return configReader.getValue('rank_rankgame_cfg', this.account.match_rank).nbgold;
    }

    /**
     * 存档，持久化到redis中
     * TODO: 
     * 1、排位赛日志如何写到数据库
     * 2、连胜公告如何同步到数据服
     */
    save() {
        //获得一个宝箱
        if (this._box) {
            let boxes = this.account.match_box_list;
            let boxesStamp = this.account.match_box_timestamp;
            let boxIdx = this._box.idx;
            boxes[boxIdx] = this._box.id;
            boxesStamp[boxIdx] = -1;
            this.account.match_box_list = boxes;
            this.account.match_box_timestamp = boxesStamp;
        }

        //首胜宝箱获得
        if (this._firstWinBox) {
            let firstBox = this.account.match_1st_box;
            firstBox.id = this._firstWinBox;
            firstBox.stat = 2;
            this.account.match_1st_box = firstBox;
            this.account.match_season_1st_win = 1;
        }

        this.account.match_unfinish = 0; //已查看结算结果标记
        this.account.match_rank = this._rankChange;
        this.account.match_points = this._pointChange;
        this.account.match_winning_streak = this._winStreak;

        this.account.match_season_count = 1;
        if (this._winner == 1) {
            this.account.match_season_win = 1;
            this.account.match_win = 1;
        } else if (this._winner == 2) {
            this.account.match_fail = 1;
        }

        this.account.charm_point = this._charmPoint;
        this.account.charm_rank = this._charmRank;

        this._mission && this._mission.commit();
        this.account.commit();

        //添加到rank有序列表中
        // if(this.account.privacy==1) {
        //     if (!tools.BuzzUtil.isCheat(this.account)) {
        //         redisConnector.cmd.zadd(`${REDISKEY.RANK.MATCH}:${this.account.platform}`, this.account.match_points, this.account.id);
        //     }
        // }
    }

    async _zaddMatchPoints(points){
        //添加到rank有序列表中
        if(this.account.privacy==1) {
            if (!tools.BuzzUtil.isCheat(this.account)) {
                await redisConnector.zadd(`${REDISKEY.RANK.MATCH}:${this.account.platform}`, points, this.account.id);
            }
        }
    }

    async updateAccount(){
        this.account = await redisAccountSync.getAccountAsync(this.uid, RankMatchPlayer.sBaseField());
    }

    /**
     * 胜负结果处理
     *  // 积分变化
        // (1)根据双方段位的value参数值计算积分
        // (2)胜方增加：max(败方参数-胜方参数 + 20，5)
        // (3)败方减少：max(胜方参数-败方参数 + 20，5)
        // 分数相同且不为0, 比较firetime
     */
    async setResult(p2) {
        this._winner = 0; //0平局 1赢了 2输了
        let score1 = this.statistics.score;
        let score2 = p2.statistics.score;

        let star1 = this.getSkinStar();
        star1 && (score1 += star1.score);
        let star2 = p2.getSkinStar();
        star2 && (score2 += star2.score);

        if (score1 === 0 && score2 === 0) {
            this._winner = 0;
        } else {
            if (score1 > score2) {
                this._winner = 1;
            } else if (score1 < score2) {
                this._winner = 2;
            } else {
                if (this.statistics.firetime <= p2.statistics.firetime) {
                    this._winner = 1;
                } else {
                    this._winner = 2;
                }
            }
        }

        if (this._winner === 0) {
            const PC = 5;
            this._pointChange = -PC * this.getAddPoint();
        } else {
            let value1 = this.getValue();
            let value2 = p2.getValue();
            let pc = 0;
            if (this._winner === 1) {
                pc = Math.max(value2 - value1 + 20, 5);
                pc = pc * this.getAddPoint() + this.handleWinningStreak();
                star1 && (pc += star1.winPoint);
                this._pointChange = pc;
                this._win++;
                this._seasonWin++;

                if (p2._winStreak >= 5) {
                    // 发布终结连胜公告
                    let account = this.account;
                    let params = [account.nickname, p2.account.nickname, p2._winStreak, account.vip, account.charm_rank];
                    let content = {
                        // txt: `${account.nickname}在排位赛中终结了${p2.account.nickname}的${p2._winStreak}连胜记录`,
                        type: GameEventBroadcast.TYPE.GAME_EVENT.SEASON_END,
                        params: params,
                    };
                    new GameEventBroadcast(content).extra(account).add();
                }

            } else {
                pc = Math.max(value1 - value2 + 20, 5);
                pc = pc * this.getAddPoint();
                this._pointChange = -pc;
                this._fail++;
                this._winStreak = 0; //输了之后，连胜次数重置
            }
        }

        let points = Math.max(0, this.account.match_points + this._pointChange);
        await this._zaddMatchPoints(points);
        return points;
    }

    afterSetResult(result){
        let charm = result.charm;
        let matchRank = result.matchRank;
        let treasure2 = result.treasure2; //普通宝箱配置
        let treasure1 = result.treasure1; //首胜宝箱id
        this._charmPoint += charm;
        this._rankChange = matchRank - this._matchRank;
        this._matchRank = matchRank; //注意这个段位不是准确的，实际需求是需要根据排名和点数共同决定

        //赢家获得宝箱
        if (this._winner === 1) {
            this._box = this.newBox(treasure2);
            this._firstWinBox = this._newFirstWinBoxEnabled(matchRank) ? treasure1 : null;

            //排位赛胜利统计
            this._countMission(matchRank);
            if (this._box) {
                // 发送公告——打排位赛获得超级和史诗宝箱(treasureid 12和13)
                if (this._box.id == 12 || this._box.id == 13) {
                    let account = this.account;
                    let boxName = tools.CfgUtil.treasure.getName(this._box.id);
                    let params = [account.nickname, boxName, account.vip, account.charm];
                    let content = {
                        // txt: `${account.nickname}在排位赛中获得了稀世罕见的${boxName}宝箱！`,
                        type: GameEventBroadcast.TYPE.GAME_EVENT.SEASON_BOX,
                        params: params,
                    };
                    new GameEventBroadcast(content).extra(account).add();
                }
            }
        }
        return this._winner === 1;
    }

    _countMission(matchRank) {
        if (!this._mission) {
            this._mission = new RewardModel(this.account);
            this._mission.updateProcess(RewardModel.TaskType.CHALLENGE_WIN, 1);
            this._mission.updateProcess(RewardModel.TaskType.CHALLENGE_DUANWEI, matchRank);
        }
    }

    /**
     * 根据权重，确定一个宝箱id
     * cfgs : [[10,670],[11,240],[12,60],[13,30]],   
     */
    _findTreasureId(cfgs) {
        let total = 0;
        for (let i = 0; i < cfgs.length; i++) {
            let temp = cfgs[i];
            total += temp[1];
        }
        let rand = Math.floor(Math.random() * total);
        total = 0;
        for (let i = 0; i < cfgs.length; i++) {
            let temp = cfgs[i];
            total += temp[1];
            if (total >= rand) {
                return temp[0];
            }
        }
        return -1;
    }

    /**
     * 放置一个新的宝箱到玩家数据中
     */
    newBox(treasure2) {
        let old_box = this.account.match_box_list;
        let id = -1; //因为没有空位所以没有领取到宝箱
        let idx = 0;
        for (let i = 0; i < old_box.length; i++) {
            if (old_box[i] == 0) {
                id = this._findTreasureId(treasure2);
                idx = i;
                break;
            }
        }
        if (id !== -1) {
            return {
                id: id,
                idx: idx,
            };
        }
        return null;
    }

    /**
     * 判断玩家是否可以获得首胜宝箱
     */
    _newFirstWinBoxEnabled() {
        let first_box = this.account.match_1st_box;
        // 1. id = 0
        if (first_box.id != 0) {
            return false;
        }
        // 2. 倒计时结束
        let lefttime = this._getFirstBoxLefttime(first_box.timestamp);
        if (lefttime > 0) {
            return false;
        }
        // 3. stat状态
        if (first_box.stat != consts.BOX_STAT.NULL) {
            return false;
        }
        return true;
    }

    /**
     * 获取首胜宝箱的剩余开启时间.
     */
    _getFirstBoxLefttime(timestamp) {
        let pasttime = (new Date().getTime() - timestamp) / 1000;
        let needtime = SECONDS_IN_ONE_DAY;
        let lefttime = needtime - pasttime;
        if (lefttime < 0) {
            lefttime = 0;
        }
        return Math.round(lefttime);
    }

    /**
     * 获取玩家参数来改变积分
     */
    getValue() {
        return configReader.getValue('rank_rankgame_cfg', this.account.match_rank).value;
    }

    /**
     * 积分加成
     * TASK223: 每个赛季前10场分值变化量*5.
     */
    getAddPoint() {
        if (this.account.match_season_count < 10) {
            return 5;
        }
        return 1;
    }

    /**
     * 计算胜率
     * 注意该字段不会持久化，而是及时计算所得
     * -1标识无胜率
     */
    genWinRate() {
        let winning_rate = -1;
        let win = this._win;
        let fail = this._fail;
        let total = win + fail;
        if (total > 0) {
            winning_rate = win / total * 100;
            winning_rate = Math.round(winning_rate * 100) / 100;
        }
        return winning_rate;
    }

    /**
     * 连胜处理
     * 全服广播连胜公告
     */
    handleWinningStreak() {
        let ret = 0;
        this._winStreak++;
        if (this._winStreak >= GAMECFG.common_const_cfg.RMATCH_VICTORS) {
            ret = this._winStreak * GAMECFG.common_const_cfg.RMATCH_VICTORSADD;
            this.winstreak2DataServer();
        }
        return ret;
    }

    /**
     * 返回当前进度信息
     */
    getCurrentMatchInfo() {
        return {
            uid: this.uid,
            rank: this.account.match_rank,
            nickname: this.account.nickname,
            figure_url: this.account.figure_url,
            winning_rate: this.genWinRate(),
            wp_skin: this.account.weapon_skin.equip,
            nbomb_cost: this.genNbombCost(),
            status: {
                fire: this.statistics.fire,
                score: this.statistics.score,
            },
            vip: this.account.vip,
            provocative_enabled: this.isProvocativeEnabled() ? 1 : 0,
        };
    }

    /**
     * 计算核弹消耗
     * 来自配置
     */
    genNbombCost() {
        return this._over ? -1 : configReader.getValue('rank_rankgame_cfg', this.account.match_rank).nbgold;
    }

    /**
     * 返回个人私有数据：因本次比赛而改变的数据
     */
    getPrivateDetail() {
        let data = {
            uid: this.uid,
            finish: true, //是否有比赛结果了
            point_change: this._pointChange, //点数变化，不可能为0，>0 赢了，反之输了
            box: this._box, //宝箱为null，有两种情况：输了，赢了但是该宝箱已获得
            rank_change: this._rankChange, //段位变化，!= 0, >0 上升，反之下降
            rank: this._matchRank,
            charm_point: this.account.charm_point,
            charm_rank: this.account.charm_rank,
            match_winning_streak: this._winStreak, //连胜次数
            match_info: null,
        };
        return data;
    }

    /**
     * 返回比赛结算详情
     */
    getRMatchDetail() {
        let detail = {
            uid: this.uid,
            nickname: this.account.nickname,
            figure_url: this.account.figure_url,
            winning_rate: this.genWinRate(),
            rank: this._matchRank,
            fish_account: this.statistics.fish_account,
            nuclear_fish_count: this.statistics.nuclear_fish_count,
            nuclear_score: this.statistics.nuclear_score,
            vip: this.account.vip,
            provocativeVal: this.statistics.provocativeVal,
        };
        let star = this.getSkinStar();
        star && (detail.star = star);
        return detail;
    }

    /**
     * 返回档期皮肤星级加成属性
     */
    getSkinStar() {
        let star = this._skinStar;
        if (star) {
            return {
                skin: star.skin,
                winPoint: star.rank,
                score: star.score,
            };
        }
        return null;
    }

    /**
     * 核弹开炮结果
     */
    useNbomb(data) {
        this.statistics.firetime = new Date().getTime();
        this.statistics.score = data.score - this.statistics.provocativeVal;
        this.statistics.fire = 0;
        this.statistics.nuclear_fish_count = data.nbomb.num;
        this.statistics.nuclear_score = data.nbomb.point;
        this._over = true;
    }

    /**
     * 取消核弹使用
     */
    cancelNbomb() {
        this.statistics.firetime = new Date().getTime();
        this._over = true;
    }

    /**
     * 魅惑对手
     */
    provocative(hisScore) {
        if (this._isProvocativeEnabled && this.statistics.score < hisScore) {
            if (!this._isProvocatived) {
                this._isProvocatived = true;
                return true;
            }
        }
        return false;
    }

    /**
     * 被魅惑，减去分数
     * @param {*} provocativeVal 
     */
    beProvocatived(provocativeVal) {
        if (!this.statistics.provocativeVal) {
            this.statistics.provocativeVal = provocativeVal;
            return true;
        }
        return false;
    }

    /**
     * 普通开炮结果
     * @param {*} data 
     */
    setFightInfo(data) {
        this.statistics.firetime = new Date().getTime();
        this.statistics.fire = data.fire;
        this.statistics.score = data.score - this.statistics.provocativeVal;
        for (let i = 0; i < data.fish_list.length; i++) {
            let temp = data.fish_list[i];
            let k = temp.name;
            if (!this.statistics.fish_account[k]) {
                this.statistics.fish_account[k] = {
                    num: 0,
                    point: 0,
                };
            }
            this.statistics.fish_account[k].num += temp.num;
            this.statistics.fish_account[k].point += temp.point;
        }
        this._skinStar = data.star;
    }

    isOver() {
        return this._over && this.statistics.fire === 0;
    }

    /**
     * 连胜公告通知到数据服
     */
    winstreak2DataServer() {
        let account = this.account;
        let params = [account.nickname, this._winStreak, account.vip];
        let content = {
            txt: '玩家' + account.nickname + '连胜' + this._winStreak + '局',
            type: GameEventBroadcast.TYPE.GAME_EVENT.VICTORS,
            params: params,
        };
        new GameEventBroadcast(content).extra(account).add();
    }

    /**
     * 清除相关参数
     */
    clear() {
        this.save();
    }
    
    /**
     * 是否可以魅惑
     */
    setProvocativeEnabled(isEnabled) {
        this._isProvocativeEnabled = isEnabled;
        logger.error('uid = ', this.uid, ' isEnabled= ', isEnabled)
    }

    isProvocativeEnabled() {
        return this._isProvocativeEnabled && !this._isProvocatived && !this.isOver();
    }


    static sBaseField() {
        const baseField = [
            ACCOUNTKEY.NICKNAME,
            ACCOUNTKEY.WEAPON_SKIN,
            ACCOUNTKEY.FIGURE_URL,
            ACCOUNTKEY.MATCH_RANK,
            ACCOUNTKEY.MATCH_POINTS,
            ACCOUNTKEY.MATCH_WIN,
            ACCOUNTKEY.MATCH_FAIL,
            ACCOUNTKEY.MATCH_SEASON_COUNT,
            ACCOUNTKEY.MATCH_WINNING_STREAK,
            ACCOUNTKEY.MATCH_BOX_LIST,
            ACCOUNTKEY.MATCH_BOX_TIMESTAMP,
            ACCOUNTKEY.MATCH_1ST_BOX,
            ACCOUNTKEY.MATCH_SEASON_1ST_WIN,
            ACCOUNTKEY.MATCH_UNFINISH,
            ACCOUNTKEY.MATCH_SEASON_WIN,
            ACCOUNTKEY.PLATFORM,
            ACCOUNTKEY.VIP,
            ACCOUNTKEY.CHARM_POINT,
            ACCOUNTKEY.CHARM_RANK,
            ACCOUNTKEY.ID,
            ACCOUNTKEY.MISSION_DAILY_RESET,
            ACCOUNTKEY.MISSION_ONLY_ONCE,
            ACCOUNTKEY.ACTIVE_DAILY_RESET,
            ACCOUNTKEY.ACTIVE,
            ACCOUNTKEY.PRIVACY,
        ];
        return baseField;
    }

}

module.exports = RankMatchPlayer;