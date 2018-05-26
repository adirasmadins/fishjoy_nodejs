const SQL_CONFIG = require('../../configs/sql');
const REDISKEY = require('../../../../models/index').REDISKEY;
const tools = require('../../../../utils/tools');

/**
 * 获取实时数据接口需要的返回值
 * @param {*} data 
    {
        type:1|3, 
        title:’’, 
        content:’’ , 
        reward:’’ , 
        uid:’512,513’|undefined, 
        delay:60
    }
 */
exports.get = async function (data, ctx) {
    logger.error('data:\n', data);
    let type = data.type;
    let content = data.content;
    let reward = data.reward;
    let title = data.title;
    let player_list = data.uid;
    let delay = data.delay;
    let addByWho = ctx.session.uid;

    // 对前端传入的reward格式进行校验
    // [['i001',10],['i002',10]]
    if (!tools.ArrayUtil.isArray(JSON.parse(reward))) {
        return { result: false, err: '请传入正确的奖励格式' };
    }

    try {

        let result = await insertMail(type, content, reward, title, player_list, delay, addByWho);
        logger.error('result:\n', result);

        let insertId = result.insertId;

        switch (Number(type)) {
            case 1:
                // TODO: 对全服的玩家Redis进行操作
                break;
            case 2:
                let players = player_list.split(',');

                for (let i = 0; i < players.length; i++) {
                    let mail_box = await tools.RedisUtil.hget(REDISKEY.MAIL_BOX, players[i]);
                    if (!mail_box) {
                        await tools.RedisUtil.hset(REDISKEY.MAIL_BOX, players[i], "[" + insertId + "]");
                    }
                    else {
                        let mail = JSON.parse(mail_box);
                        if (typeof mail == 'object') {
    
                            mail.push(insertId);
                            await tools.RedisUtil.hset(REDISKEY.MAIL_BOX, players[i], JSON.stringify(mail));
                        }
                        else {
                            return { result: false, errorCode: this.app.config.ErrorCode.REDIS_ERROR_DATA };
                        }
                    }
                    // 需要将改变告诉同步服务器(这样就自动同步到玩家数据了)
                    await tools.BuzzUtil.syncAccount(players[i], 'mail_box');
                }
                break;
        }
        return { result: true, data: { id: insertId } };
    } catch (err) {
        console.log('err:', err);
        return { result: false, err: err.toString() };
    }
};

async function insertMail(type, content, reward, title, receiverUid, delay, addByWho) {
    let receiver = 0;
    if (receiverUid) {
        receiver = receiverUid.split(',').length;
    }
    else {
        // 计算全服人数
        receiver = (await tools.SqlUtil.query(SQL_CONFIG.accountCount, []))[0].sum;
    }
    // 计算生效时间
    let time = new Date().getTime() + delay * 1000;
    let validtime = tools.DateUtil.format(time, tools.DateUtil.FMT.DT);
    let sql_data = [type, content, reward, title, '[' + receiverUid + ']', receiver, validtime, addByWho];
    return await tools.SqlUtil.query(SQL_CONFIG.insertMail, sql_data);
}
