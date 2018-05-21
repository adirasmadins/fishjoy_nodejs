const downloader = require('../controllers/downloader');
const versionsUtil = require('../../../utils/imports').versionsUtil;
const redirect_https = require('../../common/redirect_https');
const omelo = require('omelo');
const httpCfg = omelo.app.get('http');
const logicResponse = require('../../common/logicResponse');
const www_domain = versionsUtil.getWWWDomain();

module.exports = (router) => {
	router.prefix = '/';

	//获取游戏首页
	router.get('/', async (ctx, next) => {
		ctx.status = 302;
        let host = ctx.host;
		if(ctx.host.search('www') == -1 && www_domain && !versionsUtil.isDevelopment()){
            host = www_domain + host;
		}
		let redirectUrl = redirect_https.genRedirectUrl(ctx.protocol, host, '/home/index.html?td_channelid=' + versionsUtil.getVerKey());
		logger.error('redirect url host=', host);
		logger.error('redirect url redirectUrl=', redirectUrl);

		ctx.redirect(redirectUrl);
	});

	//获取游戏声明
	router.get('/policy', async (ctx, next) => {
		ctx.status = 302;
		ctx.redirect(redirect_https.genRedirectUrl(ctx.protocol, ctx.host, 'policy.html'));
	});

	//图片下载
	router.get('/img', async (ctx, next) => {
		await downloader.download(ctx);
	});

	router.get('/gate', async(ctx, next)=>{
        let enable = ctx.protocol == 'https' ? true : false;
        let resource = httpCfg.resource[0];
		let gateInfo = {
            PROTOCOL : ctx.protocol,
            address: enable ?  resource.https.publicHost:
                resource.http.publicHost,
            port: enable ? resource.https.port : resource.http.port,
		};

        ctx.body = logicResponse.ask(gateInfo);
	});


};