const _ = require('lodash');
const designCfgUtils = require('../../../../utils/designCfg/designCfgUtils');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;
const KEYTYPEDEF = require('../../../../database').dbConsts.KEYTYPEDEF;
const redisAccountSync = require('../../../../utils/redisAccountSync');
const mysqlAccountSync = require('../../../../utils/mysqlAccountSync');
const moment = require('moment');
const vip_vip_cfg = require('../../../../utils/imports').DESIGN_CFG.vip_vip_cfg;
const utils = require('../../../../utils/utils');
const tools = require('../../../../utils/tools');
const CharmUtil = require('../../../hall/src/utils/CharmUtil');
const logBuilder = require('../../../../utils/logSync').logBuilder;
const RewardModel = require('../../../../utils/account/RewardModel');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const rpcSender = require('../../../../net/rpcSender');
const hallCmd = require('../../../../cmd/hallCmd');

const QUERY_USER_UID_OPENID = "SELECT id FROM `tbl_account` WHERE `channel_account_id`=? ";

class User {
    constructor() {
    }

    async _queryAccontFromMysql(uid) {
        let msyqlAccount = await mysqlAccountSync.getAccountSync(uid);
        redisAccountSync.setAccountAsync(uid, msyqlAccount);
        return await redisAccountSync.getAccountAsync(uid);
    }

    async _loadMissionProcess(account){
        let res = await mysqlConnector.query(`SELECT mission_task_once FROM  tbl_mission WHERE id = ${account.id}`);
        res = res && res[0];
        if(res != null){
            let mission_task_once = JSON.parse(res.mission_task_once);
            let mission_only_once = account.mission_only_once;
            let cmds = [];
            for(let tid in mission_only_once){
                let item = designCfgUtils.getCfgValue('daily_quest_cfg', Number(tid), 'id');
                let processValue = Number(mission_task_once[tid]);
                if(item && !Number.isNaN(processValue)){
                    let taskKey = RewardModel.EXPORT_TOOLS.getTaskKey(RewardModel.EXPORT_TOOLS.TASK_PREFIX.MISSION_TASK_ONCE, item.type,
                        item.condition, item.value1);
                    cmds.push(['HSET', taskKey, account.id, processValue]);
                }
            }
            await redisConnector.multi(cmds);
            logger.error('loadMissionProcess cmds =', cmds);
        }
    }

    async isRegiste(openId) {
        let uid = await redisConnector.hget(REDISKEY.MAP_OPENID_UID, openId);
        if(uid != null){
            return uid;
        }

        let rows = await mysqlConnector.query(QUERY_USER_UID_OPENID, [openId]);
        let row = rows && rows[0];
        if (row) {
            let account = await this._queryAccontFromMysql(row.id);
            await redisConnector.hset(REDISKEY.MAP_OPENID_UID, openId, row.id);
            await this._loadMissionProcess(account);
            return row.id;
        }
    }

    async registe(userInfo) {
        let uid = await redisAccountSync.Util.genUid();
        await this._genAccount(uid, userInfo);
        let log_date = tools.DateUtil.format(new Date(), tools.DateUtil.FMT.D);
        await tools.RedisUtil.setbit(`${REDISKEY.BIT_DAILY_NEW_USERS}${log_date}`, uid, 1);
        // yxl_20180408_01
        if (userInfo.deviceId) {
            // 新账号添加到新增设备中
            await tools.RedisUtil.sadd(REDISKEY.NEW_DEVICE_1_DAY, userInfo.device);
            await tools.RedisUtil.sadd(REDISKEY.NEW_DEVICE_1_HOUR, userInfo.device);
        }
        return uid;
    }

    async login(data) {
        let self = this;
        return new Promise(async function (resolve, reject) {
            let account = await redisAccountSync.getAccountAsync(data.uid);
            if (account) {
                try {
                    self.handleAuthCheck(account, data);
                }
                catch(err) {
                    reject(err);
                    return;
                }
                logBuilder.addLoginLog(account.id, data.deviceId, data.ip);
                self._someOptAfterLogin(account, async function (err, account) {
                    let globalSwitchCdkey = await tools.RedisUtil.get(REDISKEY.SWITCH.CDKEY);
                    globalSwitchCdkey = +globalSwitchCdkey;
                    account.cdkey_on &= globalSwitchCdkey;
                    resolve(account);
                });
            }else {
                reject(ERROR_OBJ.USER_NOT_EXIST);
            }
        });
    }

    handleAuthCheck(account, data){
    }

    loginStatus(token) {
    }

    getUserInfo(data) {
    }

    reportUserAchievement(data) {
    }

    /**
     * 产生一个新玩家，并及时写入redis
     */
    async _genAccount(id, data) {

        let newAccount = {};

        for (let k in KEYTYPEDEF.PlayerModel) {
            newAccount[k] = _.cloneDeep(KEYTYPEDEF.PlayerModel[k].def);
        }

        let timeNow = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        newAccount.created_at = timeNow;
        newAccount.updated_at = timeNow;
        newAccount.last_online_time = timeNow;

        let daysInMonth = (moment(new Date()).endOf('month')).date();
        for (let i = 0; i < daysInMonth; i++) {
            newAccount.month_sign[i] = 0;
        }
        newAccount.id = id;
        newAccount.platform = data.device;
        newAccount.channel_account_id = data.openid;
        newAccount.nickname = data.nickname;
        newAccount.figure_url = data.figure_url;
        newAccount.channel = data.channel.toString();
        newAccount.city = data.city;

        if (data.saltPassword) {
            newAccount.password = data.saltPassword;
        }
        if (data.phone) {
            newAccount.phone = data.phone;
        }

        await redisConnector.hset(REDISKEY.MAP_OPENID_UID, data.openid, id);
        await redisAccountSync.setAccountAsync(id, newAccount);
        await redisAccountSync.getAccountAsync(id);
    }

    /**
     * 当前月卡是否有效
     * @param buyDate
     * @param time
     */
    _isCardValid(buyDate, time) {
        if (buyDate) {
            return moment().diff(moment(buyDate), 'days') < time;
        } else {
            logger.error("月卡时间无效");
            return false;
        }
    }

    /**
     * 登录后相关数据操作
     */
    async _someOptAfterLogin(account, cb) {
        let id = account.id;

        let log_date = tools.DateUtil.format(new Date(), tools.DateUtil.FMT.D);
        await tools.RedisUtil.setbit(`${REDISKEY.BIT_DAILY_ACTIVE_USERS}${log_date}`, id, 1);
        await tools.RedisUtil.hincrby(REDISKEY.DATE_LOGIN_COUNT, log_date, 1);

        let token = utils.generateSessionToken(id);
        let timeNow = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

        account.token = token;
        account.updated_at = timeNow;
        account.last_online_time = timeNow;

        //月卡是否过期、魅力值变化
        let card = account.card;
        let oldCard = _.cloneDeep(card);
        let cp = account.charm_point;
        if (card.normal && !this._isCardValid(card.normal.start_date, 30)) {
            card.normal = null;
        }
        if (card.senior && !this._isCardValid(card.senior.start_date, 30)) {
            card.senior = null;
        }
        if (card.week && !this._isCardValid(card.week.start_date, 7)) {
            card.week = null;
        }
        account.card = card;

        //补足vip
        let vip = account.vip;
        if (vip > 0 && account.vip_daily_fill == 1) {
            let vip_info = null;
            for (let i in vip_vip_cfg) {
                if (vip_vip_cfg[i].vip_level == vip) {
                    vip_info = vip_vip_cfg[i];
                    break;
                }
            }
            if (vip_info && account.first_login === 1) {
                let gold = Math.max(account.gold, vip_info.vip_dailyGold) - account.gold;
                if (gold > 0) {
                    account.gold = gold;
                }
                let pearl = Math.max(account.pearl, vip_info.vip_dailyDiamond) - account.pearl;
                if (pearl > 0) {
                    account.pearl = pearl;
                }
            }
        }

        // 登录次数
        account.login_count = account.login_count + 1;

        // 排行榜第一名上线公告
        // buzz_broadcast.addFamousOnlineBroadcast(account);
        // TODO: 调用hall的接口通知上线了一个用户
        await rpcSender.invoke(rpcSender.serverType.hall, rpcSender.serverModule.hall.playerLogin,
            hallCmd.remote.player_login.route, {
                uid: account.id,
                channel_account_name: account.channel_account_name,
                nickname: account.nickname,
                tempname: account.tempname,
                vip: account.vip,
                charm_rank: account.charm_rank,
                platform: account.platform,
            });

        // 重设魅力值
        CharmUtil.getCurrentCharmPoint(account, function (charmPoint) {
            if (charmPoint) {
                account.charm_point = charmPoint;
            }
            if (account.first_login === 1) {
                account.first_login = 0;
                //累计登录任务数据统计dfc
                let mission = new RewardModel(account);
                mission.addProcess(RewardModel.TaskType.CONTINUE_LOGIN, 1);
            }

            account.commit(function () {
                redisConnector.cmd.sadd(REDISKEY.UPDATED_UIDS, id);
                cb && cb(null, account);
            });
        });
    }
}

module.exports = User;