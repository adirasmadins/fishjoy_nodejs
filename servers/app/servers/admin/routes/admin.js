const httpHandler = require('../../common/httpHandler');
const tools = require('../../../utils/tools');

module.exports = (router) => {

	router.prefix('/admin');

	function setRoute(route, menu, method) {
		router.post(route, async (ctx, next) => {
			await httpHandler(ctx, menu[method], next);
		});
	}

	tools.BuzzUtil.routes(setRoute);
};

// session的使用
// fishjoy_server3.1\servers\config\service\local\http.js
// 增加配置
// session: {
// 	store: dbCfg.redis,
// 	maxAge: 3600000
// }