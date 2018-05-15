const eventType = require('../../../consts/eventType');
const redisKey = require('../../../database/index').dbConsts.REDISKEY;
const ACCOUNTKEY = require('../../../database/index').dbConsts.ACCOUNTKEY;
const platform_data_conf = require('../../../utils/imports').sysConfig.PLATFORM_DATA_CONF;
const omelo = require('omelo');

class SubGameData {
    constructor() {
        this._pub_data_cb = null;
        logger.error('-----------------SubGameData');
    }

    listen(cb) {
        this._pub_data_cb = cb;

        redisConnector.sub(redisKey.DATA_EVENT_SYNC.PUMPWATER, this._pumpwater.bind(this));
        redisConnector.sub(redisKey.DATA_EVENT_SYNC.PLATFORM_CATCH_REVISE, this._platform_catch_revise.bind(this));
        redisConnector.sub(redisKey.DATA_EVENT_SYNC.PLATFORM_CATCHRATE, this._platform_catchrate.bind(this));
        redisConnector.sub(redisKey.DATA_EVENT_SYNC.SCENE_CATCHRATE, this._scene_catchrate.bind(this));
        redisConnector.sub(redisKey.DATA_EVENT_SYNC.PLAYER_CATCH_RATE, this._player_catchrate.bind(this));
        redisConnector.sub(redisKey.DATA_EVENT_SYNC.PLAYER_GAIN_LOSS_LIMIT, this._player_gain_loss_limit.bind(this));
        redisConnector.sub(redisKey.DATA_EVENT_SYNC.CASH_RECHAREGE_PERCET, this._cash_recharege_percet.bind(this));
    }

    _pumpwater(value) {
        let pump_water = value.pumpWater;
        let range_pump = platform_data_conf.PUMPWATER.RANGE;
        if (pump_water >= range_pump[0] && pump_water <= range_pump[1]) {
            this._pub_data_cb(redisKey.PLATFORM_DATA.PUMPWATER, pump_water);
        } else {
            logger.error('非法平台抽水系数设置，请及时检查平台安全性', value);
        }
    }

    _platform_catch_revise(value) {
        //TODO 校验数据有效性
        this._pub_data_cb(redisKey.PLATFORM_DATA.PLATFORM_CATCH_REVISE, value);
    }

    _platform_catchrate(value) {
        let range_pcatch = platform_data_conf.PLATFORM_CATCHRATE.RANGE;
        if (value >= range_pcatch[0] && value <= range_pcatch[1]) {
            this._pub_data_cb(redisKey.PLATFORM_DATA.PLATFORM_CATCHRATE, value);
        } else {
            logger.error('非法平台捕获率设置，请及时检查平台安全性', value);
        }
    }

    _scene_catchrate(value) {
        let range_pcatch = platform_data_conf.PLATFORM_CATCHRATE.RANGE;
        if (value.sceneId && value.value >= range_pcatch[0] && value.value <= range_pcatch[1]) {
            this._pub_data_cb(redisKey.PLATFORM_DATA.SCENE_CATCHRATE + value.sceneId, value.value);
        } else {
            logger.error('非法平台捕获率设置，请及时检查平台安全性', value);
        }
    }

    _player_catchrate(value) {
        let catchRate = value.value;
        let range_player = platform_data_conf.PLAYER_CATCH_RATE.RANGE;
        if (catchRate >= range_player[0] && catchRate <= range_player[1]) {
            //TODO::
            omelo.app.entry.instance.playerEventEmitter.emit(value.uid, ACCOUNTKEY.PLAYER_CATCH_RATE, catchRate);
        } else {
            logger.error('玩家捕获率设置非法值，请及时检查平台安全性', value);
        }
    }

    _player_gain_loss_limit(value) {
        //TODO 校验数据有效性
        // cache.set(redisKey.GAIN_LOSS_LIMIT, value);
        this._pub_data_cb(redisKey.GAIN_LOSS_LIMIT, value);
    }

    _cash_recharege_percet(value) {
        if (Number.isNaN(value) || (value > 1 || value < 0)) {
            logger.warn('全服提现比例系数异常', value);
        } else {
            // cache.set(redisKey.PLATFORM_DATA.CASH_RECHAREGE_PERCET, value);
            this._pub_data_cb(redisKey.PLATFORM_DATA.CASH_RECHAREGE_PERCET, value);
        }
    }
}

module.exports = SubGameData;