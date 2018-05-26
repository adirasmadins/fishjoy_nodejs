/**
 * 玩家信息字段及默认值，以下数据从数据库导出所得
 * TODO: 表过于臃肿，待拆分:女神数据，凡是单个字段
 */
const gamecfgs = require('../../config/design_cfg/index');
const player_users_cfg = gamecfgs.player_users_cfg;
const active_drawcost_cfg = gamecfgs.active_drawcost_cfg;

function init_free_draw() {
    let free_draw = {};
    const special = {
        1: "gold",
        2: "diamond"
    };
    for (let i = 0; i < active_drawcost_cfg.length; i++) {
        let activeDrawcostCfg = active_drawcost_cfg[i];
        let drawtype = activeDrawcostCfg.drawtype;
        free_draw[special[drawtype] || drawtype] = activeDrawcostCfg.free;
    }
    return free_draw;
}

module.exports.PlayerModel = {
    "id": {
        "def": 0,
        "type": "number"
    },
    "jointype": {
        "def": 0,
        "type": "number"
    },
    "who_invite_me": {
        "def": 0,
        "type": "number"
    },
    "who_share_me": {
        "def": 0,
        "type": "number"
    },
    "nickname": {
        "def": '',
        "type": "string"
    },
    "password": {
        "def": '',
        "type": "string"
    },
    "pwd_history": {
        "def": '',
        "type": "string"
    },
    "vip": {
        "def": 0,
        "type": "number"
    },
    "login_count": {
        "def": 0,
        "type": "number"
    },
    "logout_count": {
        "def": 0,
        "type": "number"
    },
    "created_at": {
        "def": '1970-01-02 00:00:00',
        "type": "timestamp"
    },
    "updated_at": {
        "def": '1970-01-02 00:00:00',
        "type": "timestamp"
    },
    "last_online_time": {
        "def": '1970-01-02 00:00:00',
        "type": "timestamp"
    },
    "salt": {
        "def": '',
        "type": "string"
    },
    "token": {
        "def": '',
        "type": "string"
    },
    "gold": {
        "def": player_users_cfg[0].gold,
        "type": "number",
        "inc": true
    },
    "pearl": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "weapon": {
        "def": 1,
        "type": "number"
    },
    "skill": {
        "def": {
            "1": 3,
            "2": 5,
            "3": 3,
            "4": -1,
            "8": 0,
            "9": 0,
            "10": 0
        },
        "type": "object"
    },
    "broke_times": {
        "def": 0,
        "type": "number"
    },
    "first_login": {
        "def": 1,
        "type": "number"
    },
    "day_reward": {
        "def": 1,
        "type": "number"
    },
    "day_reward_adv": {
        "def": 0,
        "type": "number"
    },
    "new_reward_adv": {
        "def": 0,
        "type": "number"
    },
    "day_reward_weekly": {
        "def": 0,
        "type": "number"
    },
    "vip_daily_fill": {
        "def": 1,
        "type": "number"
    },
    "vip_daily_reward": {
        "def": 0,
        "type": "number"
    },
    "rmb": {
        "def": 0,
        "type": "number"
    },
    "channel": {
        "def": "fj",
        "type": "string"
    },
    "channel_account_id": {
        "def": '',
        "type": "string"
    },
    "platform": {
        "def": 1,
        "type": "number"
    },
    "vip_weapon_id": {
        "def": '',
        "type": "string"
    },
    "pfft_at": {
        "def": '1970-01-02 00:00:00',
        "type": "timestamp"
    },
    "channel_account_info": {
        "def": {},
        "type": "object"
    },
    "exp": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "level": {
        "def": 1,
        "type": "number"
    },
    "level_mission": {
        "def": {},
        "type": "object"
    },
    "mission_daily_reset": {
        "def": {},
        "type": "object"
    },
    "mission_only_once": {
        "def": {},
        "type": "object"
    },
    "first_buy": {
        "def": {},
        "type": "object"
    },
    "activity_gift": {
        "def": {},
        "type": "object"
    },
    "heartbeat": {
        "def": 1,
        "type": "number"
    },
    "heartbeat_min_cost": {
        "def": 0,
        "type": "number"
    },
    "achieve_point": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "gold_shopping": {
        "def": 0,
        "type": "number"
    },
    "weapon_skin": {
        "def": {
            "own": [1],
            "equip": 1
        },
        "type": "object"
    },
    "bonus": {
        "def": {},
        "type": "object"
    },
    "drop_reset": {
        "def": {},
        "type": "object"
    },
    "drop_once": {
        "def": {},
        "type": "object"
    },
    "comeback": {
        "def": {},
        "type": "object"
    },
    "vip_gift": {
        "def": [],
        "type": "object"
    },
    "weapon_energy": {
        "def": {},
        "type": "object"
    },
    "pirate": {
        "def": {},
        "type": "object"
    },
    "card": {
        "def": {},
        "type": "object"
    },
    "get_card": {
        "def": {
            "normal": false,
            "senior": false,
            "week": false
        },
        "type": "object"
    },
    "first_buy_gift": {
        "def": 0,
        "type": "number"
    },
    "package": {
        "def": {},
        "type": "object"
    },
    "guide": {
        "def": 0,
        "type": "number"
    },
    "guide_weak": {
        "def": {
            "laser": false,
            "laserTimes": 3,
            "achieve": false,
            "reward": false,
            "petfish": false,
            "goddess": false,
            "specials": {}
        },
        "type": "object"
    },
    "active": {
        "def": {},
        "type": "object"
    },
    "active_daily_reset": {
        "def": {},
        "type": "object"
    },
    "active_stat_once": {
        "def": {},
        "type": "object"
    },
    "active_stat_reset": {
        "def": {},
        "type": "object"
    },
    "active_stat_newbie": {
        "def": {},
        "type": "object"
    },
    "mail_box": {
        "def": [],
        "type": "object"
    },
    "free_draw": {
        "def": init_free_draw(),
        "type": "object"
    },
    "total_draw": {
        "def": {
            "gold": 0,
            "diamond": 0
        },
        "type": "object"
    },
    "roipct_time": {
        "def": 0,
        "type": "number"
    },
    "aquarium": {
        "def": {},
        "type": "object"
    },
    "goddess": {
        "def": [{
            "id": 1,
            "level": 1,
            "hp": 100,
            "startWaveIdx": 0,
            //"free": 0,
            "ctimes": 0,
            "unlock": [2, 2, 2, 2, 2, 2, 2, 2, 2],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 2,
            "level": 0,
            "hp": 100,
            "startWaveIdx": 0,
            //"free": 0,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 3,
            "level": 0,
            "hp": 100,
            "startWaveIdx": 0,
            //"free": 0,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 4,
            "level": 0,
            "hp": 200,
            "startWaveIdx": 0,
            //"free": 0,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 5,
            "level": 0,
            "hp": 100,
            "startWaveIdx": 0,
            //"free": 0,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }],
        "type": "object"
    },
    "free_goddess": {
        "def": [1, 1, 1, 1, 1],
        "type": "object"
    },
    "goddess_free": {
        "def": 1,
        "type": "number"
    },
    "goddess_ctimes": {
        "def": 0,
        "type": "number"
    },
    "goddess_crossover": {
        "def": 0,
        "type": "number"
    },
    "goddess_ongoing": {
        "def": 0,
        "type": "number"
    },
    "goddess_jump": {
        "def": 0,
        "type": "number"
    },
    "redress_no": {
        "def": 0,
        "type": "number"
    },
    "test": {
        "def": 1,
        "type": "number"
    },
    "rank_in_friends": {
        "def": 0,
        "type": "number"
    },
    "over_me_friends": {
        "def": [],
        "type": "object"
    },
    "charm_rank": {
        "def": 0,
        "type": "number"
    },
    "charm_point": {
        "def": 100,
        "type": "number"
    },
    //10.23 update
    "sex": {
        "def": 0,
        "type": "number"
    },
    "city": {
        "def": "",
        "type": "string"
    },
    "game_friend": {
        "def": [],
        "type": "object"
    },
    "channel_game_friend": {
        "def": [],
        "type": "object"
    },
    "bp": {
        "def": 0,
        "type": "number"
    },
    "phone": {
        "def": '',
        "type": "string"
    },
    //2018.3.13 dfc
    "first_turntable_draw": {
        "def": 0,
        "type": "number"
    },
    //2018.4.28 dfc
    "mission_daily_reset_reward": {
        "def": {},
        "type": "object"
    },
    "mission_only_once_reward": {
        "def": {},
        "type": "object"
    },
    "month_sign": {
        "def": [],
        "type": "object"
    },
    "sid": {
        "def": 1,
        "type": "number"
    },
    "match_on": {
        "def": 1,
        "type": "number"
    },
    "cik_on": {
        "def": 1,
        "type": "number"
    },
    "cdkey_on": {
        "def": 1,
        "type": "number"
    },
    "msgboard_mgmt": {
        "def": 0,
        "type": "number"
    },
    "192.168.35.234_wave": {
        "def": 0,
        "type": "number"
    },
    "goddess_balance_time": {
        "def": '1970-01-02 00:00:00',
        "type": "timestamp"
    },
    "week_reward": {
        "def": 0,
        "type": "number"
    },
    "week_rank": {
        "def": 0,
        "type": "number"
    },
    "petfish_recent_time": {
        "def": '1970-01-02 00:00:00',
        "type": "timestamp"
    },
    "petfish_total_level": {
        "def": 0,
        "type": "number"
    },
    "match_recent_time": {
        "def": '1970-01-02 00:00:00',
        "type": "timestamp"
    },
    "match_win": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "match_fail": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "match_points": {
        "def": 800,
        "type": "number",
        "inc":true,
        "min":0,
    },
    "match_rank": {
        "def": 5,
        "type": "number",
        "inc":true
    },
    "match_unfinish": {
        "def": 0,
        "type": "number"
    },
    "match_box_list": {
        "def": [0, 0, 0],
        "type": "object"
    },
    "match_box_timestamp": {
        "def": [0, 0, 0],
        "type": "object"
    },
    "match_1st_box": {
        "def": {
            "stat": 1,
            "timestamp": 0,
            "id": 0
        },
        "type": "object"
    },
    "match_season_count": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "match_season_win": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "match_season_box": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "match_season_1st_win": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "match_got_season_reward": {
        "def": 1,
        "type": "number"
    },
    "match_winning_streak": {
        "def": 0,
        "type": "number"
    },
    "gold_total_gain": {
        "def": 0,
        "type": "number"
    },
    "gold_total_cost": {
        "def": 0,
        "type": "number"
    },
    "gold_shop_count": {
        "def": 0,
        "type": "number"
    },
    "gold_shop_amount": {
        "def": 0,
        "type": "number"
    },
    "diamond_total_gain": {
        "def": 0,
        "type": "number"
    },
    "diamond_total_cost": {
        "def": 0,
        "type": "number"
    },
    "diamond_shop_count": {
        "def": 0,
        "type": "number"
    },
    "diamond_shop_amount": {
        "def": 0,
        "type": "number"
    },
    "has_social": {
        "def": 0,
        "type": "number"
    },
    "social_invite_friends": {
        "def": [],
        "type": "object"
    },
    "social_share_friends": {
        "def": [],
        "type": "object"
    },
    "social_invite_progress": {
        "def": 0,
        "type": "number"
    },
    "social_invite_daily_state": {
        "def": 0,
        "type": "number"
    },
    "social_invite_reward": {
        "def": 0,
        "type": "number"
    },
    "social_share_status_0": {
        "def": {},
        "type": "object"
    },
    "social_share_status_1": {
        "def": {},
        "type": "object"
    },
    "social_share_status_2": {
        "def": {},
        "type": "object"
    },
    "social_enshrine_status": {
        "def": 0,
        "type": "number"
    },
    "social_share_top_gold": {
        "def": 0,
        "type": "number"
    },
    "social_share_top_rank": {
        "def": 0,
        "type": "number"
    },
    "figure_url": {
        "def": "default.png",
        "type": "string"
    },
    "new_player": {
        "def": 1,
        "type": "number"
    },
    "need_insert": {
        "def": 1,
        "type": "number"
    },
    "need_update": {
        "def": 1,
        "type": "number"
    },
    "online_time": {
        "def": 0,
        "type": "number"
    },
    "vip_fill_this_time": {
        "def": 0,
        "type": "number"
    },
    "flower_receive_weekly": {
        "def": 0,
        "type": "number",
    },
    //2018.2.25 add dfc
    "month_sign_extra_reward": {
        "def": {},
        "type": "object",
    },
    //2018.2.28 add dfc
    "social_daily_invite_reward": {
        "def": [],
        "type": "object",
    },
    "social_invite_week": {
        "def": [],
        "type": "object",
    },
    "social_invite_month": {
        "def": [],
        "type": "object",
    },
    //2018.3.13 add dfc
    "free_bomb": {
        "def": 0,
        "type": "number",
    },
    //2018.4.23 add dfc 是否禁言
    "talk_forbidden": {
        "def": 0,
        "type": "number",
        "name": "talk_forbidden"
    },

    "flower_receive": {
        "def": 0,
        "type": "number",
    },

    "horn_used": {
        "def": 0,
        "type": "number",
    },

    "flower_send": {
        "def": 0,
        "type": "number",
    },
    //玩家扩展数据
    "extend":{
        "def": {},
        "type": "object",
    },
    "goddess_free_pause_away":{
        "def": [0, 0, 0, 0, 0],
        "type": "object",
    },

    "arena_win": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "arena_fail": {
        "def": 0,
        "type": "number",
        "inc": true
    },

    "arena_star": {
        "def": 0,
        "type": "number",
    },

    "arena_box_state": {
        "def": 0,
        "type": "number",
    },

    "arena_matchid": {
        "def": '',
        "type": "string",
    },

    "arena_matchid_list": {
        "def": [],
        "type": "object",
    },
};

module.exports.ArenaModel = {
    "arena_created_at": {
        "def": '1970-01-02 00:00:00',
        "type": "timestamp"
    },
    "arena_inviter": {
        "def": {},
        "type": "object"
    },
    "arena_invitee": {
        "def": {},
        "type": "object"
    },
    "arena_state": {
        "def": 1,
        "type": "number"
    }
};
