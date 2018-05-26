const tbl_id_arr = require('./tbl_account_server_4.json');
const fs = require('fs');


let data = tbl_id_arr[2].data;

logger.info(data);

let ids = {};
for(let i = 0; i< data.length; i++){
    ids[data[i].uid] = 1;

}


fs.appendFileSync('test_ids_4.json', JSON.stringify(ids));

logger.info('写入完成');

// const moment = require('moment')
//
// logger.info(moment().format('YYYY-MM-DD HH:MM:SS'));
//
// setTimeout(function () {
//     logger.info(moment().format('YYYY-MM-DD HH:MM:SS'));
// },10000)


// const fs = require('fs');
// const account_def = require('../consts/account_def');

// let obj = {};
//
// let keys_account = Object.keys(account_def.PlayerModel);
// keys_account.forEach(function (key) {
//
//     obj[key.toUpperCase()] = `prefix + ${key.toLowerCase()}`;
//
// });
//
// let keys_other = Object.keys(account_def.PlayerModel);
// keys_other.forEach(function (key) {
//
//     obj[key.toUpperCase()] = `prefix + ${key.toLowerCase()}`;
//
// });
//
// fs.appendFileSync('rediskey.json', JSON.stringify(obj));
// logger.info('写入完成')


// let obj = {};
//
// let keys_account = Object.keys(account_def.PlayerModel);
// keys_account.forEach(function (key) {
//
//     obj[key.toUpperCase()] = key.toLowerCase();
//
// });
//
// let keys_other = Object.keys(account_def.PlayerModel);
// keys_other.forEach(function (key) {
//
//     obj[key.toUpperCase()] = key.toLowerCase();
//
// });
//
// fs.appendFileSync('msyqlkey.json', JSON.stringify(obj));
// logger.info('写入完成')


// const RANK_SCORE_OFFSET = Math.pow(10, 7); //排位权重偏移
// const ONE_MINUTE_SECONDS = 60;
// const ONE_HOUR_SECONDS = ONE_MINUTE_SECONDS * 60;
// const ONE_DAY_SECONDS = 24 * ONE_HOUR_SECONDS;
// const MONTH_MAX_SECONDS = 2764799;  //月最大秒数
//
// /**
//  * 获取时间权重
//  * @returns {number}
//  */
// function getTimeWeight() {
//     let t = new Date();
//     return t.getDate() * ONE_DAY_SECONDS + t.getHours() * ONE_HOUR_SECONDS + t.getMinutes() * ONE_MINUTE_SECONDS + t.getSeconds();
// }
//
// /**
//  * 获取时间权重分
//  * @param score
//  * @returns {number}
//  */
// function getTimeWeightScore(score) {
//     return score*RANK_SCORE_OFFSET + (MONTH_MAX_SECONDS - getTimeWeight());
// }
//
// /**
//  * 获取原始分数
//  * @param weighScore
//  * @returns {number}
//  */
// function getOriginScore(weighScore) {
//     return Math.floor(weighScore / RANK_SCORE_OFFSET);
// }
//
//
//
// let A = getTimeWeightScore(999999998);
// logger.info('AA:', A);
// setTimeout(function () {
//
//     let B = getTimeWeightScore(999999999);
//     logger.info('BB:', B);
//     if (A > B) {
//         logger.info('A>b OK');
//
//     }else {
//         logger.info('A<=b OK');
//     }
//
//     logger.info('A:', getOriginScore(A));
//     logger.info('B:', getOriginScore(B));
//
// }, 10000);











