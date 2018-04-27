const RANK_SCORE_OFFSET = Math.pow(10, 7); //排位权重偏移
const ONE_MINUTE_SECONDS = 60;
const ONE_HOUR_SECONDS = ONE_MINUTE_SECONDS * 60;
const ONE_DAY_SECONDS = 24 * ONE_HOUR_SECONDS;
const MONTH_MAX_SECONDS = 2764799;  //月最大秒数

/**
 * 获取时间权重
 * @returns {number}
 */
function _getTimeWeight() {
    let t = new Date();
    return t.getDate() * ONE_DAY_SECONDS + t.getHours() * ONE_HOUR_SECONDS + t.getMinutes() * ONE_MINUTE_SECONDS + t.getSeconds();
}

/**
 * 获取时间权重分
 * @param score
 * @returns {number}
 */
function _getTimeWeightScore(score) {
    return score*RANK_SCORE_OFFSET + (MONTH_MAX_SECONDS - _getTimeWeight());
}

/**
 * 获取原始分数
 * @param weighScore
 * @returns {number}
 */
function _getOriginScore(weighScore) {
    return Math.floor(weighScore / RANK_SCORE_OFFSET);
}


module.exports.getTimeWeightScore = _getTimeWeightScore;
module.exports.getOriginScore = _getOriginScore;


function test() {
    let A = _getTimeWeightScore(999999998);
    logger.info('AA:', A);
    setTimeout(function () {

        let B = _getTimeWeightScore(999999999);
        logger.info('BB:', B);
        if (A > B) {
            logger.info('A>b OK');

        }else {
            logger.info('A<=b OK');
        }

        logger.info('A:', _getOriginScore(A));
        logger.info('B:', _getOriginScore(B));

    }, 10000);
}
