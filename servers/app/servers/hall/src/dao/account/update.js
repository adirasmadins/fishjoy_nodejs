const BuzzUtil = require('../../utils/BuzzUtil');
const AccountUpdateGuide = require('./update/guide.js');

const UPDATE_TYPE_GOLD_SHOPPING = 8; // 每日购买金币的次数
const UPDATE_TYPE_GUIDE = 20;// 记录玩家是否完成了新手教学任务


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.updateAccount = updateAccount;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 账户数据更新(包括经验值(exp),...).
 */
function updateAccount(data, account, cb) {
    let type = data['type'];
    _handleUpdate(data, cb, type, account);
}

//==============================================================================
// private
//==============================================================================

function _handleUpdate(data, cb, type, my_account) {
    if (type == UPDATE_TYPE_GUIDE) {
        BuzzUtil.cacheLinkDataApi(data, "update_account_guide");
        AccountUpdateGuide.update(data, cb, my_account);
    }
    else {
        cb(new Error("不支持的更新类型: " + type + ", 请联系服务器管理员更新代码..."));
    }
}

