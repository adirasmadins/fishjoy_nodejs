// Match AI Model
// author: YXL

const config = require('../config');

class AiData {
    constructor() {
        this._canRun = true;
        this._CacheIERAvg = {};
        logger.error('-----------------AiData'); 
    }

    runTask() {
        if (!this._canRun) return;
        setTimeout(function () {
            this._calc();
            this.runTask();
        }.bind(this), config.MATCH.MATCH_AI_INTERVAL);
    }

    start() {
        this._calc();
        this.runTask();
    }

    stop() {
        this._canRun = false;
    }

    /**
     * 获取平均收支比.
     */
    getIOR(rank) {
        return this._CacheIERAvg[rank];
    }

    _calc() {
        const FUNC = '【AiData】 _calc() ---- ';
        let sql = "";
        sql += "SELECT COALESCE(SUM(`bullet_score1`), 0) AS score, ";
        sql += "COALESCE(SUM(`used_bullet1`), 0) AS bullet, ";
        sql += "COALESCE(SUM(`nuclear_exploded1`), 0) AS nuclear_exploded, ";
        sql += "COALESCE(SUM(`nuclear_score1`), 0) AS nuclear_score, ";
        sql += "COALESCE(COUNT(`nuclear_exploded1`), 0) AS game_count, ";
        sql += "rank1 AS rank ";
        sql += "FROM `tbl_rankgame_log` ";
        sql += "WHERE `player2`<0 ";
        sql += "GROUP BY rank1";

        mysqlConnector.query(sql, function (err, results) {
            if (err) {
                logger.info(FUNC + "err:\n", err);
                logger.info(FUNC + "sql:\n", sql);
                return;
            }

            let score = {};
            let bullet = {};

            for (let i = 0; i < results.length; i++) {
                let result = results[i];
                let rank = result.rank;
                score["" + rank] = result.score;
                bullet["" + rank] = result.bullet;
            }

            let ret = {};
            for (let idx in bullet) {
                let total_score = score["" + idx];
                let total_bullet = bullet["" + idx];
                if (total_bullet == 0) {
                    ret["" + idx] = 0;
                }
                else {
                    ret["" + idx] = total_score / total_bullet;
                }
            }

            this._CacheIERAvg = ret;

        }.bind(this));
    }

}

module.exports = new AiData();