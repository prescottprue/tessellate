'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findByUsername = findByUsername;
exports.getProjects = getProjects;

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _user = require('../models/user');

var _projects = require('./projects');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findByUsername(username, withoutList) {
  return _user.User.findOne({ username: username }, { password: 0, __v: 0 }).then(function (user) {
    if (!user) {
      _logger2.default.log({
        message: 'No user data',
        func: 'get', obj: 'UserCtrl'
      });
      return Promise.reject({ message: 'User not found.' });
    }
    return user;
  }, function (error) {
    _logger2.default.error({
      message: 'Error finding user.',
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
    message: 'User(s) get called.',
    func: 'get', obj: 'UserCtrl'
  });
  if (!req.params.username) {
    return res.status(400).send('Username is required to get projects');
  }
  var username = req.params.username;

  _logger2.default.debug({
    message: 'Get user called with username.',
    username: username, func: 'get', obj: 'UserCtrl'
  });
  findByUsername(username).then(function (user) {
    _logger2.default.info({
      message: 'User found.',
      user: user, func: 'getProjects', obj: 'UserCtrl'
    });
    (0, _projects.findProjectsByUserId)(user.id).then(function (projectsList) {
      _logger2.default.info({
        message: 'Projects list found.', func: 'getProjects', obj: 'UserCtrl'
      });
      res.json(projectsList);
    }, function (error) {
      _logger2.default.error({
        message: 'Error getting projects by id.', error: error,
        func: 'getProjects', obj: 'UserCtrl'
      });
      res.status(400).send('Error getting projects.');
    });
  }, function (error) {
    _logger2.default.error({
      message: 'Error find user by username.', username: username, error: error,
      func: 'getProjects', obj: 'UserCtrl'
    });
    res.status(400).send('Error finding user');
  });
};