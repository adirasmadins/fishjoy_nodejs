const redisKeys = require('../../../../../database').dbConsts.REDISKEY;

const SYS_LOG = {
    TYPE: [
        {redis_key: redisKeys.LOG.BAN_USER},//0
        // {redis_key: LOG.BAN_USER},//1
        // {redis_key: LOG.BAN_USER},//2
    ],
};

exports.SYS_LOG = SYS_LOG;