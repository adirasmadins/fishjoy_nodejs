////////////////////////////////////////
// TokenUtil
// 票据处理工具集
//--------------------------------------
// 如何使用
// var TokenUtil = require('src/buzz/TokenUtil');
// TokenUtil.verifyTokenTrue;
////////////////////////////////////////

var StringUtil = require('../utils/StringUtil');


// 需要验证token正确时调用
exports.verifyTokenTrue = function (req, res, next) {
    var token = '';
    for (var key in req.cookies) {
        if (StringUtil.endsWith(key, 'token')) {
            token = req.cookies[key];
        }
    }
    if (!token) {
        // 跳转到登录界面
        res.redirect('/sdk4sp/pages-signin.html');
        return;
    }
    
    myDao.findMemberByToken(token, function (err, rows) {
        if (err) return res.error('[ERROR] ERR_INTERNAL');
        
        if (rows.length <= 0) {
            return res.error('[ERROR] ERR_AUTHENTICATION_EXPIRED');
        } else {
            req.member = rows[0];
            next();
        }
    });
};

// 需要验证token错误时调用
exports.verifyTokenFalse = function verifyToken(req, res, next) {
    var token = '';
    for (var key in req.cookies) {
        if (StringUtil.endsWith(key, 'token')) {
            token = req.cookies[key];
        }
    }
    if (!token) {
        // 继续，显示登录页面
        next();
        return;
    }
    
    myDao.findMemberByToken(token, function (err, rows) {
        if (err) {
            return next();
        }
        
        if (rows.length <= 0) {
            return next();
        } else {
            res.redirect('/sdk4sp/index.html');
        }
    });
};