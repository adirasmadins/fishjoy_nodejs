const data_weapon = require('../../hall/controllers/data/weapon');
const data_broadcast = require('../../hall/controllers/data/broadcast');
const data_activity = require('../../hall/controllers/data/activity');
const data_mail = require('../../hall/controllers/data/mail');
const data_aquarium = require('../../hall/controllers/data/aquarium');
const data_goddess = require('../../hall/controllers/data/goddess');
const data_rankgame = require('../../hall/controllers/data/rankgame');
const data_social = require('../../hall/controllers/data/social');
const data_reward = require('../../hall/controllers/data/reward');
const data_feedback = require('../../hall/controllers/data/feedback');
const data_recieve = require('../../hall/controllers/data/recieve');
const data_info = require('../../hall/controllers/data/info');
const reward_people = require('../../hall/controllers/data/reward_people');
const friend = require('../../hall/controllers/data/friend');
const chat = require('../../hall/controllers/data/chat');
const city = require('../../hall/controllers/data/city');
const happy_weekend = require('../../hall/controllers/data/happy_weekend');
const update = require('../../hall/controllers/data/update');
const diamond2gold = require('../../hall/controllers/data/diamond2gold');

const api_list = {
    query_cik: {
        route: '/query_cik', //查询所有玩家实物兑换记录
        handler: data_recieve.queryCik,
        params: [],
        accountFields: []
    }, get_huafeiquan: {
        route: '/get_huafeiquan', //获取话费券数量
        handler: data_info.getHuafeiquan,
        params: [],
        accountFields: []
    }, guide_reward: {
        route: '/guide_reward', //完成强制教学领奖
        handler: data_reward.guideReward,
        params: [],
        accountFields: []
    }, mission_reward: {
        route: '/mission_reward', //任务领奖
        handler: data_reward.missionReward,
        params: [],
        accountFields: []
    }, mission_info: {
        route: '/mission_info', //获取任务信息
        handler: data_reward.missionInfo,
        params: [],
        accountFields: []
    }, active_reward: {
        route: '/active_reward', //活跃值领奖(4个等级, 参数就是0，1，2，3)
        handler: data_reward.activeReward,
        params: [],
        accountFields: []
    }, weapon_up: {
        route: '/weapon_up', //武器升级
        handler: data_weapon.levelup,
        params: [],
        accountFields: []
    }, weapon_skin_upstar: {
        route: '/weapon_skin_upstar', //皮肤升星
        handler: data_weapon.upstar,
        params: [],
        accountFields: []
    }, weapon_buy_skin: {
        route: '/weapon_buy_skin', //武器皮肤购买
        handler: data_weapon.buySkin,
        params: [],
        accountFields: []
    }, weapon_equip: {
        route: '/weapon_equip', //武器皮肤装备
        handler: data_weapon.equip,
        params: [],
        accountFields: []
    }, weapon_skin_vote: {
        route: '/weapon_skin_vote', //皮肤支持率投票
        handler: data_weapon.vote,
        params: [],
        accountFields: []
    }, query_skin_vote: {
        route: '/query_skin_vote', //查询投票排行榜
        handler: data_weapon.querySkinVote,
        params: [],
        accountFields: []
    }, ban_user: {
        route: '/ban_user', //对玩家封号
        handler: data_feedback.banUser,
        params: [],
        accountFields: []
    }, get_invite_progress: {
        route: '/get_invite_progress', //获取好友邀请进度
        handler: data_social.getInviteProgress,
        params: [],
        accountFields: []
    }, get_share_status: {
        route: '/get_share_status', //获取好友分享状态
        handler: data_social.getShareStatus,
        params: [],
        accountFields: []
    }, get_enshrine_status: {
        route: '/get_enshrine_status', //获取收藏状态
        handler: data_social.getEnshrineStatus,
        params: [],
        accountFields: []
    }, invite_success: {
        route: '/invite_success', //接收邀请好友成功记录
        handler: data_social.inviteSuccess,
        params: [],
        accountFields: []
    }, share_success: {
        route: '/share_success', //分享成功记录
        handler: data_social.shareSuccess,
        params: [],
        accountFields: []
    }, get_social_reward: {
        route: '/get_social_reward', //社交奖励领取
        handler: data_social.getSocialReward,
        params: [],
        accountFields: []
    }, enshrine_success: {
        route: '/enshrine_success', //快捷方式相关(创建, 领取奖励)，收藏成功
        handler: data_social.enshrineSuccess,
        params: [],
        accountFields: []
    }, god_week_reward: {
        route: '/god_week_reward', //领取保卫女神周排名奖励
        handler: data_goddess.weekReward,
        params: [],
        accountFields: []
    }, goddess_unlock: {
        route: '/goddess_unlock', //女神解锁身体区域
        handler: data_goddess.unlock,
        params: [],
        accountFields: []
    }, goddess_levelup: {
        route: '/goddess_levelup', //女神升级
        handler: data_goddess.levelup,
        params: [],
        accountFields: []
    }, get_god_data: {
        route: '/get_god_data', //获取女神数据
        handler: data_goddess.getDefend,
        params: [],
        accountFields: []
    }, challenge_god: {
        route: '/challenge_god', //挑战女神
        handler: data_goddess.challengeGoddess,
        params: [],
        accountFields: []
    }, get_god_week_top1: {
        route: '/get_god_week_top1', //获取保卫女神第一名数据
        handler: data_goddess.weekTop1,
        params: [],
        accountFields: []
    }, rankgame_result: {
        route: '/rankgame_result', //获取排位赛的结算
        handler: data_rankgame.result,
        params: [],
        accountFields: []
    }, rankgame_info: {
        route: '/rankgame_info', //客户端打开排位赛界面时获取排位赛的相关信息
        handler: data_rankgame.info,
        params: [],
        accountFields: []
    }, rankgame_box: {
        route: '/rankgame_box', //客户端操作宝箱的统一接口
        handler: data_rankgame.box,
        params: [],
        accountFields: []
    }, rankgame_ising: {
        route: '/rankgame_ising', //是否有正在进行中的排位赛, 如果有, 则返回房间地址
        handler: data_rankgame.ongoing,
        params: [],
        accountFields: []
    }, upgrade_petfish: {
        route: '/upgrade_petfish', //解锁或升级宠物鱼
        handler: data_aquarium.upgradePetfish,
        params: [],
        accountFields: []
    }, put_petfish: {
        route: '/put_petfish', //放养宠物鱼
        handler: data_aquarium.putPetfish,
        params: [],
        accountFields: []
    }, reward_petfish: {
        route: '/reward_petfish', //领取宠物鱼奖励
        handler: data_aquarium.rewardPetfish,
        params: [],
        accountFields: []
    }, put_goddess: {
        route: '/put_goddess', //放置女神
        handler: data_aquarium.putGoddess,
        params: [],
        accountFields: []
    }, get_aquarium: {
        route: '/get_aquarium', //获取当前鱼缸和女神状态
        handler: data_aquarium.getAquarium,
        params: [],
        accountFields: []
    }, mail_list: {
        route: '/mail_list', //获取邮件列表
        handler: data_mail.mailList,
        params: [],
        accountFields: []
    }, get_activity_reward: {
        route: '/get_activity_reward', //领取活动奖励
        handler: data_activity.getReward,
        params: [],
        accountFields: []
    }, show_me_activity: {
        route: '/show_me_activity', //返回给客户端活动列表
        handler: data_activity.showMeActivity,
        params: [],
        accountFields: []
    }, get_broadcast: {
        route: '/get_broadcast', //获取通告
        handler: data_broadcast.get_broadcast,
        params: [],
        accountFields: []
    }, month_sign: {
        route: '/month_sign', //每日签到
        handler: data_reward.monthSign,
        params: [],
        accountFields: []
    }, get_day_reward: {
        route: '/get_day_reward', //领取每日奖励，领取后会把数据库中对应用户的day_reward字段设置为0
        handler: data_reward.get_day_reward,
        params: [],
        accountFields: []
    }, get_day_extra_reward: {
        route: '/get_day_extra_reward', //签到额外奖励
        handler: data_reward.get_day_extra_reward,
        params: [],
        accountFields: []
    }, update_account: {
        route: '/update_account', //更新用户部分数据
        handler: update.updateAccount,
        params: [],
        accountFields: []
    }, update_channel_friends: {
        route: '/update_channel_friends', //更新渠道好友列表
        handler: data_social.updateChannelFriends,
        params: [],
        accountFields: []
    }, get_friends_ranking: {
        route: '/get_friends_ranking', //获取好友排行榜
        handler: data_social.getFriendsCharts,
        params: [],
        accountFields: []
    }, get_ranking: {
        route: '/get_ranking', //获取实时排名
        handler: data_rankgame.get_ranking,
        params: [],
        accountFields: []
    }, reward_people: {
        route: '/reward_people', //打赏
        handler: reward_people.reward_people,
        params: [],
        accountFields: []
    }, send_chat: {
        route: '/send_chat', //发送聊天
        handler: chat.sendChat,
        params: [],
        accountFields: []
    }, forbid_player_world: {
        route: '/forbid_player_world', //禁言
        handler: chat.forbid_player_world,
        params: [],
        accountFields: []
    }, unforbid_player_world: {
        route: '/unforbid_player_world', //解除禁言
        handler: chat.unforbid_player_world,
        params: [],
        accountFields: []
    }, get_user_info: {
        route: '/get_user_info', //返回聊天个人信息
        handler: chat.userInfo,
        params: [],
        accountFields: []
    }, add_friend: {
        route: '/add_friend', //添加好友
        handler: friend.addFriend,
        params: [],
        accountFields: []
    }, del_friend: {
        route: '/del_friend', //删除好友
        handler: friend.delFriend,
        params: [],
        accountFields: []
    }, set_city: {
        route: '/set_city', //设置城市
        handler: city.setCity,
        params: [],
        accountFields: []
    }, get_user_rank: {
        route: '/get_user_rank', //获取玩家历史排行信息
        handler: data_reward.getUserRank,
        params: [],
        accountFields: []
    }, get_chart_reward: {
        route: '/get_chart_reward', //获取玩家排行榜奖励
        handler: data_reward.getChartReward,
        params: [],
        accountFields: []
    }, query_weekend_reward: {
        route: '/query_weekend_reward', //查询周末狂欢活动状态
        handler: happy_weekend.getDataWithToken,
        params: [],
        accountFields: []
    }, get_weekend_reward: {
        route: '/get_weekend_reward', //领取周末狂欢奖励
        handler: happy_weekend.check2GetReward,
        params: [],
        accountFields: []
    }, upload_hweekend_fishing: {
        route: '/upload_hweekend_fishing', //更新周末狂欢捕鱼任意条进度
        handler: happy_weekend.saveFishingCount,
        params: [],
        accountFields: []
    }, get_horn_flower: {
        route: '/get_horn_flower', //查询玩家使用的喇叭和收到的鲜花
        handler: data_info.getHornFlower,
        params: [],
        accountFields: []
    }, get_item_limit_time: {
        route: '/get_item_limit_time', //查询指定某个道具剩余过期时间
        handler: data_info.getItemLimitTime,
        params: [],
        accountFields: []
    }, get_item_limit_got_time: {
        route: '/get_item_limit_got_time', //查询玩家限时道具获得时间
        handler: data_info.getItemLimitGotTime,
        params: [],
        accountFields: []
    }, get_free_card: {
        route: '/get_free_card', //免费开通周卡月卡
        handler: data_social.getFreeCard,
        params: [],
        accountFields: []
    }, check_bomb_reward: {
        route: '/check_bomb_reward', //查询免费核弹
        handler: data_social.getFreeBomb,
        params: [],
        accountFields: []
    }, query_account_fields: {
        route: '/query_account_fields', //查询用户数据接口
        handler: data_info.queryAccountFields,
        params: [],
        accountFields: []
    }, diamond_to_gold: {
        route: '/diamond_to_gold', //钻石兑换金币
        handler: diamond2gold.exchange,
        params: [],
        accountFields: []
    }, get_newbie_info: {
        route: '/get_newbie_info', //获取新手狂欢信息
        handler: data_activity.getNewbieInfo,
        params: [],
        accountFields: []
    }, sync_mission_progress: {
        route: '/sync_mission_progress', //同步新手狂欢进度数据
        handler: data_activity.syncMissionProgress,
        params: [],
        accountFields: []
    }, newbie_reward: {
        route: '/newbie_reward', //同步新手狂欢进度数据
        handler: data_activity.getNewbieReward,
        params: [],
        accountFields: []
    },goddess_interact_reward: {
        route: '/goddess_interact_reward', //女神互动奖励(爱抚女神获取奖励)
        handler: data_goddess.interractReward,
        params: [],
        accountFields: []
    },match_1v1_status_own: {
        route: '/match_1v1_status_own', //查询自己创建的比赛状态
        handler: data_rankgame.getPlayerMatch1v1Status,
        params: [],
        accountFields: []
    },match_1v1_status_other: {
        route: '/match_1v1_status_other', //查询别人创建的比赛状态，即接受别人邀请的比赛状态
        handler: data_rankgame.acceptMatch1v1,
        params: [],
        accountFields: []
    },match_1v1_result: {
        route: '/match_1v1_result', //查询1v1比赛结果
        handler: data_rankgame.queryMatch1v1Result,
        params: [],
        accountFields: []
    }
};

module.exports = {
    apiCfgs:api_list,
    PREFIX: '/hall/clientApi',
};

