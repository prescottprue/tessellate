import 'newrelic';
// import 'babel-core/register';

import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import jwt from 'express-jwt';
import cors from 'cors';

import confFile from '../config.json';
import config from './config/default';
import systemUtils from './lib/systemUtils';
import logger from './utils/logger';
import routes from './config/routes';


let app = express();

let routeBuilder = require('./utils/routeBuilder')(app);

/** View Engine Setup
 * @description Apply ejs rending engine and views folder
 */
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

/** Environment and variable setup
 * @description Set node variables based on environment settings
 */
app.set('config', config);
app.set('env', app.get('config').env);
/** Parsers
 * @description Body and cookie parsers
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
/** Static files
 * @description References to static files
 */
app.use(favicon(__dirname + './../public/favicon.ico'));
app.use(express.static(path.join(__dirname, '..', 'public')));

/** CORS Configuration
 * @description Enable cors and prefight on requests
 */
app.use(cors());
app.options('*', cors());

/** Authentication
 * @description Enable authentication based on config setting
 */
if(config.authEnabled){
  let allowedPaths = [
    '/', '/login',
    '/logout', '/signup',
    '/docs', '/docs/**',
    '/authrocket',
    /(\/apps\/.*\/login)/,
    /(\/apps\/.*\/logout)/,
    /(\/apps\/.*\/signup)/,
    /(\/apps\/.*\/providers)/
  ];
  let secret = config.jwtSecret;
  if (config.authRocket && config.authRocket.enabled) {
    if (!config.authRocket.secret) {
      logger.error({
        description: 'AuthRocket secret required to decode token. Check environment variables.',
        func: 'init', obj: 'server'
      });
    } else {
      secret = config.authRocket.secret;
    }
  }
  /** Route Protection
   * @description Protect all routes except allowedPaths by requiring Authorization header
   */
  app.use(jwt({secret: secret}).unless({path:allowedPaths}));
  /** Unauthorized Error Handler
   * @description Respond with 401 when authorization token is invalid
   */
  app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
      logger.error({
        description: 'Error confirming token.',
        error: err, obj: 'server'
      });
      //TODO: look for application name
      //TODO: Try decoding with application's authrocket secret
      return res.status(401).json({message:'Invalid token', code:'UNAUTHORIZED'});
    }
  });
} else {
  logger.warn({
    description: 'Authentication is disabled. Endpoint results may be affected.',
    obj: 'server'
  });
}

/** Route Builder
 * @description Setup routes based on config file
 */
routeBuilder(routes);

/** Error Logger
 * @description Log Errors before they are handled
 */
app.use((err, req, res, next) => {
  logger.error({
    message:err.message, url: req.originalUrl
  });
  if(err){
    res.status(500);
  }
  res.send('Error: ' + err.message);
});

/** Page Not Found Handler
 * @description catch 404 and forward to error handler
 */
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/** Development Error Handler
 * @description print stacktraces when in local environment
 */
if (app.get('env') === 'local') {
  app.use((err, req, res, next) => {
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
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

/**
 * Get port from environment and store in Express.
 */
let portNumber = process.env.PORT || 4000;
if(confFile && confFile.server && confFile.server.port && (config.envName === 'development' || config.envName === 'test')) {
  port = confFile.server.port;
}
let port = systemUtils.normalizePort(portNumber);
console.log('Server started...');
console.log('Environment: ' + config.envName || 'ERROR');
console.log('Port: ' + port);
app.set('port', port);
/**
 * Create app server object based on settings
 */
let server = systemUtils.createServer(app);

/** Listen on provided port, on all network interfaces.
 */
server.listen(port);

module.exports = app;
