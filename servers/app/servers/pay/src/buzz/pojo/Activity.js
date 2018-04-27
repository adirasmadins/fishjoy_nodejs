const Reward = require('./Reward');
const active_cdkey_cfg = require('../../../../config').gameConfig.active_cdkey_cfg;

exports.Activity = Activity;// 活动对象

/**
 * id 活动ID.
 */
function Activity(id) {
    // ---- 储存原始活动ID
    this.id = id;
    
    // ---- 储存解析后的奖励
    this.starttime = '';    // 开始时间
    this.endtime = '';      // 结束时间
    this.repeat = '';       // 可否重复领取
    this.description = '';  // 描述
    this.reward = {};       // 奖励
    
    // ---- 解析活动
    for (let i in active_cdkey_cfg) {
        let activity = active_cdkey_cfg[i];
        if (activity.id == this.id) {
            this.starttime = activity.starttime;
            this.endtime = activity.endtime;
            this.repeat = activity.repeat;
            this.description = activity.description;
            this.reward = new Reward(activity.reward);
            break;
        }
    }
}