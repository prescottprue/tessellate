'use strict'

/**
 * Expose
 */

module.exports = {
  envName: 'production',
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
  auth: {
    enabled: true,
    secret: process.env.TESSELLATE_JWT_SECRET || process.env.JWT_SECRET,
    cookieName: 'tessellate'
  },
  oauthio: {
    publicKey: process.env.OAUTHIO_KEY,
    secretKey: process.env.OAUTHIO_SECRET
  }
}
