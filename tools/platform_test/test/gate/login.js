// 登录测试模块, 需要做到通用(其他模块测试时可以反复调用)
const request = require('supertest');
const CFG_SERVERS = require('../../configs/servers');
const testUtil = require('../../utils/TestUtil');
const tests = module.exports;

/**
 * 使用内部账号登录
 * @param {*} uname 用户名
 * @param {*} pwd 密码
 */
tests.login = async (uname, pwd) => {
    return new Promise((resolve, reject) => {
        let requestGate = request(CFG_SERVERS.GATE_URL);
        requestGate.post('/gate/clientApi/login')
            .send({ data: { username: uname, password: pwd } })
            .end(function (err, res) {
                testUtil.handleApiResponse(resolve, reject, err, res);
            });
    });
}