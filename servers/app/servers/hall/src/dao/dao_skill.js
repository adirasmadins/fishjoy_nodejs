const StringUtil = require('../utils/StringUtil');
const ObjUtil = require('../buzz/ObjUtil');
const CstError = require('../../../../consts/fish_error');
const AccountCommon = require('./account/common');
const ITEM_CFG = require('../../../../utils/imports').DESIGN_CFG.item_item_cfg;
const CacheSkill = require('../buzz/cache/CacheSkill');
const ERROR_OBJ = CstError.ERROR_OBJ;

const ITEM_SKILL = 3;

const TAG = "【dao_skill】";


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.write = write;
exports.addSkillLog = addSkillLog;
exports.addSkillLogEx = addSkillLogEx;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 批量插入连接日志.
 */
function write(pool, cb) {
    const FUNC = TAG + "write() --- ";
    //----------------------------------

    let skill_list = CacheSkill.cache();
    _sumSkillInCache(pool, skill_list, function(err, result) {
        if (skill_list.length > 0) {
            _didWrite(pool, skill_list, cb);
        }
        else {
            cb(null, FUNC + "没有可以插入的数据");
        }
    });

}


/**
 * 增加技能记录(在一段时间内获取或使用的某种技能的数量)
 */
function addSkillLogEx(account, data, cb) {

    if (!_prepare(data, cb)) {
        return;
    }
    let nickname = (account.nickname != null);

    _didAddSkillLog(mysqlConnector, data, cb, account, nickname);
}


/**
 * 增加技能记录(在一段时间内获取或使用的某种技能的数量)
 */
function addSkillLog(pool, data, cb) {
    
    if (!_prepare(data, cb)) {
        return;
    }
    let token = data['token'];

    AccountCommon.getAccountByToken(pool, token, function (err1, results1) {
        if (err1) {
            logger.info("err1：", err1);
            let extraErrInfo = {debug_info: "dao_skill.addSkillLog()-使用token查询玩家账户", err_obj: err1};
            logger.error(extraErrInfo.debug_info);
            cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.DB_ERR));
            return;
        }
        if (results1.length == 0) {
            logger.error('TOKEN_INVALID: dao_skill.addSkillLog()');
            cb(CstError.ERROR_OBJ.TOKEN_INVALID);
            return;
        }
        let account_result = results1[0];
        let nickname = (account_result.nickname != null);
        
        _didAddSkillLog(pool, data, cb, account_result, nickname);
    });
}


//==============================================================================
// private
//==============================================================================

function _didWrite(pool, skill_list, cb) {
    const FUNC = TAG + "_didWrite() --- ";
    //----------------------------------
    // yPEND: 增加字段comment
    // ALTER TABLE tbl_skill_log ADD `comment` letchar(100) NOT NULL DEFAULT '无' COMMENT '技能使用注释';
    let count = skill_list.length;
    let sql = "";
    sql += "INSERT `tbl_skill_log` ";
    sql += '(`account_id`,`skill_id`,`gain`,`cost`,`total`,`log_at`,`nickname`,`comment`) ';
    sql += 'VALUES ';
    for (let i = 0; i < count; i++) {
        if (i > 0) sql += ',';
        sql += '(?,?,?,?,?,?,?,?)';
    }

    let sql_data = [];
    for (let i = 0; i < count; i++) {
        let one_link = skill_list.shift();
        sql_data.push(one_link.account_id);
        sql_data.push(one_link.skill_id);
        sql_data.push(one_link.gain);
        sql_data.push(one_link.cost);
        sql_data.push(one_link.total);
        sql_data.push(new Date(one_link.log_at));
        sql_data.push(one_link.nickname);
        sql_data.push(one_link.comment || '无');
    }

    logger.info(FUNC + 'sql:\n', sql);
    logger.info(FUNC + 'sql_data:\n', sql_data);
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            logger.error(FUNC + "err:\n", err);
            logger.error(FUNC + 'sql:\n', sql);
            logger.error(FUNC + 'sql_data:\n', sql_data);
        } else {
            logger.info(FUNC + 'result: ', result);
        }
        cb(err, result);
    });
}

function _sumSkillInCache(pool, skill_list, cb) {
    cb(null, null);
}

/**
 * 增加技能数据log的准备工作, 准备好了返回true, 出现任何问题返回false.
 */
function _prepare(data, cb) {
    let token = data['token'];
    let skill_data = data['skill_data'];
    
    if (!_isParamExist(token, "接口调用请传参数token", cb)) return false;
    if (!_isParamExist(skill_data, "接口调用请传参数skill_data(玩家技能数据)", cb)) return false;
    
    if (typeof skill_data == "string") {
        try {
            skill_data = JSON.parse(skill_data);
        } catch (e) {
            cb(e);
            return false;
        }
    }
    
    if (skill_data.length == 0) {
        logger.info("更新的技能数据为空，数据库无需做出修改");
        cb(null, "更新的技能数据为空，数据库无需做出修改");
        return false;
    }
    return true;
}

/**
 * 检测客户端传入的参数, 如果参数不存在，返回false, 如果通过检测, 返回true.
 * @param param 待检测的参数.
 * @param err_info 如果检测失败，回调需要传回的信息.
 */
function _isParamExist(param, err_info, cb) {
    if (param == null) {
        logger.error(err_info);
        let extraErrInfo = { debug_info: "dao_skill.addSkillLog()-" + err_info };
        cb && cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.PARAM_MISSING));
        return false;
    }
    return true;
}

// 验证后加入一条log
function _didAddSkillLog(pool, data, cb, account, nickname) {
    const FUNC = TAG + "_didAddSkillLog() --- ";

    let account_skill = account.skill;
    let account_id = data['account_id'];
    let skill_data = data['skill_data'];

    logger.info(FUNC + "skill_data: ", skill_data);
    if (typeof skill_data == "string") {
        try {
            skill_data = JSON.parse(skill_data);
        } catch (e) {
            cb(e);
            return;
        }
    }

    if (skill_data.length == 0) {
        logger.error(FUNC + '插入的技能日志为0条, 不做数据库操作');
        cb(new Error('插入的技能日志为0条, 不做数据库操作'));
        return;
    }

    // 临时处理

    let sql = '';
    sql += 'INSERT INTO `tbl_skill_log` ';
    sql += '(`account_id`,`skill_id`,`gain`,`cost`,`total`,`nickname`) ';
    sql += 'VALUES';
    sql += ' (?,?,?,?,?,?)';
    if (skill_data.length > 1) {
        for (let i = 0; i < skill_data.length - 1; i++) {
            sql += ', (?,?,?,?,?,?)';
        }
    }
    
    let sql_data = [];
    for (let i = 0; i < skill_data.length; i++) {
        let skill_obj = skill_data[i];
        sql_data.push(account_id);
        sql_data.push(skill_obj.id);
        sql_data.push(skill_obj.gain);
        sql_data.push(skill_obj.cost);
        sql_data.push(skill_obj.total);
        sql_data.push(nickname);
    }

    logger.info(FUNC + 'sql:\n', sql);
    logger.info(FUNC + 'sql_data:\n', sql_data);

    if (sql_data.length == 0) {
        logger.error(FUNC + '---插入的技能日志为0条, 不做数据库操作');
        cb(new Error('插入的技能日志为0条, 不做数据库操作'));
        return;
    }

    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            logger.error(FUNC + "err:", err);
            logger.error(FUNC + 'sql:\n', sql);
            logger.error(FUNC + 'sql_data:\n', sql_data);
            cb(err);
        } else {
             logger.info(FUNC + 'result:\n', result);
            _updateSkillField(pool, data, account, cb, account_skill);
        }
    });
}

// 更新tbl_account表中的skill字段
function _updateSkillField(pool, data, account, cb, account_skill) {
    const FUNC = TAG + "_updateSkillField() --- ";

    logger.info(FUNC + "CALL...");

    let uid = data['account_id'];
    let skill_data = data['skill_data'];
    
    //if (typeof skill_data == "string") {
    if (StringUtil.isString(skill_data)) {
        try {
            skill_data = JSON.parse(skill_data);
        } catch (e) {
            logger.error(FUNC + "parse error(1):\n", e);
            cb(e);
            return;
        }
    }

    //校验售出道具时的合法性
    let failOperation = function () {
        logger.info('account.skill = 售卖技能失败');
        let ret1= {
            pearl: account.pearl,
            skill: account.skill,
            package: account.package,
        };
        cb(null, [ret1]);
    };
    if (!skill_data || skill_data.length === 0) {
        return failOperation();
    }
    let firstItem = skill_data[0];
    if (!firstItem) {
        return failOperation();
    } 
    if (!account.skill) {
        return failOperation();
    }
    let ownC = account.skill[firstItem.id] || 0;
    if (firstItem.sell) {
       if (firstItem.cost < 0 || ownC < firstItem.cost || firstItem.gain > 0 || Math.abs(firstItem.total - ownC) != firstItem.cost) {
            return failOperation();
        }
    }else{
        if (firstItem.gain < 0 || firstItem.cost > 0 || Math.abs(firstItem.total - ownC) != firstItem.gain) {
            return failOperation();
        }
    }
    let ret = {};
    if (account_skill == null) {
        logger.info(FUNC + 'account_skill == null');
        for (let i = 0; i < skill_data.length; i++) {
            let key = '' + skill_data[i].id;
            let value = skill_data[i].total;
            ret[key] = value;
        }
    }
    else {
        logger.info(FUNC + 'account_skill != null');
        try {
            if (StringUtil.isString(account_skill)) {
                logger.info(FUNC + "account_skill是一个字符串");
                ret = JSON.parse(account_skill);
            }
            else {
                logger.info(FUNC + "account_skill不是一个字符串");
                ret = account_skill;
            }
            //ret = JSON.parse(account_skill);
        } catch (e) {
            logger.error(FUNC + "错误的玩家技能字符串---account_skill", account_skill);// BUG
            logger.error(FUNC + "_updateSkillField()----parse error(2):\n", e);// BUG
            cb(e);
            return;
        }
        for (let i = 0; i < skill_data.length; i++) {
            let key = '' + skill_data[i].id;
            let value = skill_data[i].total;
            if (ret[key] == null) {
                let new_key = '' + skill_data[i].id;
                ret[new_key] = value;
            }
            else {
                ret[key] = value;
            }
        }
    }
    
    let firstItem = skill_data[0];
    let isSell = firstItem['sell'];
    let goldAdd = 0;
    // 处理卖出技能的逻辑
    if (isSell) {
        let sellItemId = firstItem['id'];
        let sellItemNum = firstItem['cost'];
        goldAdd = sellItemNum * _getItemSellPrice(sellItemId);
    }
    
    //--------------------------------------------------------------------------
    // 更新缓存中数据(重要:数据库操作将会被删除)
    //--------------------------------------------------------------------------

    account.skill = ret;
    account.gold = goldAdd;
    account.commit();

    let ret1= {
        gold: account.gold,
        skill: account.skill,
        package: account.package,
    };
    cb(null, [ret1]);
}

function _getItemSellPrice(skillId) {
    let sellPrice = 0;
    for (let itemId in ITEM_CFG) {
        let itemInfo = ITEM_CFG[itemId];
        if (itemInfo.type == ITEM_SKILL && itemInfo.id == skillId) {
            sellPrice = itemInfo.saleprice;
        }
    }
    return sellPrice;
}