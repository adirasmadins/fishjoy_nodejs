const VER_KEY = require('../versions').VER_KEY;
const PUB = require('../versions').PUB;

module.exports = {
    redis:require(`./${VER_KEY[PUB]}/redis.json`),
    mysql:require(`./${VER_KEY[PUB]}/mysql.json`)
};