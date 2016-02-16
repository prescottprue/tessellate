'use strict';

/**
 * Module dependencies.
 */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
// import csrf from 'csurf';


var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _cookieSession = require('cookie-session');

var _cookieSession2 = _interopRequireDefault(_cookieSession);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _methodOverride = require('method-override');

var _methodOverride2 = _interopRequireDefault(_methodOverride);

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

var _swig = require('swig');

var _swig2 = _interopRequireDefault(_swig);

var _expressJwt = require('express-jwt');

var _expressJwt2 = _interopRequireDefault(_expressJwt);

var _connectFlash = require('connect-flash');

var _connectFlash2 = _interopRequireDefault(_connectFlash);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _viewHelpers = require('view-helpers');

var _viewHelpers2 = _interopRequireDefault(_viewHelpers);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mongoStore = require('connect-mongo')(_expressSession2.default);
var env = process.env.NODE_ENV || 'development';

/**
 * Expose
 */

module.exports = function (app, passport) {

  // Compression middleware (should be placed before express.static)
  app.use((0, _compression2.default)({
    threshold: 512
  }));

  // Static files middleware
  app.use(_express2.default.static(_config2.default.root + '/public'));

  // Use winston on production
  var log = 'dev';
  if (env !== 'development') {
    log = {
      stream: {
        write: function write(message) {
          return _winston2.default.info(message);
        }
      }
    };
  }

  // Don't log during tests
  // Logging middleware
  if (env !== 'test') app.use((0, _morgan2.default)(log));

  // Swig templating engine settings
  if (env === 'development' || env === 'test') {
    console.log('');
    _swig2.default.setDefaults({
      cache: false
    });
  }

  // set views path, template engine and default layout
  app.engine('html', _swig2.default.renderFile);
  app.set('views', _config2.default.root + '/app/views');
  app.set('view engine', 'html');

  // expose package.json to views
  app.use(function (req, res, next) {
    res.locals.pkg = _package2.default;
    res.locals.env = env;
    next();
  });

  // bodyParser should be above methodOverride
  app.use(_bodyParser2.default.json());
  app.use(_bodyParser2.default.urlencoded({ extended: true }));
  app.use((0, _multer2.default)({ dest: './uploads/' }).single('image'));
  app.use((0, _methodOverride2.default)(function (req) {
    if (req.body && _typeof(req.body) === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }));

  // CookieParser should be above session
  app.use((0, _cookieParser2.default)());
  app.use((0, _cookieSession2.default)({ secret: 'secret' }));
  app.use((0, _expressSession2.default)({
    resave: true,
    saveUninitialized: true,
    secret: _package2.default.name,
    store: new mongoStore({
      url: _config2.default.db,
      collection: 'sessions'
    })
  }));

  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  // connect flash for flash messages - should be declared after sessions
  app.use((0, _connectFlash2.default)());

  // should be declared after session and flash
  app.use((0, _viewHelpers2.default)(_package2.default.name));

  app.use((0, _cors2.default)());

  /** Authentication
   * @description Enable authentication based on config setting
   */
  var _config$auth = _config2.default.auth;
  var enabled = _config$auth.enabled;
  var secret = _config$auth.secret;
  var ignoredPaths = _config$auth.ignoredPaths;


  if (enabled) {
    /** Route Protection
     * @description Get token from Authorization header
     */
    app.use((0, _expressJwt2.default)({ secret: secret, credentialsRequired: false }).unless({ path: ignoredPaths }));

    /** Unauthorized Error Handler
     * @description Respond with 401 when authorization token is invalid
     */
    app.use(function (err, req, res, next) {
      if (err.name === 'UnauthorizedError') {
        console.error({
          description: 'Error confirming token.',
          error: err, obj: 'server'
        });
        return res.status(401).json({ message: 'Invalid token', code: 'UNAUTHORIZED' });
      }
    });
  } else {
    console.log({
      description: 'Authentication is disabled. Endpoint results may be affected.',
      obj: 'server'
    });
  }

  app.use(function (err, req, res, next) {
    console.error('Error:');
    console.error(err.stack);
    console.error(err.toString());
  });
  // Cross Site Request Forgery
  // if (env !== 'test') {
  //   app.use(csrf());
  //
  //   // This could be moved to view-helpers :-)
  //   app.use(function (req, res, next) {
  //     res.locals.csrf_token = req.csrfToken();
  //     next();
  //   });
  // }
};