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
  auth: {
    enabled: true,
    secret: 'shhhhh',
    cookieName: 'tessellate'
  }
};