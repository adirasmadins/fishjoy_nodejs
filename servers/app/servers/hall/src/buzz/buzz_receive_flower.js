const RedisUtil = require('../utils/RedisUtil');
const redisKeys = require('../../../../database').dbConsts.REDISKEY;


const TAG = "【buzz_receive_people】";

exports.flower_receive = flower_receive;
exports.flower_send = flower_send;

/**
 * @param uid
 * @param item [['i001',100]]
 */
function flower_receive(uid, item, cb) {
    const FUNC = TAG + "flower_receive() --- ";
    logger.info(FUNC + "CALL---");
    let itemid = item[0][0];
    if (itemid != 'i410') return;
    let itemcount = item[0][1];
    RedisUtil.hincrby(redisKeys.FLOWER_RECEIVE, uid, itemcount, function (err, total) {
        RedisUtil.hincrby(redisKeys.FLOWER_RECEIVE_WEEKLY, uid, itemcount, function (err, week_data) {
            cb && cb(week_data, total);
        });
    });
}

function flower_send(uid, item, cb) {
    let itemid = item[0][0];
    if (itemid != 'i410') return;
    let itemcount = item[0][1];
    RedisUtil.hincrby(redisKeys.FLOWER_SEND, uid, itemcount, function (err, total) {
        cb && cb(total);
    });

}