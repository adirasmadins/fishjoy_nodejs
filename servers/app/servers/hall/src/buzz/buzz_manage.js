// 游戏管理相关的业务代码...

var fs = require('fs');
var StringUtil = require('../utils/StringUtil');

// /**
//  * 生成资源地图(用于根据文件名来查找对应的UUID)
//  */
// function _makeResMap() {
//     // prev: 验证settings.js文件是否为模块，如果不是则复写文件
//     var settings_file = "./public/fishjoy_game/src/settings.js";
//     var module_export_txt = "exports.settings = _CCSettings;";
//     // 读文件
//     fs.readFile(settings_file, "utf8", function (error, data) {
//         if (error) {
//             logger.info(error);
//             return;
//         }
//         // logger.info(data);
//         if (StringUtil.contain(data, module_export_txt)) {
//             logger.info("已经有模块导出语句");
//             _didMakeResMap();
//         }
//         else {
//             logger.info("还没有模块导出语句，需要复写文件");
//             // 写文件
//             var txt = data + '\n' + module_export_txt;
//             fs.writeFile(settings_file, txt, function (err) {
//                 if (error) {
//                     logger.info(error);
//                     return;
//                 }
//                 logger.info("settings.js Saved !");
//                 _didMakeResMap();
//             });
//         }
//     });
// }
// exports.makeResMap = _makeResMap;

// function _didMakeResMap() {
//     // (1)
//     // 查找settings.js中对应文件的UUID
//     var settings = require('../../public/fishjoy_game/src/settings');
    
//     // (2)
//     // 读取settings.settings.rawAssets.assets
//     var assets = settings.settings.rawAssets.assets;
    
//     // 定义资源地图的匹配变量
//     var res_map_assets = {};
    
//     // 完成资源文件名到UUID的匹配
//     for (var uuid in assets) {
//         var file_name = assets[uuid][0];
//         res_map_assets[file_name] = uuid;
//     }
//     //logger.info("res_map_assets: ", res_map_assets);
    
//     // (3)
//     // 读取settings.settings.rawAssets.internal
//     var internal = settings.settings.rawAssets.internal;
    
//     // 定义资源地图的匹配变量
//     var res_map_internal = {};
    
//     // 完成资源文件名到UUID的匹配
//     for (var uuid in internal) {
//         var file_name = internal[uuid][0];
//         res_map_internal[file_name] = uuid;
//     }
//     //logger.info("res_map_internal: ", res_map_internal);
    
//     // 将res_map_settings写入文件res_map.js中
//     var txt = '';
//     txt += 'var assets = ' + JSON.stringify(res_map_assets) + ';';
//     txt += 'exports.assets = assets;';
//     txt += 'var internal = ' + JSON.stringify(res_map_internal) + ';';
//     txt += 'exports.internal = internal;';
    
//     txt = StringUtil.replaceAll(txt, '","', '",\n"');
//     txt = StringUtil.replaceAll(txt, '{"', '{\n"');
//     txt = StringUtil.replaceAll(txt, ';', ';\n');
    
//     // 写入文件
//     fs.writeFile("./routes/admin/res_map.js", txt, function (err) {
//         if (err) throw err;
//         logger.info("File Saved !"); //文件被保存
//     });
// }