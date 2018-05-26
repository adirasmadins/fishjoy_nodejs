const dao_feedback = require('../dao/dao_feedback');
const redisAccountSync = require('../../../../utils/redisAccountSync');
const REDISKEY = require('../../../../models/index').REDISKEY;
const clone = require('clone');

const LEN = 100;
const HOT4LEN = 10;

class Feedback {
    constructor() {
        this._data = [];
        this._hot4 = [];
    }

    async init() {
        try {
            let datas = await dao_feedback.loadAll(LEN);
            //id,uid,text,time,like_uids,like_count
            for (let i = datas.length - 1; i >= 0; i--) {
                let newVar = await this.parseData(datas[i]);
                newVar && this._data.push(newVar);
            }
            let hot4 = await dao_feedback.loadHot4(HOT4LEN);
            for (let i = 0; i < hot4.length; i++) {
                let newVar = await this.parseData(hot4[i]);
                newVar && this._hot4.push(newVar);
            }
        } catch (err) {
            logger.error(err);
        }
    }

    async parseData(data) {
        let like_uids = data.like_uids ? JSON.parse("[" + data.like_uids + "]") : [];
        for (let i = 0; i < like_uids.length; i++) {
            if (like_uids[i] == 'null') {
                like_uids.splice(i, 1);
            }
        }
        let uid = data.uid;
        let time = new Date(data.time).getTime();
        let account;
        try {
            // 不在这里获取test的原因: 如果redis中没有数据, 会取默认值1
            // 但是此处没有数据应取-1
            account = await redisAccountSync.getAccountAsync(uid, ['nickname', 'figure_url']);
        } catch (err) {
            return null;
        }
        return {
            mid: data.id,
            uid: uid,
            text: data.text,
            timestamp: time,
            like_uids: like_uids,
            like_count: like_uids.length,
            username: account.nickname,
            figure: account.figure_url,
            test: data.test,
        };
    }


    async insertMsg(uid, text, cb) {
        try {
            let time = new Date().getTime();
            let mid = await dao_feedback.insertMsg(uid, text);
            let account = await redisAccountSync.getAccountAsync(uid, ['nickname', 'figure_url', 'test']);
            if (!account) {
                cb({code: 123123, msg: "no data"});
                return;
            }
            let msg = {
                mid: mid,
                uid: uid,
                text: text,
                timestamp: time,
                like_uids: [],
                like_count: 0,
                username: account.nickname,
                figure: account.figure_url,
                test: parseInt(account.test),
            };
            redisConnector.pub(REDISKEY.CH.FEEDBACK, msg);
            msg.is_me_like = false;
            cb(null, msg);
        } catch (err) {
            logger.error(err);
            cb(err);
        }
    }

    delMsg(mid) {
        redisConnector.pub(REDISKEY.CH.DEL_FEEDBACK, mid);
        dao_feedback.del(mid);
    }

    likeMsg(mid, uid) {
        let ret = {
            like_count: 0,
            success: false,
        };
        if (!uid) {
            logger.error("likemsg uid error:", uid);
            return ret;
        }
        for (let i = 0; i < this._hot4.length; i++) {
            let data = this._hot4[i];
            if (data.mid == mid) {
                let like_uids = data.like_uids;
                uid = Number(uid);
                let likeCount = like_uids.length;
                if (likeCount == 0 || !like_uids.includes(uid)) {
                    redisConnector.pub(REDISKEY.CH.LIKE_FEEDBACK, { mid: mid, uid: uid });
                    dao_feedback.update(mid, like_uids, uid, likeCount + 1);
                    ret.like_count = likeCount + 1;
                    ret.success = true;
                }
                break;
            }
        }
        for (let i = 0; i < this._data.length; i++) {
            let data = this._data[i];
            if (data.mid == mid) {
                let like_uids = data.like_uids;
                uid = Number(uid);
                let likeCount = like_uids.length;
                if (like_uids.length == 0 || !like_uids.includes(uid)) {
                    redisConnector.pub(REDISKEY.CH.LIKE_FEEDBACK, { mid: mid, uid: uid });
                    dao_feedback.update(mid, like_uids, uid, likeCount + 1);
                    ret.like_count = likeCount + 1;
                    ret.success = true;
                }
                break;
            }
        }
        return ret;
    }

    update(msg) {
        this._data.push(msg);
        if (this._data.length > LEN) {
            this._data.shift();
        }
    }

    del(mid) {
        mid = Number(mid);
        for (let i = 0; i < this._hot4.length; i++) {
            if (this._hot4[i].mid == mid) {
                this._hot4.splice(i, 1);
                break;
            }
        }
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i].mid == mid) {
                this._data.splice(i, 1);
                break;
            }
        }
    }

    like(m) {
        let mid = m.mid;
        let uid = Number(m.uid);
        for (let i = 0; i < this._hot4.length; i++) {
            let data = this._hot4[i];
            if (data.mid == mid) {
                let like_uids = data.like_uids;
                if (like_uids.length === 0 || !like_uids.includes(uid)) {
                    like_uids.push(uid);
                }
                break;
            }
        }
        for (let i = 0; i < this._data.length; i++) {
            let data = this._data[i];
            if (data.mid == mid) {
                let like_uids = data.like_uids;
                if (like_uids.length === 0 || !like_uids.includes(uid)) {
                    like_uids.push(uid);
                }
                break;
            }
        }
    }

    /**
     * 捕鱼圈留言数据是否可以返回
     * 非作弊玩家留言, 或者请求者为作弊玩家且此条为该玩家玩家留言放过
     * @param {*} data 
     * @param {*} request_uid 
     */
    isAvailable(data, request_uid) {
        return (data.test < 0 && data.uid == request_uid) || (data.test >= 0);
    }

    async getMsg(request_uid, timestamp, count, need_hot4, cb) {
        try {
            let msg = [];
            // logger.error('this._data:\n', this._data);
            for (let i = this._data.length - 1; i >= 0; i--) {
                // 作弊玩家过滤
                let data = clone(this._data[i]);
                // 非作弊玩家留言, 或者请求者为作弊玩家且此条为该玩家玩家留言放过
                if (this.isAvailable(data, request_uid)) {
                    if (data.timestamp < timestamp) {
                        data.is_me_like = data.like_uids.length > 0 ? data.like_uids.includes(request_uid) : false;
                        data.like_count = data.like_uids.length;
                        // 返回客户端数据, 需要尽量精简(这里是克隆的数据, 删除不会影响原有数据)
                        delete data.like_uids;
                        msg.push(data);
                    }
                }
                if (msg.length >= count) {
                    break;
                }
            }
            let hot4 = [];
            if (need_hot4) {
                for (let i = 0; i < this._hot4.length; i++) {
                    let data = clone(this._hot4[i]);
                    if (this.isAvailable(data, request_uid)) {
                        data.is_me_like = data.like_uids.length > 0 ? data.like_uids.includes(request_uid) : false;
                        data.like_count = data.like_uids.length;
                        delete data.like_uids;
                        hot4.push(data);
                    }
                    if (hot4.length == 4) {
                        break;
                    }
                }
            }

            cb(null, {
                server_time: new Date().getTime(),
                msg_list: msg,
                hot4: hot4,
            });
        } catch (err) {
            logger.error(err);
            cb(err);
        }
    }
}

module.exports = new Feedback();