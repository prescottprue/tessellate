'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Project = mongoose.model('Project');
const User = mongoose.model('User');

/**
 * Clear database
 *
 * @param {Object} t<Ava>
 * @api public
 */

exports.cleanup = function* (t) {
  yield User.remove();
  yield Project.remove();
  t.end();
};
