'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var OAuth2Strategy = require('passport-oauth2');
var config = require('../config');
var User = mongoose.model('User');

var _config$github = config.github;
var clientID = _config$github.clientID;
var clientSecret = _config$github.clientSecret;

if (!clientID || !clientSecret) {
  throw new Error('Github clientId and clientSecret are required.');
}
module.exports = new OAuth2Strategy({
  authorizationURL: 'https://github.com/login/oauth/authorize',
  tokenURL: 'https://github.com/login/oauth/access_token',
  clientID: clientID,
  clientSecret: clientSecret,
  callbackURL: "http://localhost:3000/auth/example/callback",
  scope: 'repos'
}, function (accessToken, refreshToken, profile, done) {
  console.log('response:', accessToken, refreshToken, profile);
  User.findOrCreate({ exampleId: profile.id }, function (err, user) {
    return done(err, user);
  });
});