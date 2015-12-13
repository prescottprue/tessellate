'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.events = events;

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _account = require('../models/account');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @description handles events from authrocket hook POST requests
 */
/** Authrocket controller
 *
 */
function events(req, res, next) {
  //TODO:Link to user account if matching account already exists and does not have linked account
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
    var account = new _account.Account({
      authrocketId: requestData.user_id
    });
    //TODO: Load data from authrocket users endpoint to put in new user data

    account.saveNew().then(function (newAccount) {
      _logger2.default.warn({
        description: 'New account created from authrocket user_created event.',
        func: 'userCreated', obj: 'AuthrocketCtrls'
      });
      resolve('Thanks.');
    }, function (err) {
      _logger2.default.error({
        description: 'Error creating new account.', error: err,
        func: 'userCreated', obj: 'AuthrocketCtrls'
      });
      resolve('Thanks'); //Bogus response to authrocket
    });
    // //Find account within mongo
    // var query = Account.findOne(findObj);
    // query.then((accountData) => {
    //   logger.warn({
    //     message:'Account query response', accountData: accountData,
    //     func:'userCreated', obj:'AuthrocketCtrls'
    //   });
    // 	if(!accountData){
    // 		logger.warn({
    //       message:'Account does not already exist',
    //       func:'userCreated', obj:'AuthrocketCtrls'
    //     });
    //
    // 	} else {
    //     logger.warn({
    //       message:'Account with matching user_id already exists.',
    //       func:'userCreated', obj:'AuthrocketCtrls'
    //     });
    //     return res.send('Thanks.'); //Bogus response to authrocket
    // 	}
    // }, (err) => {
    // 	logger.error({
    //     message:'Error finding account data.', error:err,
    //     func:'userCreated', obj:'AuthrocketCtrls'
    //   });
    // 	return res.status(500).send('Error getting account.');
    // });
  });
}
function userUpdated(requestData) {
  _logger2.default.log({
    description: 'Authrocket user updated.', data: requestData,
    func: 'userCreated', obj: 'AuthrocketCtrls'
  });
  return new Promise(function (resolve, reject) {
    _account.Account.findOne({ authrocketId: requestData.user_id }, function (err, account) {
      if (err) {
        _logger2.default.error({
          description: 'Error finding account.', reqData: requestData,
          error: err, func: 'update', obj: 'AccountsCtrl'
        });
        // res.status(500).send('Error finding account.');
        resolve();
      } else if (!account) {
        _logger2.default.error({
          description: 'Account with matching authrocket id not found',
          reqData: requestData, func: 'update', obj: 'AccountsCtrl'
        });
        //TODO: Add to a new account or an account with matching username
        // res.status(400).send('Account not found.');
        resolve();
      } else {
        //Select only valid parameters
        _logger2.default.log({
          description: 'Account before save.', account: account,
          func: 'update', obj: 'AccountsCtrl'
        });
        account.saveNew().then(function (savedAccount) {
          _logger2.default.log({
            description: 'Account saved successfully.',
            func: 'update', account: savedAccount, obj: 'AccountsCtrl'
          });
          resolve(savedAccount);
        }, function (err) {
          _logger2.default.error({
            description: 'Error saving account.', error: err,
            func: 'update', obj: 'AccountsCtrl'
          });
          reject('Error updating account.');
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
      var query = _account.Account.findOneAndRemove({ authrocketId: requestData.user_id }); // find and delete using id field
      query.then(function (result) {
        _logger2.default.log({
          description: 'Account deleted successfully:',
          func: 'userDelected'
        });
        resolve(result);
      }, function (err) {
        _logger2.default.error({
          description: 'Account could not be deleted.',
          error: err, func: 'userDeleted'
        });
        reject('Account cound not be deleted');
      });
    }
  });
}