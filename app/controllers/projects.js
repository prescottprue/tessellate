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
 * Load project
 */

exports.load = wrap(function* (req, res, next, projectName) {
  console.log('req.user', req.user);
  console.log('req.params', req.params);
  req.project = yield Project.load({name: projectName, owner: req.params.username || req.user._id});
  if (!req.project) return next(new Error('Project not found'));
  next();
});

/**
 * List projects
 */

exports.index = wrap(function* (req, res) {
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const limit = 30;
  const options = {
    limit: limit,
    page: page
  };

  const projects = yield Project.list(options);
  // Response with page data
  // const count = yield Project.count();
  // res.json({
  //   title: 'Projects',
  //   projects: projects,
  //   page: page + 1,
  //   pages: Math.ceil(count / limit)
  // });
  res.json(projects);
});

/**
 * New project page
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
 * Edit page
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
  res.json(project);
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
 * Get a project
 */

exports.get = wrap(function* (req, res){
  if(!req.project){
    return res.json({message: 'Project not found.'});
  }
  res.json(req.project);
});

/**
 * Delete an project
 */

exports.destroy = wrap(function* (req, res) {
  if(req.project.owner && req.project.owner != req.user._id){
    return res.status(400).json({
      message: 'You are not the project owner',
      status: 'NOT_OWNER'
    });
  }
  yield req.project.remove();
  res.json({
    message: 'Project deleted successfully',
    status: 'SUCCESS'
  });
});