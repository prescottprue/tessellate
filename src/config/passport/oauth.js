'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const OAuth2Strategy = require('passport-oauth2');
const config = require('../config');
const User = mongoose.model('User');

const { clientID, clientSecret } = config.github;
if(!clientID || !clientSecret){
  throw new Error('Github clientId and clientSecret are required.');
}
module.exports =  new OAuth2Strategy({
    authorizationURL: 'https://github.com/login/oauth/authorize',
    tokenURL: 'https://github.com/login/oauth/access_token',
    clientID,
    clientSecret,
    callbackURL: "http://localhost:3000/auth/example/callback",
    scope: 'repos'
  },
  function(accessToken, refreshToken, profile, done) {
    console.log('response:', accessToken, refreshToken, profile);
    User.findOrCreate({ exampleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
);
