'use strict'

/**
 * Module dependencies.
 */

const mongoose = require('mongoose')
const assign = require('object-assign')
const wrap = require('co-express')
const only = require('only')
const _ = require('lodash')
const Project = mongoose.model('Project')

/**
 * Load project
 */

exports.load = wrap(function * (req, res, next, projectName) {
  if (!req.profile) return res.status(400).json({ message: 'Owner required to get project.' })
  req.project = yield Project.load({ name: projectName, owner: req.profile._id })
  if (!req.project) return next(new Error('Project not found'))
  next()
})

/**
 * List projects
 */

exports.index = wrap(function * (req, res) {
  const page = (req.query.page > 0 ? req.query.page : 1) - 1
  const limit = 30
  const options = {
    limit: limit,
    page: page
  }
  if (req.profile) {
    options.criteria = { $or: [ { owner: req.profile._id }, { collaborators: { $in: [req.profile._id] } } ] }
  }
  try {
    const projects = yield Project.list(options)
    res.json(projects)
  } catch (err) {
    console.log('Error getting projects:', err)
    res.json({message: 'Error getting projects', error: err.toString()})
  }
  // TODO: Responsed with pagination data
  // const count = yield Project.count()
  // res.json({
  //	 title: 'Projects',
  //	 projects: projects,
  //	 page: page + 1,
  //	 pages: Math.ceil(count / limit)
  // })
})

/**
 * Get a project
 */

exports.get = wrap(function * (req, res) {
  if (!req.project) {
    return res.json({
      message: 'Project not found.',
      status: 'NOT_FOUND'
    })
  }
  res.json(req.project)
})

/**
 * Create an project
 */

exports.create = wrap(function * (req, res) {
  const project = new Project(only(req.body, 'name collaborators'))
  if (!req.profile || !req.profile._id) {
    return res.status(400).send({
      message: 'Error creating project. User not found.'
    })
  }
  project.owner = req.profile._id
  try {
    yield project.save()
    const populatedProject = yield Project.load({ _id: project._id })
    res.json(populatedProject)
  } catch (err) {
    const errorsList = _.map(err.errors, (e, key) => {
      return e.message || key
    })
    // console.log('error creating project', errorsList)
    res.status(400).json({
      message: 'Error creating project.',
      error: errorsList[0] || err
    })
  }
})

/**
 * Update project
 */

exports.update = wrap(function * (req, res) {
  const project = req.project
  // console.log('update called before:', req.body)
  assign(project, only(req.body, 'name collaborators owner'))
  try {
    // console.log('project after assign', newProject)
    yield project.save()
    res.json(project)
  } catch (err) {
    res.status(400).send({message: 'Error updating project'})
  }
})

/**
 * Delete an project
 */

exports.destroy = wrap(function * (req, res) {
  if (req.profile && req.project.owner && req.project.owner.id !== req.profile.id) {
    return res.status(400).json({
      message: 'You are not the project owner',
      status: 'NOT_OWNER'
    })
  }
  const project = req.project
  yield project.remove()
  res.json({
    message: 'Project deleted successfully',
    status: 'SUCCESS'
  })
})

/**
 * Add collaborator to project
 */

exports.addCollaborator = wrap(function * (req, res) {
  const project = req.project
  if (!req.user) return res.status(400).json({message: 'Username is required to add a collaborator'})
  try {
    yield project.addCollaborator(req.user)
    res.json(project)
  } catch (error) {
    console.log('error:', error)
    res.status(400).send({ message: error.toString() || 'Error adding collaborator.' })
  }
})

/**
 * Remove collaborator from project
 */

exports.removeCollaborator = wrap(function * (req, res) {
  const project = req.project
  if (!req.user) return res.status(400).json({message: 'Username is required to add a collaborator'})
  try {
    yield project.removeCollaborator(req.user._id)
    res.json(project)
  } catch (err) {
    res.status(400).send({message: 'Error removing collaborator.', error: err.toString()})
  }
})

/**
 * List project collaborators
 */

exports.getCollaborators = function (req, res) {
  res.json(req.project.collaborators)
}

/**
 * New project page
 */

exports.new = function (req, res) {
  res.render('projects/new', {
    title: 'New Project',
    project: new Project({})
  })
}

/**
 * Edit page
 */

exports.edit = function (req, res) {
  res.render('projects/edit', {
    title: 'Edit ' + req.project.title,
    project: req.project
  })
}

/**
 * Project detail page
 */

exports.show = function (req, res) {
  //	Render project page
  res.render('projects/show', {
    title: req.project.title,
    project: req.project
  })
}
