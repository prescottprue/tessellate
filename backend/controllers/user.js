import logger from '../utils/logger';
import { User } from '../models/user';
import { findProjectsByUserId } from './projects';
export function findByUsername(username, withoutList) {
  return User.findOne({ username }, {password:0, __v:0}).then(user => {
    if(!user){
      logger.log({
        message:'No user data',
        func:'get', obj:'UserCtrl'
      });
      return Promise.reject({message: 'User not found.'});
    }
    return user;
  }, error => {
    logger.error({
      message:'Error finding user.',
      error, func:'findByUsername', obj:'UserCtrl'
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
export function getProjects(req, res, next) {
	logger.log({
		message:'User(s) get called.',
		func:'get', obj:'UserCtrl'
	});
  if(!req.params.username){
    return res.status(400).send('Username is required to get projects');
  }
  const { username } = req.params;
	logger.debug({
		message:'Get user called with username.',
		username, func:'get', obj:'UserCtrl'
	});
  findByUsername(username).then(user => {
    logger.info({
  		message:'User found.',
  		user, func:'getProjects', obj:'UserCtrl'
  	});
    findProjectsByUserId(user.id).then(projectsList => {
      logger.info({
    		message:'Projects list found.', func:'getProjects', obj:'UserCtrl'
    	});
      res.json(projectsList);
    }, error => {
      logger.error({
    		message:'Error getting projects by id.', error,
    		func:'getProjects', obj:'UserCtrl'
    	});
      res.status(400).send('Error getting projects.');
    });
  }, error => {
    logger.error({
      message:'Error find user by username.', username, error,
      func:'getProjects', obj:'UserCtrl'
    });
    res.status(400).send('Error finding user');
  });
};
