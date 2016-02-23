'use strict';

/**
 * Module dependencies.
 */

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _coExpress = require('co-express');

var _coExpress2 = _interopRequireDefault(_coExpress);

var _only = require('only');

var _only2 = _interopRequireDefault(_only);

var _oauthio = require('oauthio');

var _oauthio2 = _interopRequireDefault(_oauthio);

var _config = require('../../config/config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var User = _mongoose2.default.model('User');
var Project = _mongoose2.default.model('Project');

/**
 * Return logged in user
 */
exports.index = (0, _coExpress2.default)(regeneratorRuntime.mark(function _callee(req, res) {
  var user;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return User.load({ _id: req.user._id });

        case 2:
          user = _context.sent;

          if (user) {
            _context.next = 5;
            break;
          }

          return _context.abrupt('return', res.status(404).json({ message: 'User not found' }));

        case 5:
          res.json(user);

        case 6:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
}));

/**
 * Login
 */
exports.login = (0, _coExpress2.default)(regeneratorRuntime.mark(function _callee2(req, res) {
  var user, token;
  return regeneratorRuntime.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (req.user) {
            _context2.next = 2;
            break;
          }

          return _context2.abrupt('return', res.status(400).json({ message: 'User required to login.' }));

        case 2:
          user = req.user;
          token = user.createAuthToken();

          res.json({ token: token, user: (0, _only2.default)(user, '_id username email name avatar_url') });

        case 5:
        case 'end':
          return _context2.stop();
      }
    }
  }, _callee2, this);
}));

/**
 * Get state token
 */
exports.getStateToken = function (req, res) {
  if (!_config2.default.oauthio || !_config2.default.oauthio.publicKey) throw new Error('OAuthio config is required.');
  var _config$oauthio = _config2.default.oauthio;
  var publicKey = _config$oauthio.publicKey;
  var secretKey = _config$oauthio.secretKey;

  _oauthio2.default.initialize(publicKey, secretKey);
  try {
    var token = _oauthio2.default.generateStateToken(req.session);
    res.json({ token: token });
  } catch (err) {
    console.log('error getting state token', err);
    res.status(400).json({ message: 'Error getting state token.' });
  }
};

/**
 * Authenticate with external provider
 */
exports.providerAuth = (0, _coExpress2.default)(regeneratorRuntime.mark(function _callee3(req, res) {
  var _req$body, stateToken, provider, code, auth, providerAccount, email, name, avatar, id, existingUser, existingToken, newData, user, token;

  return regeneratorRuntime.wrap(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (req.body) {
            _context3.next = 2;
            break;
          }

          return _context3.abrupt('return', res.status(400).json({ message: 'Provider auth data required.' }));

        case 2:
          _req$body = req.body;
          stateToken = _req$body.stateToken;
          provider = _req$body.provider;
          code = _req$body.code;

          req.session.csrf_tokens = [stateToken];
          _context3.prev = 7;
          _context3.next = 10;
          return _oauthio2.default.auth(provider, req.session, { code: code });

        case 10:
          auth = _context3.sent;
          _context3.next = 13;
          return auth.me();

        case 13:
          providerAccount = _context3.sent;
          email = providerAccount.email;
          name = providerAccount.name;
          avatar = providerAccount.avatar;
          id = providerAccount.id;
          _context3.prev = 18;
          _context3.next = 21;
          return User.load({ criteria: { email: email, provider: provider } });

        case 21:
          existingUser = _context3.sent;
          existingToken = existingUser.createAuthToken();

          if (!existingUser) {
            _context3.next = 25;
            break;
          }

          return _context3.abrupt('return', res.json({ user: existingUser, token: existingToken }));

        case 25:
          _context3.next = 42;
          break;

        case 27:
          _context3.prev = 27;
          _context3.t0 = _context3['catch'](18);

          //User does not already exist
          newData = {
            email: email, name: name, provider: provider, avatar_url: avatar, providerId: id,
            username: providerAccount.alias || email.split('@')[0]
          };

          newData[req.body.provider] = providerAccount;
          _context3.prev = 31;
          user = new User(newData);
          _context3.next = 35;
          return user.save();

        case 35:
          token = user.createAuthToken();

          res.json({ token: token, user: user });
          _context3.next = 42;
          break;

        case 39:
          _context3.prev = 39;
          _context3.t1 = _context3['catch'](31);

          res.status(400).json({ message: 'Error creating new user.', error: _context3.t1.toString() });

        case 42:
          _context3.next = 48;
          break;

        case 44:
          _context3.prev = 44;
          _context3.t2 = _context3['catch'](7);

          console.error('error authenticating with oAuthio', _context3.t2.toString());
          res.status(400).json({ message: 'error authenticating', error: _context3.t2.toString() });

        case 48:
        case 'end':
          return _context3.stop();
      }
    }
  }, _callee3, this, [[7, 44], [18, 27], [31, 39]]);
}));

/**
 * Return logged in user
 */
exports.logout = (0, _coExpress2.default)(regeneratorRuntime.mark(function _callee4(req, res) {
  return regeneratorRuntime.wrap(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          // console.log('logout request:', req.user);
          // const user = yield User.load({ owner: req.user._id  });
          // delete user.authToken;
          // yield user.save();
          res.json({
            message: 'Logout successful.'
          });

        case 1:
        case 'end':
          return _context4.stop();
      }
    }
  }, _callee4, this);
}));

/**
 * Return projects for logged in user
 */
exports.projects = (0, _coExpress2.default)(regeneratorRuntime.mark(function _callee5(req, res) {
  var projects;
  return regeneratorRuntime.wrap(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return Project.list({ owner: req.user._id });

        case 2:
          projects = _context5.sent;

          res.json(projects);

        case 4:
        case 'end':
          return _context5.stop();
      }
    }
  }, _callee5, this);
}));

/**
 * Avatar
 */
exports.avatar = (0, _coExpress2.default)(regeneratorRuntime.mark(function _callee6(req, res) {
  var image, _user;

  return regeneratorRuntime.wrap(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          //Handle an image
          image = req.file ? req.file : undefined;
          _context6.prev = 1;
          _user = req.profile;
          _context6.next = 5;
          return _user.uploadImageAndSave(image);

        case 5:
          res.json({ message: 'Image uploaded successfully.' });
          _context6.next = 11;
          break;

        case 8:
          _context6.prev = 8;
          _context6.t0 = _context6['catch'](1);

          res.status(400).json({ message: 'Error uploading image.', error: _context6.t0.toString() });

        case 11:
        case 'end':
          return _context6.stop();
      }
    }
  }, _callee6, this, [[1, 8]]);
}));