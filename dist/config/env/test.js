'use strict';

/**
 * Expose
 */

module.exports = {
  db: 'mongodb://localhost/noobjs_test',
  github: {
    clientID: '',
    clientSecret: '',
    callbackURL: 'http://localhost:3000/auth/github/callback'
  },
  google: {
    clientID: 'asdfasdf',
    clientSecret: 'asdfasdf',
    callbackURL: 'http://localhost:3000/auth/google/callback'
  },
  jwtSecret: 'shhhhh',
  auth: {
    enabled: true,
    secret: process.env.TESSELLATE_JWT_SECRET || process.env.JWT_SECRET,
    cookieName: 'tessellate'
  }
};