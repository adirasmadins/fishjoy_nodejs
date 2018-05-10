// 管理员登录测试模块
const CFG_SERVERS = require('../../configs/servers');
const testUtil = require('../../utils/TestUtil');
const request = require('supertest')(CFG_SERVERS.ADMIN_URL);
const tests = module.exports;

/**
 * 管理员账号登录
 * @param {*} uname 用户名
 * @param {*} pwd 密码
 */
tests.login = async (uname, pwd) => {
    return new Promise((resolve, reject) => {
        request.post('/admin/login')
            .send({ data: { username: uname, password: pwd, i18n: CFG_SERVERS.I18N } })
            .end(function (err, res) {
                if (err) {
                    reject(error);
                }
                if (res) {
                    let text = JSON.parse(res.res.text);
                    if (text.data.result) {
                        let setCookie = res.header['set-cookie'][0];
                        let koaSession = setCookie.split(';')[0];
                        let session = koaSession.split('=')[1];
                        resolve(session);
                    }
                    else {
                        reject(text.data.err);
                    }
                }
            });
    });
}