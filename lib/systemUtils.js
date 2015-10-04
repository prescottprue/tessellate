/** sytemUtils
 * @description System utilities includes nodejs port management, server creation, and listeners.
 */
var server, port,
debug = require('debug')('tessellate:server'),
http = require('http');
/**
 * @function createServer
 * @description Create HTTP server.
 */
exports.createServer = function(app){
  server = http.createServer(app);
  server.on('error', onError);
  server.on('listening', onListening);
  return server;
}
/**
 * @function createServer
 * @description Create HTTP server.
 */
exports.normalizePort = normalizePort;

exports.onError = onError;
/**
 * @function onListening
 * @description Set server local variable and set "onListening" listener
 */
exports.onListening = function(server){
  server = server;
  return onListening;
};
/**
 * @function normalizePort
 * @description Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (typeof port !== 'undefined' && port >= 0) {
    // port number
    return port;
  }

  return false;
}
/**
 * @function onError
 * @description Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
/**
 * @function onListening
 * @description Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
