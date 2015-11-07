/** Authrocket controller
 *
 */
var logger = require('../utils/logger');
var Account = require('../models/account').Account;

/**
 * @description handles events from authrocket hook POST requests
 */
exports.events = (req, res, next) => {
  //TODO:Link to user account if matching account already exists and does not have linked account
  logger.warn({
    description: 'Authrocket event recieved.',
    body: req.body, func: 'authrocket'
  });
  if(req.body.event.event_type){
    switch(req.body.event.event_type){
      case 'user.created':
          userCreated(req.body.event).then(() => {
            logger.warn({
              description: 'User created successfully.',
              body: req.body, func: 'authrocket'
            });
            res.send('Thanks'); //Respond to authrocket post
          }, (err) => {
            logger.error({
              description: 'Error creating user in response to authrocket event.',
              body: req.body, func: 'events', obj: 'AuthrocketCtrls'
            });
            res.send('Thanks'); //Respond to authrocket post
          });
        break;
      case 'user.updated':
          userUpdated(req.body).then(() => {
            res.send('Thanks'); //Respond to authrocket post
          }, (err) => {
            logger.error({
              description: 'Error updating user in response to authrocket event.',
              body: req.body, func: 'events', obj: 'AuthrocketCtrls'
            });
            res.send('Thanks'); //Respond to authrocket post
          });
        break;
      case 'user.deleted':
          userDeleted(req.body).then(() => {
            res.send('Thanks'); //Respond to authrocket post
          }, (err) => {
            logger.error({
              description: 'Error deleting user in response to authrocket event.',
              body: req.body, func: 'events', obj: 'AuthrocketCtrls'
            });
            res.send('Thanks'); //Respond to authrocket post
          });
        break;
      default:
        logger.error({
          description: 'Authrocket event did not get handled.',
          body: req.body, func: 'events', obj: 'AuthrocketCtrls'
        });
    }
  } else {
    logger.error({
      description: 'Authrocket event did not have a type.',
      body: req.body, func: 'events', obj: 'AuthrocketCtrls'
    });
    res.send('');
  }
};
function userCreated(requestData){
  logger.log({
    description: 'Authrocket user created called.', data: requestData,
    func: 'userCreated', obj: 'AuthrocketCtrls'
  });
  if(!requestData.user_id){
    logger.error({
      description: 'user_id parameter is required.', data: requestData,
      func: 'userCreated', obj: 'AuthrocketCtrls'
    });
    return Promise.reject('user_id required');
  }
  // logger.info({
  //   description: 'Find object build', findObj: findObj,
  //   func: 'userCreated', obj: 'AuthrocketCtrls'
  // });
  var account = new Account({authrocketId: requestData.user_id});
  return account.saveNew().then((newAccount) => {
    logger.warn({
      description: 'New account created from authrocket user_created event.',
      func: 'userCreated', obj: 'AuthrocketCtrls'
    });
    return 'Thanks.';
  }, (err) => {
    logger.error({
      description: 'Error creating new account.', error: err,
      func: 'userCreated', obj: 'AuthrocketCtrls'
    });
    return 'Thanks'; //Bogus response to authrocket
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
}
function userUpdated(requestData){
  logger.log({
    description: 'Authrocket user updated.', data: requestData,
    func: 'userCreated', obj: 'AuthrocketCtrls'
  });
  Account.findOne({authrocketId:requestData.user_id}, (err, account) => {
    if(err){
      logger.error({
        description: 'Error finding account.', reqData: requestData,
        error: err, func:'update', obj:'AccountsCtrl'
      });
      // res.status(500).send('Error finding account.');
      res.status('Thanks');
    } else if(!account){
      logger.error({
        description: 'Account with matching authrocket id not found',
        reqData: requestData, func:'update', obj:'AccountsCtrl'
      });
      //TODO: Add to a new account or an account with matching username
      // res.status(400).send('Account not found.');
      res.status('Thanks');
    } else {
      //Select only valid parameters
      logger.log({
        description: 'Account before save.', account: account,
        func: 'update', obj: 'AccountsCtrl'
      });
      return account.saveNew().then((savedAccount) => {
        logger.log({
          description: 'Account saved successfully.',
          func: 'update', obj: 'AccountsCtrl'
        });
        return savedAccount;
      }, (err) => {
        logger.error({
          description: 'Error saving account.', error: err,
          func: 'update', obj: 'AccountsCtrl'
        });
        return Promise.reject('Error updating account.');
      });
    }
  });
}
function userDeleted(requestData){
  logger.log({
    description: 'Authrocket user deleted.', data: requestData,
    func: 'userDelete', obj: 'AuthrocketCtrls'
  });
  if(requestData.user_id){
		var query = Account.findOneAndRemove({authrocketId: requestData.user_id}); // find and delete using id field
		return query.then((result) => {
			logger.log({
        description: 'Account deleted successfully:',
        func: 'userDelected'
      });
			return result;
		}, (err) => {
			logger.error({
        description: 'Account could not be deleted.',
        error: err, func: 'userDeleted'
      });
      return Promise.reject('Account cound not be deleted')
		});
	}
}
