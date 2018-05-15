const DaoGold = require('./dao_gold');
const DaoCdKey = require('./dao_cdkey');
const DaoMail = require('./dao_mail');
const DaoReward = require('./dao_reward');
const DaoChange = require('./dao_change');

function _findAccountByToken(pool, token, cb) {
    var sql = 'SELECT `id`,`tempname`,`created_at`,`updated_at` FROM `tbl_account` WHERE `token`=?';
    pool.query(sql, [token], cb);
}

exports.withDbPool = function () {
    var pool = {
        query: function (sql, values, cb) {
            mysqlConnector.query(sql, values, function (err,data) {
                cb(err, data);
            });
        }
    };
    return {
        
        findAccountByToken: function (token, cb) {
            _findAccountByToken(pool, token, cb);
        },
        
        getAccountByToken: function (token, cb) {
            AccountCommon.getAccountByToken(pool, token, cb);
        },
        
        //!!!
        resetDaillyShare: function (id_list, cb) {
            DaoSocial.resetDaillyShare(pool, id_list, cb);
        },


        token4DailyReset: function (data, cb) {
            DaoAccount.token4DailyReset(pool, data, cb);
        },
        
        //!!!
        genStatistics: function (cb) {
            DaoStatistics.genStatistics(pool, cb);
        },
        
        //!!!
        getDailyStatistics: function (data, cb) {
            DaoStatistics.getDailyStatistics(pool, data, cb);
        },
        
        getBankruptcyCompensation: function (data, cb) {
            DaoAccount.getBankruptcyCompensation(pool, data, cb);
        },
        
        //!!!
        addPearlLog: function (data, cb) {
            DaoPearl.addPearlLog(pool, data, cb);
        },

        //通用消耗的方法
        rewardCost: function (data, cb) {
            DaoReward.costCommon(pool, data, cb);
        },
        
        //!!!
        getReward: function (data, cb) {
            DaoActivity.getReward(pool, data, cb);
        },
        
        //!!!
        showMeActivity: function (data, cb) {
            DaoActivity.showMeActivity(pool, data, cb);
        },
        
        //!!!
        updateGift: function (cb) {
            DaoActivity.updateGift(pool, cb);
        },
        
        //!!!
        addSkillLog: function (data, cb) {
            DaoSkill.addSkillLog(pool, data, cb);
        },

        //!!!
        addWeaponLog: function (data, cb) {
            DaoWeapon.addWeaponLog(pool, data, cb);
        },

        //!!!
        getOnlineTime: function (data, cb) {
            DaoGold.getOnlineTime(pool, data, cb);
        },

        //!!!
        sumUpLastHour: function (data, cb) {
            DaoStatisticsHour.sumUpLastHour(pool, data, cb);
        },
        
        sumUpLastDay: function (cb) {
            DaoStatisticsDay.sumUpLastDay(pool, cb);
        },

        getOrderList: function (data, cb) {
            DaoAdminPayuser.getOrderList(pool, data, cb);
        },
        
        getPayUserData: function (data, cb) {
            DaoAdminPayuser.getPayUserData(pool, data, cb);
        },
        
        getUserPayData: function (data, cb) {
            DaoAdminPayuser.getUserPayData(pool, data, cb);
        },
        
        getCardUserList: function (data, cb) {
            DaoAdminPayuser.getCardUserList(pool, data, cb);
        },
        
        getPayLogData: function (data, cb) {
            DaoAdminPayuser.getPayLogData(pool, data, cb);
        },
        
        getQueryPay: function (data, cb) {
            DaoAdminPayuser.getQueryPay(pool, data, cb);
        },
        
        generateCdKey: function (data, cb) {
            DaoCdKey.generate(pool, data, cb);
        },

        listCdKey: function (data, cb) {
            DaoCdKey.list(pool, data, cb);
        },

        useCdKey: function (data, cb) {
            DaoCdKey.use(pool, data, cb);
        },

        showCdkeyDetail: function (data, cb) {
            DaoCdKey.detail(pool, data, cb);
        },
        
        sendMail:function (data,cb) {
            DaoMail.sendMail(pool,data,cb);
        },

        readMail: function (data, cb) {
            DaoMail.readMail(pool, data, cb);
        },

        clearMail: function (cb) {
            DaoMail.clearMail(pool, cb);
        },

        mailList: function (data, cb) {
            DaoMail.mailList(pool, data, cb);
        },
        
        //---------------------Dao-Image------------------------
        getUrlFromWeb2Local: function (data, cb) {
            DaoImage.getUrlFromWeb2Local(pool, data, cb);
        },

        createImage: function (data, cb) {
            DaoImage.create(pool, data, cb);
        },
        
        getGoddessTop1: function (platform, cb) {
            DaoRank.getGoddessTop1(pool, platform, cb);
        },
        
        //---------------------Aquarium------------------------
        updateTableAquarium: function (account_id, aquarium, cb) {
            DaoAquarium.updateTableAquarium(pool, account_id, aquarium, cb);
        },

        //---------------------后门----------------------------
        modifyUserData: function (data, cb) {
            DaoBackdoor.modifyUserData(pool, data, cb);
        },

        kickUser: function (data, cb) {
            DaoBackdoor.kickUser(pool, data, cb);
        },

        accountForbidden: function (data, cb) {
            DaoBackdoor.accountForbidden(pool, data, cb);
        },

        accountAuth: function (data, cb) {
            DaoBackdoor.accountAuth(pool, data, cb);
        },

        switchMatch: function (data, cb) {
            DaoBackdoor.switchMatch(pool, data, cb);
        },

        switchCik: function (data, cb) {
            DaoBackdoor.switchCik(pool, data, cb);
        },

        //---------------------Social--------------------------
        getInviteProgress: function (data, cb) {
            DaoSocial.getInviteProgress(pool, data, cb);
        },
        
        getShareStatus: function (data, cb) {
            DaoSocial.getShareStatus(pool, data, cb);
        },

        getEnshrineStatus: function (data, cb) {
            DaoSocial.getEnshrineStatus(pool, data, cb);
        },
        
        inviteSuccess: function (data, cb) {
            DaoSocial.inviteSuccess(pool, data, cb);
        },
        
        shareSuccess: function (data, cb) {
            DaoSocial.shareSuccess(pool, data, cb);
        },
        
        getSocialReward: function (data, cb) {
            DaoSocial.getSocialReward(pool, data, cb);
        },

        getInviteDailyReward: function (data, cb) {
            DaoSocial.getInviteDailyReward(pool, data, cb);
        },
        
        enshrineSuccess: function (data, cb) {
            DaoSocial.enshrineSuccess(pool, data, cb);
        },
        
        writeUserException: function (cb) {
            DaoGold.writeUserException(pool, cb);
        },

        writeLogMailReward: function (cb) {
            DaoMail.writeLogMailReward(pool, cb);
        },
        
        addChangeLog: function (data, cb) {
            DaoChange.insert(pool, data, cb);
        },

        updateOperation: function (data, cb) {
            DaoOperation.update(pool, data, cb);
        },

        updateShipTime: function (params, cb) {
            DaoChange.updateShipTime(pool, params, cb);
        },

        updateStutus: function (params, cb) {
            DaoChange.updateStutus(pool, params, cb);
        },

        updateWay: function (params, cb) {
            DaoChange.updateWay(pool, params, cb);
        },


    };
};