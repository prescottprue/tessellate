'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const wrap = require('co-express');
const _ = require('lodash');
const only = require('only');
const User = mongoose.model('User');
const Project = mongoose.model('Project');

/**
 * Load
 */

exports.load = wrap(function* (req, res, next, username) {
  const criteria = { username };
  req.profile = yield User.load({ criteria });
  if (!req.profile) return res.status(404).json({message: 'User not found'});
  next();
});

/**
 * List
 */

exports.index = wrap(function* (req, res) {
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const limit = 30;
  const options = {
    limit: limit,
    page: page
  };

  const users = yield User.list(options);
  const count = yield User.count();

  res.json({
    title: 'Users',
    users,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
});

/**
 * Create user
 */

exports.create = wrap(function* (req, res) {
  const user = new User(req.body);
  user.provider = 'local';
  try {
    yield user.save();
  } catch(err) {
    const errorsList = _.map(err.errors, function(e, key){
      return e.message || key;
    });
    return res.status(400).json({
      message: 'Error signing up.', errors: errorsList
    });
  }
  req.logIn(user, error => {
    if (error) {
      console.error({message: 'Error with login', error});
      req.status(500).json({message: 'Error with login.'})
    }
    const token = user.createAuthToken();
    res.json({ token, user: only(user, 'username email name provider _id')});
  });
});

/**
 *  Show profile
 */

exports.show = function (req, res) {
  res.json(req.profile);
};

/**
 * Delete a user
 */

exports.destroy = wrap(function* (req, res) {
  yield req.profile.remove();
  res.json({message: 'User deleted successfully'});
});

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.logout();
  res.json({message: 'Logout successful.'});
};

/**
 * Session
 */

exports.session = (err, user, errData) => {
  console.log('session called..', err, user, errData);
  if(err || !user){
    return errData;
  }
  return user;
};
