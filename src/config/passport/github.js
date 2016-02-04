'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const GithubStrategy = require('passport-github').Strategy;
const config = require('../config');
const User = mongoose.model('User');

/**
 * Expose
 */

// let strategy = new GithubStrategy({
//     clientID: config.github.clientID,
//     clientSecret: config.github.clientSecret,
//     callbackURL: config.github.callbackURL
//   },
//   (accessToken, refreshToken, profile, done) => {
//     const options = {
//       criteria: { 'github.id': profile.id }
//     };
//     User.load(options, (err, user) => {
//       if (err) return done(err);
//       if(user){
//         return done(err, user);
//       }
//       if (!user) {
//         user = new User({
//           name: profile.displayName,
//           email: profile.emails[0].value,
//           username: profile.username,
//           provider: 'github',
//           github: profile._json
//         });
//         user.save(err => {
//           if (err) console.log(err);
//           return done(err, user);
//         });
//       }
//     });
//   }
// );
// export default strategy;
