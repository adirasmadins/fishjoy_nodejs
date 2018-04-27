const HttpSessionFilter = require('./httpSessionFilter').HttpSessionFilter;

class AdminFilter extends HttpSessionFilter {
    handleError(ctx, err) {
        logger.error(ctx.url, '会话SESSION无效，请重新登录', err);
        ctx.redirect('/error.html');
    }
}

module.exports = new AdminFilter();