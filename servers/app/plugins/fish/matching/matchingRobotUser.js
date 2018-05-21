// //--[[
// description: 排位赛报名机器人
// author: scott (liuwenming@chufengnet.com)
// date: 20171222
// ATTENTION：
// //--]]

const  MatchingUser = require('./matchingUser');
const consts = require('../consts');

class MatchingRobotUser extends MatchingUser {
    constructor (opts) {
        super(opts);
        this.account.kindId = consts.ENTITY_TYPE.ROBOT;
    }

    /**
     * 分配一个合适的机器人.
     * 详细参数可参考传入参数确定
     */
    static async allocUser(realUer, robotInfo) {
        // 使用玩家uid的相反数作为机器人的uid.
        let rid = -realUer.account.uid;

        // 机器人的武器倍率, 核弹消耗金币没有意义，随便设置一个值
        let weapon = 100;
        let nbomb_cost = 1000;

        let account = {
            uid: rid,
            nickname: robotInfo.baseInfo.nickname,
            figure_url: robotInfo.baseInfo.headUrl,
            weapon_skin: robotInfo.weapon_skin,
            weapon: weapon, 
            match_rank: robotInfo.match_rank,// 排位赛段位
            nbomb_cost: nbomb_cost,// 本次核弹消耗金币
            match_winning_streak: utils.random_int(0, 10),// 连胜次数
            match_win: utils.random_int(1, 100), // 胜利次数
            match_fail: utils.random_int(1, 100), // 失败次数
            charm_point: utils.random_int(1, 10000), // 魅力点数
            charm_rank: 1, // 魅力等级
            match_season_win: utils.random_int(1, 5), // 赛季胜利次数
            match_points: utils.random_int(1, 1000), // 点数
            ior: robotInfo.ior, // 本段位的平均收支比
            vip: robotInfo.vip,
            charm_point: robotInfo.charm_point,
        };

        let robot = new MatchingRobotUser({
            ext: {
                sid: '0',
                uid: account.uid,
                isRobot: true,
            },
            account: account,
        });
        return robot;
    }
}

module.exports = MatchingRobotUser;
