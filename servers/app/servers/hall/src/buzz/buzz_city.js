/**
 * 设置城市
 * Created by zhenghang on 2017/9/21.
 */
const CstError = require('../../../../consts/fish_error');
const ERROR_OBJ = CstError.ERROR_OBJ;

exports.setCity = _setCity;

function _setCity(dataObj, cb) {
    let city = dataObj.city;
    if (typeof(city) === 'string') {
        let account = dataObj.account;
        logger.error('account = ', account.city, ' tartge = ', city);
        account.city = city;
        account.commit();
        cb && cb(null, []);
    }else{
        cb && cb(ERROR_OBJ.PARAM_WRONG_TYPE);
    }
}