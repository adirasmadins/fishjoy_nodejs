const chokidar = require('chokidar');
const path = require('path');
const log = console.log.bind(console);

class HotUpdate {
    constructor() {
        this._changeHandler = null;
    }

    watch(hot_path, changeHandler) {
        this._changeHandler = changeHandler;
        const watcher = chokidar.watch(hot_path, {
            ignored: /(^|[\/\\])\../
        });

        watcher.on('change', this.onChange.bind(this));
    }

    onChange(file) {
        if (/.*?\.js$/.test(file) || /.*?\.json$/.test(file)) {
            log(`配置文件 ${file} 发生变化`);
            this.reload(file);
        }
    }

    reload(file) {
        let fullpath = null;
        try {
            fullpath = require.resolve(path.join(__dirname, file));
        } catch (err) {
            log(`热更配置文件 ${file} 路径异常`, err);
            return;
        }

        let module = require.cache[fullpath];
        require.cache[fullpath] = null;
        let name = path.parse(fullpath).name;
        try {
            if(this._changeHandler){
                this._changeHandler(name, require(fullpath));
                log(`热更配置文件 ${name} 成功`);
            }
        } catch (err) {
            log(`热更配置文件 ${name} 异常`, err);
            require.cache[fullpath] = module;
        }
    }
}

module.exports = HotUpdate;