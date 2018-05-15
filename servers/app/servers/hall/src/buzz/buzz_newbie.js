const moment = require('moment');
const MissionModel = require('../../../../utils/account/RewardModel');

exports.getNewbieInfo = (data, cb) => {
    const uid = data.id;
    const account = data.account;
    const created_at = account.created_at;

    // 计算当前是登录第几天
    let current_date = moment();
    let create_date = moment(created_at);
    let day_nth = current_date.diff(create_date, 'days') + 1;
    // 计算截止日期
    let end_time = create_date.add(8, 'days').format('YYYY-MM-DD 23:59:59');
    // TODO: 获取领取状态
    let reward_status = account.active_stat_newbie;

    let ret = {
        day_nth: day_nth,
        end_time: end_time,
        reward_status: reward_status,
    };

    console.error('getNewbieInfo:\n', ret);
    cb(null, ret);
}

exports.syncNewbieProgress = async (data, cb) => {
    const uid = data.id;
    const account = data.account;
    let progress = await MissionModel.getNewbieTaskProcessInfo(account) || {};
    let ret = progress.active_stat_newbie;
    cb(null, ret);
}

exports.getNewbieReward = (data, cb) => {

}