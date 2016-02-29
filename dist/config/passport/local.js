'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var LocalStrategy = require('passport-local').Strategy;
var User = mongoose.model('User');

/**
 * Expose
 */

module.exports = new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, function (username, password, done) {
  console.log('calling stragey with', username, password);
  var options = {
    criteria: { username: username },
    select: 'name username email hashed_password salt avatar_url'
  };
  User.load(options, function (err, user) {
    if (err) return done(err);
    if (!user) {
      return done(null, false, { message: 'Unknown user' });
    }
    if (!user.authenticate(password)) {
      console.log('Invalid password');
      return done(null, false, { message: 'Invalid password' });
    }
    return done(null, user);
  });
});