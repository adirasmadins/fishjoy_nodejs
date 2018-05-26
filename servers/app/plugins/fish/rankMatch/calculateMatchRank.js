const import_def = require('../../../models/index');
const REDISKEY = import_def.REDISKEY;
const ACCOUNTKEY = import_def.ACCOUNTKEY;
const GAMECFG = require('../../../utils/imports').DESIGN_CFG;
const rank_rankgame_cfg = GAMECFG.rank_rankgame_cfg;
const redisSync = require('../../../utils/redisAccountSync');

class CalculateMatchRank {

    async refreshTop(uid, platform, pid, result) {
        let key = this._getRedisRankKey(platform);
        const len = await redisConnector.zcard(key);
        const start = len > 11 ? len - 11 : 0;
        const data = await redisConnector.zrangewithscores(key, start, -1);
        const size = data.length;
        let isChange = false;

        for (let i = 0; i < size; i += 2) {
            if (data[i] == uid) {
                if (i == 0 && len > 11) break;
                isChange = true;
                break;
            }
        }
        if (isChange) {
            for (let j = 0; j < size; j += 2) {
                let id = data[j];
                let points = data[j + 1];
                let rank = (size - j) / 2;
                for (let i = rank_rankgame_cfg.length - 1; i > 0; i--) {
                    let info = rank_rankgame_cfg[i];
                    if (points >= info.integral) {
                        let maxranking = info.maxranking;
                        if (maxranking !== 0 && rank <= maxranking) {
                            if (id == uid) {
                                result.matchRank = info.id;
                                result.charm = info.charm;
                                result.treasure2 = info.treasure2;
                                result.treasure1 = info.treasure1;
                            } else if (id != pid) {
                                let accountAsync = await redisSync.getAccountAsync(id, [ACCOUNTKEY.MATCH_RANK]);
                                let matchRank = info.id - accountAsync.match_rank;
                                accountAsync.match_rank = matchRank;
                                matchRank !== 0 && accountAsync.commit();
                            }
                            break;
                        } else if (maxranking === 0 && id != pid) {
                            let accountAsync = await redisSync.getAccountAsync(id, [ACCOUNTKEY.MATCH_RANK]);
                            accountAsync.match_rank = info.id - accountAsync.match_rank;
                            accountAsync.commit();
                            break;
                        }
                    }
                }
            }
        }
        return isChange;
    }

    async calculateAll(p1, p1_points, p2, p2_points) {
        let result = {p1_data: {}, p2_data: {}};
        let i = rank_rankgame_cfg.length;
        let p1_is_refresh = false;
        let p2_is_refresh = false;
        let p1_stop_flag = false;
        let p2_stop_flag = false;
        let p1_is_rebot = p1.account.id < 0;
        let p2_is_rebot = p2.account.id < 0;
        while (i > 0 && i--) {
            let rank_info = rank_rankgame_cfg[i];
            //p1
            if (p1_points >= rank_info.integral && !p1_stop_flag) {
                if (rank_info.maxranking == 0 || p1_is_rebot) {
                    result.p1_data = {
                        matchRank: rank_info.id,
                        charm: rank_info.charm,
                        treasure2: rank_info.treasure2,
                        treasure1: rank_info.treasure1
                    };
                    p1_stop_flag = true;
                } else {
                    if (!p1_is_refresh) {
                        p1_stop_flag = await this.refreshTop(p1.account.id, p1.account.platform, p2.account.id, result.p1_data);
                        p1_is_refresh = true;
                    }
                }
            }

            //p2
            if (p2_points >= rank_info.integral && !p2_stop_flag) {
                if (rank_info.maxranking == 0 || p2_is_rebot) {
                    result.p2_data = {
                        matchRank: rank_info.id,
                        charm: rank_info.charm,
                        treasure2: rank_info.treasure2,
                        treasure1: rank_info.treasure1
                    };
                    p2_stop_flag = true;
                } else if (!p2_is_refresh) {
                    p2_stop_flag = await this.refreshTop(p2.account.id, p2.account.platform, p1.account.id, result.p2_data);
                    p2_is_refresh = true;
                }
            }
        }
        return result;
    }

    _getRedisRankKey(platform) {
        return `${REDISKEY.RANK.MATCH}:${platform}`;
    }
}

module.exports = new CalculateMatchRank();