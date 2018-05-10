const auth = require('../controllers/Auth');
const statistics = require('../controllers/Statistics');
const gameData = require('../controllers/GameData');
const gameMgmt = require('../controllers/GameMgmt');
const operation = require('../controllers/Operation');
const backMgmt = require('../controllers/BackMgmt');

module.exports = {
    login: {
        params: ['username', 'password', 'i18n'],
        optParams: [],
        menu: auth,
    },

    // statistics
    realData: {
        params: ['date'],
        optParams: [],
        menu: statistics,
    },
    retentionData: {
        params: ['startDate', 'endDate'],
        optParams: [],
        menu: statistics,
    },
    topupData: {
        params: ['startDate', 'endDate'],
        optParams: [],
        menu: statistics,
    },
    topupLog: {
        params: ['status', 'startDate', 'endDate', 'start', 'length'],
        optParams: ['uid'],
        menu: statistics,
    },
    topupChart: {
        params: ['start', 'length'],
        optParams: [],
        menu: statistics,
    },

    // gameData
    goldData: {
        params: ['date'],
        optParams: [],
        menu: gameData,
    },
    loginLog: {
        params: ['date', 'start', 'length'],
        optParams: ['uid'],
        menu: gameData,
    },
    playerData: {
        params: ['start', 'length'],
        optParams: ['uid'],
        menu: gameData,
    },
    getFreezeReasonList: {
        params: [],
        optParams: [],
        menu: gameData,
    },
    freezePlayer: {
        params: ['uid', 'op'],
        optParams: ['reason', 'time'],
        menu: gameData,
    },
    activityLog: {
        params: ['startDate', 'endDate', 'start', 'length'],
        optParams: [],
        menu: gameData,
    },
    goldLog: {
        params: ['startDate', 'endDate', 'start', 'length'],
        optParams: ['uid'],
        menu: gameData,
    },
    itemLog: {
        params: ['startDate', 'endDate', 'start', 'length'],
        optParams: ['uid'],
        menu: gameData,
    },
    goddessLog: {
        params: ['startDate', 'endDate', 'start', 'length'],
        optParams: ['uid', 'type'],
        menu: gameData,
    },

    // gameMgmt
    cashRequire: {
        params: ['key', 'value'],
        optParams: [],
        menu: gameMgmt,
    },
    cashRequireQuery: {
        params: [],
        optParams: [],
        menu: gameMgmt,
    },
    genGiftCode: {
        params: ['prefix', 'num', 'limit', 'action_id'],
        optParams: [],
        menu: gameMgmt,
    },
    getGiftCodeConfig: {
        params: [],
        optParams: [],
        menu: gameMgmt,
    },
    getGiftCodeData: {
        params: ['giftCode'],
        optParams: [],
        menu: gameMgmt,
    },
    downloadGiftCodeList: {
        // api: "downloadGiftCodeList/:id",
        params: ['time'],
        optParams: [],
        menu: gameMgmt,
    },
    getGiftCodeList: {
        params: [],
        optParams: [],
        menu: gameMgmt,
    },
    addBroadcast: {
        params: ['content', 'gap', 'repeat', 'startTime', 'endTime'],
        optParams: [],
        menu: gameMgmt,
    },
    getBroadcast: {
        params: [],
        optParams: [],
        menu: gameMgmt,
    },
    cancelBroadcast: {
        params: ['id'],
        optParams: [],
        menu: gameMgmt,
    },
    sendMail: {
        params: ['type', 'title', 'content', 'reward', 'delay'],
        optParams: ['uid'],
        menu: gameMgmt,
    },
    sendMailCompensation: {
        params: ['serial', 'code', 'money', 'gold', 'uid', 'delay'],
        optParams: [],
        menu: gameMgmt,
    },
    getMailData: {
        params: ['startDate', 'endDate'],
        optParams: [],
        menu: gameMgmt,
    },
    delMail: {
        params: ['id'],
        optParams: [],
        menu: gameMgmt,
    },

    // operation
    getChangeLog: {
        params: ['startDate', 'endDate', 'filter', 'start', 'length'],
        optParams: ['uid'],
        menu: operation,
    },
    confirmChange: {
        params: ['orderId'],
        optParams: ['info'],
        menu: operation,
    },
    cancelChange: {
        params: ['orderId'],
        optParams: [],
        menu: operation,
    },

    queryJackpot: {
        params: [],
        optParams: [],
        menu: operation,
    },
    queryServerPeriod: {
        params: [],
        optParams: [],
        menu: operation,
    },
    queryPlayer: {
        params: ['uid'],
        optParams: [],
        menu: operation,
    },
    getCashData: {
        params: ['start', 'length'],
        optParams: [],
        menu: operation,
    },
    getProfitChart: {
        params: ['type', 'start', 'length'],
        optParams: [],
        menu: operation,
    },
    changeCatchRate: {
        params: ['type', 'rate', 'leftSecond'],
        optParams: ['uid'],
        menu: operation,
    },
    changeQueryServerPeriod: {
        params: ['key', 'value'],
        optParams: [],
        menu: operation,
    },

    getPlayerData: {
        params: ['uid'],
        optParams: [],
        menu: operation,
    },
    modifyPlayerData: {
        params: ['key', 'value', 'uid'],
        optParams: [],
        menu: operation,
    },

    getFireData: {
        params: ['date'],
        optParams: [],
        menu: operation,
    },

    getSceneCatchRateList: {
        params: [],
        optParams: [],
        menu: operation,
    },

    modifySceneCatchRate: {
        params: ['key', 'value'],
        optParams: [],
        menu: operation,
    },

    // backmgmt
    getOperator: {
        params: [],
        optParams: [],
        menu: backMgmt,
    },
    addOperator: {
        params: ['username', 'password'],
        optParams: [],
        menu: backMgmt,
    },
    modifyOperatorPassword: {
        params: ['username', 'password'],
        optParams: [],
        menu: backMgmt,
    },
    authSwitch: {
        params: ['username', 'auth'],
        optParams: [],
        menu: backMgmt,
    },
    generateDailyData: {
        params: ['startDate', 'endDate'],
        optParams: [],
        menu: backMgmt,
    },
    getServerSwitch: {
        params: [],
        optParams: [],
        menu: backMgmt,
    },
    serverSwitch: {
        params: ['type', 'value'],
        optParams: [],
        menu: backMgmt,
    },
    rmbVipCorrect: {
        params: ['uidList'],
        optParams: [],
        menu: backMgmt,
    },
    // 接口测试
    resetCikDailyLeft: {
        params: [],
        optParams: [],
        menu: backMgmt,
    },

};