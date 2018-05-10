const chokidar = require('chokidar');
const path = require('path');
const log = console.log.bind(console);
const omelo = require('omelo');
const util = require('util');

class HotUpdate {
    constructor(regExps, reload = true) {
        this._changeHandler = null;
        this._regExps = Array.isArray(regExps)?this._regExps = regExps:this._regExps = [regExps];
        this._reload = reload;

    }

    watch(hot_path, changeHandler) {
        this._changeHandler = changeHandler;
        const watcher = chokidar.watch(hot_path, {
            ignored: /(^|[\/\\])\../
        });

        watcher.on('change', this._onChange.bind(this));
    }

    _onChange(file) {
        for(let i = 0; i< this._regExps.length; i++){
            if(this._regExps[i].test(file)){
                log(`配置文件 ${file} 发生变化`);
                if(this._reload){
                    let {name, value}= this._reloadFile(file);
                    log(`热更配置文件 ${name} 成功`);
                    if(name && value && this._changeHandler){
                        this._changeHandler(name, value);
                    }
                }else {
                    let name = path.parse(file).name;
                    if(this._changeHandler){
                        this._changeHandler(name);
                    }
                }
                break;
            }
        }
    }

    _reloadFile(file) {
        let fullpath = null;
        try {
            log('omelo.app.getBase = ', omelo.app.getBase());
            fullpath = require.resolve(path.join(omelo.app.getBase(), file));
        } catch (err) {
            log(`热更配置文件 ${file} 路径异常`, err);
            return;
        }

        let module = require.cache[fullpath];
        require.cache[fullpath] = null;
        let name = path.parse(fullpath).name;
        try {
            return {name:name, value:require(fullpath)};
        } catch (err) {
            log(`热更配置文件 ${name} 异常`, err);
            require.cache[fullpath] = module;
        }
    }
}

module.exports = HotUpdate;