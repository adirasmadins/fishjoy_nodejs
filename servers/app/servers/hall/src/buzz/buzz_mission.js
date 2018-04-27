
function getMission(data, cb) {
    let account = data.account;
    cb && cb(null, {mission_only_once: account.mission_only_once, mission_daily_reset: account.mission_daily_reset});
}

exports.getMission = getMission;