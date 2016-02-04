'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var JwtStrategy = require('passport-jwt').Strategy;
var User = mongoose.model('User');
var config = require('../config');

/**
 * Expose
 */

module.exports = new JwtStrategy({
  secretOrKey: config.jwtSecret
}, function (jwt_payload, done) {
  // console.log('JWTPAYLOAD', jwt_payload);
  var options = {
    criteria: { _id: jwt_payload.sub },
    select: 'name username email hashed_password salt'
  };
  User.load(options, function (err, user) {
    if (err) return done(err);
    if (!user) {
      return done(null, false, { message: 'Unknown user' });
    }
    if (!user.authenticate(password)) {
      return done(null, false, { message: 'Invalid password' });
    }
    return done(null, user);
  });
});