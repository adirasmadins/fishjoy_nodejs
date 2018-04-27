////////////////////////////////////////////////////////////////////////////////
// Account Update Defend Goddess
// 心跳更新(每日凌晨重置为0)
// update
////////////////////////////////////////////////////////////////////////////////

//==============================================================================
// import
//==============================================================================
//var AccountCommon = require('../common');
//var CacheAccount = require('../../../buzz/cache/CacheAccount');


//==============================================================================
// const
//==============================================================================
var DEBUG = 0;
var ERROR = 1;

var TAG = "【dao_aquarium】";

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.updateTableAquarium = updateTableAquarium;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------


function updateTableAquarium(pool, account_id, aquarium, cb) {
    const FUNC = TAG + "updateTableAquarium() --- ";

    if (DEBUG) logger.info(FUNC + "CALL...");

    if (DEBUG) logger.info(FUNC + "aquarium", aquarium);
    
    var sql = "";
    sql += "SELECT id, total_level ";
    sql += "FROM `tbl_aquarium` ";
    sql += "WHERE `id`=?";
    var sql_data = [account_id];
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            if (DEBUG) logger.error(FUNC + 'err:\n', err);
            cb(err);
            return;
        }
        if (result.length == 0) {
            // 创建数据
            _insertAquarium(pool, account_id, function (err, result) {
                // 更新数据
                _didUpdateAquarium(pool, aquarium.petfish, { id: account_id, total_level: 0 });
            });
        }
        else {
            // 更新数据
            _didUpdateAquarium(pool, aquarium.petfish, result[0]);
        }
    });
}


//==============================================================================
// private
//==============================================================================

function _insertAquarium(pool, account_id, cb) {
    const FUNC = TAG + "_insertAquarium() --- ";

    if (DEBUG) logger.info(FUNC + "CALL...");
    
    var sql = "";
    sql += "INSERT INTO `tbl_aquarium` ";
    sql += "(id, total_level) ";
    sql += "VALUES (?,?)";
    var sql_data = [account_id, 0];
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            if (ERROR) logger.error(FUNC + 'err:\n', err);
            cb(err);
            return;
        }
        cb(null, result);
    });
}

function _didUpdateAquarium(pool, petfish_list, old_aquariun) {
    const FUNC = TAG + "_didUpdateAquarium() --- ";

    if (DEBUG) logger.info(FUNC + "CALL...");

    var temp_level = 0;
    for (var idx in petfish_list) {
        temp_level += petfish_list[idx].level;
    }
    
    if (old_aquariun.total_level < temp_level) {
        old_aquariun.total_level = temp_level;
        // 更新数据库
        var sql = "";
        sql += "UPDATE `tbl_aquarium` ";
        sql += "SET total_level=? ";
        sql += "WHERE id=?";
        var sql_data = [old_aquariun.total_level, old_aquariun.id];
        
        pool.query(sql, sql_data, function (err, result) {
            if (err) {
                if (ERROR) logger.error(FUNC + 'err:\n', err);
                return;
            }
        });
    }
}