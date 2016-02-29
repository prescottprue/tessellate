'use strict';

/**
 * Module dependencies
 */

require('babel-polyfill');
var fs = require('fs');
var join = require('path').join;
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/config');

var models = join(__dirname, 'app/models');
var port = process.env.PORT || 3000;
var app = express();

/**
 * Expose
 */

module.exports = app;

// Bootstrap models
fs.readdirSync(models).filter(function (file) {
  return ~file.indexOf('.js');
}).forEach(function (file) {
  return require(join(models, file));
});

// Bootstrap routes
require('./config/passport')(passport);
require('./config/express')(app, passport);
require('./config/routes')(app, passport);

connect().on('error', console.log).on('disconnected', connect).once('open', listen);

function listen() {
  if (app.get('env') === 'test') return;
  app.listen(port);
  var startMsg = 'Tessellate started\n' + ('environment: ' + config.envName + '\n') + ('port: ' + port + ' \n');
  console.log(startMsg);
}

function connect() {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  return mongoose.connect(config.db, options).connection;
}