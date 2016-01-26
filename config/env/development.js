'use strict';

/*!
 * Module dependencies.
 */

const fs = require('fs');
const envFile = require('path').join(__dirname, 'env.json');

let env = {};

// Read env.json file, if it exists, load the id's and secrets from that
// Note that this is only in the development env
// it is not safe to store id's in files

if (fs.existsSync(envFile)) {
  env = fs.readFileSync(envFile, 'utf-8');
  env = JSON.parse(env);
  Object.keys(env).forEach(key => process.env[key] = env[key]);
}

/**
 * Expose
 */

module.exports = {
  db: process.env.TESSELLATE_DEV_MONGO || 'mongodb://localhost/tessellate',
  google: {
    clientID: process.env.TESSELLATE_GOOGLE_CLIENTID || process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.TESSELLATE_GOOGLE_SECRET || process.env.GOOGLE_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
  }
};
