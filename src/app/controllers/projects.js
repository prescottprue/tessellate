'use strict'

/**
 * Module dependencies.
 */

import mongoose from 'mongoose'
import wrap from 'co-express'
import { project as dsProject } from 'devshare' // Only used for firebase/util functionality
import Firepad from 'firepad'
import AdmZip from 'adm-zip'
import { each, map } from 'lodash'

/**
 * Models
 */
const Project = mongoose.model('Project')

/**
 * Load project
 */
exports.load = wrap(function * (req, res, next, projectName) {
  if (!req.profile) return res.status(400).json({ message: 'owner required to get project.' })
  req.project = yield Project.load({ name: projectName, owner: req.profile._id })
  if (!req.project) return next(new Error('project not found'))
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
    console.log('error getting projects:', err)
    res.json({message: 'error getting projects', error: err.toString()})
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
      message: 'project not found.',
      status: 'NOT_FOUND'
    })
  }
  res.json(req.project)
})

/**
 * Create an project
 */
exports.create = wrap(function * (req, res) {
  const { name, collaborators } = req.body
  const project = new Project({ name, collaborators })
  if (!req.profile || !req.profile._id) {
    return res.status(400)
      .send({
        message: 'error creating project. authentication required.'
      })
  }
  project.owner = req.profile._id
  try {
    yield project.save()
    const populatedProject = yield Project.load({ _id: project._id })
    res.json(populatedProject)
  } catch (err) {
    const errorsList = map(err.errors, (e, key) => e.message || key)
    res.status(400).json({
      message: 'error creating project.',
      error: errorsList[0] || err
    })
  }
})

/**
 * Update project
 */
exports.update = wrap(function * (req, res) {
  const project = req.project
  let { name, collaborators, owner } = req.body
  // TODO: Handle owner as an object as well as id
  // TODO: Handle array of objects or ids for collaborators
  const newProject = Object.assign(
    project,
    { name, collaborators, owner }
  )
  try {
    yield newProject.save()
    res.json(project)
  } catch (err) {
    res.status(400).send({ message: 'error updating project' })
  }
})

/**
 * Delete an project
 */
exports.destroy = wrap(function * (req, res) {
  if (req.profile && req.project.owner && req.project.owner.id !== req.profile.id) {
    return res.status(400).json({
      message: 'you are not the project owner',
      status: 'NOT_OWNER'
    })
  }
  const project = req.project
  yield project.remove()
  res.json({
    message: 'project deleted successfully',
    status: 'SUCCESS'
  })
})

/**
 * Add collaborator to project
 */

exports.addCollaborator = wrap(function * (req, res) {
  const project = req.project
  if (!req.user) return res.status(400).json({message: 'username is required to add a collaborator'})
  try {
    yield project.addCollaborator(req.user)
    res.json(project)
  } catch (error) {
    console.log('error:', error)
    res.status(400).send({ message: error.toString() || 'error adding collaborator' })
  }
})

/**
 * Remove collaborator from project
 */

exports.removeCollaborator = wrap(function * (req, res) {
  const project = req.project
  if (!req.user) return res.status(400).json({ message: 'username is required to add a collaborator' })
  try {
    yield project.removeCollaborator(req.user._id)
    res.json(project)
  } catch (err) {
    res.status(400).send({ message: 'error removing collaborator.', error: err.toString() })
  }
})

/**
 * List project collaborators
 */

exports.getCollaborators = function (req, res) {
  res.json(req.project.collaborators)
}
/**
 * Get the contents of a file
 */
exports.getFileContent = wrap(function * (req, res) {
  // Firepad.Headless(fileSystem.file(child.meta.path).firebaseRef()).getText(text => {
  //   zip.addFile(child.meta.path, new Buffer(text))
  //   resolve(text || '')
  // })
})

/**
 * @description Create zip from project directory
 */
const getFileZip = (owner, projectName) => {
  const fileSystem = dsProject(owner, projectName).fileSystem
  return fileSystem
    .get()
    .then(directory => {
      // console.log('directory loaded:', directory)
      let zip = new AdmZip()
      let promiseArray = []
      let handleZip = fbChildren => {
        each(fbChildren, child => {
          if (!child.meta || child.meta.entityType === 'folder') {
            delete child.meta
            return handleZip(child)
          }
          if (child.original && !child.history) return zip.file(child.meta.path, child.original)
          let promise = new Promise(resolve =>
            Firepad.Headless(fileSystem.file(child.meta.path).firebaseRef()).getText(text => {
              zip.addFile(child.meta.path, new Buffer(text))
              resolve(text || '')
            })
          )
          promiseArray.push(promise)
        })
      }
      handleZip(directory)
      return Promise.all(promiseArray).then(() => {
        // TODO: Delete zip file after download
        const zipPath = `./zips/${owner}-${projectName}-devShare-export.zip`
        zip.writeZip(zipPath)
        return zipPath
      })
    })
}

exports.createZipFromPost = wrap(function * (req, res) {
  const { owner, projectName } = req.body
  try {
    const zipPath = yield getFileZip(owner, projectName)
    res.download(zipPath)
  } catch (error) {
    res.status(400).send({ message: error.toString() || 'error creating zip' })
  }
})

exports.createZip = wrap(function * (req, res) {
  const { owner, projectName } = req.params
  try {
    const zipPath = yield getFileZip(owner, projectName)
    res.download(zipPath)
  } catch (error) {
    res.status(400).send({ message: error.toString() || 'error creating zip' })
  }
})

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
