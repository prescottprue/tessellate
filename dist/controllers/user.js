'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var wrap = require('co-express');
var only = require('only');
var User = mongoose.model('User');
var Project = mongoose.model('Project');

/**
 * Return logged in user
 */

exports.index = wrap(regeneratorRuntime.mark(function _callee(req, res) {
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
 * Return projects for logged in user
 */

exports.projects = wrap(regeneratorRuntime.mark(function _callee2(req, res) {
  var projects;
  return regeneratorRuntime.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return Project.list({ owner: req.user._id });

        case 2:
          projects = _context2.sent;

          res.json(projects);

        case 4:
        case 'end':
          return _context2.stop();
      }
    }
  }, _callee2, this);
}));

/**
 * Login
 */

exports.login = wrap(regeneratorRuntime.mark(function _callee3(req, res) {
  var googleUser, user, token;
  return regeneratorRuntime.wrap(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (!(req.body.provider === 'google')) {
            _context3.next = 6;
            break;
          }

          console.log('loading google user:', req.body);
          _context3.next = 4;
          return User.load({ email: req.body.email });

        case 4:
          googleUser = _context3.sent;

          console.log('google user loaded', googleUser);

        case 6:

          // if(!req.user) res.status(400).json({message: 'Error with login.'});

          user = googleUser || req.user;
          token = user.createAuthToken();

          res.json({ token: token, user: only(user, '_id username email name') });

        case 9:
        case 'end':
          return _context3.stop();
      }
    }
  }, _callee3, this);
}));

/**
 * Return logged in user
 */

exports.logout = wrap(regeneratorRuntime.mark(function _callee4(req, res) {
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
 * Session
 */
exports.avatar = wrap(regeneratorRuntime.mark(function _callee5(req, res) {
  var image, user;
  return regeneratorRuntime.wrap(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          //Handle an image
          image = req.file ? req.file : undefined;

          console.log('image from req:', image);
          _context5.prev = 2;
          user = req.profile;
          _context5.next = 6;
          return user.uploadImageAndSave(image);

        case 6:
          res.json({ message: 'Image uploaded successfully.' });
          _context5.next = 12;
          break;

        case 9:
          _context5.prev = 9;
          _context5.t0 = _context5['catch'](2);

          res.status(400).json({ message: 'Error uploading image.', error: _context5.t0.toString() });

        case 12:
        case 'end':
          return _context5.stop();
      }
    }
  }, _callee5, this, [[2, 9]]);
}));