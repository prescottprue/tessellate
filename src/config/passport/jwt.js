'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const JwtStrategy = require('passport-jwt').Strategy;
const User = mongoose.model('User');
const config = require('../config');

/**
 * Expose
 */

module.exports = new JwtStrategy({
  secretOrKey: config.jwtSecret
}, (jwt_payload, done) => {
  // console.log('JWTPAYLOAD', jwt_payload);
  const options = {
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
