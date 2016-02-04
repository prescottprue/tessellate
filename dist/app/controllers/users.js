'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var wrap = require('co-express');
var _ = require('lodash');
var only = require('only');
var User = mongoose.model('User');
var Project = mongoose.model('Project');

/**
 * Load
 */
exports.load = wrap(regeneratorRuntime.mark(function _callee(req, res, next, username) {
  var criteria;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          criteria = { username: username };
          _context.next = 3;
          return User.load({ criteria: criteria });

        case 3:
          req.profile = _context.sent;

          if (req.profile) {
            _context.next = 6;
            break;
          }

          return _context.abrupt('return', res.status(404).json({ message: 'User not found' }));

        case 6:
          next();

        case 7:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
}));

/**
 * Load collaborator
 */
exports.loadCollaborator = wrap(regeneratorRuntime.mark(function _callee2(req, res, next, username) {
  var criteria;
  return regeneratorRuntime.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          criteria = { username: username };
          _context2.next = 3;
          return User.load({ criteria: criteria });

        case 3:
          req.user = _context2.sent;

          if (req.user) {
            _context2.next = 6;
            break;
          }

          return _context2.abrupt('return', res.status(404).json({ message: 'User not found' }));

        case 6:
          next();

        case 7:
        case 'end':
          return _context2.stop();
      }
    }
  }, _callee2, this);
}));

/**
 * List
 */
exports.index = wrap(regeneratorRuntime.mark(function _callee3(req, res) {
  var page, limit, options, users, count;
  return regeneratorRuntime.wrap(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          page = (req.query.page > 0 ? req.query.page : 1) - 1;
          limit = 30;
          options = {
            limit: limit,
            page: page
          };
          _context3.next = 5;
          return User.list(options);

        case 5:
          users = _context3.sent;
          _context3.next = 8;
          return User.count();

        case 8:
          count = _context3.sent;

          res.json({
            title: 'Users',
            users: users,
            page: page + 1,
            pages: Math.ceil(count / limit)
          });

        case 10:
        case 'end':
          return _context3.stop();
      }
    }
  }, _callee3, this);
}));

/**
 * Create user
 */
exports.create = wrap(regeneratorRuntime.mark(function _callee4(req, res) {
  var user, errorsList;
  return regeneratorRuntime.wrap(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          user = new User(req.body);
          //Handle 3rd party providers

          if (user.provider) {
            user.skipValidation();
          } else {
            user.provider = 'local';
          }

          _context4.prev = 2;
          _context4.next = 5;
          return user.save();

        case 5:
          _context4.next = 13;
          break;

        case 7:
          _context4.prev = 7;
          _context4.t0 = _context4['catch'](2);

          if (!(_context4.t0.code === 11000)) {
            _context4.next = 11;
            break;
          }

          return _context4.abrupt('return', res.status(400).json({
            message: 'A user with those credentials already exists.'
          }));

        case 11:
          errorsList = _.map(_context4.t0.errors, function (e, key) {
            return e.message || key;
          });
          return _context4.abrupt('return', res.status(400).json({
            message: 'Error signing up.', errors: errorsList
          }));

        case 13:
          req.logIn(user, function (error) {
            if (error) {
              console.error({ message: 'Error with login', error: error });
              req.status(500).json({ message: 'Error with login.' });
            }
            var token = user.createAuthToken();
            res.json({ token: token, user: only(user, 'username email name provider _id') });
          });

        case 14:
        case 'end':
          return _context4.stop();
      }
    }
  }, _callee4, this, [[2, 7]]);
}));

/**
 *  Show profile
 */
exports.show = function (req, res) {
  res.json(req.profile);
};

/**
 * Search for a user
 */
exports.search = wrap(regeneratorRuntime.mark(function _callee5(req, res, next) {
  var limit, select, criteria, user;
  return regeneratorRuntime.wrap(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          if (!(!req.query || !req.query.username && !req.query.email)) {
            _context5.next = 2;
            break;
          }

          return _context5.abrupt('return', res.status(400).json({
            message: 'Query parameter required to search.'
          }));

        case 2:
          limit = 15;
          select = 'username email name';
          criteria = {
            $or: [createQueryObj('username', req.query.username) || createQueryObj('email', req.query.email)]
          };
          _context5.next = 7;
          return User.list({ criteria: criteria, limit: limit, select: select });

        case 7:
          user = _context5.sent;

          console.log('user:', user);

          if (user) {
            _context5.next = 11;
            break;
          }

          return _context5.abrupt('return', res.json([]));

        case 11:
          res.json(user);

        case 12:
        case 'end':
          return _context5.stop();
      }
    }
  }, _callee5, this);
}));

/**
 * Delete a user
 */
exports.destroy = wrap(regeneratorRuntime.mark(function _callee6(req, res) {
  return regeneratorRuntime.wrap(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return req.profile.remove();

        case 2:
          res.json({ message: 'User deleted successfully' });

        case 3:
        case 'end':
          return _context6.stop();
      }
    }
  }, _callee6, this);
}));

/**
 * Logout
 */
exports.logout = function (req, res) {
  req.logout();
  res.json({ message: 'Logout successful.' });
};

/**
 * Session
 */
exports.session = function (err, user, errData) {
  console.log('session called..', err, user, errData);
  if (err || !user) {
    return errData;
  }
  return user;
};

/**
 * Create a query object
 * @param {String} key - Key/Name of query parameter
 * @param {String} val - Value of query
 * @return {Object}
 */
function createQueryObj(key, val) {
  if (!val) return null;
  var obj = {};
  obj[key] = new RegExp(_.escapeRegExp(val), 'i');
  return obj;
}