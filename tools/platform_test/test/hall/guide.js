// 引导测试模块
const login = require('../gate/login');
const CFG_SERVERS = require('../../configs/servers');
const CFG_ACCOUNT = require('../../configs/account');
const request = require('supertest')(CFG_SERVERS.HALL_URL);
const testUtil = require('../../utils/TestUtil');
const tests = module.exports;

/**
 * 获取完成新手引导的奖励
 */
tests.guideReward = async () => {
    return new Promise(async (resolve, reject) => {
        const account = await login.login(CFG_ACCOUNT.UNAME, CFG_ACCOUNT.PWD);
        let token = account.token;
        request.post('/hall/clientApi/guide_reward')
            .send({ data: { token: token } })
            .end(function (err, res) {
                testUtil.handleApiResponse(resolve, reject, err, res);
            });
    });
}