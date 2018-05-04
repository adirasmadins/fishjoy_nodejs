const downloader = require('../controllers/downloader');
const versions = require('../../../utils/imports').versions;
const CHANNEL_TAG = versions.VER_KEY[versions.PUB];
const redirect_https = require('../../common/redirect_https');
const omelo = require('omelo');
const httpCfg = omelo.app.get('http');
const logicResponse = require('../../common/logicResponse');

const www_domain = versions.WWW_DOMAIN.indexOf(versions.PUB) !== -1 ? 'www.' : null;

module.exports = (router) => {
	router.prefix = '/';

	//获取游戏首页
	router.get('/', async (ctx, next) => {
		ctx.status = 301;
        let host = ctx.host;
		if(ctx.host.search('www') == -1 && www_domain){
            host = www_domain + host;
		}
		let redirectUrl = redirect_https.genRedirectUrl(ctx.protocol, host, '/fishjoy/index.html?td_channelid=' + CHANNEL_TAG);
		logger.error('redirect url host=', host);
		logger.error('redirect url redirectUrl=', redirectUrl);

		ctx.redirect(redirectUrl);
		// ctx.type = 'html';
		// if (!gameIndexHtml) {
		// 	try {
		// 		gameIndexHtml = fs.readFileSync(path.join(__dirname, '../public/fishjoy/index.html'));
		// 		ctx.body = gameIndexHtml;
		// 	} catch (e) {
		// 		ctx.status = 404;
		// 	}
		// }

	});

	//获取游戏声明
	router.get('/policy', async (ctx, next) => {
		ctx.status = 301;
		ctx.redirect(redirect_https.genRedirectUrl(ctx.protocol, ctx.host, 'policy.html'));
		// ctx.type = 'html';
		// if (!policyHtml) {
		// 	try {
		// 		policyHtml = fs.readFileSync(path.join(__dirname, '../public/fishjoy/policy.html'));
		// 		ctx.body = policyHtml;
		// 	} catch (e) {
		// 		ctx.status = 404;
		// 	}
		// }
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