const _ = require('underscore');
const tools = require('../../../utils/tools');

module.exports = (router) => {

	function setRoute(route, ejs) {
		router.get(route, async (ctx, next) => {
			let i18n = 'en_US';
			if (ctx.session) {
				i18n = ctx.session.i18n || 'en_US';
			}
			let data = {};
			let locals = require('../configs/locals/' + i18n);
			data = _.extend(data, locals);

			// 如果是index.html, 需要单独处理
			if ('index' == ejs) {
				if (ctx.session.role) {
					ejs = ctx.session.role.sidebar;
				}
				else {
					logger.error(`[Error]role不存在:session=\n`, ctx.session);
				}
			}
			await ctx.render(ejs, data);
		});
	}

	tools.ObjUtil.pages(setRoute);
};