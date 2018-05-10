// 实物兑换测试模块
const login = require('../gate/login');
const CFG_SERVERS = require('../../configs/servers');
const CFG_ACCOUNT = require('../../configs/account');
const request = require('supertest')(CFG_SERVERS.HALL_URL);
const testUtil = require('../../utils/TestUtil');
const tests = module.exports;

/**
 * 查询全服最近100条兑换记录
 */
tests.queryCik = async () => {
    return new Promise(async (resolve, reject) => {
        const account = await login.login(CFG_ACCOUNT.UNAME, CFG_ACCOUNT.PWD);
        let token = account.token;
        request.post('/hall/clientApi/query_cik')
            .send({ data: { token: token } })
            .end(function (err, res) {
                testUtil.handleApiResponse(resolve, reject, err, res);
            });
    });
}

/**
 * 获取玩家当前拥有的话费券数量
 */
tests.getHuafeiquan = async () => {
    return new Promise(async (resolve, reject) => {
        const account = await login.login(CFG_ACCOUNT.UNAME, CFG_ACCOUNT.PWD);
        let token = account.token;
        request.post('/hall/clientApi/get_huafeiquan')
            .send({ data: { token: token } })
            .end(function (err, res) {
                testUtil.handleApiResponse(resolve, reject, err, res);
            });
    });
}