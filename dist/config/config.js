'use strict';

/**
 * Module dependencies.
 */

var path = require('path');
var extend = require('util')._extend;
var development = require('./env/development');
var test = require('./env/test');
var production = require('./env/production');

var notifier = {
  service: 'postmark',
  APN: false,
  email: true, // true
  actions: ['comment'],
  tplPath: path.join(__dirname, '..', 'app/mailer/templates'),
  key: 'POSTMARK_KEY'
};

var defaults = {
  root: path.join(__dirname, '..'),
  notifier: notifier
};

// if (process.env.NODE_ENV !== 'test') {
//   const requiredEnvVars = [
//     'JWT_SECRET',
//     'FIREBASE_SECRET',
//     'OAUTHIO_KEY',
//     'OAUTHIO_SECRET'
//   ]
//
//   requiredEnvVars.forEach(envVar => {
//     if (!process.env[envVar] && !process.env[`TESSELLATE_${envVar}`]) throw Error(`${envVar} is a required environment variable`)
//   })
// }

/**
 * Expose
 */

module.exports = {
  development: extend(development, defaults),
  test: extend(test, defaults),
  production: extend(production, defaults)
}[process.env.NODE_ENV || 'development'];