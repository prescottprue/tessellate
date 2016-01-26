'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const wrap = require('co-express');
const User = mongoose.model('User');
const Project = mongoose.model('Project');

/**
 * Return logged in user
 */

exports.index = wrap(function* (req, res) {
  console.log('loading profile for:', req.user._id);
  const user = yield User.load({ _id: req.user._id });
  if (!user) return res.status(404).json({message: 'User not found'});
  res.json(user);
});



/**
 * Return logged in user
 */

exports.projects = wrap(function* (req, res) {
  const projects = yield Project.list({ owner: req.user._id });
  res.json(projects);
});
