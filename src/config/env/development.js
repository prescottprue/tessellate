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
  envName: 'development',
  db: process.env.TESSELLATE_DEV_MONGO || 'mongodb://localhost/tessellate',
  jwtSecret: process.env.TESSELLATE_JWT_SECRET || process.env.JWT_SECRET,
  logging: {
    level: 0,
    external: false
  },
  contentSettings: {
    images: {
      bucket: 'tessellate-images'
    },
    avatar: {
      prefix: 'avatars'
    }
  },
  oauthio: {
    publicKey: process.env.OAUTHIO_KEY,
    secretKey: process.env.OAUTHIO_SECRET
  },
  aws: {
    key: process.env.TESSELLATE_AWS_KEY || process.env.AWS_KEY,
    secret: process.env.TESSELLATE_AWS_SECRET || process.env.AWS_SECRET
  },
  google: {
    clientID: process.env.DEVSHARE_GOOGLE_CLIENTID || process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.DEVSHARE_GOOGLE_SECRET || process.env.GOOGLE_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
  },
  github: {
    clientID: process.env.DEVSHARE_GITHUB_KEY || process.env.GITHUB_KEY,
    clientSecret: process.env.DEVSHARE_GITHUB_SECRET || process.env.GITHUB_SECRET
  }
};
