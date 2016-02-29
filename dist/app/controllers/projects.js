'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var assign = require('object-assign');
var wrap = require('co-express');
var only = require('only');
var _ = require('lodash');
var Project = mongoose.model('Project');

/**
 * Load project
 */

exports.load = wrap(regeneratorRuntime.mark(function _callee(req, res, next, projectName) {
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (req.profile) {
            _context.next = 2;
            break;
          }

          return _context.abrupt('return', res.status(400).json({ message: 'Owner required to get project.' }));

        case 2:
          _context.next = 4;
          return Project.load({ name: projectName, owner: req.profile._id });

        case 4:
          req.project = _context.sent;

          if (req.project) {
            _context.next = 7;
            break;
          }

          return _context.abrupt('return', next(new Error('Project not found')));

        case 7:
          next();

        case 8:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
}));

/**
 * List projects
 */

exports.index = wrap(regeneratorRuntime.mark(function _callee2(req, res) {
  var page, limit, options, projects;
  return regeneratorRuntime.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          page = (req.query.page > 0 ? req.query.page : 1) - 1;
          limit = 30;
          options = {
            limit: limit,
            page: page
          };

          if (req.profile) {
            options.criteria = { $or: [{ owner: req.profile._id }, { collaborators: { $in: [req.profile._id] } }] };
          }
          _context2.next = 6;
          return Project.list(options);

        case 6:
          projects = _context2.sent;

          // TODO: Responsed with pagination data
          // const count = yield Project.count()
          // res.json({
          //	 title: 'Projects',
          //	 projects: projects,
          //	 page: page + 1,
          //	 pages: Math.ceil(count / limit)
          // })
          res.json(projects);

        case 8:
        case 'end':
          return _context2.stop();
      }
    }
  }, _callee2, this);
}));

/**
 * Get a project
 */

exports.get = wrap(regeneratorRuntime.mark(function _callee3(req, res) {
  return regeneratorRuntime.wrap(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (req.project) {
            _context3.next = 2;
            break;
          }

          return _context3.abrupt('return', res.json({
            message: 'Project not found.',
            status: 'NOT_FOUND'
          }));

        case 2:
          res.json(req.project);

        case 3:
        case 'end':
          return _context3.stop();
      }
    }
  }, _callee3, this);
}));

/**
 * Create an project
 */

exports.create = wrap(regeneratorRuntime.mark(function _callee4(req, res) {
  var project, populatedProject, errorsList;
  return regeneratorRuntime.wrap(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          project = new Project(only(req.body, 'name collaborators'));

          if (!(!req.profile || !req.profile._id)) {
            _context4.next = 3;
            break;
          }

          return _context4.abrupt('return', res.status(400).send({
            message: 'Error creating project. User not found.'
          }));

        case 3:
          project.owner = req.profile._id;
          _context4.prev = 4;
          _context4.next = 7;
          return project.save();

        case 7:
          _context4.next = 9;
          return Project.load({ _id: project._id });

        case 9:
          populatedProject = _context4.sent;

          res.json(populatedProject);
          _context4.next = 17;
          break;

        case 13:
          _context4.prev = 13;
          _context4.t0 = _context4['catch'](4);
          errorsList = _.map(_context4.t0.errors, function (e, key) {
            return e.message || key;
          });
          // console.log('error creating project', errorsList)

          res.status(400).json({
            message: 'Error creating project.',
            error: errorsList[0] || _context4.t0
          });

        case 17:
        case 'end':
          return _context4.stop();
      }
    }
  }, _callee4, this, [[4, 13]]);
}));

/**
 * Update project
 */

exports.update = wrap(regeneratorRuntime.mark(function _callee5(req, res) {
  var project;
  return regeneratorRuntime.wrap(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          project = req.project;
          // console.log('update called before:', req.body)

          assign(project, only(req.body, 'name collaborators owner'));
          _context5.prev = 2;
          _context5.next = 5;
          return project.save();

        case 5:
          res.json(project);
          _context5.next = 11;
          break;

        case 8:
          _context5.prev = 8;
          _context5.t0 = _context5['catch'](2);

          res.status(400).send({ message: 'Error updating project' });

        case 11:
        case 'end':
          return _context5.stop();
      }
    }
  }, _callee5, this, [[2, 8]]);
}));

/**
 * Delete an project
 */

exports.destroy = wrap(regeneratorRuntime.mark(function _callee6(req, res) {
  var project;
  return regeneratorRuntime.wrap(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          if (!(req.profile && req.project.owner && req.project.owner.id !== req.profile.id)) {
            _context6.next = 2;
            break;
          }

          return _context6.abrupt('return', res.status(400).json({
            message: 'You are not the project owner',
            status: 'NOT_OWNER'
          }));

        case 2:
          project = req.project;
          _context6.next = 5;
          return project.remove();

        case 5:
          res.json({
            message: 'Project deleted successfully',
            status: 'SUCCESS'
          });

        case 6:
        case 'end':
          return _context6.stop();
      }
    }
  }, _callee6, this);
}));

/**
 * Add collaborator to project
 */

exports.addCollaborator = wrap(regeneratorRuntime.mark(function _callee7(req, res) {
  var project;
  return regeneratorRuntime.wrap(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          project = req.project;

          if (req.user) {
            _context7.next = 3;
            break;
          }

          return _context7.abrupt('return', res.status(400).json({ message: 'Username is required to add a collaborator' }));

        case 3:
          _context7.prev = 3;
          _context7.next = 6;
          return project.addCollaborator(req.user);

        case 6:
          res.json(project);
          _context7.next = 13;
          break;

        case 9:
          _context7.prev = 9;
          _context7.t0 = _context7['catch'](3);

          console.log('error:', _context7.t0);
          res.status(400).send({ message: _context7.t0.toString() || 'Error adding collaborator.' });

        case 13:
        case 'end':
          return _context7.stop();
      }
    }
  }, _callee7, this, [[3, 9]]);
}));

/**
 * Remove collaborator from project
 */

exports.removeCollaborator = wrap(regeneratorRuntime.mark(function _callee8(req, res) {
  var project;
  return regeneratorRuntime.wrap(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          project = req.project;

          if (req.user) {
            _context8.next = 3;
            break;
          }

          return _context8.abrupt('return', res.status(400).json({ message: 'Username is required to add a collaborator' }));

        case 3:
          _context8.prev = 3;
          _context8.next = 6;
          return project.removeCollaborator(req.user._id);

        case 6:
          res.json(project);
          _context8.next = 12;
          break;

        case 9:
          _context8.prev = 9;
          _context8.t0 = _context8['catch'](3);

          res.status(400).send({ message: 'Error removing collaborator.', error: _context8.t0.toString() });

        case 12:
        case 'end':
          return _context8.stop();
      }
    }
  }, _callee8, this, [[3, 9]]);
}));

/**
 * List project collaborators
 */

exports.getCollaborators = function (req, res) {
  res.json(req.project.collaborators);
};

/**
 * New project page
 */

exports.new = function (req, res) {
  res.render('projects/new', {
    title: 'New Project',
    project: new Project({})
  });
};

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
 * Project detail page
 */

exports.show = function (req, res) {
  //	Render project page
  res.render('projects/show', {
    title: req.project.title,
    project: req.project
  });
};