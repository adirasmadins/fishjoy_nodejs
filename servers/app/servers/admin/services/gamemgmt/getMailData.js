const _ = require('underscore');
const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取实时数据接口需要的返回值
 * @param {*} data {date:'YYYY-MM-DD'} 
 */
exports.get = async function (data, ctx) {
    // console.log('data:', data);
    let mailList = await getMailList(data.startDate, data.endDate, data.mailId);
    // console.log('mailList:', mailList);
    return makeChart(mailList);
};

async function getMailList(startDate, endDate, mailId) {
    let sql = SQL_CONFIG.getMailData;
    if (mailId && mailId.length > 0) {
        sql = SQL_CONFIG.getMailDataWithId.replace('|mid_list|', mailId);
    }
    let fields = tools.ObjUtil.makeSqlDataFromTo(startDate, endDate);
    let mailList = await tools.SqlUtil.query(sql, fields);
    return mailList;
}

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
function makeChart(list) {
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let mailData = list[i];

        let sendtime = tools.DateUtil.format(mailData.sendtime, tools.DateUtil.FMT.DT);
        let receiver = mailData.receiver;
        let received = mailData.received;
        let notReceived = receiver - received;
        if (mailData.type == 2 || mailData.type == 3) {
            receiver = JSON.parse(mailData.receiverUid || '[]');
            received = JSON.parse(mailData.receivedUid || '[]');
            notReceived = _.difference(receiver, received);
        }

        try {
            ret.push({
                id: mailData.id,
                mailId: mailData.id,
                title: mailData.title,
                time: sendtime,
                reward: JSON.parse(mailData.reward),
                type: mailData.type,
                typeText: getTypeText(mailData.type),
                valid: getValid(mailData),
                addByWho: 'op',
                receiver: receiver,
                received: received,
                notReceived: notReceived,
                status: mailData.status == 1 ? 'cancel' : 'valid'
            });
        }
        catch (err) {
            logger.error('mailData.reward:', mailData.reward);
            logger.error('err:', err);
        }
    }
    // console.log('ret:', ret);
    return ret;
}

function getValid(mailData) {
    let valid = '已生效';
    let validtime = new Date(mailData.validtime).getTime();
    let now = new Date().getTime();
    if (validtime > now) {
        valid = Math.round((validtime - now) / 1000) + 's';
    }
    return valid;
}

function getTypeText(type) {
    const MAIL_TYPE = {
        "1": '系统邮件',
        "2": '补偿邮件',
        "3": '指定邮件',
    };
    return MAIL_TYPE[type];
}
