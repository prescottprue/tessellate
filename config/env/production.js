'use strict';

/**
 * Expose
 */

module.exports = {
  envVame: 'production',
  db: process.env.TESSELLATE_MONGO || process.env.MONGO_URL,
  jwtSecret: process.env.TESSELLATE_JWT_SECRET || process.env.JWT_SECRET,
  google: {
    clientID: process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: 'http://nodejs-express-demo.herokuapp.com/auth/google/callback'
  }
};