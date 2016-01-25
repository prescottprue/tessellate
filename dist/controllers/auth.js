'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.signup = signup;
exports.login = login;
exports.logout = logout;
exports.verify = verify;
exports.recover = recover;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _lodash = require('lodash');

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _user = require('../models/user');

var _session = require('../models/session');

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @api {post} /signup Sign Up
 * @apiDescription Sign up a new user and start a session as that new user
 * @apiName Signup
 * @apiGroup Auth
 *
 * @apiParam {Number} id Users unique ID.
 * @apiParam {String} username Username of user to signup as.
 * @apiParam {String} [title] Title of user to signup as.
 * @apiParam {String} email Email of user to signup as.
 * @apiParam {String} password Password of user to signup as.
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       user: {
 *         "name": "John Doe",
 *         "username": "someguy1",
 *     	   "email": "test@test.com",
 *       },
 *       token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InNjb3R0NSIsImdyb3VwcyI6W10sInNlc3Npb25JZCI6IjU2YTVhYTkxMWMxNjljYTgwZTQyOWE5ZSIsInVzZXJJZCI6IjU2YTVhYTkxMWMxNjljYTgwZTQyOWE5ZCIsImlhdCI6MTQ1MzY5NzY4MX0.USXvRAjcHj44amw_NqjcnVUMGQMB6R3efWpvC6HtCyY"
 *     }
 *
 */
/**
 * @description Authentication controller
 */
function signup(req, res, next) {
	_logger2.default.debug({
		description: 'Signup request.', func: 'signup', obj: 'AuthCtrls'
	});
	var _req$body = req.body;
	var username = _req$body.username;
	var email = _req$body.email;
	var name = _req$body.name;
	//Check for username or email

	if (!username || !email) {
		return res.status(400).json({
			code: 400,
			message: 'Username and Email are required to signup'
		});
	}
	var user = new _user.User({ username: username, email: email, name: name });
	// TODO: Start a session with new user
	user.signup(req.body).then(function (newUser) {
		_logger2.default.debug({
			description: 'New user created successfully.', newUser: newUser,
			func: 'signup', obj: 'AuthCtrls'
		});
		res.send(newUser);
	}, function (error) {
		_logger2.default.error({
			description: 'Error signing up.', error: error,
			func: 'signup', obj: 'AuthCtrls'
		});
		res.status(500).json(error);
	});
};

/**
 * @api {post} /login Login
 * @apiDescription Login and start a new session.
 * @apiName Login
 * @apiGroup Auth
 *
 * @apiParam {String} username - Username of user to login as. Email must be provided if username is not.
 * @apiParam {String} email - Email of user to login as. Can be used instead of username.
 * @apiParam {String} password - Users password
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       user:{
 *         name: "John Doe",
 *         username:"hackerguy1",
 *         title: "Front End Developer",
 *         role:"admin",
 *         createdAt:1438737438578
 *         updatedAt:1438737438578
 *       },
 *       token:'99qaisnuufa9suf9ue0hf2h'
 *     }
 *
 */
function login(req, res, next) {
	var _req$body2 = req.body;
	var username = _req$body2.username;
	var email = _req$body2.email;
	var password = _req$body2.password;
	var provider = _req$body2.provider;

	if (!username && !email || !password && !provider) {
		return res.status(400).json({
			message: 'Username/Email and password or provider info required to login'
		});
	}
	var findObj = {};
	if (username && (0, _lodash.isString)(username)) {
		findObj = username.indexOf('@') !== -1 ? { email: username } : { username: username };
	}
	if (email && (0, _lodash.isString)(email)) {
		findObj.email = email;
	}
	_logger2.default.debug({
		description: 'Searching for user to login as.', findObj: findObj,
		func: 'login', obj: 'AuthCtrl'
	});
	_user.User.findOne(findObj).populate({ path: 'groups', select: 'name' }).select({ __v: 0, createdAt: 0, updatedAt: 0 }).then(function (currentUser) {
		if (!currentUser) {
			_logger2.default.error({
				description: 'User not found.',
				func: 'login', obj: 'AuthCtrl'
			});
			return res.status(409).json({ message: 'User not found.' });
		}
		currentUser.login(password).then(function (loginRes) {
			_logger2.default.log({
				description: 'Login Successful.',
				func: 'login', obj: 'AuthCtrl'
			});
			res.json(loginRes);
		}, function (error) {
			//TODO: Handle wrong password
			_logger2.default.error({
				description: 'Login Error.', error: error,
				func: 'login', obj: 'AuthCtrl'
			});
			res.status(400).json({ message: 'Error logging in.' });
		});
	}, function (error) {
		_logger2.default.error({
			description: 'Login error', error: error,
			func: 'login', obj: 'AuthCtrl'
		});
		res.status(500).json({ message: 'Error logging in.' });
	});
};

/**
 * @api {post} /logout Logout
 * @apiDescription Logout the currently logged in user and invalidate  token.
 * @apiName Logout
 * @apiGroup Auth
 *
 * @apiSuccess {Object} userData Object containing success message
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "Logout successful"
 *     }
 *
 */
function logout(req, res, next) {
	//TODO: Invalidate token
	_logger2.default.debug({
		description: 'Logout called.',
		func: 'logout', obj: 'AuthCtrl'
	});
	//TODO: Handle user not being in req.user
	var user = new _user.User(req.user);
	user.endSession().then(function () {
		_logger2.default.info({
			description: 'Successfully ended session',
			func: 'logout', obj: 'AuthCtrl'
		});
		res.json({ message: 'Logout successful.' });
	}, function (error) {
		_logger2.default.error({
			description: 'Error ending session.', error: error,
			func: 'logout', obj: 'AuthCtrl'
		});
		res.status(500).json({ message: 'Error ending session.' });
	});
};

/**
 * @api {put} /user Verify
 * @apiDescription Verify token and get matching user's data.
 * @apiName Verify
 * @apiGroup Auth
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "John Doe",
 *       username:"hackerguy1",
 *       title: "Front End Developer",
 *       role:"admin",
 *       createdAt:1438737438578
 *       updatedAt:1438737438578
 *     }
 *
 */
function verify(req, res, next) {
	//TODO:Actually verify user instead of just returning user data
	// logger.log('verify request:', req.user);
	if (!req.user) {
		_logger2.default.error({
			description: 'Invalid auth token.',
			func: 'verify', obj: 'AuthCtrl'
		});
		res.status(401).send('Valid Auth token required to verify');
	}
	//Find by username in token
	var findObj = {};
	if ((0, _lodash.has)(req.user, "username")) {
		findObj.username = req.user.username;
	} else {
		findObj.email = req.user.email;
	}
	var query = _user.User.findOne(findObj).select({ password: 0, __v: 0, createdAt: 0, updatedAt: 0 });
	query.then(function (result) {
		if (!result) {
			//Matching user already exists
			// TODO: Respond with a specific error code
			_logger2.default.error({
				description: 'User not found.',
				error: err, func: 'verify', obj: 'AuthCtrl'
			});
			return res.status(400).send('User with this information does not exist.');
		}
		res.json(result);
	}, function (err) {
		_logger2.default.error({
			description: 'Error querying for user',
			error: err, func: 'verify', obj: 'AuthCtrl'
		});
		return res.status(500).send('Unable to verify token.');
	});
};
/**
 * @api {post} /recover Recover
 * @apiDescription Recover an user though email
 * @apiName Recover
 * @apiGroup Auth
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "John Doe",
 *       username:"hackerguy1",
 *       title: "Front End Developer",
 *       role:"admin",
 *       createdAt:1438737438578
 *       updatedAt:1438737438578
 *     }
 *
 */
function recover(req, res, next) {
	_logger2.default.debug({
		description: 'Recover request recieved.',
		func: 'recover', obj: 'AuthCtrl'
	});
	if (!req.body || !req.body.username && !req.body.email) {
		_logger2.default.error({
			description: 'Username or email required to recover user.',
			func: 'recover', obj: 'AuthCtrl'
		});
		res.send('Username or email required to recover user.');
	}
	var findObj = {};
	if ((0, _lodash.has)(req.body, "username")) {
		findObj.username = req.body.username;
	} else {
		findObj.email = req.body.email;
	}
	_logger2.default.log({
		description: 'Find object built.', findObj: findObj,
		func: 'recover', obj: 'AuthCtrl'
	});
	var query = _user.User.findOne(findObj).select({ password: 0, __v: 0, createdAt: 0, updatedAt: 0 });
	query.then(function (user) {
		if (!user) {
			// TODO: Respond with a specific error code
			_logger2.default.error({
				description: 'User not found.',
				func: 'verify', obj: 'AuthCtrl'
			});
			return res.status(400).send('User with this information does not exist.');
		}
		//TODO: Email user
		_logger2.default.info({
			description: 'User found. Sending email',
			func: 'verify', obj: 'AuthCtrl'
		});
		user.sendRecoveryEmail().then(function () {
			res.json({ message: 'Email sent', status: 'SUCCESS' });
		}, function (error) {
			res.status(500).send('Error sending recovery email');
		});
	}, function (err) {
		_logger2.default.error({
			description: 'Error querying for user',
			err: err, func: 'verify', obj: 'AuthCtrl'
		});
		return res.status(500).send('Unable to verify token.');
	});
};