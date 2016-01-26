'use strict';

/**
 * Expose
 */

module.exports = {
  db: process.env.MONGOHQ_URL,
  google: {
    clientID: process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: 'http://nodejs-express-demo.herokuapp.com/auth/google/callback'
  }
};
