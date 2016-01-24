/** Authrocket controller
 *
 */
import logger from '../utils/logger';
import { User } from '../models/user';

/**
 * @description handles events from authrocket hook POST requests
 */
export function events(req, res, next) {
  //TODO:Link to user user if matching user already exists and does not have linked user
  logger.warn({
    description: 'Authrocket event recieved.',
    body: req.body || req, func: 'authrocket'
  });
  if(!req.body || !req.body.event){
    return res.status(400).send('Event required.');
  }
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
  return new Promise((resolve, reject) => {
    if(!requestData.user_id){
      logger.error({
        description: 'user_id parameter is required.', data: requestData,
        func: 'userCreated', obj: 'AuthrocketCtrls'
      });
      reject('user_id required');
    }
    // logger.info({
    //   description: 'Find object build', findObj: findObj,
    //   func: 'userCreated', obj: 'AuthrocketCtrls'
    // });
    var user = new User({
      authrocketId: requestData.user_id
    });
    //TODO: Load data from authrocket users endpoint to put in new user data












    user.saveNew().then((newUser) => {
      logger.warn({
        description: 'New user created from authrocket user_created event.',
        func: 'userCreated', obj: 'AuthrocketCtrls'
      });
      resolve('Thanks.');
    }, (err) => {
      logger.error({
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
function userUpdated(requestData){
  logger.log({
    description: 'Authrocket user updated.', data: requestData,
    func: 'userCreated', obj: 'AuthrocketCtrls'
  });
  return new Promise((resolve, reject) => {
    User.findOne({authrocketId:requestData.user_id}, (err, user) => {
      if(err){
        logger.error({
          description: 'Error finding user.', reqData: requestData,
          error: err, func:'update', obj:'UsersCtrl'
        });
        // res.status(500).send('Error finding user.');
        resolve();
      } else if(!user){
        logger.error({
          description: 'User with matching authrocket id not found',
          reqData: requestData, func:'update', obj:'UsersCtrl'
        });
        //TODO: Add to a new user or an user with matching username
        // res.status(400).send('User not found.');
        resolve()
      } else {
        //Select only valid parameters
        logger.log({
          description: 'User before save.', user: user,
          func: 'update', obj: 'UsersCtrl'
        });
        user.saveNew().then((savedUser) => {
          logger.log({
            description: 'User saved successfully.',
            func: 'update', user: savedUser, obj: 'UsersCtrl'
          });
          resolve(savedUser);
        }, (err) => {
          logger.error({
            description: 'Error saving user.', error: err,
            func: 'update', obj: 'UsersCtrl'
          });
          reject('Error updating user.');
        });
      }
    });
  })
}
function userDeleted(requestData){
  logger.log({
    description: 'Authrocket user deleted.', data: requestData,
    func: 'userDelete', obj: 'AuthrocketCtrls'
  });
  return new Promise((resolve, reject) => {
    if(requestData.user_id){
  		var query = User.findOneAndRemove({authrocketId: requestData.user_id}); // find and delete using id field
  		query.then((result) => {
  			logger.log({
          description: 'User deleted successfully:',
          func: 'userDelected'
        });
  			resolve(result);
  		}, (err) => {
  			logger.error({
          description: 'User could not be deleted.',
          error: err, func: 'userDeleted'
        });
        reject('User cound not be deleted')
  		});
  	}
  });

}
