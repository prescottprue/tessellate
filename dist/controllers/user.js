'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getProjects = getProjects;

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _user = require('../models/user');

var _project = require('../models/project');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findProjectsByUserId(userId) {
  if (!userId) {
    _logger2.default.error({
      description: 'User id is required to find projects.',
      func: 'findProjectsByUserId'
    });
    return Promise.reject({
      message: 'User id is required to find projects.',
      status: 'MISSING_INPUT'
    });
  }
  var findObj = { owner: userId, $or: [{ 'owner': userId }, { 'collaborators': { $in: [userId] } }] };
  return _project.Project.find(findObj).populate({ path: 'owner', select: 'username name email' }).then(function (projects) {
    if (!projects) {
      _logger2.default.error({
        description: 'Projects not found',
        func: 'findProject'
      });
      return Promise.reject({
        message: 'Project not found',
        status: 'NOT_FOUND'
      });
    }
    _logger2.default.log({
      description: 'Project found.', time: Date.now(), func: 'findProject'
    });
    return projects;
  }, function (error) {
    _logger2.default.error({
      description: 'Error finding project.',
      error: error, func: 'findProject'
    });
    return Promise.reject({ message: 'Error finding project.' });
  });
}
function findByUsername(username, withoutList) {
  return _user.User.findOne({ username: username }, { password: 0, __v: 0 }).then(function (user) {
    if (!user) {
      _logger2.default.log({
        description: 'No user data',
        func: 'get', obj: 'UserCtrl'
      });
      return Promise.reject({ message: 'User not found.' });
    }
    return user;
  }, function (error) {
    _logger2.default.error({
      description: 'Error finding user.',
      error: error, func: 'findByUsername', obj: 'UserCtrl'
    });
    return Promise.reject(error);
  });
}

/**
 * @api {get} /user/:username/projects Get projects for a specific user
 * @apiDescription Get list of users
 * @apiName GetUser
 * @apiGroup User
 *
 * @apiParam {Number} id Users unique ID.
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John Doe",
 *       "title": "Doe",
 *       "username": "john123",
 *       "email": "john123@gmail.com",
 *       "role":"user",
 *     }
 *
 */
function getProjects(req, res, next) {
  _logger2.default.log({
    description: 'User(s) get called.',
    func: 'getProjects', obj: 'UserCtrl'
  });
  if (!req.params.username) {
    return res.status(400).json({ message: 'Username is required to get projects' });
  }
  var username = req.params.username;

  _logger2.default.debug({
    description: 'Get user called with username.',
    username: username, func: 'getProjects', obj: 'UserCtrl', time: Date.now()
  });
  findByUsername(username).then(function (user) {
    _logger2.default.info({
      description: 'User found.',
      user: user, func: 'getProjects', obj: 'UserCtrl',
      time: Date.now()
    });
    findProjectsByUserId(user.id).then(function (projectsList) {
      _logger2.default.info({
        description: 'Projects list found.', func: 'getProjects', obj: 'UserCtrl',
        time: Date.now()
      });
      res.json(projectsList);
    }, function (error) {
      _logger2.default.error({
        description: 'Error getting projects by id.', error: error,
        func: 'getProjects', obj: 'UserCtrl'
      });
      res.status(400).json({ message: 'Error getting projects.' });
    });
  }, function (error) {
    _logger2.default.error({
      description: 'Error find user by username.', username: username, error: error,
      func: 'getProjects', obj: 'UserCtrl'
    });
    res.status(400).json({ message: 'Error finding user' });
  });
};