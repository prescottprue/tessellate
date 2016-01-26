'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const wrap = require('co-express');
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
  yield user.save();
  req.logIn(user, err => {
    if (err) req.flash('info', 'Sorry! We are not able to log you in!');
    // return res.redirect('/');
    req.json(user);
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
  console.log('user destroy called', req);
  yield req.profile.remove();
  res.json({message: 'User deleted successfully'});
});

/**
 * Auth callback
 */

exports.authCallback = login;
exports.signin = function(){};

/**
 * Show login form
 */

exports.login = function (req, res) {
  res.render('users/login', {
    title: 'Login'
  });
};

/**
 * Show sign up form
 */

exports.signup = function (req, res) {
  res.render('users/signup', {
    title: 'Sign up',
    user: new User()
  });
};

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.logout();
  res.json({message: 'Logout successful.'});
  // res.redirect('/login');
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

/**
 * Login
 */

function login (req, res) {
  const redirectTo = req.session.returnTo
    ? req.session.returnTo
    : '/';
  delete req.session.returnTo;
  res.redirect(redirectTo);
}
