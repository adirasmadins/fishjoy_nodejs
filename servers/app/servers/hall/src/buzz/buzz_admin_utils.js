exports.checkToken = _checkToken;
exports.checkTokenPost = _checkTokenPost;

/**
 * 检查token并返回用户的权限
 */
function _checkToken(req, cb) {
    _printReq(req);

    cb();
}

/**
 * 检查token并返回用户的权限
 */
function _checkTokenPost(req, cb) {
    _printReq(req);
    
    // TODO: 从req.body中获取用户的token等信息, 查找用户角色对应的权限, 决定用户所能看到的页面
    var token = req.body.token;
    if (token == null) {
        logger.info("跳转到登录界面");
        // res.render("admin/login", _makeVar());
    }
    else {
        logger.info("回调，直接渲染仪表盘");
        logger.info("通过token查找用户信息(权限，角色等)");
        myDao.getUserInfo(req.body, function (err, user_info) {
            logger.info("getUserInfo complete...");
            if (err) {
                logger.info(JSON.stringify(err));
                cb(err);
            } else {
                // 在这里统一处理auth
                logger.info('----------user_info: ', user_info);
                var rows = user_info['auth_list'];
                var user_auth = {};
                for (var i = 0; i < rows.length; i++) {
                    user_auth[rows[i]] = 1;
                }
                
                //cb(null, user_auth);
                cb(null, user_auth, user_info);
            }
        });
    }
}

function _printReq(req) {
    logger.info("req.body: ", req.body);
}