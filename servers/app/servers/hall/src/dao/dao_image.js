////////////////////////////////////////////////////////////////////////////////
// 网络图片加载服务
////////////////////////////////////////////////////////////////////////////////

//==============================================================================
// import
//==============================================================================
var CommonUtil = require('../buzz/CommonUtil');
var ObjUtil = require('../buzz/ObjUtil');

var ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;

var CacheAccount = require('../buzz/cache/CacheAccount');

var AccountCommon = require('./account/common');

//==============================================================================
// const
//==============================================================================
var ERROR = 1;
var DEBUG = 0;

var TAG = "【dao_image】";

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.getUrlFromWeb2Local = getUrlFromWeb2Local;
exports.create = create;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
/**
 * 获取图片的本地链接
 */
function getUrlFromWeb2Local(pool, data, cb) {

    var img_id = data.web_url.split("_|||_")[1];

    var sql = "";
    sql += "SELECT * ";
    sql += "FROM `tbl_img` ";
    // sql += "WHERE `web_url`=? ";
    sql += "WHERE `id`=? ";

    // var sql_data = [data.web_url];
    var sql_data = [img_id];

    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            cb(err);
            return;
        }
        if (results.length == 0) {
            cb(null, null);
            return;
        }
        cb(null, results[0].local_url);
    });

}

/**
 * 创建一条新的记录
 */
function create(pool, data, cb) {
    
    const FUNC = TAG + "create() --- ";

    var sql = "";
    sql += "INSERT INTO `tbl_img` ";
    sql += "(`web_url`, `local_url`) ";
    sql += "VALUES (?, ?)";
    
    var sql_data = [data.web_url, data.local_url];
    
    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            cb(err);
            return;
        }
        logger.info("results:", results);
        var id = results.insertId;
        if (data.no_id) {
            cb(null, data.local_url, id);
        }
        else {
            // 根据插入的数值改写local_url
            _updateLocalImageName(pool, id, function () {
                
                logger.info(FUNC + "id:\n", id);

                cb(null, data.local_url + id + ".jpg", id);
            });
        }
    });

}


//==============================================================================
// private
//==============================================================================

function _updateLocalImageName(pool, id, cb) {

    var sql = "";
    sql += "UPDATE `tbl_img` ";
    sql += "SET `local_url`=concat(`local_url`, '" + (id + ".jpg") + "') ";
    sql += "WHERE `id`=?";

    var sql_data = [id];
    
    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            cb(err);
            return;
        }
        logger.info("results:", results);
        cb(null);
    });
}