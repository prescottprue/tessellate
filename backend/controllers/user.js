import logger from '../utils/logger';
import { User } from '../models/user';
import { Project } from '../models/project';
function findProjectsByUserId(userId) {
	if(!userId){
		logger.error({
			description: 'User id is required to find projects.',
			func: 'findProjectsByUserId'
		});
		return Promise.reject({
			message: 'User id is required to find projects.',
			status: 'MISSING_INPUT'
		});
	}
	const findObj = {owner: userId, $or: [{'owner': userId}, {'collaborators': {$in:[userId]}}]};
	return Project.find(findObj)
		.populate({path:'owner', select:'username name email'})
		.then(projects => {
			if(!projects){
				logger.error({
					description: 'Projects not found',
					func: 'findProject'
				});
				return Promise.reject({
					message: 'Project not found',
					status: 'NOT_FOUND'
				});
			}
			logger.log({
				description: 'Project found.', time: Date.now(), func: 'findProject'
			});
			return projects;
		}, error => {
			logger.error({
				description: 'Error finding project.',
				error, func: 'findProject'
			});
			return Promise.reject({message: 'Error finding project.'});
		});
}
function findByUsername(username, withoutList) {
  return User.findOne({ username }, {password:0, __v:0}).then(user => {
    if(!user){
      logger.log({
        description: 'No user data',
        func:'get', obj:'UserCtrl'
      });
      return Promise.reject({message:  'User not found.'});
    }
    return user;
  }, error => {
    logger.error({
      description: 'Error finding user.',
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
		description: 'User(s) get called.',
		func:'getProjects', obj:'UserCtrl'
	});
  if(!req.params.username){
    return res.status(400).json({message: 'Username is required to get projects'});
  }
  const { username } = req.params;
	logger.debug({
		description: 'Get user called with username.',
		username, func:'getProjects', obj:'UserCtrl', time: Date.now()
	});
  findByUsername(username).then(user => {
    logger.info({
  		description: 'User found.',
  		user, func:'getProjects', obj:'UserCtrl',
      time: Date.now()
  	});
    findProjectsByUserId(user.id).then(projectsList => {
      logger.info({
    		description: 'Projects list found.', func:'getProjects', obj:'UserCtrl',
        time: Date.now()
    	});
      res.json(projectsList);
    }, error => {
      logger.error({
    		description: 'Error getting projects by id.', error,
    		func:'getProjects', obj:'UserCtrl'
    	});
      res.status(400).json({message:  'Error getting projects.'});
    });
  }, error => {
    logger.error({
      description: 'Error find user by username.', username, error,
      func:'getProjects', obj:'UserCtrl'
    });
    res.status(400).json({message:  'Error finding user'});
  });
};
