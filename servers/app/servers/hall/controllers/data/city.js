/**
 * 设置城市
 * Created by zhenghang on 2017/9/20.
 */
var buzz_city = require('../../src/buzz/buzz_city');
var data_util = require('./data_util');
const logicResponse = require('../../../common/logicResponse');

var TAG = "【data/city】";
var DEBUG = 1;

async function setCity(data) {
    return new Promise(function(resolve, reject){
        buzz_city.setCity(data, function (err,result) {
            if(err){
                logger.error('设置城市 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

exports.setCity = setCity;