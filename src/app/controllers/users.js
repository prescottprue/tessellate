'use strict';

/**
 * Module dependencies.
 */

import mongoose from 'mongoose';
import wrap from 'co-express';
import { escapeRegExp, map } from 'lodash';
import only from 'only';
const assign = require('object-assign');
const User = mongoose.model('User');
const Project = mongoose.model('Project');


/**
 * Load
 */
exports.load = wrap(function* (req, res, next, username) {
  let criteria = { username };
  req.profile = yield User.load({ criteria });
  if (!req.profile) return res.status(404).json({message: 'User not found'});
  next();
});

/**
 * Load collaborator
 */
exports.loadCollaborator = wrap(function* (req, res, next, username) {
  let criteria = { username };
  req.user = yield User.load({ criteria });
  if (!req.user) return res.status(404).json({message: 'User not found'});
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
  //Handle 3rd party providers
  if(user.provider){
    user.skipValidation();
  } else {
    user.provider = 'local';
  }

  try {
    yield user.save();
  } catch(err) {
    if(err.code === 11000){
      return res.status(400).json({
        message: 'A user with those credentials already exists.'
      });
    }
    const errorsList = map(err.errors, (e, key) => {
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
    res.json({ token, user: only(user, 'username email name provider avatar_url _id id')});
  });
});




/**
 * Update a user
 */

exports.update = wrap(function* (req, res){
	let user = req.profile;
	// console.log('update called before:', req.body);
	const newUser = assign(user, only(req.body, 'name username email avatar_url'));
	try {
		// console.log('user after assign', newProject);
		yield newUser.save();
		res.json(newUser);
	} catch(err) {
		res.status(400).send({message: 'Error updating project'});
	}
});
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
 *  Show profile
 */
exports.show = function (req, res) {
  res.json(req.profile);
};

/**
 * Search for a user
 */
exports.search = wrap(function* (req, res, next) {
  if (!req.query || (!req.query.username && !req.query.email)){
    return res.status(400).json({
      message: 'Query parameter required to search.'
    });
  }
  const limit = 15;
  const select = 'username email name avatar_url';
  const criteria = {
    $or: [
      createQueryObj('username', req.query.username) ||
      createQueryObj('email', req.query.email)
    ]
  };
  const users = yield User.list({ criteria, limit, select });
  if (!users) return res.json([]);
  res.json(users);
});

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
 * Auth callback
 */

exports.authCallback = login;

/**
 * Show login form
 */

exports.login = function (req, res) {
  res.render('users/login', {
    title: 'Login'
  });
};
exports.signin = function () {
  console.log('signin route being called');
};


/**
 * Create a query object
 * @param {String} key - Key/Name of query parameter
 * @param {String} val - Value of query
 * @return {Object}
 */
function createQueryObj(key, val) {
  if(!val) return null;
  var obj = {};
  obj[key] = new RegExp(escapeRegExp(val), 'i');
  return obj;
}


/**
 * Login
 */
function login (req, res) {
  const redirectTo = req.session.returnTo
    ? req.session.returnTo
    : '/';
  delete req.session.returnTo;
  console.log('login route hit', req.url);
  // res.json({message: 'yup'});
  // res.redirect(redirectTo);
  res.render('home/redirect', {
    title: 'Login'
  });
}
