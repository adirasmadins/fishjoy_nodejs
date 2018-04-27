////////////////////////////////////////
// FrameUtil
// 框架处理工具集
//--------------------------------------
// 如何使用
// var FrameUtil = require('src/buzz/FrameUtil');
// FrameUtil.func(params...);
////////////////////////////////////////

var ArrayUtil = require('../utils/ArrayUtil');
var StringUtil = require('../utils/StringUtil');
var ObjUtil = require('./ObjUtil');

function _getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
}
exports.getClientIp = _getClientIp;

function _getRoleName (userrole) {
    switch (userrole) {
        case '1':
            return '超级管理员';
        case '2':
            return '渠道管理员';
        default:
            return '游客';
    }

    // TODO: 读取缓存的角色表
}

function _getCookieInfo(cookies, target_key) {
    for (var key in cookies) {
        if (StringUtil.endsWith(key, target_key)) {
            return cookies[key];
        }
    }
    return null;
}

function _getMemberName(cookies) {
    return _getCookieInfo(cookies, 'name');
}
exports.getMemberName = _getMemberName;

function _getMemberRoleId(cookies) {
    return _getCookieInfo(cookies, 'role');
}
exports.getMemberRoleId = _getMemberRoleId;

function _getMemberInfo(cookies) {
    //logger.info(FrameUtil.getClientIp(req));
    logger.info(cookies);

    // 从cookie中获取用户名和角色编号
    var username = '';
    var userRoleName = '';
    for (var key in cookies) {
        if (StringUtil.endsWith(key, 'name')) {
            username = cookies[key];
        }
        if (StringUtil.endsWith(key, 'role')) {
            userRoleName = _getRoleName(cookies[key]);
        }
    }
    
    return {
        username: username,
        userrole: userRoleName
    };
}
exports.getMemberInfo = _getMemberInfo;

function _findParent(tree, parent_id) {
    //logger.info('tree: ', tree);
    if (tree.item.id == parent_id) {
        return tree;
    }
    else {
        for (var i = 0; i < tree.nodes.length; i++) {
            var result = _findParent(tree.nodes[i], parent_id);
            if (result != null) {
                return result;
            }
        }
    }
    return null;
}
exports.findParent = _findParent;


//==========================================================
// 处理权限相关的通用方法
//==========================================================

// Step1: getAuthPage
function _getAuthPage(req, res, page_lan, cb) {
    // 根据cookie中的role值查询对应角色的auth_ids字段
    var memberRoleId = _getMemberRoleId(req.cookies);
    logger.info('memberRoleId: ' + memberRoleId);
    
    // 查询数据库role获取角色信息
    myDao.getRoleInfo(memberRoleId, function (err, result) {
        if (err) {
            logger.info('[ERROR] getRoleInfo: ' + err);
            return;
        }
        logger.info('result: ' + JSON.stringify(result));
        _mergeMemberInfo(req, res, page_lan, result, cb);
    });
}

// Step2: mergeMemberInfo
function _mergeMemberInfo(req, res, page_lan, result, cb) {
    // 生成显示用户信息的数据
    var memberName = _getMemberName(req.cookies);
    var role_name_cn = result.role_name_cn;
    var role_name_en = result.role_name_en;
    var memberinfo = {
        username: memberName,
        userrole: role_name_cn
    };
    page_lan = ObjUtil.merge(page_lan, memberinfo);
    
    _getRoleAuthPages(req, res, page_lan, result, cb);
}

// Step3: getRoleAuthPages
function _getRoleAuthPages(req, res, page_lan, result, cb) {
    // 根据角色权限进行设置
    var auth_ids = result.auth_ids;
    myDao.getAuthPages(auth_ids, function (err, pages) {
        if (err) {
            logger.info('[ERROR] getAuthPages: ' + err);
            return;
        }
        logger.info('pages: ' + JSON.stringify(pages));
        var auth_pages = {};
        for (var i = 0; i < pages.length; i++) {
            var page = pages[i];
            var key = page.replace('/', 'auth_').replace(new RegExp('-', "gm"), '_');
            auth_pages[key] = 1;
        }
        logger.info('[FrameUtil]_getRoleAuthPages() - auth_pages: ' + JSON.stringify(auth_pages));
        logger.info('----------------------------------------------');
        logger.info('[FrameUtil]_getRoleAuthPages() - page_lan: ' + JSON.stringify(page_lan));
        logger.info('----------------------------------------------');
        page_lan = ObjUtil.merge(page_lan, auth_pages);

        cb(page_lan);
    });
}

// page_lan: 页面相关的变量
// cb: callback回调函数, 进行下一步的处理
function _handleAuth(req, res, page_lan, cb) {
    logger.info('[FrameUtil]_handleAuth() - page_lan: ' + JSON.stringify(page_lan));
    logger.info('----------------------------------------------');
    _getAuthPage(req, res, page_lan, cb);
}
exports.handleAuth = _handleAuth;

// 权限控制: 不具备访问某页面的权限就跳转到首页
function _redirectWhenAuthForbidden(res, flag, next) {
    if (flag != 1) {
        res.redirect('/index');
        return;
    }
    next();
}
exports.redirectWhenAuthForbidden = _redirectWhenAuthForbidden;