'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
console.log('requre:', require('passport-jwt'));
var User = mongoose.model('User');
var config = require('../config');
console.log('ExtractJwt', ExtractJwt);
/**
 * Expose
 */

module.exports = new JwtStrategy({
  secretOrKey: config.jwtSecret,
  jwtFromRequest: function jwtFromRequest(req) {
    console.log('request reqceived', req);
  }
}, function (jwt_payload, done) {
  console.log('JWTPAYLOAD', jwt_payload);
  var options = {
    criteria: { _id: jwt_payload.sub },
    select: 'name username email hashed_password salt'
  };
  User.load(options, function (err, user) {
    console.log('user load:', err, user);
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