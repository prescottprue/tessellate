var config = require('./backend/config/default').config,
systemUtils = require('./lib/systemUtils');

var confFile = require('./config.json');

/**
 * Get port from environment and store in Express.
 */
 var app = require('./app');

var port = systemUtils.normalizePort(process.env.PORT || confFile.server.port || 4000);
console.log('Server started...');
console.log('Environment: ' + config.envName || 'ERROR');
console.log('Port: ' + port);
app.set('port', port);

var server = systemUtils.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);

module.exports = app;
/**
 * Load view helpers
 */
require('./app-locals');
