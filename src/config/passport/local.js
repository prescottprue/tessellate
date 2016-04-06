'use strict'

/**
 * Module dependencies.
 */

const mongoose = require('mongoose')
const LocalStrategy = require('passport-local').Strategy
const User = mongoose.model('User')

/**
 * Expose
 */

module.exports = new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },
  (username, password, done) => {
    const options = {
      criteria: { username },
      select: 'name username email hashed_password salt avatar_url'
    }
    User.load(options, function (err, user) {
      if (err) return done(err)
      if (!user) {
        return done(null, false, { message: 'Unknown user' })
      }
      if (!user.authenticate(password)) {
        console.log('Invalid password')
        return done(null, false, { message: 'Invalid password' })
      }
      return done(null, user)
    })
  }
)
