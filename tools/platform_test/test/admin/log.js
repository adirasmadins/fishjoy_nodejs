// 管理员登录测试模块
const auth = require('./auth');
const CFG_SERVERS = require('../../configs/servers');
const CFG_ACCOUNT = require('../../configs/account');
const testUtil = require('../../utils/TestUtil');
const request = require('supertest')(CFG_SERVERS.ADMIN_URL);
const tests = module.exports;

/**
 * 获取女神日志
 * {startDate:'YYYY-MM-DD', endDate:'YYYY-MM-DD', start:1, length:100, uid:'1,2,3', type:'1,2,3'} 
 * @param {*} startDate 开始日期, 格式为YYYY-MM-DD
 * @param {*} endDate 结束日期, 格式为YYYY-MM-DD
 * @param {*} start 开始索引
 * @param {*} length 数据长度
 * @param {*} uid 玩家ID列表, 如果不为空表示查询指定玩家数据
 * @param {*} type 过滤类型(1,2,3)
 */
tests.goddessLog = async (params) => {
    return new Promise(async (resolve, reject) => {
        let session = await auth.login(CFG_ACCOUNT.ADMIN_NAME, CFG_ACCOUNT.ADMIN_PWD);
        request.post('/admin/goddessLog')
            .set('Cookie', `koa:sess=${session}; lang=${CFG_SERVERS.I18N}; account=${CFG_ACCOUNT.ADMIN_NAME}`)
            .send({ data: params })
            .end(function (err, res) {
                testUtil.handleAdminResponse(resolve, reject, err, res);
            });
    });
}