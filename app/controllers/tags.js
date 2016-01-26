'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const wrap = require('co-express');
const Project = mongoose.model('Project');

/**
 * List items tagged with a tag
 */

exports.index = wrap(function* (req, res) {
  const criteria = { tags: req.params.tag };
  const page = (req.params.page > 0 ? req.params.page : 1) - 1;
  const limit = 30;
  const options = {
    limit: limit,
    page: page,
    criteria: criteria
  };

  const projects = yield Project.list(options);
  const count = yield Project.count(criteria);

  res.render('projects/index', {
    title: 'Projects tagged ' + req.params.tag,
    projects: projects,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
});
