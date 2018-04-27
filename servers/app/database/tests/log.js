// const logWriter = require('../event/utils/logWriter');
// function testLog() {
//     let initId = 0;
//     // account_id', 'log_at', 'nickname
//
//     logWriter.setDBtype(0)
//
//     setInterval(function () {
//         let now = moment().format('YYYY-MM-DD HH:mm:ss');
//
//         for (let i = 0; i< 20; i++){
//             initId++;
//             logWriter.add(0, {account_id:initId, log_at:now, nickname:initId%13});
//             logWriter.add(1, {account_id:initId, log_at:now, nickname:initId%13});
//             logWriter.add(2, {account_id:initId, log_at:now, gain:initId%13, cost:initId%13, total:initId%13,scene:0,nickname:0});
//         }
//     },2);
// }