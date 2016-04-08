'use strict'

/**
 * Module dependencies.
 */

import mongoose, { Schema } from 'mongoose'
import { uploadAvatar } from '../utils/fileStorage'
import {
  validatePresenceOf, encryptPassword,
  makeSalt, createFirebaseToken, createAuthToken
} from '../utils'

const oAuthTypes = [
  'github',
  'google'
]

/**
 * User Schema
 */

const UserSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '', unique: true },
  username: { type: String, default: '', unique: true },
  avatar_url: { type: String },
  provider: { type: String, default: '' },
  providerId: { type: String },
  hashed_password: { type: String, default: '' },
  salt: { type: String, default: '' },
  github: {},
  google: {}
})



/**
 * Virtuals
 */

UserSchema
  .virtual('password')
  .set(function (password) {
    this._password = password
    this.salt = makeSalt()
    this.hashed_password = encryptPassword(password, this.salt)
  })
  .get(function () {
    return this._password
  })

/**
 * Validations
 */

// the below 5 validations only apply if you are signing up traditionally

UserSchema.path('email').validate(function (email) {
  if (this.skipValidation()) return true;
  return email.length;
}, 'Email cannot be blank')

UserSchema.path('email').validate(function (email, fn) {
  const User = mongoose.model('User')
  // if (this.skipValidation()) fn(true)
  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('email')) {
    User.find({ email }).exec(function(err, users) {
      fn(!err && users.length === 0)
    })
  } else fn(true)
}, 'Email already exists')

UserSchema.path('username').validate(function (username) {
  if (this.skipValidation()) return true
  return username.length
}, 'Username cannot be blank')

UserSchema.path('username').validate(function (username, fn) {
  const User = mongoose.model('User')
  // if (this.skipValidation()) fn(true)

  // Check only when it is a new user or when username field is modified
  if (this.isNew || this.isModified('username')) {
    User.find({ username }).exec(function (err, users) {
      fn(!err && users.length === 0)
    })
  } else fn(true)
}, 'Username already exists')

UserSchema.path('hashed_password').validate(function (hashed_password) {
  if (this.skipValidation()) return true
  return hashed_password.length && this._password.length
}, 'Password cannot be blank')


/**
 * Pre-save hook
 */

UserSchema.pre('save', function (next) {
  if (!this.isNew) return next()

  if (!validatePresenceOf(this.password) && !this.skipValidation()) {
    next(new Error('Invalid password'))
  } else {
    next()
  }
})

/**
 * Methods
 */

UserSchema.methods = {

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  authenticate: function (plainText) {
    return encryptPassword(plainText, this.salt) === this.hashed_password
  },

  /**
   * Validation is not required if using OAuth
   */

  skipValidation: function () {
    return ~oAuthTypes.indexOf(this.provider)
  },

  /**
   * Create JWT authentication token and Firebase token
   * @return {Object}
   * @api public
   */

  createTokens: function () {
    const authToken = createAuthToken(this)
    const firebaseToken = createFirebaseToken(this)
    return { authToken, firebaseToken }
  },

  uploadImageAndSave: async function (image) {
    if (!image) throw new Error('Image required to upload')
    const err = this.validateSync()
    if (err && err.toString()) throw new Error(err.toString())
    image.key = `${this._id}/${image.originalname}`
    try {
      const output = await uploadAvatar({localPath: image.path, key: image.key})
      this.avatar_url = output.url
      await this.save()
    } catch (err) {
      console.log('error uploading avatar image file', err)
      throw err
    }
  }
};

/**
 * Statics
 */

UserSchema.statics = {

  /**
   * Load
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  load: function (options, cb) {
    const select = options.select || 'name username email avatar_url';
    const criteria = options.criteria || options || {};
    return this.findOne(criteria)
      .select(select)
      .exec(cb)
  },

  /**
   * List projects
   *
   * @param {Object} options
   * @api private
   */

  list: function (options) {
    const criteria = options.criteria || {}
    const select = options.select || 'name username email avatar_url'
    const page = options.page || 0
    const limit = options.limit || 30
    return this.find(criteria)
      .select(select)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec()
  }
}

mongoose.model('User', UserSchema)
