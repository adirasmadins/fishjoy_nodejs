const answer = require('../../utils/answer');
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const logicResponse = require('./logicResponse');
const genAccount = require('./genAccount');
const logger = require('omelo-logger').getLogger('http', __filename);

module.exports = async function handler(ctx, target, next) {
    if (!target) {
        ctx.body = answer.httpResponse(ERROR_OBJ.NOT_SUPPORT_SERVICE, ctx.request.body.aes, true);
        return;
    }

    try {

        let reqData = ctx.request.body.data;
        if (reqData && reqData.uid) {
            reqData.account = await genAccount.getAccount(reqData.uid, ctx.url);
        }

        if (!genAccount.checkParams(ctx, reqData)) {
            throw ERROR_OBJ.PARAM_MISSING;
        }

        let {
            type,
            data
        } = await target(ctx.request.body.data, ctx);

        switch (type) {
            case logicResponse.TYPE.DATA:
                {
                    ctx.body = answer.httpResponse(data, ctx.request.body.aes);
                    return data;
                }
            case logicResponse.TYPE.EJS:
                {
                    await ctx.render(data.template, data.data);
                    break;
                }
            case logicResponse.TYPE.REDIRECT:
                {
                    ctx.redirect(data);
                    break;
                }
            case logicResponse.TYPE.FILE:
                {
                    ctx.response.set('Content-Type', 'application/vnd.openxmlformats');
                    ctx.response.set("Content-Disposition", "attachment; filename=" + encodeURIComponent(data.fileName));
                    // 将数据转为二进制输出
                    // 对应res.end(data, 'binary');
                    ctx.body = new Buffer(data.excel, 'binary');
                    break;
                }
            default:
                {
                    logger.error(`处理http请求${ctx.request.url}返回结果类型未知`);
                    ctx.body = answer.httpResponse(ERROR_OBJ.SERVER_INTERNAL_ERROR, ctx.request.body.aes, true);
                    break;
                }
        }

    } catch (err) {
        logger.error(`处理http请求${ctx.request.url}发生异常`, err);
        ctx.body = answer.httpResponse(err, ctx.request.body.aes, true);
    } finally {
        next && await next();
    }
};