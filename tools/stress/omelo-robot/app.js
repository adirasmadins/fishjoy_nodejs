const envConfig = require('./app/config/env.json');
const config = require('./app/config/' + envConfig.env + '/config');
const Robot = require('./lib/robot').Robot;
const fs = require('fs');
require('../../../servers/app/utils/logHelper')


const robot = new Robot(config);
let mode = 'master';

if (process.argv.length > 2){
    mode = process.argv[2];
}
 
if (mode !== 'master' && mode !== 'client') {
	throw new Error(' mode must be master or client');
}

if (mode === 'master') {
    robot.runMaster(__filename);
} else {
    var script = (process.cwd() + envConfig.script);
    robot.runAgent(script);
}

process.on('uncaughtException', function(err) {
  /* temporary code */
	console.error(' Caught exception: ' + err.stack);
	if (!!robot && !!robot.agent){
		// robot.agent.socket.emit('crash', err.stack);
	}
	fs.appendFile('./log/.log', err.stack, function (err) {});
  /* temporary code */
});
