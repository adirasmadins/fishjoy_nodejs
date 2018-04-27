module.exports = {
    CATALOG: {
        /** 充值卡 */
        CARD: 1,
        /** 实物 */
        REAL: 2,
        /** 游戏道具 */
        GAME_ITEM: 3,
    },
    STATUS: {
        /** 确认中 */
        CONFIRM: 0,
        /** 发放中 */
        SENGING: 1,
        /** 发放成功 */
        SENDSUCCESS: 2,
        /** 取消 */
        CANCEL: 3,
        /** 发放失败 */
        SENDFAIL: 4,
    },
    PAY_SERVER_IP: '10.16.99.39',
    PAY_SERVER_PORT: '2337'
};