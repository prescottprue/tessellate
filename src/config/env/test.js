'use strict'

/**
 * Expose
 */

module.exports = {
  db: 'mongodb://localhost/tessellate_test',
  auth: {
    enabled: true,
    secret: 'shhhhh',
    cookieName: 'tessellate'
  },
  firebase: {
    url: 'https://kyper-tech.firebaseio.com/tessellate',
    secret: process.env.TESSELLATE_FIREBASE_SECRET || process.env.FIREBASE_SECRET || 'asdf'
  }
}
