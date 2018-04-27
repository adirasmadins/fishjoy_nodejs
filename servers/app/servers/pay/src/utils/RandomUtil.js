//==============================================================================
// import
//==============================================================================
var _ = require('underscore');


//==============================================================================
// variables
//==============================================================================
var TAG = "【RandomUtil】";


//==============================================================================
// exports
//==============================================================================
exports.random = random;
exports.randomInt = randomInt;
exports.randomNum = randomNum;
exports.randomReward = randomReward;
exports.randomDrop= randomDrop;


//==============================================================================
// implements
//==============================================================================
/**
 * 随机函数的包装.
 */
function random() {
    return Math.random();
}

/**
 * 获取一个随机数，范围是0~maxNum.
 * @param maxNum 随机数的最大取值.
 */
function randomInt(maxNum) {
    return Math.floor(Math.random() * maxNum);
}

/**
 * 获取一个随机整数，范围是minNum~maxNum.
 * @param minNum 随机整数的最小取值.
 * @param maxNum 随机整数的最大取值.
 */
function randomNum(minNum,maxNum) {
    return parseInt(Math.random() * (maxNum-minNum+1)+minNum,10);
}

/**
 * 获取随机奖励.
 * @param reward 随机奖励数组
 *     格式: [[1,100],[2,100],[3,100],[4,100]]
 *     含义: 每一项是一个宝箱box, box[0]是宝箱ID, box[1]是宝箱概率
 */
function randomReward(reward) {
    var box_random_list = [];
    var total = 0;
    for (var i = 0; i < reward.length; i++) {
        var box = reward[i];
        total += box[1];
        box_random_list.push(total);
    }
    var random = randomInt(total);

    // logger.info("random:", random);
    // logger.info("box_random_list:", box_random_list);

    for (var i = 0; i < box_random_list.length; i++) {
        if (random <= box_random_list[i]) {
            var box = reward[i];
            return box[0];
        }
    }
}

/**
 * 获取随机掉落物品, 一次获取一个, 如需掉落多个可多次获取.
 * @param reward 随机奖励数组
 *     格式: [["r1001"],["r2001"]], [1800, 800]
 *     含义: drop_id是一个掉落ID列表, probability是宝箱概率
 */
function randomDrop(drop_info) {
    var drop_id = drop_info.drop_id;
    var probability = drop_info.probability;
    var box_random_list = [];
    var total = 0;
    if (!drop_info.box_random_list) {
        for (var i = 0; i < probability.length; i++) {
            total += probability[i];
            box_random_list.push(total);
        }
        drop_info.box_random_list = box_random_list;
    }
    box_random_list = drop_info.box_random_list;
    total = box_random_list[box_random_list.length - 1];
    var random = randomInt(total);

    // logger.info("random:", random);
    // logger.info("box_random_list:", box_random_list);

    for (var i = 0; i < box_random_list.length; i++) {
        if (random <= box_random_list[i]) {
            return drop_id[i];
        }
    }
}