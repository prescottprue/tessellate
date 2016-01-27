'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const assign = require('object-assign');
const wrap = require('co-express');
const only = require('only');
const _ = require('lodash');
const Project = mongoose.model('Project');
const User = mongoose.model('User');

/**
 * Load project
 */

exports.load = wrap(function* (req, res, next, projectName) {
  req.owner = yield User.load({username: req.params.username});
  req.project = yield Project.load({name: projectName, owner: req.owner._id || req.user._id});
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
  // Response with pagination data
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
 */

exports.create = wrap(function* (req, res) {
  const project = new Project(only(req.body, 'name collaborators'));
  if(!req.profile || !req.profile._id){
    return res.status(400).send({
      message: 'Error creating project. User not found.'
    });
  }
  project.owner = req.profile._id;
  try {
    yield project.save();
    const populatedProject = yield Project.load({ _id: project._id });
    res.json(populatedProject);
  } catch(err) {
    var errorsList = _.map(err.errors, function(e, key){
      return e.message || key;
    });
    // console.log('error creating project', errorsList);
    res.status(400).json({
      message: 'Error creating project.',
      error: errorsList[0] || err
    });
  }
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
  assign(project, only(req.body, 'name collaborators owner'));
  yield project.save();
  res.json(project);
});

/**
 * Project detail page
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
    return res.json({
      message: 'Project not found.',
      status: 'NOT_FOUND'
    });
  }
  res.json(req.project);
});

/**
 * Delete an project
 */

exports.destroy = wrap(function* (req, res) {
  if(req.project.owner && (JSON.stringify(req.project.owner._id) !== JSON.stringify(req.user._id))){
    return res.status(400).json({
      message: 'You are not the project owner',
      status: 'NOT_OWNER'
    });
  }
  const project = req.project;
  yield project.remove();
  res.json({
    message: 'Project deleted successfully',
    status: 'SUCCESS'
  });
});
