var express = require('express'),
path = require('path'),
favicon = require('serve-favicon'),
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser'),
jwt = require('express-jwt'),
config = require('./backend/config/default').config,
cors = require('cors'),
systemUtils = require('./lib/systemUtils');

var confFile = require('./config.json');
var app = express();

var routes = require('./backend/config/routes');
var routeBuilder = require('./backend/utils/routeBuilder')(app);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('config', config);
app.set('env', app.get('config').env);

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//Set cors configuration
app.use(cors());
//Enable all preflight requests
app.options('*', cors()); // include before other routes

//Protect all routes except allowedPaths by requiring Authorization header
// var allowedPaths = ['/', '/test', '/login', '/logout', '/signup', '/docs', '/docs/**', /(\/apps\/.*\/login)/, /(\/apps\/.*\/logout)/, /(\/apps\/.*\/signup)/, /(\/apps\/.*\/providers)/];
// app.use(jwt({secret: config.jwtSecret}).unless({path:allowedPaths}));
//Handle unauthorized errors
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({message:'Invalid token', code:'UNAUTHORIZED'});
  }
});
//Setup routes based on config
routeBuilder(routes);

//------------ Error handlers -----------//

//Log Errors before they are handled
app.use(function (err, req, res, next) {
  console.log(err.message, req.originalUrl);
  if(err){
    res.status(500);
  }
  res.send('Error: ' + err.message);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// development error handler
// will print stacktrace
if (app.get('env') === 'local') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
// production error handler
// no stacktraces leaked to user
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
