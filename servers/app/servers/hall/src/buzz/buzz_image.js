////////////////////////////////////////////////////////////
// Image Related
////////////////////////////////////////////////////////////

//==============================================================================
// import
//==============================================================================

//------------------------------------------------------------------------------
// 工具
//------------------------------------------------------------------------------
var BuzzUtil = require('../utils/BuzzUtil');
var _ = require('underscore');
var async = require('async');

var CommonUtil = require('./CommonUtil');
var HttpUtil = require('../utils/HttpUtil');
var RedisUtil = require('../utils/RedisUtil');
var CstError = require('../../../../consts/fish_error');

//------------------------------------------------------------------------------
// 业务
//------------------------------------------------------------------------------
var buzz_account = require('./buzz_account');

//==============================================================================
// const
//==============================================================================
var DEBUG = 1;
var ERROR = 1;

var TAG = "【buzz_image】";

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.load = load;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 加载网络图片
 */
function load(req, data, cb) {
    const FUNC = TAG + "load() --- ";
    if (DEBUG) logger.info("CALL load()");

    if (!_prepare(data, cb)) return;
    BuzzUtil.cacheLinkDataApi(data, "load_web_img");

    var id = data["token"].split("_")[0];
    var web_url = data['web_url'];
    var web_url_id = data['web_url_id'];
    var download = false;

    logger.info(FUNC + 'web_url:', web_url);
    logger.info(FUNC + 'web_url_id:', web_url_id);

    if(!web_url_id || isNaN(Number(web_url_id)) || web_url_id<0){
        cb(null, 'img/0/0/jiaodie.png');
        return;
    }

    async.waterfall([function (cb) {
            buzz_account.check(req, data, cb);
        }, function (data, cb) {
            if (web_url == null || web_url == "" || typeof(web_url) == "undefined" || web_url == "1" ||
                web_url.split("_|||_")[0] == "http://p3.wmpic.me/article/2015/05/18/1431913649_GWJqwtVU.jpeg") {
                //cb(1);
                cb(null, data);//test
            } else {
                cb(null, data);
            }
        }, function (data, cb) {
            RedisUtil.hget('pair:uid:local_url', web_url_id, cb);
        }, function (local_url, cb) {
            if (!local_url) {
                download = true;
                let imgObj = {
                    id: web_url_id,
                    web_url: web_url
                };
                HttpUtil.postImg("/img_api/load_web_img", imgObj, function (ret) {
                    cb(null, ret);
                });
            } else {
                cb(null, local_url);
            }
        }, function (ret, cb) {
            if (download) {
                HttpUtil.handleReturn(ret, cb);
            } else {
                cb(null, ret);
            }
        }, function (ret, cb) {
            if (download) {
                RedisUtil.hset('pair:uid:local_url', web_url_id, ret);
            }
            cb(null, ret);
        }
        ], function (err, res) {
            if (err) {
                cb(null, 'img/0/0/jiaodie.png');
            } else {
                cb(err, res);
            }
        }
    );
}

//==============================================================================
// private
//==============================================================================

// 准备工作: 传入参数验证
function _prepare(data, cb) {
    const FUNC = TAG + "_prepare() --- ";
    if (DEBUG) logger.info(FUNC + "data:", data);

    var token = data["token"];
    var web_url = data['web_url'];
    var localpath = data['localpath'];

    if (!CommonUtil.isParamExist("buzz_image", token, "接口调用请传参数token(玩家token, 仅允许客户端调用)", cb)) return false;
    if (!CommonUtil.isParamExist("buzz_image", web_url, "接口调用请传参数web_url(需要下载的图片源地址)", cb)) return false;
    if (!CommonUtil.isParamExist("buzz_image", localpath, "接口调用请传参数localpath(非客户端传入, 存储网络图片时使用的本地路径)", cb)) return false;

    return true;

}