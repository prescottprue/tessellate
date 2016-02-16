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

          console.log('user:', user);
          token = user.createAuthToken();

          res.json({ token: token, user: (0, _only2.default)(user, '_id username email name avatar_url') });

        case 6:
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
  _oauthio2.default.initialize(_config2.default.oauthio.publicKey, _config2.default.oauthio.secretKey);
  var token = _oauthio2.default.generateStateToken(req.session);
  res.json({ token: token });
};

/**
 * Authenticate with external provider
 */
exports.providerAuth = (0, _coExpress2.default)(regeneratorRuntime.mark(function _callee3(req, res) {
  var _req$body, stateToken, provider, code, auth, providerAccount, email, name, avatar, existingUser, existingToken, newData, user, token;

  return regeneratorRuntime.wrap(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _req$body = req.body;
          stateToken = _req$body.stateToken;
          provider = _req$body.provider;
          code = _req$body.code;

          req.session.csrf_tokens = [stateToken];
          _context3.prev = 5;
          _context3.next = 8;
          return _oauthio2.default.auth(provider, req.session, { code: code });

        case 8:
          auth = _context3.sent;
          _context3.next = 11;
          return auth.me();

        case 11:
          providerAccount = _context3.sent;
          email = providerAccount.email;
          name = providerAccount.name;
          avatar = providerAccount.avatar;
          _context3.prev = 15;
          _context3.next = 18;
          return User.load({ criteria: { email: email } });

        case 18:
          existingUser = _context3.sent;
          existingToken = existingUser.createAuthToken();

          if (!existingUser) {
            _context3.next = 22;
            break;
          }

          return _context3.abrupt('return', res.json({ user: existingUser, token: existingToken }));

        case 22:
          _context3.next = 39;
          break;

        case 24:
          _context3.prev = 24;
          _context3.t0 = _context3['catch'](15);

          //User already exists
          newData = { email: email, name: name, provider: provider, avatar_url: avatar, username: providerAccount.alias || email.split('@')[0] };

          newData[req.body.provider] = providerAccount;
          _context3.prev = 28;
          user = new User(newData);
          _context3.next = 32;
          return user.save();

        case 32:
          token = user.createAuthToken();

          res.json({ token: token, user: user });
          _context3.next = 39;
          break;

        case 36:
          _context3.prev = 36;
          _context3.t1 = _context3['catch'](28);

          res.status(400).json({ message: 'Error creating new user.', error: _context3.t1.toString() });

        case 39:
          _context3.next = 45;
          break;

        case 41:
          _context3.prev = 41;
          _context3.t2 = _context3['catch'](5);

          console.error('error authenticating with oAuthio', _context3.t2.toString());
          res.status(400).json({ message: 'error authenticating', error: _context3.t2.toString() });

        case 45:
        case 'end':
          return _context3.stop();
      }
    }
  }, _callee3, this, [[5, 41], [15, 24], [28, 36]]);
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