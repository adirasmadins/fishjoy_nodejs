const WHITE_LIST = require('./white_list');
const _ = require('lodash');
const async = require('async');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;
const KEYTYPEDEF = require('../../../../database').dbConsts.KEYTYPEDEF;
const redisAccountSync = require('../../../../utils/redisAccountSync');
const mysqlAccountSync = require('../../../../utils/mysqlAccountSync');
const moment = require('moment');
const vip_vip_cfg = require('../../../../utils/imports').DESIGN_CFG.vip_vip_cfg;
const utils = require('../../../../utils/utils');
const tools = require('../../../../utils/tools');
const CharmUtil = require('../../../hall/src/utils/CharmUtil');
const buzz_cst_game = require('../../../hall/src/buzz/cst/buzz_cst_game');
const logBuilder = require('../../../../utils/logSync').logBuilder;
const RewardModel = require('../../../../utils/account/RewardModel');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;

class User {
    constructor() {
    }

    _queryAccont(uid, cb) {
        async.waterfall([
            function (cb) {
                mysqlAccountSync.getAccount(uid, cb);
            },
            function (account, cb) {
                redisAccountSync.setAccount(uid, account, cb);
            },
            function (res, cb) {
                redisAccountSync.getAccount(uid, cb);
            }
        ],
            function (err, account) {
                if (err) {
                    logger.error('User _queryAccont err', err);
                    utils.invokeCallback(cb, err);
                } else {
                    utils.invokeCallback(cb, null, account);
                }
            }
        );
    }

    isRegiste(data) {
        let self = this;
        return new Promise(function (resolve, reject) {
            redisConnector.cmd.hget(REDISKEY.OPENID_UID, data.openid, function (err, uid) {
                if (err) {
                    reject(err);
                    return;
                }

                if (!uid) {
                    let sql = "SELECT id FROM `tbl_account` WHERE `channel_account_id`=? ";
                    let sql_data = [data.openid];
                    mysqlConnector.query(sql, sql_data, function (err, rows) {
                        if (err) {
                            reject(ERROR_OBJ.DB_ERR);
                            return;
                        }
                        let row = rows && rows[0];
                        if (row) {
                            async.waterfall([function (cb) {
                                self._queryAccont(row.id, cb);
                            }, function (result, cb) {
                                redisConnector.cmd.hset(REDISKEY.OPENID_UID, data.openid, row.id, cb);
                            }], function (err) {
                                if (err) {
                                    reject(ERROR_OBJ.DB_ERR);
                                } else {
                                    resolve(row.id);
                                }
                            });
                        } else {
                            resolve(null);
                        }

                    });

                } else {
                    resolve(uid);
                }

            });
        });

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
        return new Promise(function (resolve, reject) {
            redisAccountSync.getAccount(data.uid, function (err, account) {

                if (err && ERROR_OBJ.USER_NOT_EXIST == err) {
                    self._queryAccont(data.uid, function (err, account) {
                        if (err) {
                            reject(err);
                            return;
                        }

                        logBuilder.addLoginLog(account.id, data.deviceId, data.ip);
                        self._someOptAfterLogin(account, function (err, account) {
                            resolve(account);
                        });
                    });
                    return;
                }

                if (account) {
                    logBuilder.addLoginLog(account.id, data.deviceId, data.ip);
                    self._someOptAfterLogin(account, function (err, account) {
                        resolve(account);
                    });
                    return;
                }
                reject(err);

            });
        });
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
    _genAccount(id, data) {

        let AccountDefault = KEYTYPEDEF.AccountDef;
        let OtherDef = KEYTYPEDEF.OtherDef;
        let newAccount = {};

        for (let k in AccountDefault) {
            newAccount[k] = _.cloneDeep(AccountDefault[k].def);
        }
        for (let k in OtherDef) {
            newAccount[k] = _.cloneDeep(OtherDef[k].def);
        }

        let timeNow = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        newAccount.created_at = timeNow;
        newAccount.updated_at = timeNow;
        newAccount.last_online_time = timeNow;

        var daysInMonth = (moment(new Date()).endOf('month')).date();
        for (var i = 0; i < daysInMonth; i++) {
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

        return new Promise(function (resolve, reject) {
            async.waterfall([function (cb) {
                redisConnector.cmd.hset(REDISKEY.OPENID_UID, data.openid, id, cb);
            }, function (ret, cb) {
                redisAccountSync.setAccount(id, newAccount, cb);
            }, function (res, cb) {
                redisAccountSync.getAccount(id, cb);
            }], function (err, account) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(err, account.id);
            });

        });
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
            var vip_info = null;
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

        //登录次数
        account.login_count = account.login_count + 1;

        //
        buzz_cst_game.addFamousOnlineBroadcast(account, account.platform);
        //重设魅力值
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