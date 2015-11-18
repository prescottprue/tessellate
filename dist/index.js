'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

require('newrelic');

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _serveFavicon = require('serve-favicon');

var _serveFavicon2 = _interopRequireDefault(_serveFavicon);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _expressJwt = require('express-jwt');

var _expressJwt2 = _interopRequireDefault(_expressJwt);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _configJson = require('../config.json');

var _configJson2 = _interopRequireDefault(_configJson);

var _configDefault = require('./config/default');

var _libSystemUtils = require('./lib/systemUtils');

var _libSystemUtils2 = _interopRequireDefault(_libSystemUtils);

var _utilsLogger = require('./utils/logger');

var _utilsLogger2 = _interopRequireDefault(_utilsLogger);

var _configRoutes = require('./config/routes');

var _configRoutes2 = _interopRequireDefault(_configRoutes);

var app = (0, _express2['default'])();

var routeBuilder = require('./utils/routeBuilder')(app);

/** View Engine Setup
 * @description Apply ejs rending engine and views folder
 */
app.set('views', _path2['default'].join(__dirname, 'views'));
app.set('view engine', 'ejs');

/** Environment and variable setup
 * @description Set node variables based on environment settings
 */
app.set('config', _configDefault.config);
app.set('env', app.get('config').env);
/** Parsers
 * @description Body and cookie parsers
 */
app.use(_bodyParser2['default'].json());
app.use(_bodyParser2['default'].urlencoded({ extended: false }));
app.use((0, _cookieParser2['default'])());
/** Static files
 * @description References to static files
 */
app.use((0, _serveFavicon2['default'])(__dirname + './../public/favicon.ico'));
app.use(_express2['default']['static'](_path2['default'].join(__dirname, 'public')));

/** CORS Configuration
 * @description Enable cors and prefight on requests
 */
app.use((0, _cors2['default'])());
app.options('*', (0, _cors2['default'])());

/** Authentication
 * @description Enable authentication based on config setting
 */
if (_configDefault.config.authEnabled) {
  var allowedPaths = ['/', '/login', '/logout', '/signup', '/docs', '/docs/**', '/authrocket', /(\/apps\/.*\/login)/, /(\/apps\/.*\/logout)/, /(\/apps\/.*\/signup)/, /(\/apps\/.*\/providers)/];
  var secret = _configDefault.config.jwtSecret;
  if (_configDefault.config.authRocket && _configDefault.config.authRocket.enabled) {
    if (!_configDefault.config.authRocket.secret) {
      _utilsLogger2['default'].error({
        description: 'AuthRocket secret required to decode token. Check environment variables.',
        func: 'init', obj: 'server'
      });
    } else {
      secret = _configDefault.config.authRocket.secret;
    }
  }
  /** Route Protection
   * @description Protect all routes except allowedPaths by requiring Authorization header
   */
  app.use((0, _expressJwt2['default'])({ secret: secret }).unless({ path: allowedPaths }));
  /** Unauthorized Error Handler
   * @description Respond with 401 when authorization token is invalid
   */
  app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      _utilsLogger2['default'].error({
        description: 'Error confirming token.',
        error: err, obj: 'server'
      });
      //TODO: look for application name
      //TODO: Try decoding with application's authrocket secret
      return res.status(401).json({ message: 'Invalid token', code: 'UNAUTHORIZED' });
    }
  });
} else {
  _utilsLogger2['default'].warn({
    description: 'Authentication is disabled. Endpoint results may be affected.',
    obj: 'server'
  });
}

/** Route Builder
 * @description Setup routes based on config file
 */
routeBuilder(_configRoutes2['default']);

//------------ Error handlers -----------//

/** Error Logger
 * @description Log Errors before they are handled
 */
app.use(function (err, req, res, next) {
  _utilsLogger2['default'].error({
    message: err.message, url: req.originalUrl
  });
  if (err) {
    res.status(500);
  }
  res.send('Error: ' + err.message);
});

/** Page Not Found Handler
 * @description catch 404 and forward to error handler
 */
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/** Development Error Handler
 * @description print stacktraces when in local environment
 */
if (app.get('env') === 'local') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
/** Production Error Handler
 * @description keep stacktraces from being leaked to user
 */
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

/**
 * Get port from environment and store in Express.
 */
var port = _libSystemUtils2['default'].normalizePort(process.env.PORT || _configJson2['default'].server.port || 4000);
console.log('Server started...');
console.log('Environment: ' + _configDefault.config.envName || 'ERROR');
console.log('Port: ' + port);
app.set('port', port);
/**
 * Create app server object based on settings
 */
var server = _libSystemUtils2['default'].createServer(app);

/** Listen on provided port, on all network interfaces.
 */
server.listen(port);

module.exports = app;