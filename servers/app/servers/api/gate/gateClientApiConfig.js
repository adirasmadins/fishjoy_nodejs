const thirdPartyAuth = require('../../gate/controllers/thirdPartyAuth');
const innerUserAuth = require('../../gate/controllers/innerUserAuth');
const queryServices = require('../../gate/controllers/queryServices');
const tools = require('../../../utils/tools');

const api_list = {
    get_api_server: {
        route: '/get_api_server', //获取服务器列表
        handler: queryServices.lists,
        params: [],
        accountFields: null,
        ext: {
            getNetProtocol: function (ctx) {
                ctx.request.body.data = ctx.request.body.data || {};
                ctx.request.body.data.protocol = ctx.request.protocol;
            }
        },
    }, query_game_entry: {
        route: '/query_game_entry', //查询游戏入口
        handler: queryServices.query_game_entry,
        params: [],
        accountFields: null
    },
    auth: {
        route: '/auth', //渠道登录授权.
        handler: thirdPartyAuth.login,
        params: [],
        accountFields: null,
        ext: {
            getIP: tools.BuzzUtil.getIP
        }
    },
    register: {
        route: '/register', //内置账号注册
        handler: innerUserAuth.register,
        params: [],
        accountFields: null,
        ext: {
            getIP: tools.BuzzUtil.getIP
        }
    },
    login: {
        route: '/login', //内置账号登录
        handler: innerUserAuth.login,
        params: [],
        accountFields: null,
        ext: {
            getIP: tools.BuzzUtil.getIP
        }
    }, modifyPassword: {
        route: '/modifyPassword', //内置账号修改密码
        handler: innerUserAuth.modifyPassword,
        params: [],
        accountFields: null
    }, logout_account: {
        route: '/logout_account', //注销
        handler: innerUserAuth.logout,
        params: [],
        accountFields: null
    }, call_sdk_api: {
        route: '/call_sdk_api', //渠道SDK信息获取
        handler: thirdPartyAuth.callSdkApi,
        params: [],
        accountFields: null
    }
};


module.exports = {
    apiCfgs: api_list,
    PREFIX: '/gate/clientApi',
};