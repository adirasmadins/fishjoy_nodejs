const redirect_https = require('../../common/redirect_https');

module.exports = (router) => {
    router.prefix = '/';
   //获取管理后台首页
    router.get('/', async (ctx, next) => {
        ctx.status = 302;
        ctx.redirect(redirect_https.genRedirectUrl(ctx.protocol, ctx.host, '/login.html'));
    });

};

