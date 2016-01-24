'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.events = events;

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _user = require('../models/user');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @description handles events from authrocket hook POST requests
 */
/** Authrocket controller
 *
 */
function events(req, res, next) {
  //TODO:Link to user user if matching user already exists and does not have linked user
  _logger2.default.warn({
    description: 'Authrocket event recieved.',
    body: req.body || req, func: 'authrocket'
  });
  if (!req.body || !req.body.event) {
    return res.status(400).send('Event required.');
  }
  if (req.body.event.event_type) {
    switch (req.body.event.event_type) {
      case 'user.created':
        userCreated(req.body.event).then(function () {
          _logger2.default.warn({
            description: 'User created successfully.',
            body: req.body, func: 'authrocket'
          });
          res.send('Thanks'); //Respond to authrocket post
        }, function (err) {
          _logger2.default.error({
            description: 'Error creating user in response to authrocket event.',
            body: req.body, func: 'events', obj: 'AuthrocketCtrls'
          });
          res.send('Thanks'); //Respond to authrocket post
        });
        break;
      case 'user.updated':
        userUpdated(req.body).then(function () {
          res.send('Thanks'); //Respond to authrocket post
        }, function (err) {
          _logger2.default.error({
            description: 'Error updating user in response to authrocket event.',
            body: req.body, func: 'events', obj: 'AuthrocketCtrls'
          });
          res.send('Thanks'); //Respond to authrocket post
        });
        break;
      case 'user.deleted':
        userDeleted(req.body).then(function () {
          res.send('Thanks'); //Respond to authrocket post
        }, function (err) {
          _logger2.default.error({
            description: 'Error deleting user in response to authrocket event.',
            body: req.body, func: 'events', obj: 'AuthrocketCtrls'
          });
          res.send('Thanks'); //Respond to authrocket post
        });
        break;
      default:
        _logger2.default.error({
          description: 'Authrocket event did not get handled.',
          body: req.body, func: 'events', obj: 'AuthrocketCtrls'
        });
    }
  } else {
    _logger2.default.error({
      description: 'Authrocket event did not have a type.',
      body: req.body, func: 'events', obj: 'AuthrocketCtrls'
    });
    res.send('');
  }
};
function userCreated(requestData) {
  _logger2.default.log({
    description: 'Authrocket user created called.', data: requestData,
    func: 'userCreated', obj: 'AuthrocketCtrls'
  });
  return new Promise(function (resolve, reject) {
    if (!requestData.user_id) {
      _logger2.default.error({
        description: 'user_id parameter is required.', data: requestData,
        func: 'userCreated', obj: 'AuthrocketCtrls'
      });
      reject('user_id required');
    }
    // logger.info({
    //   description: 'Find object build', findObj: findObj,
    //   func: 'userCreated', obj: 'AuthrocketCtrls'
    // });
    var user = new _user.User({
      authrocketId: requestData.user_id
    });
    //TODO: Load data from authrocket users endpoint to put in new user data

    user.saveNew().then(function (newUser) {
      _logger2.default.warn({
        description: 'New user created from authrocket user_created event.',
        func: 'userCreated', obj: 'AuthrocketCtrls'
      });
      resolve('Thanks.');
    }, function (err) {
      _logger2.default.error({
        description: 'Error creating new user.', error: err,
        func: 'userCreated', obj: 'AuthrocketCtrls'
      });
      resolve('Thanks'); //Bogus response to authrocket
    });
    // //Find user within mongo
    // var query = User.findOne(findObj);
    // query.then((userData) => {
    //   logger.warn({
    //     message:'User query response', userData: userData,
    //     func:'userCreated', obj:'AuthrocketCtrls'
    //   });
    // 	if(!userData){
    // 		logger.warn({
    //       message:'User does not already exist',
    //       func:'userCreated', obj:'AuthrocketCtrls'
    //     });
    //
    // 	} else {
    //     logger.warn({
    //       message:'User with matching user_id already exists.',
    //       func:'userCreated', obj:'AuthrocketCtrls'
    //     });
    //     return res.send('Thanks.'); //Bogus response to authrocket
    // 	}
    // }, (err) => {
    // 	logger.error({
    //     message:'Error finding user data.', error:err,
    //     func:'userCreated', obj:'AuthrocketCtrls'
    //   });
    // 	return res.status(500).send('Error getting user.');
    // });
  });
}
function userUpdated(requestData) {
  _logger2.default.log({
    description: 'Authrocket user updated.', data: requestData,
    func: 'userCreated', obj: 'AuthrocketCtrls'
  });
  return new Promise(function (resolve, reject) {
    _user.User.findOne({ authrocketId: requestData.user_id }, function (err, user) {
      if (err) {
        _logger2.default.error({
          description: 'Error finding user.', reqData: requestData,
          error: err, func: 'update', obj: 'UsersCtrl'
        });
        // res.status(500).send('Error finding user.');
        resolve();
      } else if (!user) {
        _logger2.default.error({
          description: 'User with matching authrocket id not found',
          reqData: requestData, func: 'update', obj: 'UsersCtrl'
        });
        //TODO: Add to a new user or an user with matching username
        // res.status(400).send('User not found.');
        resolve();
      } else {
        //Select only valid parameters
        _logger2.default.log({
          description: 'User before save.', user: user,
          func: 'update', obj: 'UsersCtrl'
        });
        user.saveNew().then(function (savedUser) {
          _logger2.default.log({
            description: 'User saved successfully.',
            func: 'update', user: savedUser, obj: 'UsersCtrl'
          });
          resolve(savedUser);
        }, function (err) {
          _logger2.default.error({
            description: 'Error saving user.', error: err,
            func: 'update', obj: 'UsersCtrl'
          });
          reject('Error updating user.');
        });
      }
    });
  });
}
function userDeleted(requestData) {
  _logger2.default.log({
    description: 'Authrocket user deleted.', data: requestData,
    func: 'userDelete', obj: 'AuthrocketCtrls'
  });
  return new Promise(function (resolve, reject) {
    if (requestData.user_id) {
      var query = _user.User.findOneAndRemove({ authrocketId: requestData.user_id }); // find and delete using id field
      query.then(function (result) {
        _logger2.default.log({
          description: 'User deleted successfully:',
          func: 'userDelected'
        });
        resolve(result);
      }, function (err) {
        _logger2.default.error({
          description: 'User could not be deleted.',
          error: err, func: 'userDeleted'
        });
        reject('User cound not be deleted');
      });
    }
  });
}