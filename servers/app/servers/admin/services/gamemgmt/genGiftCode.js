const tools = require('../../../../utils/tools');

/**
 * 生成礼品码(生成成功返回一个true, 由客户端刷新礼包码列表并从那里下载礼包码信息)
 * @param {*} data data: { prefix: 'YY', num: '10', limit: '2' }
 */
exports.get = async function (data, ctx) {
    console.log('data:', data);

    try {
        generate(data.prefix, data.num, data.limit, data.action_id, ctx);
        return {
            result: true,
        };
    }
    catch (err) {
        logger.error('err:', err);
        return {
            result: false,
            err: err
        };
    }
};

/**
 * 生成礼包码
 * @param {*} prefix 礼包码前缀
 * @param {*} num 礼包码数量
 * @param {*} limit 礼包码使用限制
 * @param {*} ctx 上下文, 需要获取生成礼包码的管理员信息 
 */
async function generate(prefix, num, limit, action_id, ctx) {
    var cdKeyList = generateCdKeyList(prefix, num);
    console.log('cdKeyList:', cdKeyList);
    if (cdKeyList && cdKeyList.length > 0) {
        let created_at = tools.DateUtil.format(new Date(), tools.DateUtil.FMT.DT);
        let sql = "";
        sql += "INSERT INTO `tbl_cd_key` (`cd_key`, `action_id`, `limit`, `addByWho`, `created_at`) VALUES ";
        for (let i = 0; i < cdKeyList.length; i++) {
            if (i > 0) sql += ", ";
            sql += `('${cdKeyList[i]}', ${action_id}, ${limit}, ${ctx.session.uid}, '${created_at}')`;
        }
        console.log('sql:', sql);
        let res = await tools.SqlUtil.query(sql, []);
    }
}

function generateCdKeyList(prefix, num) {
    var ret = [];
    for (var i = 0; i < num; i++) {
        ret.push(prefix + generateCdKey());
    }
    return ret;
}

function generateCdKey() {
    var str = "";
    for (var i = 0; i < 8; i++) {
        var charOrNum = randomInt(2) % 2 == 0 ? "char" : "num";
        var r = 0;
        if ("char" == charOrNum) {
            var temp = randomInt(2) % 2 == 0 ? 65 : 97;
            var temp = 65;
            r = randomInt(26) + temp;
        } else if ("num" == charOrNum) {
            r = randomInt(10) + 48;
        }

        str += String.fromCharCode(r);
    }
    return str;
}

function randomInt(maxNum) {
    return Math.floor(Math.random() * maxNum);
}
