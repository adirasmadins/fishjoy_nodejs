const constDef = require('../../../consts/constDef');

module.exports = {
    //子任务类型定义
    SUBTASK_TYPE: {
        REWARD: Symbol('reward'),
        DEL: Symbol('del'),
        MODIFY: Symbol('modify'),
        SPECIAL: Symbol('special')
    },

    RANK_TYPE: constDef.RANK_TYPE,

    REWARD_TYPE: {
        DAILY: 1,
        WEEK: 2,
        MONTH: 3
    },

    RANK_TRIM: {
        TOP: 1,
        BOTTOM: 2,
    },
};