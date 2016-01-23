/**
 * @description User controller functions
 */
import _ from 'lodash';
import { keys } from 'lodash';
import logger from '../utils/logger';
import { User } from '../models/user';
import util from 'util';
import multer from 'multer';

/**
 * @api {get} /users Get User(s)
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
export function get(req, res, next) {
	logger.log({
		message:'User(s) get called.',
		func:'get', obj:'UserCtrl'
	});
	var query = User.find({}, {username:1, email:1});
	if(_.has(req, 'params') && _.has(req.params, "username")){ //Get data for a specific user
		logger.log({
			message:'Get user called with username.',
			username:req.params.username,
			func:'get', obj:'UserCtrl'
		});
		query = User.findOne({username:req.params.username}, {password:0, __v:0});
	}
	query.then((userData) => {
		if(!userData){
			logger.log({
				message:'No user data',
				func:'get', obj:'UserCtrl'
			});
			return res.send(400).send('User not found.');
		} else {
			res.send(userData);
		}
	}, (err) => {
		logger.error({
			message:'Error finding user data.',
			error:err, func:'get', obj:'UserCtrl'
		});
		return res.status(500).send('Error getting user.');
	});
};
/**
 * @api {post} /users Add User
 * @apiDescription Add a new user.
 * @apiName AddUser
 * @apiGroup User
 *
 * @apiParam {String} username Username of user
 * @apiParam {String} email Email of user
 * @apiParam {String} password Password of user
 * @apiParam {String} name Name of user
 * @apiParam {String} title Title of user
 * @apiParam {Boolean} tempPassword Whether or not to set a temporary password (Also set if there is no password param)
 *
 * @apiSuccess {Object} userData Object containing newly created users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"user",
 *     }
 *
 */
export function add(req, res, next) {
	//Query for existing user with same _id
	var query;
	if(!_.has(req.body, "username") && !_.has(req.body, "email")){
		return res.status(400).json({code:400, message:"Username or Email required to add a new user"});
	}
	if(_.has(req.body, "username")){
		query = User.findOne({"username":req.body.username}); // find using username field
	} else {
		query = User.findOne({"email":req.body.email}); // find using email field
	}
	query.then(() =>  {
		var user = new User(req.body);
		user.save().then((newUser) => {
			//TODO: Set temporary password
			res.json(newUser);
		}, (err) => {
			logger.error({description: 'Error creating new user.', error: err, func: 'add', obj: 'UsersCtrl'});
			res.status(500).send('User could not be added.');
		});
	}, (err) => {
		//next() //Pass error on
		logger.error({description: 'Error creating new user.', error: err, func: 'add', obj: 'UsersCtrl'});
		res.status(500).send('User could not be added.');
	});
};
/**
 * @api {put} /users Update User
 * @apiDescription Update a user.
 * @apiName UpdateUser
 * @apiGroup User
 *
 * @apiParam {String} username Email of user
 * @apiParam {String} password Password of user
 * @apiParam {String} name Name of user
 * @apiParam {String} title Title of user
 * @apiParam {String} role Role of user (admin, user)
 *
 * @apiSuccess {Object} userData Object containing updated users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"user",
 *     }
 *
 */
export function update(req, res, next) {
	logger.log({
		description: 'Update user called.', body: req.body,
		params: req.params
	});
	if(_.has(req.params, "username")){
		User.findOne({username:req.params.username}, (err, user) => {
			if(err){
				logger.error({description: 'Error finding user.', username: req.params.username,error: err, func:'update', obj:'UsersCtrl'});
				res.status(500).send('Error finding user.');
			} else if(!user){
				res.status(400).send('User not found.');
			} else {
				//Select only valid parameters
				var updateData = _.pick(req.body, ['username', 'email', 'name', 'frontend', 'backend', 'groups', 'sessionId', 'password']);
				//Apply each updated value to user.
				_.each(_.keys(updateData), (key) => {
					user[key] = updateData[key];
				});
				logger.log('user before save:', user);
				user.saveNew().then((savedUser) => {
					logger.log({description: 'User saved successfully.'});
					res.json(savedUser);
				}, (err) => {
					logger.error({description: 'Error saving user.', error: err, func: 'update', obj: 'UsersCtrl'});
					res.status(500).send('Error updating user.');
				});
			}
		});
		// User.update({username:req.params.username}, req.body, {upsert:false},  (err, numberAffected, result)  => {
		// 	if (err) { return next(err); }
		// 	//TODO: respond with updated data instead of passing through req.body
		// 	res.json(req.body);
		// });
	} else {
		res.status(400).send({message:'User username is required to update.'});
	}
};
/**
 * @api {delete} /user/:id Delete User
 * @apiDescription Delete a user.
 * @apiName DeleteUser
 * @apiGroup User
 *
 * @apiParam {String} username Email of user
 *
 * @apiSuccess {Object} userData Object containing deleted users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"user",
 *     }
 *
 */
export function del(req, res, next) {
	// var urlParams = url.parse(req.url, true).query;
	if(_.has(req.params, "username")){
		var query = User.findOneAndRemove({'username':req.params.username}); // find and delete using id field
		query.then((result) => {
			logger.log('User deleted successfully:');
			res.json(result);
		}, (err) => {
			logger.error('User could not be deleted:', err);
			res.status(500).send({message:'User cound not be deleted'});
		});
	}
};
/**
 * @api {get} /user/:id Search Users
 * @apiDescription Search Users.
 * @apiName SearchUser
 * @apiGroup User
 *
 * @apiParam {String} searchQuery String to search through users with
 *
 * @apiSuccess {Object} userData Object containing deleted users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"user",
 *     }
 *
 */
export function search(req, res, next) {
	// var urlParams = url.parse(req.url, true).query;
	var usernameQuery = createUserQuery('username', req.params.searchQuery);
	var emailQuery = createUserQuery('email', req.params.searchQuery);
	//Search usernames
	usernameQuery.then((usernameResults) => {
		if(_.isArray(usernameResults) && usernameResults.length == 0){
			//Search emails
			emailQuery.then((emailResults) => {
				logger.log('User search by email resulted:', emailResults);
				res.json(emailResults);
			}, (err) => {
				res.status(500).send({message:'User cound not be found'});
			});
		} else {
			logger.log('User search by username resulted:', usernameResults);
			res.json(usernameResults);
		}
	}, (err) => {
		logger.error({description: 'Error searching for user.', error: err, func: 'search', obj: 'UsersCtrls'});
		res.status(500).send({message:'User cound not be found'});
	});
};
/**
 * @api {get} /user/:id Search Users
 * @apiDescription Search Users.
 * @apiName SearchUser
 * @apiGroup User
 *
 * @apiParam {String} searchQuery String to search through users with
 *
 * @apiSuccess {Object} userData Object containing deleted users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"user",
 *     }
 *
 */
export function uploadImage(req, res, next) {
	logger.log({
		description: 'Upload image request.',
		func: 'uploadImage', obj: 'UsersCtrls'
	});
	if (!req.params || !req.params.username) {
		logger.error({
			description: 'Username is required to upload an image.',
			func: 'uploadImage', obj: 'UsersCtrls'
		});
		return res.status(400).send('Username is required to upload image.');
	}
	let findObj = {};
	if(!req.params.username.indexOf('@')){
		findObj.email = req.params.username;
	} else {
		findObj.username = req.params.username;
	}
	let q = User.findOne(findObj, {email:1, name:1, username:1, image:1});
	//Search usernames
	q.then(user => {
		//TODO:
		logger.info({
			description: 'User found.', user: user,
			func: 'uploadImage', obj: 'UsersCtrls'
		});
		user.uploadImage(req.file).then(updatedUser => {
			logger.info({
				description: 'Image successfully uploaded to user.', user: updatedUser,
				func: 'uploadImage', obj: 'UsersCtrls'
			});
			res.send(updatedUser);
		}, err => {
			logger.error({
				description: 'Error uploading image to user.', error: err,
				func: 'uploadImage', obj: 'UsersCtrls'
			});
			res.status(500).send('Error uploading image.');
		});
	}, err => {
		logger.error({
			description: 'Error uploading user image.', error: err,
			func: 'uploadImage', obj: 'UsersCtrls'
		});
		res.status(500).send('User cound not be found');
	});
};

/**
 * Create a user query based on provided key and value
 */
export function createUserQuery(key, val){
	var queryArr = _.map(val.split(' '), (qr) => {
    var queryObj = {};
    queryObj[key] = new RegExp(_.escapeRegExp(qr), 'i');
    return queryObj;
  });
  var find = {$or: queryArr};
	return User.find(find, {email:1, name:1, username:1}); // find and delete using id field
}
