import logger from '../utils/logger';
import { Account } from '../models/account';
import { findProjectsByUserId } from './applications';
export function findByUsername(username, withoutList) {
  return Account.findOne({ username }, {password:0, __v:0}).then(account => {
    if(!account){
      logger.log({
        message:'No account data',
        func:'get', obj:'AccountCtrl'
      });
      return Promise.reject({message: 'Account not found.'});
    }
    return account;
  }, error => {
    logger.error({
      message:'Error finding account.',
      error, func:'findByUsername', obj:'AccountCtrl'
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
export function getProjects(req, res, next) {
	logger.log({
		message:'Account(s) get called.',
		func:'get', obj:'AccountCtrl'
	});
  if(!req.params.username){
    return res.status(400).send('Username is required to get projects');
  }
  const { username } = req.params;
	logger.debug({
		message:'Get account called with username.',
		username, func:'get', obj:'AccountCtrl'
	});
  findByUsername(username).then(account => {
    logger.info({
  		message:'Account found.',
  		account, func:'getProjects', obj:'AccountCtrl'
  	});
    findProjectsByUserId(account.id).then(projectsList => {
      logger.info({
    		message:'Projects list found.', func:'getProjects', obj:'AccountCtrl'
    	});
      res.json(projectsList);
    }, error => {
      logger.error({
    		message:'Error getting projects by id.', error,
    		func:'getProjects', obj:'AccountCtrl'
    	});
      res.status(400).send('Error getting projects.');
    });
  }, error => {
    logger.error({
      message:'Error find account by username.', username, error,
      func:'getProjects', obj:'AccountCtrl'
    });
    res.status(400).send('Error finding account');
  });
};
