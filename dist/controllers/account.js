'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findByUsername = findByUsername;
exports.getProjects = getProjects;

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _account = require('../models/account');

var _applications = require('./applications');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findByUsername(username, withoutList) {
  return _account.Account.findOne({ username: username }, { password: 0, __v: 0 }).then(function (account) {
    if (!account) {
      _logger2.default.log({
        message: 'No account data',
        func: 'get', obj: 'AccountCtrl'
      });
      return Promise.reject({ message: 'Account not found.' });
    }
    return account;
  }, function (error) {
    _logger2.default.error({
      message: 'Error finding account.',
      error: error, func: 'findByUsername', obj: 'AccountCtrl'
    });
    return Promise.reject(error);
  });
}

/**
 * @api {get} /account/:username/projects Get projects for a specific user
 * @apiDescription Get list of accounts
 * @apiName GetAccount
 * @apiGroup Account
 *
 * @apiParam {Number} id Accounts unique ID.
 *
 * @apiSuccess {Object} accountData Object containing accounts data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John Doe",
 *       "title": "Doe",
 *       "username": "john123",
 *       "email": "john123@gmail.com",
 *       "role":"account",
 *     }
 *
 */
function getProjects(req, res, next) {
  _logger2.default.log({
    message: 'Account(s) get called.',
    func: 'get', obj: 'AccountCtrl'
  });
  if (!req.params.username) {
    return res.status(400).send('Username is required to get projects');
  }
  var username = req.params.username;

  _logger2.default.debug({
    message: 'Get account called with username.',
    username: username, func: 'get', obj: 'AccountCtrl'
  });
  findByUsername(username).then(function (account) {
    _logger2.default.info({
      message: 'Account found.',
      account: account, func: 'getProjects', obj: 'AccountCtrl'
    });
    (0, _applications.findProjectsByUserId)(account.id).then(function (projectsList) {
      _logger2.default.info({
        message: 'Projects list found.', func: 'getProjects', obj: 'AccountCtrl'
      });
      res.json(projectsList);
    }, function (error) {
      _logger2.default.error({
        message: 'Error getting projects by id.', error: error,
        func: 'getProjects', obj: 'AccountCtrl'
      });
      res.status(400).send('Error getting projects.');
    });
  }, function (error) {
    _logger2.default.error({
      message: 'Error find account by username.', username: username, error: error,
      func: 'getProjects', obj: 'AccountCtrl'
    });
    res.status(400).send('Error finding account');
  });
};