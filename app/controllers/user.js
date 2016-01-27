'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const wrap = require('co-express');
const only = require('only');
const User = mongoose.model('User');
const Project = mongoose.model('Project');

/**
 * Return logged in user
 */

exports.index = wrap(function* (req, res) {
  const user = yield User.load({ _id: req.user._id });
  if (!user) return res.status(404).json({message: 'User not found'});
  res.json(user);
});



/**
 * Return projects for logged in user
 */

exports.projects = wrap(function* (req, res) {
  const projects = yield Project.list({ owner: req.user._id });
  res.json(projects);
});

/**
 * Login
 */

exports.login = wrap(function* (req, res) {
  if(!req.user) res.status(400).json({message: 'Error with login.'});
  const user = req.user;
  const token = req.user.createAuthToken();
  res.json({ token, user: only(user, '_id username email name') });
});

/**
 * Return logged in user
 */

exports.logout = wrap(function* (req, res) {
  // console.log('logout request:', req.user);
  // const user = yield User.load({ owner: req.user._id  });
  // delete user.authToken;
  // yield user.save();
  res.json({
    message: 'Logout successful.'
  });
});
