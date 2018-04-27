const log4js = require('log4js');

let logDefaultconfig = {
    appenders: {
        file: {
            type: 'file',
            filename: `./logs/default.log`,
            maxLogSize: 10 * 1024 * 1024,
            backups: 50
        },
        console: {
            type: 'console'
        }
    },
    categories: {
        default: {appenders: ['file', 'console'], level: 'info'}
    }
};

log4js.configure(logDefaultconfig);
global.logger = log4js.getLogger('default');
global.loggerEx = function (filename = 'default') {
    return log4js.getLogger(filename);
};

class LogHelper {
    constructor() {
    }

    setLevel(level) {
        global.logger.level = level;
    }

    setAppName(name){
        logDefaultconfig.appenders.file.filename = `./logs/${name}.log`;
        log4js.configure(logDefaultconfig);
        global.logger = log4js.getLogger(name);
    }

    configure(config) {
        log4js.configure(config);
    }

    flush() {
        log4js.shutdown();
    }

}

module.exports = new LogHelper();