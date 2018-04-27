
let loadGames = ['fish'];

loadGames.forEach(function(item){
    module.exports[item] = require('./' + item);
});