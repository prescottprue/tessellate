'use strict';

/**
 * Expose
 */

module.exports = {
  envVame: 'production',
  db: process.env.TESSELLATE_MONGO || process.env.MONGO_URL,
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
  aws: {
    key: process.env.TESSELLATE_AWS_KEY,
    secret: process.env.TESSELLATE_AWS_SECRET
  },
  google: {
    clientID: process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: 'http://tessellate.elasticbeanstalk.com/auth/google/callback'
  },
  github: {
    clientID: process.env.TESSELLATE_GITHUB_KEY || process.env.GITHUB_KEY,
    clientSecret: process.env.TESSELLATE_GITHUB_SECRET || process.env.GITHUB_SECRET
  }
};
