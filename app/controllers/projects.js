'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const assign = require('object-assign');
const wrap = require('co-express');
const only = require('only');
const Project = mongoose.model('Project');

/**
 * Load
 */

exports.load = wrap(function* (req, res, next, id) {
  req.project = yield Project.load(id);
  if (!req.project) return next(new Error('Project not found'));
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

  const projects = yield Project.list(options);
  const count = yield Project.count();

  res.render('projects/index', {
    title: 'Projects',
    projects: projects,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
});

/**
 * New project
 */

exports.new = function (req, res){
  res.render('projects/new', {
    title: 'New Project',
    project: new Project({})
  });
};

/**
 * Create an project
 * Upload an image
 */

exports.create = wrap(function* (req, res) {
  const project = new Project(only(req.body, 'title body tags'));
  const images = req.files.image
    ? [req.files.image]
    : undefined;

  project.user = req.user;
  yield project.uploadAndSave(images);
  req.flash('success', 'Successfully created project!');
  res.redirect('/projects/' + project._id);
});

/**
 * Edit an project
 */

exports.edit = function (req, res) {
  res.render('projects/edit', {
    title: 'Edit ' + req.project.title,
    project: req.project
  });
};

/**
 * Update project
 */

exports.update = wrap(function* (req, res){
  const project = req.project;
  const images = req.files.image
    ? [req.files.image]
    : undefined;

  assign(project, only(req.body, 'title body tags'));
  yield project.uploadAndSave(images);
  res.redirect('/projects/' + project._id);
});

/**
 * Show
 */

exports.show = function (req, res){
  res.render('projects/show', {
    title: req.project.title,
    project: req.project
  });
};

/**
 * Delete an project
 */

exports.destroy = wrap(function* (req, res) {
  yield req.project.remove();
  req.flash('success', 'Deleted successfully');
  res.redirect('/projects');
});
