const versions = require('../versions');
const VER = versions.DEVELOPMENT ? versions.VER_KEY[versions.GAMEPLAY.LOCAL] : versions.VER_KEY[versions.PUB];

module.exports = {
    redis: require(`./${VER}/redis.json`),
    mysql: require(`./${VER}/mysql.json`),
};