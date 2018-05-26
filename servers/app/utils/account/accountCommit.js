const commit = require('../../models/commit');

/**
 * 动态代码，自动生成
 */
class AccountCommit extends commit{
    constructor(id){
        super(id);
    }

    get id() {
        return Number(this.__id);
    }

    set who_invite_me(value) {
        this._modify('who_invite_me', value);
    }

    get who_invite_me() {
        return this._value('who_invite_me');
    }

    set tempname(value) {
        this._modify('tempname', value);
    }

    get tempname() {
        return this._value('tempname');
    }

    set who_share_me(value) {
        this._modify('who_share_me', value);
    }

    get who_share_me() {
        return this._value('who_share_me');
    }

    set nickname(value) {
        this._modify('nickname', value);
    }

    get nickname() {
        return this._value('nickname');
    }

    set password(value) {
        this._modify('password', value);
    }

    get password() {
        return this._value('password');
    }

    set pwd_history(value) {
        this._modify('pwd_history', value);
    }

    get pwd_history() {
        return this._value('pwd_history');
    }

    set vip(value) {
        this._modify('vip', value);
    }

    get vip() {
        return this._value('vip');
    }

    set login_count(value) {
        this._modify('login_count', value);
    }

    get login_count() {
        return this._value('login_count');
    }

    set logout_count(value) {
        this._modify('logout_count', value);
    }

    get logout_count() {
        return this._value('logout_count');
    }

    set created_at(value) {
        this._modify('created_at', value);
    }

    get created_at() {
        return this._value('created_at');
    }

    set updated_at(value) {
        this._modify('updated_at', value);
    }

    get updated_at() {
        return this._value('updated_at');
    }

    set last_online_time(value) {
        this._modify('last_online_time', value);
    }

    get last_online_time() {
        return this._value('last_online_time');
    }

    set salt(value) {
        this._modify('salt', value);
    }

    get salt() {
        return this._value('salt');
    }

    set token(value) {
        this._modify('token', value);
    }

    get token() {
        return this._value('token');
    }

    set gold(value) {
        this._modify('gold', value);
    }

    get gold() {
        return this._value('gold');
    }

    set pearl(value) {
        this._modify('pearl', value);
    }

    get pearl() {
        return this._value('pearl');
    }

    set weapon(value) {
        this._modify('weapon', value);
    }

    get weapon() {
        return this._value('weapon');
    }

    set skill(value) {
        this._modify('skill', value);
    }

    get skill() {
        return this._value('skill');
    }

    set broke_times(value) {
        this._modify('broke_times', value);
    }

    get broke_times() {
        return this._value('broke_times');
    }

    set first_login(value) {
        this._modify('first_login', value);
    }

    get first_login() {
        return this._value('first_login');
    }

    set day_reward(value) {
        this._modify('day_reward', value);
    }

    get day_reward() {
        return this._value('day_reward');
    }

    set day_reward_adv(value) {
        this._modify('day_reward_adv', value);
    }

    get day_reward_adv() {
        return this._value('day_reward_adv');
    }

    set new_reward_adv(value) {
        this._modify('new_reward_adv', value);
    }

    get new_reward_adv() {
        return this._value('new_reward_adv');
    }

    set day_reward_weekly(value) {
        this._modify('day_reward_weekly', value);
    }

    get day_reward_weekly() {
        return this._value('day_reward_weekly');
    }

    set vip_daily_fill(value) {
        this._modify('vip_daily_fill', value);
    }

    get vip_daily_fill() {
        return this._value('vip_daily_fill');
    }

    set rmb(value) {
        this._modify('rmb', value);
    }

    get rmb() {
        return this._value('rmb');
    }

    set channel(value) {
        this._modify('channel', value);
    }

    get channel() {
        return this._value('channel');
    }

    set channel_account_id(value) {
        this._modify('channel_account_id', value);
    }

    get channel_account_id() {
        return this._value('channel_account_id');
    }

    set platform(value) {
        this._modify('platform', value);
    }

    get platform() {
        return this._value('platform');
    }

    set vip_weapon_id(value) {
        this._modify('vip_weapon_id', value);
    }

    get vip_weapon_id() {
        return this._value('vip_weapon_id');
    }

    set pfft_at(value) {
        this._modify('pfft_at', value);
    }

    get pfft_at() {
        return this._value('pfft_at');
    }

    set channel_account_name(value) {
        this._modify('channel_account_name', value);
    }

    get channel_account_name() {
        return this._value('channel_account_name');
    }

    set channel_account_info(value) {
        this._modify('channel_account_info', value);
    }

    get channel_account_info() {
        return this._value('channel_account_info');
    }

    set exp(value) {
        this._modify('exp', value);
    }

    get exp() {
        return this._value('exp');
    }

    set level_mission(value) {
        this._modify('level_mission', value);
    }

    get level_mission() {
        return this._value('level_mission');
    }

    set mission_daily_reset(value) {
        this._modify('mission_daily_reset', value);
    }

    get mission_daily_reset() {
        return this._value('mission_daily_reset');
    }

    set level(value) {
        this._modify('level', value);
    }

    get level() {
        return this._value('level');
    }

    set mission_only_once(value) {
        this._modify('mission_only_once', value);
    }

    get mission_only_once() {
        return this._value('mission_only_once');
    }

    set activity_gift(value) {
        this._modify('activity_gift', value);
    }

    get activity_gift() {
        return this._value('activity_gift');
    }

    set first_buy(value) {
        this._modify('first_buy', value);
    }

    get first_buy() {
        return this._value('first_buy');
    }

    set heartbeat(value) {
        this._modify('heartbeat', value);
    }

    get heartbeat() {
        return this._value('heartbeat');
    }

    set heartbeat_min_cost(value) {
        this._modify('heartbeat_min_cost', value);
    }

    get heartbeat_min_cost() {
        return this._value('heartbeat_min_cost');
    }

    set achieve_point(value) {
        this._modify('achieve_point', value);
    }

    get achieve_point() {
        return this._value('achieve_point');
    }

    set gold_shopping(value) {
        this._modify('gold_shopping', value);
    }

    get gold_shopping() {
        return this._value('gold_shopping');
    }

    set weapon_skin(value) {
        this._modify('weapon_skin', value);
    }

    get weapon_skin() {
        return this._value('weapon_skin');
    }

    set bonus(value) {
        this._modify('bonus', value);
    }

    get bonus() {
        return this._value('bonus');
    }

    set drop_reset(value) {
        this._modify('drop_reset', value);
    }

    get drop_reset() {
        return this._value('drop_reset');
    }

    set drop_once(value) {
        this._modify('drop_once', value);
    }

    get drop_once() {
        return this._value('drop_once');
    }

    set comeback(value) {
        this._modify('comeback', value);
    }

    get comeback() {
        return this._value('comeback');
    }

    set vip_gift(value) {
        this._modify('vip_gift', value);
    }

    get vip_gift() {
        return this._value('vip_gift');
    }

    set weapon_energy(value) {
        this._modify('weapon_energy', value);
    }

    get weapon_energy() {
        return this._value('weapon_energy');
    }

    set pirate(value) {
        this._modify('pirate', value);
    }

    get pirate() {
        return this._value('pirate');
    }

    set card(value) {
        this._modify('card', value);
    }

    get card() {
        return this._value('card');
    }

    set get_card(value) {
        this._modify('get_card', value);
    }

    get get_card() {
        return this._value('get_card');
    }

    set first_buy_gift(value) {
        this._modify('first_buy_gift', value);
    }

    get first_buy_gift() {
        return this._value('first_buy_gift');
    }

    set package(value) {
        this._modify('package', value);
    }

    get package() {
        return this._value('package');
    }

    set guide(value) {
        this._modify('guide', value);
    }

    get guide() {
        return this._value('guide');
    }

    set guide_weak(value) {
        this._modify('guide_weak', value);
    }

    get guide_weak() {
        return this._value('guide_weak');
    }

    set active(value) {
        this._modify('active', value);
    }

    get active() {
        return this._value('active');
    }

    set active_stat_once(value) {
        this._modify('active_stat_once', value);
    }

    get active_stat_once() {
        return this._value('active_stat_once');
    }

    set active_stat_reset(value) {
        this._modify('active_stat_reset', value);
    }

    get active_stat_reset() {
        return this._value('active_stat_reset');
    }

    set active_stat_newbie(value) {
        this._modify('active_stat_newbie', value);
    }

    get active_stat_newbie() {
        return this._value('active_stat_newbie');
    }

    set mail_box(value) {
        this._modify('mail_box', value);
    }

    get mail_box() {
        return this._value('mail_box');
    }

    set free_draw(value) {
        this._modify('free_draw', value);
    }

    get free_draw() {
        return this._value('free_draw');
    }

    set total_draw(value) {
        this._modify('total_draw', value);
    }

    get total_draw() {
        return this._value('total_draw');
    }

    set roipct_time(value) {
        this._modify('roipct_time', value);
    }

    get roipct_time() {
        return this._value('roipct_time');
    }

    set goddess(value) {
        this._modify('goddess', value);
    }

    get goddess() {
        return this._value('goddess');
    }

    set free_goddess(value) {
        this._modify('free_goddess', value);
    }

    get free_goddess() {
        return this._value('free_goddess');
    }

    set goddess_free(value) {
        this._modify('goddess_free', value);
    }

    get goddess_free() {
        return this._value('goddess_free');
    }

    set goddess_ctimes(value) {
        this._modify('goddess_ctimes', value);
    }

    get goddess_ctimes() {
        return this._value('goddess_ctimes');
    }

    set goddess_crossover(value) {
        this._modify('goddess_crossover', value);
    }

    get goddess_crossover() {
        return this._value('goddess_crossover');
    }

    set goddess_ongoing(value) {
        this._modify('goddess_ongoing', value);
    }

    get goddess_ongoing() {
        return this._value('goddess_ongoing');
    }

    set goddess_jump(value) {
        this._modify('goddess_jump', value);
    }

    get goddess_jump() {
        return this._value('goddess_jump');
    }

    set goddess_free_pause_away(value) {
        this._modify('goddess_free_pause_away', value);
    }

    get goddess_free_pause_away() {
        return this._value('goddess_free_pause_away');
    }

    set redress_no(value) {
        this._modify('redress_no', value);
    }

    get redress_no() {
        return this._value('redress_no');
    }

    set test(value) {
        this._modify('test', value);
    }

    get test() {
        return this._value('test');
    }

    set rank_in_friends(value) {
        this._modify('rank_in_friends', value);
    }

    get rank_in_friends() {
        return this._value('rank_in_friends');
    }

    set over_me_friends(value) {
        this._modify('over_me_friends', value);
    }

    get over_me_friends() {
        return this._value('over_me_friends');
    }

    set active_daily_reset(value) {
        this._modify('active_daily_reset', value);
    }

    get active_daily_reset() {
        return this._value('active_daily_reset');
    }

    set charm_rank(value) {
        this._modify('charm_rank', value);
    }

    get charm_rank() {
        return this._value('charm_rank');
    }

    set charm_point(value) {
        this._modify('charm_point', value);
    }

    get charm_point() {
        return this._value('charm_point');
    }

    set month_sign(value) {
        this._modify('month_sign', value);
    }

    get month_sign() {
        return this._value('month_sign');
    }

    set sid(value) {
        this._modify('sid', value);
    }

    get sid() {
        return this._value('sid');
    }

    set match_on(value) {
        this._modify('match_on', value);
    }

    get match_on() {
        return this._value('match_on');
    }

    set cik_on(value) {
        this._modify('cik_on', value);
    }

    get cik_on() {
        return this._value('cik_on');
    }

    set aquarium(value) {
        this._modify('aquarium', value);
    }

    get aquarium() {
        return this._value('aquarium');
    }

    set cdkey_on(value) {
        this._modify('cdkey_on', value);
    }

    get cdkey_on() {
        return this._value('cdkey_on');
    }

    set msgboard_mgmt(value) {
        this._modify('msgboard_mgmt', value);
    }

    get msgboard_mgmt() {
        return this._value('msgboard_mgmt');
    }

    set max_wave(value) {
        this._modify('max_wave', value);
    }

    get max_wave() {
        return this._value('max_wave');
    }

    set goddess_balance_time(value) {
        this._modify('goddess_balance_time', value);
    }

    get goddess_balance_time() {
        return this._value('goddess_balance_time');
    }

    set week_rank(value) {
        this._modify('week_rank', value);
    }

    get week_rank() {
        return this._value('week_rank');
    }

    set petfish_recent_time(value) {
        this._modify('petfish_recent_time', value);
    }

    get petfish_recent_time() {
        return this._value('petfish_recent_time');
    }

    set petfish_total_level(value) {
        this._modify('petfish_total_level', value);
    }

    get petfish_total_level() {
        return this._value('petfish_total_level');
    }

    set match_win(value) {
        this._modify('match_win', value);
    }

    get match_win() {
        return this._value('match_win');
    }

    set match_fail(value) {
        this._modify('match_fail', value);
    }

    get match_fail() {
        return this._value('match_fail');
    }

    set match_points(value) {
        this._modify('match_points', value);
    }

    get match_points() {
        return this._value('match_points');
    }

    set match_recent_time(value) {
        this._modify('match_recent_time', value);
    }

    get match_recent_time() {
        return this._value('match_recent_time');
    }

    set match_box_list(value) {
        this._modify('match_box_list', value);
    }

    get match_box_list() {
        return this._value('match_box_list');
    }

    set match_box_timestamp(value) {
        this._modify('match_box_timestamp', value);
    }

    get match_box_timestamp() {
        return this._value('match_box_timestamp');
    }

    set match_1st_box(value) {
        this._modify('match_1st_box', value);
    }

    get match_1st_box() {
        return this._value('match_1st_box');
    }

    set match_unfinish(value) {
        this._modify('match_unfinish', value);
    }

    get match_unfinish() {
        return this._value('match_unfinish');
    }

    set match_season_count(value) {
        this._modify('match_season_count', value);
    }

    get match_season_count() {
        return this._value('match_season_count');
    }

    set match_season_win(value) {
        this._modify('match_season_win', value);
    }

    get match_season_win() {
        return this._value('match_season_win');
    }

    set match_season_1st_win(value) {
        this._modify('match_season_1st_win', value);
    }

    get match_season_1st_win() {
        return this._value('match_season_1st_win');
    }

    set match_got_season_reward(value) {
        this._modify('match_got_season_reward', value);
    }

    get match_got_season_reward() {
        return this._value('match_got_season_reward');
    }

    set match_winning_streak(value) {
        this._modify('match_winning_streak', value);
    }

    get match_winning_streak() {
        return this._value('match_winning_streak');
    }

    set gold_total_gain(value) {
        this._modify('gold_total_gain', value);
    }

    get gold_total_gain() {
        return this._value('gold_total_gain');
    }

    set match_season_box(value) {
        this._modify('match_season_box', value);
    }

    get match_season_box() {
        return this._value('match_season_box');
    }

    set gold_shop_count(value) {
        this._modify('gold_shop_count', value);
    }

    get gold_shop_count() {
        return this._value('gold_shop_count');
    }

    set gold_shop_amount(value) {
        this._modify('gold_shop_amount', value);
    }

    get gold_shop_amount() {
        return this._value('gold_shop_amount');
    }

    set diamond_total_gain(value) {
        this._modify('diamond_total_gain', value);
    }

    get diamond_total_gain() {
        return this._value('diamond_total_gain');
    }

    set diamond_total_cost(value) {
        this._modify('diamond_total_cost', value);
    }

    get diamond_total_cost() {
        return this._value('diamond_total_cost');
    }

    set diamond_shop_count(value) {
        this._modify('diamond_shop_count', value);
    }

    get diamond_shop_count() {
        return this._value('diamond_shop_count');
    }

    set diamond_shop_amount(value) {
        this._modify('diamond_shop_amount', value);
    }

    get diamond_shop_amount() {
        return this._value('diamond_shop_amount');
    }

    set has_social(value) {
        this._modify('has_social', value);
    }

    get has_social() {
        return this._value('has_social');
    }

    set week_reward(value) {
        this._modify('week_reward', value);
    }

    get week_reward() {
        return this._value('week_reward');
    }

    set social_invite_friends(value) {
        this._modify('social_invite_friends', value);
    }

    get social_invite_friends() {
        return this._value('social_invite_friends');
    }

    set social_invite_progress(value) {
        this._modify('social_invite_progress', value);
    }

    get social_invite_progress() {
        return this._value('social_invite_progress');
    }

    set social_invite_daily_state(value) {
        this._modify('social_invite_daily_state', value);
    }

    get social_invite_daily_state() {
        return this._value('social_invite_daily_state');
    }

    set social_invite_reward(value) {
        this._modify('social_invite_reward', value);
    }

    get social_invite_reward() {
        return this._value('social_invite_reward');
    }

    set social_share_status_0(value) {
        this._modify('social_share_status_0', value);
    }

    get social_share_status_0() {
        return this._value('social_share_status_0');
    }

    set social_share_status_1(value) {
        this._modify('social_share_status_1', value);
    }

    get social_share_status_1() {
        return this._value('social_share_status_1');
    }

    set social_share_status_2(value) {
        this._modify('social_share_status_2', value);
    }

    get social_share_status_2() {
        return this._value('social_share_status_2');
    }

    set social_enshrine_status(value) {
        this._modify('social_enshrine_status', value);
    }

    get social_enshrine_status() {
        return this._value('social_enshrine_status');
    }

    set social_share_top_gold(value) {
        this._modify('social_share_top_gold', value);
    }

    get social_share_top_gold() {
        return this._value('social_share_top_gold');
    }

    set social_share_top_rank(value) {
        this._modify('social_share_top_rank', value);
    }

    get social_share_top_rank() {
        return this._value('social_share_top_rank');
    }

    set figure_url(value) {
        this._modify('figure_url', value);
    }

    get figure_url() {
        return this._value('figure_url');
    }

    set social_share_friends(value) {
        this._modify('social_share_friends', value);
    }

    get social_share_friends() {
        return this._value('social_share_friends');
    }

    set need_insert(value) {
        this._modify('need_insert', value);
    }

    get need_insert() {
        return this._value('need_insert');
    }

    set gold_total_cost(value) {
        this._modify('gold_total_cost', value);
    }

    get gold_total_cost() {
        return this._value('gold_total_cost');
    }

    set online_time(value) {
        this._modify('online_time', value);
    }

    get online_time() {
        return this._value('online_time');
    }

    set vip_fill_this_time(value) {
        this._modify('vip_fill_this_time', value);
    }

    get vip_fill_this_time() {
        return this._value('vip_fill_this_time');
    }

    set jointype(value) {
        this._modify('jointype', value);
    }

    get jointype() {
        return this._value('jointype');
    }

    set new_player(value) {
        this._modify('new_player', value);
    }

    get new_player() {
        return this._value('new_player');
    }

    set match_rank(value) {
        this._modify('match_rank', value);
    }

    get match_rank() {
        return this._value('match_rank');
    }

    set need_update(value) {
        this._modify('need_update', value);
    }

    get need_update() {
        return this._value('need_update');
    }

    set sex(value) {
        this._modify('sex', value);
    }

    get sex() {
        return this._value('sex');
    }

    set city(value) {
        this._modify('city', value);
    }

    get city() {
        return this._value('city');
    }

    set player_catch_rate(value) {
        this._modify('player_catch_rate', value);
    }

    get player_catch_rate() {
        return this._value('player_catch_rate');
    }

    get recharge() {
        return this._value('recharge');
    }

    set recharge(value) {
        this._modify('recharge', value);
    }

    get cash() {
        return this._value('cash');
    }

    set cash(value) {
        this._modify('cash', value);
    }

    get cost() {
        return this._value('cost');
    }

    set cost(value) {
        this._modify('cost', value);
    }

    get gain_loss() {
        return this._value('gain_loss');
    }

    set gain_loss(value) {
        this._modify('gain_loss', value);
    }

    get gain_loss_limit() {
        return this._value('gain_loss_limit');
    }

    set gain_loss_limit(value) {
        this._modify('gain_loss_limit', value);
    }

    get gain_loss_snapshot() {
        return this._value('gain_loss_snapshot');
    }

    set gain_loss_snapshot(value) {
        this._modify('gain_loss_snapshot', value);
    }

    set bp(value) {
        this._modify('bp', value);
    }

    get bp() {
        return this._value('bp');
    }

    get flower_receive_weekly() {
        return this._value('flower_receive_weekly');
    }

    set flower_receive_weekly(value) {
        this._modify('flower_receive_weekly', value);
    }

    //dfc 2018/2/25
    get month_sign_extra_reward() {
        return this._value('month_sign_extra_reward');
    }

    set month_sign_extra_reward(value) {
        this._modify('month_sign_extra_reward', value);
    }

    //dfc 2018/2/28
    get social_daily_invite_reward() {
        return this._value('social_daily_invite_reward');
    }

    set social_daily_invite_reward(value) {
        this._modify('social_daily_invite_reward', value);
    }

    get social_invite_week() {
        return this._value('social_invite_week');
    }

    set social_invite_week(value) {
        this._modify('social_invite_week', value);
    }

    get social_invite_month() {
        return this._value('social_invite_month');
    }

    set social_invite_month(value) {
        this._modify('social_invite_month', value);
    }

    get vip_daily_reward() {
        return this._value('vip_daily_reward');
    }

    set vip_daily_reward(value) {
        this._modify('vip_daily_reward', value);
    }

    get free_bomb() {
        return this._value('free_bomb');
    }

    set free_bomb(value) {
        this._modify('free_bomb', value);
    }

    get first_turntable_draw() {
        return this._value('first_turntable_draw');
    }

    set first_turntable_draw(value) {
        this._modify('first_turntable_draw', value);
    }

    get game_friend() {
        return this._value('game_friend');
    }

    set game_friend(value) {
        this._modify('game_friend', value);
    }

    get privacy() {
        return this._value('privacy');
    }

    set privacy(value) {
        this._modify('privacy', value);
    }

    get talk_forbidden() {
        return this._value('talk_forbidden');
    }

    set talk_forbidden(value) {
        this._modify('talk_forbidden', value);
    }

    //添加统计key
    get horn_used() {
        return this._value('horn_used');
    }

    set horn_used(value) {
        this._modify('horn_used', value);
    }

    get flower_send() {
        return this._value('flower_send');
    }

    set flower_send(value) {
        this._modify('flower_send', value);
    }

    get flower_receive() {
        return this._value('flower_receive');
    }

    set flower_receive(value) {
        this._modify('flower_receive', value);
    }

    get extend() {
        return this._value('extend');
    }

    set extend(value) {
        this._modify('extend', value);
    }

    get channel_game_friend() {
        return this._value('channel_game_friend');
    }

    set channel_game_friend(value) {
        this._modify('channel_game_friend', value);
    }

    get arena_win() {
        return this._value('arena_win');
    }

    set arena_win(value) {
        this._modify('arena_win', value);
    }

    get arena_fail() {
        return this._value('arena_fail');
    }

    set arena_fail(value) {
        this._modify('arena_fail', value);
    }

    get arena_star() {
        return this._value('arena_star');
    }

    set arena_star(value) {
        this._modify('arena_star', value);
    }

    get arena_box_state() {
        return this._value('arena_box_state');
    }

    set arena_box_state(value) {
        this._modify('arena_box_state', value);
    }

    get arena_matchid() {
        return this._value('arena_matchid');
    }

    set arena_matchid(value) {
        this._modify('arena_matchid', value);
    }

    get arena_matchid_list() {
        return this._value('arena_matchid_list');
    }

    set arena_matchid_list(value) {
        this._modify('arena_matchid_list', value);
    }


}

module.exports = AccountCommit;