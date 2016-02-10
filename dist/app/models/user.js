'use strict';

/**
 * Module dependencies.
 */

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _only = require('only');

var _only2 = _interopRequireDefault(_only);

var _config = require('./../../config/config');

var _config2 = _interopRequireDefault(_config);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _fileStorage = require('../utils/fileStorage');

var fileStorage = _interopRequireWildcard(_fileStorage);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var Schema = _mongoose2.default.Schema;
var oAuthTypes = ['github', 'google'];

/**
 * User Schema
 */

var UserSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '', unique: true },
  username: { type: String, default: '', unique: true },
  avatar_url: { type: String },
  provider: { type: String, default: '' },
  hashed_password: { type: String, default: '' },
  salt: { type: String, default: '' },
  authToken: { type: String },
  github: {},
  google: {}
});

var validatePresenceOf = function validatePresenceOf(value) {
  return value && value.length;
};

/**
 * Virtuals
 */

UserSchema.virtual('password').set(function (password) {
  this._password = password;
  this.salt = this.makeSalt();
  this.hashed_password = this.encryptPassword(password);
}).get(function () {
  return this._password;
});

/**
 * Validations
 */

// the below 5 validations only apply if you are signing up traditionally

UserSchema.path('name').validate(function (name) {
  if (this.skipValidation()) return true;
  return name.length;
}, 'Name cannot be blank');

UserSchema.path('email').validate(function (email) {
  if (this.skipValidation()) return true;
  return email.length;
}, 'Email cannot be blank');

UserSchema.path('email').validate(function (email, fn) {
  var User = _mongoose2.default.model('User');
  // if (this.skipValidation()) fn(true);

  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('email')) {
    User.find({ email: email }).exec(function (err, users) {
      fn(!err && users.length === 0);
    });
  } else fn(true);
}, 'Email already exists');

UserSchema.path('username').validate(function (username) {
  if (this.skipValidation()) return true;
  return username.length;
}, 'Username cannot be blank');

UserSchema.path('username').validate(function (username, fn) {
  var User = _mongoose2.default.model('User');
  // if (this.skipValidation()) fn(true);

  // Check only when it is a new user or when username field is modified
  if (this.isNew || this.isModified('username')) {
    User.find({ username: username }).exec(function (err, users) {
      fn(!err && users.length === 0);
    });
  } else fn(true);
}, 'Username already exists');

UserSchema.path('hashed_password').validate(function (hashed_password) {
  if (this.skipValidation()) return true;
  return hashed_password.length && this._password.length;
}, 'Password cannot be blank');

/**
 * Pre-save hook
 */

UserSchema.pre('save', function (next) {
  if (!this.isNew) return next();

  if (!validatePresenceOf(this.password) && !this.skipValidation()) {
    next(new Error('Invalid password'));
  } else {
    next();
  }
});

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

  authenticate: function authenticate(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */

  makeSalt: function makeSalt() {
    return Math.round(new Date().valueOf() * Math.random()) + '';
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */

  encryptPassword: function encryptPassword(password) {
    if (!password) return '';
    try {
      return _crypto2.default.createHmac('sha1', this.salt).update(password).digest('hex');
    } catch (err) {
      return '';
    }
  },

  /**
   * Validation is not required if using OAuth
   */

  skipValidation: function skipValidation() {
    return ~oAuthTypes.indexOf(this.provider);
  },

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  createAuthToken: function createAuthToken() {
    if (this.authToken) return this.authToken;
    try {
      var tokenData = (0, _only2.default)(this, '_id username email provider');
      var token = _jsonwebtoken2.default.sign(tokenData, _config2.default.jwtSecret);
      return this.authToken = token;
    } catch (error) {
      console.log({
        description: 'Error generating token.',
        error: error, func: 'createAuthToken', obj: 'User'
      });
    }
  },

  uploadImageAndSave: function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(image) {
      var err, output;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (image) {
                _context.next = 2;
                break;
              }

              throw new Error('Image required to upload');

            case 2:
              err = this.validateSync();

              if (!(err && err.toString())) {
                _context.next = 5;
                break;
              }

              throw new Error(err.toString());

            case 5:
              image.key = this._id + '/' + image.originalname;
              _context.prev = 6;
              _context.next = 9;
              return fileStorage.uploadAvatar({ localPath: image.path, key: image.key });

            case 9:
              output = _context.sent;

              this.avatar_url = output.url;
              _context.next = 13;
              return this.save();

            case 13:
              _context.next = 19;
              break;

            case 15:
              _context.prev = 15;
              _context.t0 = _context['catch'](6);

              console.log('error uploading image file', _context.t0);
              throw _context.t0;

            case 19:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[6, 15]]);
    }));

    return function uploadImageAndSave(_x) {
      return ref.apply(this, arguments);
    };
  }()
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

  load: function load(options, cb) {
    var select = options.select || 'name username email avatar_url';
    var criteria = options.criteria || options || {};
    return this.findOne(criteria).select(select).exec(cb);
  },

  /**
   * List projects
   *
   * @param {Object} options
   * @api private
   */

  list: function list(options) {
    var criteria = options.criteria || {};
    var select = options.select || {};
    var page = options.page || 0;
    var limit = options.limit || 30;
    return this.find(criteria).select(select).sort({ createdAt: -1 }).limit(limit).skip(limit * page).exec();
  }
};

_mongoose2.default.model('User', UserSchema);