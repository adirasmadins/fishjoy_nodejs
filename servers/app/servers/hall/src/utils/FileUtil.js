// =============================================================================
// FileUtil
// 文件处理工具集
//------------------------------------------------------------------------------
// 如何使用
// let FileUtil = require('../utils/FileUtil');    // src/dao文件夹
// let FileUtil = require('../src/utils/FileUtil');// routes文件夹
// FileUtil.func(str, params...);
//==============================================================================

const fs = require("fs");
const StringUtil = require('../utils/StringUtil');    // src/dao文件夹

//==============================================================================
// const
//==============================================================================

const TAG = "【FileUtil】";

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------

exports.copy = _copy;
exports.listDir = _listDir;
exports.dir = _dir;
exports.readFileSync = _readFileSync;

// WRAP
exports.existsSync = existsSync;
exports.mkdirSync = mkdirSync;

//------------------------------------------------------------------------------
// prototype implement
//------------------------------------------------------------------------------
Date.prototype.format = function (fmt) { //author: meizz   
    let o = {
        "M+" : this.getMonth() + 1,                 //月份   
        "d+" : this.getDate(),                    //日   
        "h+" : this.getHours(),                   //小时   
        "m+" : this.getMinutes(),                 //分   
        "s+" : this.getSeconds(),                 //秒   
        "q+" : Math.floor((this.getMonth() + 3) / 3), //季度   
        "S"  : this.getMilliseconds()             //毫秒   
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 拷贝文件
 */
function _copy(src, dst) {
    let fs = require("fs");
    // 创建读取流
    let readable = fs.createReadStream(src);
    // 创建写入流
    let writable = fs.createWriteStream(dst);
    // 通过管道来传输流
    readable.pipe(writable);
}

function _hasFile(path) {
    let ret = false;
    let file_list = fs.readdirSync(path);
    
    file_list.forEach(function (filename) {
        let full_path = path + '/' + filename;
        let stats = fs.statSync(full_path);
        logger.info(full_path + ': ' + stats.isFile());
        if (stats.isFile()) {
            // 只要文件夹下存在一个文件就返回true.
            ret = true;
        }
    });
    return ret;
}

/**
 * 列表指定path下面所有文件夹
 * @string path 路径
 * @boolean hasFile 是否只列出有文件的目录, true表示只列出有文件目录, false表示列出所有目录, 无论下面是否有文件
 */
function _listDir(path, hasFile, keepOriPath) {
    const FUNC = TAG + "_listDir() --- ";
    let ret = [];
    
    readDir(path);
    logger.info(FUNC + "ret:", ret);
    
    // 同步版本
    function readDir(src_path) {
        logger.info(FUNC + "readDir()...");
        
        try {
            let file_list = fs.readdirSync(src_path);
            
            file_list.forEach(function (filename) {
                let new_path = src_path + '/' + filename;
                let stats = fs.statSync(new_path);
                // 处理文件夹
                if (stats.isDirectory()) {
                    let recordThis = true;
                    if (hasFile) {
                        recordThis = _hasFile(new_path);
                    }
                    if (recordThis) {
                        if (keepOriPath) {
                            ret.push(new_path);
                        }
                        else {
                            ret.push(new_path.slice(path.length + 1, new_path.length));
                        }
                    }
                    readDir(new_path);
                }
            });
        }
        catch(err) {
            logger.error(FUNC + "err:", err);
        }
    }

    return ret;
}

/**
 * 将指定目录(src_path)下文件列表写入指定文件(target_file)中
 * @boolean write_version 是否写入版本号，如果需要写入，则获取当前时间作为版本号，file_path:time_version
 * @function cb CallBack, 写完文件后的回调...
 */
function _dir(src_path, target_file, write_version, cb, postfix) {
    //path模块，可以生产相对和绝对路径
    let path = require("path");
    
    //配置远程路径
    let remotePath = src_path;
    if (StringUtil.startsWith(remotePath, "./")) {
        remotePath = remotePath.substr(2, remotePath.length);
    }
    
    //读取文件存储数组
    let fileArr = [];
    
    //读取文件目录
    function readDir() {
        
        //logger.info("readDir()...");
        
        fs.readdir(src_path, function (err, files) {
            if (err) {
                logger.info(err);
                return;
            }
            let count = files.length;
            //logger.info("count:" + count);
            let results = {};
            files.forEach(function (filename) {
                fs.stat(path.join(src_path, filename), function (err, stats) {
                    if (err) throw err;
                    //文件
                    if (stats.isFile()) {
                        if (getdir(filename) == postfix) {
                            let newUrl = remotePath + filename;
                            if (write_version) {
                                //logger.info("stats: ", stats);
                                let mtime = stats.mtime;
                                let time_version = new Date(mtime).format("yyyyMMddhhmmss");
                                fileArr.push('"' + newUrl + '":' + time_version + ',');
                            }
                            else {
                                fileArr.push(newUrl);
                            }
                            writeFile(fileArr);
                        }
                    } else if (stats.isDirectory()) {
                        let name = filename;
                        readFile(path.join(src_path, filename), name);
                    }
                });
            });
        });
    }
    
    //获取后缀名
    function getdir(url) {
        //logger.info("getdir()...");
        let arr = url.split('.');
        let len = arr.length;
        return arr[len - 1];
    }
    
    //获取文件数组
    function readFile(readurl, name) {
        //logger.info("readFile()...");
        //logger.info(name);
        let name = name;
        fs.readdir(readurl, function (err, files) {
            if (err) { logger.info(err); return; }

            let count = files.length;
            //logger.info("---count:" + count);
            
            files.forEach(function (filename) {
                fs.stat(path.join(readurl, filename), function (err, stats) {
                    if (err) throw err;
                    logger.info("stats: ", stats);
                    //是文件
                    if (stats.isFile()) {
                        let newUrl = remotePath + name + '/' + filename;
                        if (write_version) {
                            let birthtime = stats.birthtime;
                            let time_version = new Date(birthtime).format("yyyyMMddhhmmss");
                            fileArr.push('"' + newUrl + '":' + time_version + ',');
                        }
                        else {
                            fileArr.push(newUrl);
                        }
                        writeFile(fileArr);
                    //是子目录
                    } else if (stats.isDirectory()) {
                        let dirName = filename;
                        readFile(path.join(readurl, filename), name + '/' + dirName);
                    }
                });
            });
        });
    }
    
    
    // 写入到filelisttxt文件
    function writeFile(data) {
        //logger.info("writeFile()...");
        let data = data.join("\n");
        fs.writeFile(target_file, data + '\n', function (err) {
            if (err) {
                logger.error("写入失败: ", err);
            }
        });
    }

    readDir();
    if (cb != null) {
        cb();
    }
}

/**
 * 异步方式读取指定文件的内容.
 */
function _readFileSync(path) {
    return fs.readFileSync(path);
}

//==========================================================
// Wrap Method
//==========================================================
/**
 * fs.existsSync(path)
 * 如果文件存在，则返回 true，否则返回 false.
 * TEST: tTODO
 */
function existsSync(path) {
    return fs.existsSync(path);
}

/**
 * fs.mkdirSync(path[, mode])
 * 创建一个文件夹path.
 * TEST: tTODO
 */
function mkdirSync(path) {
    return fs.mkdirSync(path);
}