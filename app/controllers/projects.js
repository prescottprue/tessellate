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

exports.load = wrap(function* (req, res, next, projectName) {
  req.project = yield Project.load({name: projectName, owner: req.params.owner});
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

  res.json({
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
  const project = new Project(only(req.body, 'name collaborators'));
  const images = (req.files && req.files.image)
    ? [req.files.image]
    : undefined;

  project.owner = req.user;
  yield project.save();
  // req.flash('success', 'Successfully created project!');
  // res.redirect('/projects/' + project._id);
  res.json(project);
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
  //  Render project page
  res.render('projects/show', {
    title: req.project.title,
    project: req.project
  });
};

/**
 * Delete an project
 */

exports.get = function (req, res){
  console.log('project', req.project);
  res.json(req.project);
};

/**
 * Delete an project
 */

exports.destroy = wrap(function* (req, res) {
  if(req.project.owner && req.project.owner != req.user._id){
    return res.status(400).json({message: 'You are not the project owner'});
  }
  yield req.project.remove();
  res.json({message: 'Project deleted successfully'});
});
