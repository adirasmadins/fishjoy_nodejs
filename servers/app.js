require('./app/utils/logHelper');
require('./app/utils/globals');
const omelo = require('omelo');
const path = require('path');
const fs = require('fs');
const versions = require('./config/versions');
const omeloHttpPlugin = require('omelo-http-plugin');
const logger = require('omelo-logger').getLogger('default', __filename);
const sysConfig = require('./config/sysConfig');
// const masterhaPlugin = require('omelo-masterha-plugin');
const globalChannel = require('omelo-globalchannel-plugin');
const status = require('omelo-status-plugin');
const HotUpdate = require('./app/utils/hotUpdate');
const designCfgUtils = require('./app/utils/designCfg/designCfgUtils');
// const scale = require('omelo-scale-plugin');

let SSL = null;
if (sysConfig.SSL_CERT) {
    SSL = {
        type: 'wss',
        key: fs.readFileSync(sysConfig.SSL_CERT.KEY, 'utf8'),
        cert: fs.readFileSync(sysConfig.SSL_CERT.CERT, 'utf8'),
        strictSSL: false,
        rejectUnauthorized: false
    };
}

/**
 * Init app for client.
 */

const VER = versions.DEVELOPMENT ? versions.VER_KEY[versions.GAMEPLAY.LOCAL] : versions.VER_KEY[versions.PUB];
let app = omelo.createApp({
    version_key: VER
});

app.set('name', 'fishjoy');
app.set('errorHandler', function (err, msg, resp, session, next) {
    logger.error('-------errorHandler happend ---->', err);
    next(err, resp);
});

app.set('rpcErrorHandler', function (err, serverId, msg, opts) {
    logger.error('-------rpcErrorHandler happend ---->', err);
});

app.set('globalErrorHandler', function (err, msg, resp, session, opts, next) {
    logger.error('-------globalErrorHandler happend ---->', err);
    next();
});

app.loadConfig('versions', require('./config/versions'));
app.loadConfig('redis', require('./app/utils/imports').dbCfg.redis);
app.loadConfig('mysql', require('./app/utils/imports').dbCfg.mysql);
app.loadConfig('http', path.join(app.getBase(), `config/service/${VER}/http`));
app.loadConfig('adminUser', require('./config/adminUser'));

const httpAesFilter = require('./app/servers/common/httpAesFilter');
const httpTokenFilter = require('./app/servers/common/httpTokenFilter');
const Http304Filter = require('./app/servers/common/http304Filter');
const httpLockFilter = require('./app/servers/common/httpLockFilter');
const activeStatisticsFilter = require('./app/servers/common/activeStatisticsFilter');
const httpSwitchFilter = require('./app/servers/common/httpSwitchFilter');
const serviceSwitchFilter = require('./app/servers/common/serviceSwitchFilter');
const tokenFilter = require('./app/servers/common/tokenFilter');

// configure for global
app.configure('production|development', function () {
    // load configure

    // app.enable('systemMonitor');
    // filter configures
    // app.before(omelo.filters.toobusy()); // 服务器繁忙
    // app.filter(omelo.filters.serial()); //主要负责保证所有从客户端到服务端的请求能够按顺序地处理
    // app.filter(omelo.filters.time()); //主要负责记录请求的相应时间
    //app.filter(omelo.filters.timeout()); //主要负责监控请求响应时间，如果超时就给出警告
    //app.before(decryptFilter);
    //app.filter(queueFilter);

    if (typeof app.registerAdmin === 'function') {
        let modules = require('./app/modules');
        for (let moduleId in modules) {
            app.registerAdmin(modules[moduleId], {
                app: app
            });
        }
    }

    // proxy configures
    app.set('proxyConfig', {
        cacheMsg: true,
        interval: 30,
        lazyConnection: true
        // enableRpcLog: true
    });

    // remote configures
    app.set('remoteConfig', {
        cacheMsg: true,
        interval: 30
    });

    const redisCfg = app.get('redis');
    app.use(globalChannel, {
        globalChannel: {
            // prefix: 'globalChannel',
            host: redisCfg.server.host,
            port: redisCfg.server.port,
            db: '2',
            auth_pass: redisCfg.server.password,
            cleanOnStartUp: true
        }
    });

    app.use(status, {
        status: {
            // prefix: 'status',
            host: redisCfg.server.host,
            port: redisCfg.server.port,
            db: '2',
            auth_pass: redisCfg.server.password,
            cleanOnStartUp: true
        }
    });

    // master high availability
    // app.use(masterhaPlugin, {
    //     zookeeper: {
    //         server: '127.0.0.1:2181',
    //         path: '/pomelo/master'
    //     }
    // });

    // route configures
    const rpcRoute = require('./app/net/rpcRoute');
    app.route('game', rpcRoute.gameRoute);
    app.route('rankMatch', rpcRoute.rankMatchRoute);
});

// app.configure('production|development', 'master', function() {
//     app.use(scale, {
//         scale: {
//             cpu: {
//                 connector: 2,
//                 interval: 10 * 1000,
//                 increasement: 1
//             },
//             memory: {
//                 lottery: 1,
//                 interval: 15 * 1000,
//                 increasement: 1
//             },
//             backup: 'config/backupServers.json'
//         }
//     });
// });

// 服务基础配置
app.configure('production|development', 'loadManager|eventSync|matching|rankMatch|r2mSync|ranking|admin|resource|game|gate|hall|chat|logManager|pay', function () {
    global.logger = require('omelo-logger').getLogger(app.getServerId());

    const VER = versions.VER_KEY[versions.PUB];
    let hotUpdate = new HotUpdate([/.*?\.js$/, /.*?\.json$/]);
    const GAME_CFG = require('./config/design_cfg');
    hotUpdate.watch(`config/design_cfg/${VER}`, function (name, value) {
        GAME_CFG[name] = value;
        designCfgUtils.updateCfg(name, value);
    });

    // setInterval(function () {
    //     global.logger.error(GAME_CFG.active_active_cfg[0].id);
    // }, 5000);
});

//服务http配置
app.configure('production|development', 'admin|resource|gate|hall|chat|pay|loadManager', function () {
    app.use(omeloHttpPlugin, {
        http: app.get('http')
    });
});

//服务http service switch配置
app.configure('production|development', 'resource|gate|hall|chat|pay', function () {
    omeloHttpPlugin.filter(httpSwitchFilter);
});

app.configure('production|development', 'admin|resource|gate|hall|chat|pay|loadManager', function () {
    omeloHttpPlugin.filter(httpAesFilter);
});

// 服务器token配置
app.configure('production|development', 'hall|chat|pay', function () {
    httpTokenFilter.addIgnoreRoute('/payCallback');
    omeloHttpPlugin.filter(httpTokenFilter);
    omeloHttpPlugin.filter(activeStatisticsFilter);
});

// 服务器pay配置
app.configure('production|development', 'pay', function () {
    httpLockFilter.addRoute("/pay/clientApi", httpLockFilter.matchMode.PART);
    omeloHttpPlugin.filter(httpLockFilter);
});

// 服务器admin配置
app.configure('production|development', 'admin', function () {

    let http304Filter = new Http304Filter();
    http304Filter.addPath('/js');
    http304Filter.addPath('/css');
    http304Filter.addPath('/fonts');
    omeloHttpPlugin.filter(http304Filter);

    const adminFilter = require('./app/servers/common/adminFilter');
    adminFilter.addIgnoreRoute('/admin/login');
    adminFilter.addIgnoreRoute('/login.html');
    adminFilter.addIgnoreRoute('/error.html');
    adminFilter.addIgnoreRoute('/css');
    adminFilter.addIgnoreRoute('/js');
    adminFilter.addIgnoreRoute('/fonts');
    omeloHttpPlugin.filter(adminFilter);
});

// 服务器hall配置
app.configure('production|development', 'hall', function () {
    httpLockFilter.addRoute('/hall/clientApi/get_social_reward');
    httpLockFilter.addRoute('/hall/clientApi/get_chart_reward');
    httpLockFilter.addRoute('/hall/clientApi/get_day_reward');
    httpLockFilter.addRoute('/hall/clientApi/guide_reward');
    httpLockFilter.addRoute('/hall/clientApi/daily_reward');
    httpLockFilter.addRoute('/hall/clientApi/achieve_reward');
    httpLockFilter.addRoute('/hall/clientApi/mission_reward');
    httpLockFilter.addRoute('/hall/clientApi/active_reward');
    httpLockFilter.addRoute('/hall/clientApi/get_adv_gift');
    httpLockFilter.addRoute('/hall/clientApi/get_ad_reward');
    httpLockFilter.addRoute('/hall/clientApi/god_week_reward');
    httpLockFilter.addRoute('/hall/clientApi/rankgame_box');
    httpLockFilter.addRoute('/hall/clientApi/reward_petfish');
    httpLockFilter.addRoute('/hall/clientApi/get_activity_reward');
    httpLockFilter.addRoute('/hall/clientApi/get_day_extra_reward');
    httpLockFilter.addRoute('/hall/clientApi/diamond_to_gold');
    httpLockFilter.addRoute('/hall/clientApi/get_weekend_reward');
    httpLockFilter.addRoute('/hall/clientApi/weapon_buy_skin');
    httpLockFilter.addRoute('/hall/clientApi/newbie_reward');
    omeloHttpPlugin.filter(httpLockFilter);
});

//资源服资源过期设置
app.configure('production|development', 'resource', function () {
    let http304Filter = new Http304Filter();
    http304Filter.addPath('/default.png');
    http304Filter.addPath('/jiaodie.png');
    http304Filter.addPath('/upload/');
    http304Filter.addPath('/fishjoy/res/raw-assets/');
    http304Filter.addPath('/fishjoy/res/raw-internal/');
    omeloHttpPlugin.filter(http304Filter);
});

// 网关配置
app.configure('production|development', 'gate', function () {
    app.set('connectorConfig', {
        connector: omelo.connectors.hybridconnector,
        useDict: true,
        useProtobuf: true
    });

    httpTokenFilter.addIgnoreRoute('/auth');
    httpTokenFilter.addIgnoreRoute('/login');
    httpTokenFilter.addIgnoreRoute('/register');
    httpTokenFilter.addIgnoreRoute('/modifyPassword');
    omeloHttpPlugin.filter(httpTokenFilter);
    app.before(serviceSwitchFilter);
    app.before(tokenFilter);

});

// 游戏服务配置
app.configure('production|development', 'game', function () {
    let connectorConfig = {
        connector: omelo.connectors.hybridconnector,
        heartbeat: 10,
        useDict: true,
        useProtobuf: true
    };
    SSL && (connectorConfig.ssl = SSL);
    app.set('connectorConfig', connectorConfig);
    // app.use(sync, {sync: {path: __dirname + '/app/logic/mapping', dbclient: redisClient, interval: 500}});
    app.before(require('./app/servers/common/unLoginFilter'));
    app.filter(require('./app/servers/game/filter/playerFilter'));
    app.before(serviceSwitchFilter);
    app.before(tokenFilter);

});

// start app
app.start();

process.on('uncaughtException', function (err) {
    logger.error(' Caught exception: ' + err.stack);
});

process.on('unhandledRejection', (reason, p) => {
    logger.error("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});