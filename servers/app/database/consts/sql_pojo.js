exports.fields = {
    "id": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "id"
    },
    "jointype": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "jointype"
    },
    "who_invite_me": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "who_invite_me"
    },
    "who_share_me": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "who_share_me"
    },
    "nickname": {
        "def": null,
        "type": "string",
        "table": "tbl_account",
        "name": "nickname"
    },
    "password": {
        "def": null,
        "type": "string",
        "table": "tbl_account",
        "name": "password"
    },
    "pwd_history": {
        "def": null,
        "type": "string",
        "table": "tbl_account",
        "name": "pwd_history"
    },
    "vip": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "vip"
    },
    "login_count": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "login_count"
    },
    "logout_count": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "logout_count"
    },
    "created_at": {
        "def": 0,
        "type": "timestamp",
        "table": "tbl_account",
        "name": "created_at"
    },
    "updated_at": {
        "def": 0,
        "type": "timestamp",
        "table": "tbl_account",
        "name": "updated_at"
    },
    "last_online_time": {
        "def": 0,
        "type": "timestamp",
        "table": "tbl_account",
        "name": "last_online_time"
    },
    "salt": {
        "def": null,
        "type": "string",
        "table": "tbl_account",
        "name": "salt"
    },
    "token": {
        "def": null,
        "type": "string",
        "table": "tbl_account",
        "name": "token"
    },
    "gold": {
        "def": 1000,
        "type": "number",
        "table": "tbl_account",
        "name": "gold",
        "inc": true
    },
    "pearl": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "pearl"
    },
    "weapon": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "weapon"
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
        "type": "object",
        "table": "tbl_account",
        "name": "skill"
    },
    "broke_times": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "broke_times"
    },
    "first_login": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "first_login"
    },
    "day_reward": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "day_reward"
    },
    "day_reward_adv": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "day_reward_adv"
    },
    "new_reward_adv": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "new_reward_adv"
    },
    "day_reward_weekly": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "day_reward_weekly"
    },
    "vip_daily_fill": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "vip_daily_fill"
    },
    "rmb": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "rmb"
    },
    "channel": {
        "def": "fj",
        "type": "string",
        "table": "tbl_account",
        "name": "channel"
    },
    "channel_account_id": {
        "def": null,
        "type": "string",
        "table": "tbl_account",
        "name": "channel_account_id"
    },
    "platform": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "platform"
    },
    "vip_weapon_id": {
        "def": null,
        "type": "string",
        "table": "tbl_account",
        "name": "vip_weapon_id"
    },
    "pfft_at": {
        "def": 0,
        "type": "timestamp",
        "table": "tbl_account",
        "name": "pfft_at"
    },
    "channel_account_name": {
        "def": null,
        "type": "string",
        "table": "tbl_account",
        "name": "channel_account_name"
    },
    "channel_account_info": {
        "def": null,
        "type": "string",
        "table": "tbl_account",
        "name": "channel_account_info"
    },
    "exp": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "exp"
    },
    "level": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "level"
    },
    "level_mission": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "level_mission"
    },
    "mission_daily_reset": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "mission_daily_reset"
    },
    "mission_only_once": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "mission_only_once"
    },
    "first_buy": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "first_buy"
    },
    "activity_gift": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "activity_gift"
    },
    "heartbeat": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "heartbeat"
    },
    "heartbeat_min_cost": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "heartbeat_min_cost"
    },
    "achieve_point": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "achieve_point"
    },
    "gold_shopping": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "gold_shopping"
    },
    "weapon_skin": {
        "def": {
            "own": [1],
            "equip": 1
        },
        "type": "object",
        "table": "tbl_account",
        "name": "weapon_skin"
    },
    "bonus": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "bonus"
    },
    "drop_reset": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "drop_reset"
    },
    "drop_once": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "drop_once"
    },
    "comeback": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "comeback"
    },
    "vip_gift": {
        "def": [],
        "type": "object",
        "table": "tbl_account",
        "name": "vip_gift"
    },
    "weapon_energy": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "weapon_energy"
    },
    "pirate": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "pirate"
    },
    "card": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "card"
    },
    "get_card": {
        "def": {
            "normal": false,
            "senior": false
        },
        "type": "object",
        "table": "tbl_account",
        "name": "get_card"
    },
    "first_buy_gift": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "first_buy_gift"
    },
    "package": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "package"
    },
    "guide": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "guide"
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
        "type": "object",
        "table": "tbl_account",
        "name": "guide_weak"
    },
    "active": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "active"
    },
    "active_daily_reset": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "active_daily_reset"
    },
    "active_stat_once": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "active_stat_once"
    },
    "active_stat_reset": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "active_stat_reset"
    },
    "mail_box": {
        "def": [],
        "type": "object",
        "table": "tbl_account",
        "name": "mail_box"
    },
    "free_draw": {
        "def": {
            "gold": 1,
            "diamond": 0
        },
        "type": "object",
        "table": "tbl_account",
        "name": "free_draw"
    },
    "total_draw": {
        "def": {
            "gold": 0,
            "diamond": 0
        },
        "type": "object",
        "table": "tbl_account",
        "name": "total_draw"
    },
    "roipct_time": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "roipct_time"
    },
    "aquarium": {
        "def": {},
        "type": "object",
        "table": "tbl_account",
        "name": "aquarium"
    },
    "goddess": {
        "def": [{
            "id": 1,
            "level": 1,
            "hp": 100,
            "startWaveIdx": 0,
            "free": 1,
            "ctimes": 0,
            "unlock": [2, 2, 2, 2, 2, 2, 2, 2, 2],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 2,
            "level": 0,
            "hp": 100,
            "startWaveIdx": 0,
            "free": 1,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 3,
            "level": 0,
            "hp": 100,
            "startWaveIdx": 0,
            "free": 1,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 4,
            "level": 0,
            "hp": 200,
            "startWaveIdx": 0,
            "free": 1,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 5,
            "level": 0,
            "hp": 100,
            "startWaveIdx": 0,
            "free": 1,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }],
        "type": "object",
        "table": "tbl_account",
        "name": "goddess"
    },
    "free_goddess": {
        "def": [1, 1, 1, 1, 1],
        "type": "object",
        "table": "tbl_account",
        "name": "free_goddess"
    },
    "goddess_free": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "goddess_free"
    },
    "goddess_ctimes": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "goddess_ctimes"
    },
    "goddess_crossover": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "goddess_crossover"
    },
    "goddess_ongoing": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "goddess_ongoing"
    },
    "redress_no": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "redress_no"
    },
    "test": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "test"
    },
    "rank_in_friends": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "rank_in_friends"
    },
    "over_me_friends": {
        "def": [],
        "type": "object",
        "table": "tbl_account",
        "name": "over_me_friends"
    },
    "charm_rank": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "charm_rank"
    },
    "charm_point": {
        "def": 100,
        "type": "number",
        "table": "tbl_account",
        "name": "charm_point"
    },
    "month_sign": {
        "def": [],
        "type": "object",
        "table": "tbl_account_sign",
        "name": "month_sign"
    },
    "match_on": {
        "def": 1,
        "type": "number",
        "table": "tbl_switch",
        "name": "match_on"
    },
    "cik_on": {
        "def": 1,
        "type": "number",
        "table": "tbl_switch",
        "name": "cik_on"
    },
    "cdkey_on": {
        "def": 1,
        "type": "number",
        "table": "tbl_switch",
        "name": "cdkey_on"
    },
    "msgboard_mgmt": {
        "def": 0,
        "type": "number",
        "table": "tbl_switch",
        "name": "msgboard_mgmt"
    },
    "max_wave": {
        "def": 0,
        "type": "number",
        "table": "tbl_goddess",
        "name": "max_wave"
    },
    "goddess_balance_time": {
        "def": 0,
        "type": "timestamp",
        "table": "tbl_goddess",
        "name": "updated_at"
    },
    "week_reward": {
        "def": 0,
        "type": "number",
        "table": "tbl_goddess",
        "name": "week_reward"
    },
    "week_rank": {
        "def": 0,
        "type": "number",
        "table": "tbl_goddess",
        "name": "week_rank"
    },
    "petfish_recent_time": {
        "def": 0,
        "type": "timestamp",
        "table": "tbl_aquarium",
        "name": "updated_at"
    },
    "petfish_total_level": {
        "def": 0,
        "type": "number",
        "table": "tbl_aquarium",
        "name": "total_level"
    },
    "match_recent_time": {
        "def": 0,
        "type": "timestamp",
        "table": "tbl_rankgame",
        "name": "updated_at"
    },
    "match_win": {
        "def": 0,
        "type": "number",
        "table": "tbl_rankgame",
        "name": "win"
    },
    "match_fail": {
        "def": 0,
        "type": "number",
        "table": "tbl_rankgame",
        "name": "fail"
    },
    "match_points": {
        "def": 800,
        "type": "number",
        "table": "tbl_rankgame",
        "name": "points"
    },
    "match_rank": {
        "def": 1,
        "type": "number",
        "table": "tbl_rankgame",
        "name": "rank"
    },
    "match_unfinish": {
        "def": 0,
        "type": "number",
        "table": "tbl_rankgame",
        "name": "unfinish"
    },
    "match_box_list": {
        "def": [0, 0, 0],
        "type": "object",
        "table": "tbl_rankgame",
        "name": "box"
    },
    "match_box_timestamp": {
        "def": [0, 0, 0],
        "type": "object",
        "table": "tbl_rankgame",
        "name": "box_timestamp"
    },
    "match_1st_box": {
        "def": {
            "stat": 1,
            "timestamp": 0,
            "id": 0
        },
        "type": "object",
        "table": "tbl_rankgame",
        "name": "first_box"
    },
    "match_season_count": {
        "def": 0,
        "type": "number",
        "table": "tbl_rankgame",
        "name": "season_count"
    },
    "match_season_win": {
        "def": 0,
        "type": "number",
        "table": "tbl_rankgame",
        "name": "season_win"
    },
    "match_season_box": {
        "def": 0,
        "type": "number",
        "table": "tbl_rankgame",
        "name": "season_box"
    },
    "match_season_1st_win": {
        "def": 0,
        "type": "number",
        "table": "tbl_rankgame",
        "name": "season_first_win"
    },
    "match_got_season_reward": {
        "def": 1,
        "type": "number",
        "table": "tbl_rankgame",
        "name": "is_season_reward"
    },
    "match_winning_streak": {
        "def": 0,
        "type": "number",
        "table": "tbl_rankgame",
        "name": "winning_streak"
    },
    "has_social": {
        "def": 0,
        "type": "number",
        "table": "tbl_social",
        "name": "id"
    },
    "social_invite_friends": {
        "def": [],
        "type": "object",
        "table": "tbl_social",
        "name": "invite_friends"
    },
    "social_share_friends": {
        "def": [],
        "type": "object",
        "table": "tbl_social",
        "name": "share_friends"
    },
    "social_invite_progress": {
        "def": 0,
        "type": "number",
        "table": "tbl_social",
        "name": "invite_progress"
    },
    "social_invite_daily_state": {
        "def": 0,
        "type": "number",
        "table": "tbl_social",
        "name": "social_invite_daily_state"
    },
    "social_invite_reward": {
        "def": 0,
        "type": "number",
        "table": "tbl_social",
        "name": "invite_reward"
    },
    "social_share_status_0": {
        "def": {},
        "type": "object",
        "table": "tbl_social",
        "name": "share_status_0"
    },
    "social_share_status_1": {
        "def": {},
        "type": "object",
        "table": "tbl_social",
        "name": "share_status_1"
    },
    "social_share_status_2": {
        "def": {},
        "type": "object",
        "table": "tbl_social",
        "name": "share_status_2"
    },
    "social_enshrine_status": {
        "def": 0,
        "type": "number",
        "table": "tbl_social",
        "name": "enshrine_status"
    },
    "social_share_top_gold": {
        "def": 0,
        "type": "number",
        "table": "tbl_social",
        "name": "share_top_gold"
    },
    "social_share_top_rank": {
        "def": 0,
        "type": "number",
        "table": "tbl_social",
        "name": "share_top_rank"
    },
    "figure_url": {
        "def": "http://p3.wmpic.me/article/2015/05/18/1431913649_GWJqwtVU.jpeg",
        "type": "string",
        "table": "tbl_img",
        "name": "web_url"
    },
    "new_player": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "new_player"
    },
    "need_insert": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "need_insert"
    },
    "need_update": {
        "def": 1,
        "type": "number",
        "table": "tbl_account",
        "name": "need_update"
    },
    "online_time": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "online_time"
    },
    "vip_fill_this_time": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "vip_fill_this_time"
    },
    //10.23 update
    "sex": {
        "def": 0,
        "type": "number",
        "table": "tbl_account",
        "name": "sex"
    },
    "city": {
        "def": "",
        "type": "string",
        "table": "tbl_account",
        "name": "city"
    },
    "game_friend":{
        "def": "",
        "type": "object",
        "table": "tbl_account",
        "name": "game_friend"
    }
};


exports.tables = {
    "tbl_account": {
        def:"id"
    },
    "tbl_account_sign": {
        def:"id"
    },
    "tbl_switch": {
        def:"id"
    },
    "tbl_goddess": {
        def:"id"
    },
    "tbl_aquarium": {
        def:"id"
    },
    "tbl_rankgame": {
        def:"id"
    },
    "tbl_social": {
        def:"id"
    }
};
exports.tbl_account = {
    "id": {
        "def": 0,
        "type": "number",
        "name": "id"
    },
    "jointype": {
        "def": 0,
        "type": "number",
        "name": "jointype"
    },
    "who_invite_me": {
        "def": 0,
        "type": "number",
        "name": "who_invite_me"
    },
    "who_share_me": {
        "def": 0,
        "type": "number",
        "name": "who_share_me"
    },
    "nickname": {
        "def": null,
        "type": "string",
        "name": "nickname"
    },
    "password": {
        "def": null,
        "type": "string",
        "name": "password"
    },
    "pwd_history": {
        "def": null,
        "type": "string",
        "name": "pwd_history"
    },
    "vip": {
        "def": 0,
        "type": "number",
        "name": "vip"
    },
    "login_count": {
        "def": 0,
        "type": "number",
        "name": "login_count"
    },
    "logout_count": {
        "def": 0,
        "type": "number",
        "name": "logout_count"
    },
    "created_at": {
        "def": 0,
        "type": "timestamp",
        "name": "created_at"
    },
    "updated_at": {
        "def": 0,
        "type": "timestamp",
        "name": "updated_at"
    },
    "last_online_time": {
        "def": 0,
        "type": "timestamp",
        "name": "last_online_time"
    },
    "salt": {
        "def": null,
        "type": "string",
        "name": "salt"
    },
    "token": {
        "def": null,
        "type": "string",
        "name": "token"
    },
    "gold": {
        "def": 1000,
        "type": "number",
        "name": "gold"
    },
    "pearl": {
        "def": 0,
        "type": "number",
        "name": "pearl"
    },
    "weapon": {
        "def": 1,
        "type": "number",
        "name": "weapon"
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
        "type": "object",
        "name": "skill"
    },
    "broke_times": {
        "def": 0,
        "type": "number",
        "name": "broke_times"
    },
    "first_login": {
        "def": 1,
        "type": "number",
        "name": "first_login"
    },
    "day_reward": {
        "def": 1,
        "type": "number",
        "name": "day_reward"
    },
    "day_reward_adv": {
        "def": 0,
        "type": "number",
        "name": "day_reward_adv"
    },
    "new_reward_adv": {
        "def": 0,
        "type": "number",
        "name": "new_reward_adv"
    },
    "day_reward_weekly": {
        "def": 0,
        "type": "number",
        "name": "day_reward_weekly"
    },
    "vip_daily_fill": {
        "def": 1,
        "type": "number",
        "name": "vip_daily_fill"
    },
    "rmb": {
        "def": 0,
        "type": "number",
        "name": "rmb"
    },
    "channel": {
        "def": "fj",
        "type": "string",
        "name": "channel"
    },
    "channel_account_id": {
        "def": null,
        "type": "string",
        "name": "channel_account_id"
    },
    "platform": {
        "def": 1,
        "type": "number",
        "name": "platform"
    },
    "vip_weapon_id": {
        "def": null,
        "type": "string",
        "name": "vip_weapon_id"
    },
    "pfft_at": {
        "def": 0,
        "type": "timestamp",
        "name": "pfft_at"
    },
    "channel_account_name": {
        "def": null,
        "type": "string",
        "name": "channel_account_name"
    },
    "channel_account_info": {
        "def": null,
        "type": "string",
        "name": "channel_account_info"
    },
    "exp": {
        "def": 0,
        "type": "number",
        "name": "exp"
    },
    "level": {
        "def": 1,
        "type": "number",
        "name": "level"
    },
    "level_mission": {
        "def": {},
        "type": "object",
        "name": "level_mission"
    },
    "mission_daily_reset": {
        "def": {},
        "type": "object",
        "name": "mission_daily_reset"
    },
    "mission_only_once": {
        "def": {},
        "type": "object",
        "name": "mission_only_once"
    },
    "first_buy": {
        "def": {},
        "type": "object",
        "name": "first_buy"
    },
    "activity_gift": {
        "def": {},
        "type": "object",
        "name": "activity_gift"
    },
    "heartbeat": {
        "def": 1,
        "type": "number",
        "name": "heartbeat"
    },
    "heartbeat_min_cost": {
        "def": 0,
        "type": "number",
        "name": "heartbeat_min_cost"
    },
    "achieve_point": {
        "def": 0,
        "type": "number",
        "name": "achieve_point"
    },
    "gold_shopping": {
        "def": 0,
        "type": "number",
        "name": "gold_shopping"
    },
    "weapon_skin": {
        "def": {
            "own": [1],
            "equip": 1
        },
        "type": "object",
        "name": "weapon_skin"
    },
    "bonus": {
        "def": {},
        "type": "object",
        "name": "bonus"
    },
    "drop_reset": {
        "def": {},
        "type": "object",
        "name": "drop_reset"
    },
    "drop_once": {
        "def": {},
        "type": "object",
        "name": "drop_once"
    },
    "comeback": {
        "def": {},
        "type": "object",
        "name": "comeback"
    },
    "vip_gift": {
        "def": [],
        "type": "object",
        "name": "vip_gift"
    },
    "weapon_energy": {
        "def": {},
        "type": "object",
        "name": "weapon_energy"
    },
    "pirate": {
        "def": {},
        "type": "object",
        "name": "pirate"
    },
    "card": {
        "def": {},
        "type": "object",
        "name": "card"
    },
    "get_card": {
        "def": {
            "normal": false,
            "senior": false
        },
        "type": "object",
        "name": "get_card"
    },
    "first_buy_gift": {
        "def": 0,
        "type": "number",
        "name": "first_buy_gift"
    },
    "package": {
        "def": {},
        "type": "object",
        "name": "package"
    },
    "guide": {
        "def": 0,
        "type": "number",
        "name": "guide"
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
        "type": "object",
        "name": "guide_weak"
    },
    "active": {
        "def": {},
        "type": "object",
        "name": "active"
    },
    "active_daily_reset": {
        "def": {},
        "type": "object",
        "name": "active_daily_reset"
    },
    "active_stat_once": {
        "def": {},
        "type": "object",
        "name": "active_stat_once"
    },
    "active_stat_reset": {
        "def": {},
        "type": "object",
        "name": "active_stat_reset"
    },
    "mail_box": {
        "def": {},
        "type": "object",
        "name": "mail_box"
    },
    "free_draw": {
        "def": {
            "gold": 1,
            "diamond": 0
        },
        "type": "object",
        "name": "free_draw"
    },
    "total_draw": {
        "def": {
            "gold": 0,
            "diamond": 0
        },
        "type": "object",
        "name": "total_draw"
    },
    "roipct_time": {
        "def": 0,
        "type": "number",
        "name": "roipct_time"
    },
    "aquarium": {
        "def": {},
        "type": "object",
        "name": "aquarium"
    },
    "goddess": {
        "def": [{
            "id": 1,
            "level": 1,
            "hp": 100,
            "startWaveIdx": 0,
            "ctimes": 0,
            "unlock": [2, 2, 2, 2, 2, 2, 2, 2, 2],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 2,
            "level": 0,
            "hp": 100,
            "startWaveIdx": 0,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 3,
            "level": 0,
            "hp": 100,
            "startWaveIdx": 0,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 4,
            "level": 0,
            "hp": 200,
            "startWaveIdx": 0,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }, {
            "id": 5,
            "level": 0,
            "hp": 100,
            "startWaveIdx": 0,
            "ctimes": 0,
            "unlock": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            "interactReward": [0, 0, 0, 0],
            "isPauseAway": false
        }],
        "type": "object",
        "name": "goddess"
    },
    "free_goddess": {
        "def": [1, 1, 1, 1, 1],
        "type": "object",
        "name": "free_goddess"
    },
    "goddess_free": {
        "def": 1,
        "type": "number",
        "name": "goddess_free"
    },
    "goddess_ctimes": {
        "def": 0,
        "type": "number",
        "name": "goddess_ctimes"
    },
    "goddess_crossover": {
        "def": 0,
        "type": "number",
        "name": "goddess_crossover"
    },
    "goddess_ongoing": {
        "def": 0,
        "type": "number",
        "name": "goddess_ongoing"
    },
    "figure": {
        "def": 1,
        "type": "number",
        "name": "figure"
    },
    "redress_no": {
        "def": 0,
        "type": "number",
        "name": "redress_no"
    },
    "test": {
        "def": 1,
        "type": "number",
        "name": "test"
    },
    "rank_in_friends": {
        "def": 0,
        "type": "number",
        "name": "rank_in_friends"
    },
    "over_me_friends": {
        "def": [],
        "type": "object",
        "name": "over_me_friends"
    },
    "charm_rank": {
        "def": 0,
        "type": "number",
        "name": "charm_rank"
    },
    "charm_point": {
        "def": 100,
        "type": "number",
        "name": "charm_point"
    },
    //10.23 update
    "sex": {
        "def": 0,
        "type": "number",
        "name": "sex"
    },
    "city": {
        "def": "",
        "type": "string",
        "name": "city"
    },
    "game_friend":{
        "def": "",
        "type": "object",
        "name": "game_friend"
    }
};
exports.tbl_img = {
    "figure": {
        "def": 0,
        "type": "number",
        "name": "id"
    },
    "figure_url": {
        "def": "http://p3.wmpic.me/article/2015/05/18/1431913649_GWJqwtVU.jpeg",
        "type": "string",
        "name": "web_url"
    }
};
exports.tbl_account_sign = {
    "id": {
        "def": 0,
        "type": "number",
        "name": "id"
    },
    "month_sign": {
        "def": [],
        "type": "object",
        "name": "month_sign"
    }
};
exports.tbl_switch = {
    "id": {
        "def": 0,
        "type": "number",
        "name": "id"
    },
    "match_on": {
        "def": 1,
        "type": "number",
        "name": "match_on"
    },
    "msgboard_mgmt": {
        "def": 1,
        "type": "number",
        "name": "msgboard_mgmt"
    },
    "cik_on": {
        "def": 1,
        "type": "number",
        "name": "cik_on"
    },
    "cdkey_on": {
        "def": 1,
        "type": "number",
        "name": "cdkey_on"
    }
};

exports.tbl_goddess = {
    "id": {
        "def": 0,
        "type": "number",
        "name": "id"
    },
    "max_wave": {
        "def": 0,
        "type": "number",
        "name": "max_wave"
    },
    "goddess_balance_time": {
        "def": 0,
        "type": "timestamp",
        "name": "updated_at"
    },
    "week_reward": {
        "def": 0,
        "type": "number",
        "name": "week_reward"
    },
    "week_rank": {
        "def": 0,
        "type": "number",
        "name": "week_rank"
    }
};

exports.tbl_aquarium = {
    "id": {
        "def": 0,
        "type": "number",
        "name": "id"
    },
    "petfish_total_level": {
        "def": 0,
        "type": "number",
        "name": "total_level"
    },
    "petfish_recent_time": {
        "def": 0,
        "type": "timestamp",
        "name": "updated_at"
    }
};

exports.tbl_rankgame = {
    "id": {
        "def": 0,
        "type": "number",
        "name": "id"
    },
    "match_recent_time": {
        "def": 0,
        "type": "timestamp",
        "name": "updated_at"
    },
    "match_win": {
        "def": 0,
        "type": "number",
        "name": "win"
    },
    "match_fail": {
        "def": 0,
        "type": "number",
        "name": "fail"
    },
    "match_points": {
        "def": 800,
        "type": "number",
        "name": "points"
    },
    "match_rank": {
        "def": 1,
        "type": "number",
        "name": "rank"
    },
    "match_unfinish": {
        "def": 0,
        "type": "number",
        "name": "unfinish"
    },
    "match_box_list": {
        "def": [0, 0, 0],
        "type": "object",
        "name": "box"
    },
    "match_box_timestamp": {
        "def": [0, 0, 0],
        "type": "object",
        "name": "box_timestamp"
    },
    "match_1st_box": {
        "def": {
            "stat": 1,
            "timestamp": 0,
            "id": 0
        },
        "type": "object",
        "name": "first_box"
    },
    "match_season_count": {
        "def": 0,
        "type": "number",
        "name": "season_count"
    },
    "match_season_win": {
        "def": 0,
        "type": "number",
        "name": "season_win"
    },
    "match_season_box": {
        "def": 0,
        "type": "number",
        "name": "season_box"
    },
    "match_season_1st_win": {
        "def": 0,
        "type": "number",
        "name": "season_first_win"
    },
    "match_got_season_reward": {
        "def": 1,
        "type": "number",
        "name": "is_season_reward"
    },
    "match_winning_streak": {
        "def": 0,
        "type": "number",
        "name": "winning_streak"
    }
};

exports.tbl_gold = {
    "id": {
        "def": 0,
        "type": "number",
        "name": "account_id"
    },
    "gold_total_gain": {
        "def": 0,
        "type": "number",
        "name": "total_gain"
    },
    "gold_total_cost": {
        "def": 0,
        "type": "number",
        "name": "total_cost"
    },
    "gold_shop_count": {
        "def": 0,
        "type": "number",
        "name": "shop_count"
    },
    "gold_shop_amount": {
        "def": 0,
        "type": "number",
        "name": "shop_amount"
    }
};

exports.tbl_pearl = {
    "id": {
        "def": 0,
        "type": "number",
        "name": "account_id"
    },
    "diamond_total_gain": {
        "def": 0,
        "type": "number",
        "name": "total_gain"
    },
    "diamond_total_cost": {
        "def": 0,
        "type": "number",
        "name": "total_cost"
    },
    "diamond_shop_count": {
        "def": 0,
        "type": "number",
        "name": "shop_count"
    },
    "diamond_shop_amount": {
        "def": 0,
        "type": "number",
        "name": "shop_amount"
    }
};

exports.tbl_social = {
    "id": {
        "def": 0,
        "type": "number",
        "name": "id"
    },
    "social_invite_friends": {
        "def": [],
        "type": "object",
        "name": "invite_friends"
    },
    "social_share_friends": {
        "def": [],
        "type": "object",
        "name": "share_friends"
    },
    "social_invite_progress": {
        "def": 0,
        "type": "number",
        "name": "invite_progress"
    },
    "social_invite_reward": {
        "def": 0,
        "type": "number",
        "name": "invite_reward"
    },
    "social_share_status_0": {
        "def": {},
        "type": "object",
        "name": "share_status_0"
    },
    "social_share_status_1": {
        "def": {},
        "type": "object",
        "name": "share_status_1"
    },
    "social_share_status_2": {
        "def": {},
        "type": "object",
        "name": "share_status_2"
    },
    "social_enshrine_status": {
        "def": 0,
        "type": "number",
        "name": "enshrine_status"
    },
    "social_share_top_gold": {
        "def": 0,
        "type": "number",
        "name": "share_top_gold"
    },
    "social_share_top_rank": {
        "def": 0,
        "type": "number",
        "name": "share_top_rank"
    }
};

exports.need_update_fields = {
    "mail_box": {},
    "month_sign": {},
    "match_box_list": {},
    "match_box_timestamp": {},
    "invite_friends": {},
    "share_friends": {}
};

/**
 * 锟斤拷锟斤拷指锟斤拷锟街讹拷锟斤拷锟酵猴拷默锟斤拷值[type, def]
 */
exports.getField = function (field) {
    return exports.fields[field];
};