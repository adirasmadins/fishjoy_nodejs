////////////////////////////////////////
// Propose
// 活动对象
//--------------------------------------
// 如何使用
// var Propose = require('src/buzz/pojo/Propose').Propose;
// var Propose = new Propose(id);
// Propose.func(obj, params...);
////////////////////////////////////////

//==============================================================================
// import
//==============================================================================

//------------------------------------------------------------------------------
// POJO对象
//------------------------------------------------------------------------------

var CacheUserInfo = require('../cache/CacheUserInfo');
var ArrayUtil = require('../../../../hall/src/utils/ArrayUtil');

exports.Propose = Propose;// 建议对象
exports.getPropose = getPropose;// 获取方法

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
//----------------------------------------------------------
// Propose
//----------------------------------------------------------
/**
 * @param uid 玩家ID.
 * @param text 玩家建议的文字.
 */
function Propose(mid, uid, text) {
    /** 留言ID(message id). */
    this.mid = mid;
    this.id = mid;

    /** 玩家UID. */
    this.uid = uid;

    /** 建议文字. */
    this.text = text;

    /** 建议时间. */
    this.time = new Date().getTime();

    /** 点赞的用户ID列表. */
    this.like_uids = [];

    /** 点赞的次数. */
    this.like_count = 0;

    /** 标识此数据是否有变化, 存入数据库后将会重设为false */
    this.change = false;

    /**
     * 玩家点赞: 已经点过的不会重复点
     * @param uid 点赞玩家的ID
     */
    this.like = function(uid) {
        var like_success = true;
        for (var i = 0; i < this.like_uids.length; i++) {
            if (this.like_uids[i] == uid) {
                like_success = false;
            }
        }
        if (like_success) {
            this.like_uids.push(uid);
            this.like_count++;
            this.change = true;
        }
        return {
            like_count: this.like_count,
            success: like_success,
        };
    };
}

/**
 * 获取客户端能解析的数据格式
 * @param request_uid 请求列表的UID.
 * @param propose 需要处理的留言对象.
 */
function getPropose(request_uid, propose) {
    var figure = "http://p3.wmpic.me/article/2015/05/18/1431913649_GWJqwtVU.jpeg";
    var username = "TODO";
    var userInfo = CacheUserInfo.query(propose.uid);
    if (userInfo && userInfo.figure) {
        figure = userInfo.figure;
    }
    if (userInfo && userInfo.username) {
        username = userInfo.username;
    }
    var is_me_like = ArrayUtil.contain(propose.like_uids, request_uid);
    return {
        mid: propose.mid,
        timestamp: new Date(propose.time).getTime(),
        is_me_like: is_me_like,
        like_count: propose.like_count,
        text: propose.text,
        uid: propose.uid,
        figure: figure,
        username: username,
    };
}