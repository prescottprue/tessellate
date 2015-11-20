'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserFromRequest = getUserFromRequest;

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getUserFromRequest(req) {
  if (!req.user) {
    _logger2.default.log({
      description: 'User does not exist in request.',
      user: req.user, func: 'getUserFromRequest'
    });
    return null;
  }
  _logger2.default.log({
    description: 'Getting user from request.',
    user: req.user || null, func: 'getUserFromRequest'
  });
  var userData = {};
  //Find out what token type it is
  if (req.user.un) {
    _logger2.default.log({
      description: 'Token is AuthRocket format.',
      func: 'getUserFromRequest'
    });
    //Token is an authrocket token
    userData.username = req.user.un;
    userData.name = req.user.n || null;
    userData.uid = req.user.uid || null;
    userData.orgs = req.user.m.map(function (group) {
      return { name: group.o, id: group.oid };
    });
  } else if (req.user.accountId) {
    _logger2.default.log({
      description: 'Token is default format.',
      user: req.user, func: 'getUserFromRequest'
    });
    userData.id = req.user.accountId;
    userData.username = req.user.username;
  } else {
    _logger2.default.error({
      description: 'Unrecognized token format.',
      func: 'getUserFromRequest'
    });
  }
  //TODO: Get user from multiple token types
  return userData;
}