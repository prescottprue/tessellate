'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.get = get;
exports.add = add;
exports.update = update;
exports.del = del;
exports.search = search;
exports.uploadImage = uploadImage;
exports.createUserQuery = createUserQuery;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _user = require('../models/user');

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
/**
 * @description User controller functions
 */
function get(req, res, next) {
	_logger2.default.log({
		message: 'User(s) get called.',
		func: 'get', obj: 'UserCtrl'
	});
	var query = _user.User.find({}, { username: 1, email: 1 });
	if (_lodash2.default.has(req, 'params') && _lodash2.default.has(req.params, "username")) {
		//Get data for a specific user
		_logger2.default.log({
			message: 'Get user called with username.',
			username: req.params.username,
			func: 'get', obj: 'UserCtrl'
		});
		query = _user.User.findOne({ username: req.params.username }, { password: 0, __v: 0 });
	}
	query.then(function (userData) {
		if (!userData) {
			_logger2.default.log({
				message: 'No user data',
				func: 'get', obj: 'UserCtrl'
			});
			return res.send(400).send('User not found.');
		} else {
			res.send(userData);
		}
	}, function (err) {
		_logger2.default.error({
			message: 'Error finding user data.',
			error: err, func: 'get', obj: 'UserCtrl'
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
function add(req, res, next) {
	//Query for existing user with same _id
	var query;
	if (!_lodash2.default.has(req.body, "username") && !_lodash2.default.has(req.body, "email")) {
		return res.status(400).json({ code: 400, message: "Username or Email required to add a new user" });
	}
	if (_lodash2.default.has(req.body, "username")) {
		query = _user.User.findOne({ "username": req.body.username }); // find using username field
	} else {
			query = _user.User.findOne({ "email": req.body.email }); // find using email field
		}
	query.then(function () {
		var user = new _user.User(req.body);
		user.save().then(function (newUser) {
			//TODO: Set temporary password
			res.json(newUser);
		}, function (err) {
			_logger2.default.error({ description: 'Error creating new user.', error: err, func: 'add', obj: 'UsersCtrl' });
			res.status(500).send('User could not be added.');
		});
	}, function (err) {
		//next() //Pass error on
		_logger2.default.error({ description: 'Error creating new user.', error: err, func: 'add', obj: 'UsersCtrl' });
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
function update(req, res, next) {
	_logger2.default.log({
		description: 'Update user called.', body: req.body,
		params: req.params
	});
	if (_lodash2.default.has(req.params, "username")) {
		_user.User.findOne({ username: req.params.username }, function (err, user) {
			if (err) {
				_logger2.default.error({ description: 'Error finding user.', username: req.params.username, error: err, func: 'update', obj: 'UsersCtrl' });
				res.status(500).send('Error finding user.');
			} else if (!user) {
				res.status(400).send('User not found.');
			} else {
				//Select only valid parameters
				var updateData = _lodash2.default.pick(req.body, ['username', 'email', 'name', 'frontend', 'backend', 'groups', 'sessionId', 'password']);
				//Apply each updated value to user.
				_lodash2.default.each(_lodash2.default.keys(updateData), function (key) {
					user[key] = updateData[key];
				});
				_logger2.default.log('user before save:', user);
				user.saveNew().then(function (savedUser) {
					_logger2.default.log({ description: 'User saved successfully.' });
					res.json(savedUser);
				}, function (err) {
					_logger2.default.error({ description: 'Error saving user.', error: err, func: 'update', obj: 'UsersCtrl' });
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
			res.status(400).send({ message: 'User username is required to update.' });
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
function del(req, res, next) {
	// var urlParams = url.parse(req.url, true).query;
	if (_lodash2.default.has(req.params, "username")) {
		var query = _user.User.findOneAndRemove({ 'username': req.params.username }); // find and delete using id field
		query.then(function (result) {
			_logger2.default.log('User deleted successfully:');
			res.json(result);
		}, function (err) {
			_logger2.default.error('User could not be deleted:', err);
			res.status(500).send({ message: 'User cound not be deleted' });
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
function search(req, res, next) {
	// var urlParams = url.parse(req.url, true).query;
	var usernameQuery = createUserQuery('username', req.params.searchQuery);
	var emailQuery = createUserQuery('email', req.params.searchQuery);
	//Search usernames
	usernameQuery.then(function (usernameResults) {
		if (_lodash2.default.isArray(usernameResults) && usernameResults.length == 0) {
			//Search emails
			emailQuery.then(function (emailResults) {
				_logger2.default.log('User search by email resulted:', emailResults);
				res.json(emailResults);
			}, function (err) {
				res.status(500).send({ message: 'User cound not be found' });
			});
		} else {
			_logger2.default.log('User search by username resulted:', usernameResults);
			res.json(usernameResults);
		}
	}, function (err) {
		_logger2.default.error({ description: 'Error searching for user.', error: err, func: 'search', obj: 'UsersCtrls' });
		res.status(500).send({ message: 'User cound not be found' });
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
function uploadImage(req, res, next) {
	_logger2.default.log({
		description: 'Upload image request.',
		func: 'uploadImage', obj: 'UsersCtrls'
	});
	if (!req.params || !req.params.username) {
		_logger2.default.error({
			description: 'Username is required to upload an image.',
			func: 'uploadImage', obj: 'UsersCtrls'
		});
		return res.status(400).send('Username is required to upload image.');
	}
	var findObj = {};
	if (!req.params.username.indexOf('@')) {
		findObj.email = req.params.username;
	} else {
		findObj.username = req.params.username;
	}
	var q = _user.User.findOne(findObj, { email: 1, name: 1, username: 1, image: 1 });
	//Search usernames
	q.then(function (user) {
		//TODO:
		_logger2.default.info({
			description: 'User found.', user: user,
			func: 'uploadImage', obj: 'UsersCtrls'
		});
		user.uploadImage(req.file).then(function (updatedUser) {
			_logger2.default.info({
				description: 'Image successfully uploaded to user.', user: updatedUser,
				func: 'uploadImage', obj: 'UsersCtrls'
			});
			res.send(updatedUser);
		}, function (err) {
			_logger2.default.error({
				description: 'Error uploading image to user.', error: err,
				func: 'uploadImage', obj: 'UsersCtrls'
			});
			res.status(500).send('Error uploading image.');
		});
	}, function (err) {
		_logger2.default.error({
			description: 'Error uploading user image.', error: err,
			func: 'uploadImage', obj: 'UsersCtrls'
		});
		res.status(500).send('User cound not be found');
	});
};

/**
 * Create a user query based on provided key and value
 */
function createUserQuery(key, val) {
	var queryArr = _lodash2.default.map(val.split(' '), function (qr) {
		var queryObj = {};
		queryObj[key] = new RegExp(_lodash2.default.escapeRegExp(qr), 'i');
		return queryObj;
	});
	var find = { $or: queryArr };
	return _user.User.find(find, { email: 1, name: 1, username: 1 }); // find and delete using id field
}