const versions = require('../../servers/config/versions');
const VER = versions.VER_KEY[versions.PUB];
const BUILD_DIR = './build/servers';
const RESOURCE_DIR = '/app/servers/resource/public/cfgs';

const upload_packages_servers = {
    wanba: {
        host: '58.87.69.167',
        username: 'root',
        password: 'Chu123456',
        remotePath: '/opt/packages'
    },
    ios: {
        host: '106.75.222.154',
        username: 'root',
        password: 'adDO2UAOLxl6',
        remotePath: '/opt/packages'
    },
    vietnam_vn: {
        host: '103.90.220.2',
        username: 'root',
        password: 'Vnet@9999',
        remotePath: '/opt/packages'
    },
    vietnam_vn_test: {
        host: '103.90.220.174',
        username: 'root',
        password: 'Vnet@9999',
        remotePath: '/opt/packages'
    },
    coco: {
        host: '192.144.157.29',
        username: 'root',
        password: 'Bolin123456',
        remotePath: '/opt/packages'
    }
}

module.exports = {
    gitTag: 'v1.0.0',
    input: {
        firstJs: [
            '../../servers*/**/*',
            '!../../servers/test*/**/*',
            '!../../servers/logs*/**/*',
            '!../../servers/config/**/*',
            '!../../servers/shared/**/*',
        ],
        js: ['../../servers*/**/*.js',
            '!../../servers/test*/**/*',
            '!../../servers/logs*/**/*',
            '!../../servers/config/**/*',
            '!../../servers/shared/**/*',
        ],
        statics: [
            [`../../servers/config*/db*/${VER}/*`, BUILD_DIR],
            [`../../servers/config*/design_cfg*/${VER}/*`, BUILD_DIR],
            [`../../servers/config*/service*/${VER}/*`, BUILD_DIR],
            [`../../servers/shared*/**/${VER}/*`, BUILD_DIR],
            [`../../servers/config*/*.*`, BUILD_DIR],
            [`../../servers/config*/design_cfg*/index.js`, BUILD_DIR],
            [`../../servers/config*/db*/index.js`, BUILD_DIR],
            [`../../servers/config/design_cfg/${VER}/all_cfgs`, BUILD_DIR + RESOURCE_DIR],
            [`../../servers/config/design_cfg/${VER}/all_merge`, BUILD_DIR + RESOURCE_DIR],
            [`../../servers/config/design_cfg/${VER}/json_list.cfg`, BUILD_DIR + RESOURCE_DIR],
        ],
        zip: './build/**/*',
    },
    output: {
        dist: './build',
        origin: 'origin',
        sourcemap: 'map',
        zip: './packages/',
    },
    modulesZip: '../../packages/node_modules_prod.zip',
    scp: upload_packages_servers[versions.VER_KEY[versions.PUB]],
    upload: [{
            host: '171.244.35.40',
            username: 'root',
            password: 'JYvdwVUZrEvwFkyTDYPx',
            paths: [{
                localPath: 'C:/Users/Administrator/Desktop/BUG/room/servers.json',
                remotePath: '/home/fishjoy_test/server/fishjoyPublish/room/config'
            }]
        },
        {
            host: '171.244.35.41',
            username: 'root',
            password: 'JYvdwVUZrEvwFkyTDYPx',
            paths: [{
                localPath: 'C:/Users/Administrator/Desktop/BUG/room/servers.json',
                remotePath: '/home/fishjoy_test/server/fishjoyPublish/room/config'
            }]
        },
        {
            host: '171.244.35.42',
            username: 'root',
            password: 'JYvdwVUZrEvwFkyTDYPx',
            paths: [{
                localPath: 'C:/Users/Administrator/Desktop/BUG/room/servers.json',
                remotePath: '/home/fishjoy_test/server/fishjoyPublish/room/config'
            }]
        },
        {
            host: '171.244.35.43',
            username: 'root',
            password: 'JYvdwVUZrEvwFkyTDYPx',
            paths: [{
                localPath: 'C:/Users/Administrator/Desktop/BUG/room/servers.json',
                remotePath: '/home/fishjoy_test/server/fishjoyPublish/room/config'
            }]
        },
    ],
    download: [{
        host: '171.244.35.38',
        username: 'root',
        password: 'JYvdwVUZrEvwFkyTDYPx',
        localPath: '../../../fishjoy_server/data_server/src/buzz/sdk/payConfig.js',
        remotePath: '/home/fishjoy_test/server/data_server/src/buzz/sdk/'
    }, ]
};