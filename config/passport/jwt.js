'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const User = mongoose.model('User');

/**
 * Expose
 */

module.exports = function()  {
  if(!config.jwtSecret){
    console.error('JWT TOKEN Secret is required');
  }
  return new JwtStrategy({
      secretOrKey: config.jwtSecret
    },
    (jwt_payload, done) => {
      console.log('JWTPAYLOAD', jwt_payload);
      const options = {
        criteria: { is: jwt_payload.sub },
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
    }
  );
}
