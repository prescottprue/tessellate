'use strict';

/**
 * Module dependencies.
 */

const wrap = require('co-express');

/**
 * Load comment
 */

exports.load = function (req, res, next, id) {
  req.comment = req.project.comments
    .filter(comment => comment.id === id)
    .reduce(c => c);

  if (!req.comment) return next(new Error('Comment not found'));
  next();
};

/**
 * Create comment
 */

exports.create = wrap(function* (req, res) {
  const project = req.project;
  yield project.addComment(req.user, req.body);
  res.redirect('/projects/' + project.id);
});

/**
 * Delete comment
 */

exports.destroy = wrap(function* (req, res) {
  yield req.project.removeComment(req.params.commentId);
  req.flash('info', 'Removed comment');
  res.redirect('/projects/' + req.project.id);
});
