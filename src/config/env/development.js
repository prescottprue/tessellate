'use strict'

/*!
 * Module dependencies.
 */

const fs = require('fs')
const envFile = require('path').join(__dirname, 'env.json')

let env = {}

/**
 * Expose
 */

module.exports = {
  envName: 'development',
  db: process.env.TESSELLATE_DEV_MONGO || 'mongodb://localhost/tessellate',
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
  auth: {
    enabled: true,
    secret: process.env.TESSELLATE_JWT_SECRET || process.env.JWT_SECRET,
    firebaseSecret: process.env.TESSELLATE_FIREBASE_SECRET || process.env.FIREBASE_SECRET,
    cookieName: 'tessellate'
  },
  oauthio: {
    publicKey: process.env.OAUTHIO_KEY,
    secretKey: process.env.OAUTHIO_SECRET
  }
}
