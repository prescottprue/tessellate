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

var _authrocket = require('authrocket');

var _authrocket2 = _interopRequireDefault(_authrocket);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var authRocketEnabled = _default2.default.authRocket ? _default2.default.authRocket.enabled : false; /**
                                                                                                      * @description Authentication controller
                                                                                                      */

var authrocket = new _authrocket2.default();
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
 *       "name": "John",
 *       "title": "Doe",
 *     	 "role":"admin",
 *     }
 *
 */
function signup(req, res, next) {
	_logger2.default.log({
		description: 'Signup request.', body: req.body,
		func: 'signup', obj: 'AuthCtrls'
	});
	//Check for username or email
	if (!(0, _lodash.has)(req.body, "username") && !(0, _lodash.has)(req.body, "email")) {
		return res.status(400).json({
			code: 400,
			message: "Username or Email required to signup"
		});
	}
	var query = undefined;
	if (authRocketEnabled) {
		authrocket.signup(req.body).then(function (signupRes) {
			_logger2.default.log({
				description: 'Successfully signed up through authrocket.',
				response: signupRes, func: 'signup', obj: 'AuthCtrls'
			});
			//TODO: Record user within internal auth system
			res.send(signupRes);
		}, function (err) {
			_logger2.default.error({
				description: 'Error signing up through auth rocket.',
				error: err, func: 'signup', obj: 'AuthCtrls'
			});
			res.send(err);
		});
	} else {
		//Basic Internal Signup
		if ((0, _lodash.has)(req.body, "username")) {
			query = _user.User.findOne({ "username": req.body.username }); // find using username field
		} else {
				query = _user.User.findOne({ "email": req.body.email }); // find using email field
			}
		query.then(function (result) {
			if (result) {
				//Matching user already exists
				// TODO: Respond with a specific error code
				return res.status(400).send('User with this information already exists.');
			}
			//user does not already exist
			//Build user data from request
			var user = new _user.User(req.body);
			// TODO: Start a session with new user
			user.createWithPass(req.body.password).then(function (newUser) {
				res.send(newUser);
			}, function (err) {
				res.status(500).json({
					code: 500,
					message: 'Error hashing password',
					error: err
				});
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Error querying for user.',
				error: err, func: 'signup', obj: 'AuthCtrl'
			});
			res.status(500).send('Error querying for user.');
		});
	}
};

/**
 * @api {post} /login Login
 * @apiDescription Login and start a new session.
 * @apiName Login
 * @apiGroup Auth
 *
 * @apiParam {Number} id Users unique ID.
 * @apiParam {String} username Username of user to login as. Email must be provided if username is not.
 * @apiParam {String} [email] Email of user to login as. Can be used instead of username.
 * @apiParam {String} password Password of user to login as.
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
	var query = undefined;
	if (!(0, _lodash.has)(req.body, "username") && !(0, _lodash.has)(req.body, "email") || !(0, _lodash.has)(req.body, "password")) {
		return res.status(400).send("Username/Email and password required to login");
	}
	var loginData = { password: req.body.password };
	if ((0, _lodash.has)(req.body, 'username')) {
		if (req.body.username.indexOf('@') !== -1) {
			loginData.email = req.body.username;
		} else {
			loginData.username = req.body.username;
		}
	}
	if (authRocketEnabled) {
		//Authrocket login
		//Remove email to avoid Auth Rocket error
		if ((0, _lodash.has)(loginData, 'email')) {
			delete loginData.email;
		}
		if (!(0, _lodash.has)(req.body, 'username')) {
			return res.status(400).send('Username is required to login.');
		}
		_logger2.default.log({
			description: 'calling auth rocket with:',
			data: loginData, func: 'login', obj: 'AuthCtrls'
		});
		authrocket.login(loginData).then(function (loginRes) {
			_logger2.default.log({
				description: 'Successfully logged in through authrocket.',
				func: 'login', obj: 'AuthCtrls'
			});
			//TODO: Record login within internal auth system
			//TODO: Return user along with token data
			if (loginRes.token) {
				var _token = _jsonwebtoken2.default.decode(loginRes.token);
				_logger2.default.log({
					description: 'token', token: _token,
					func: 'login', obj: 'AuthCtrls'
				});
				if (!process.env.AUTHROCKET_JWT_SECRET) {
					_logger2.default.error({
						description: 'Authrocket secret not available to verify token',
						func: 'login', obj: 'AuthCtrls'
					});
				} else {
					var _verify = _jsonwebtoken2.default.verify(loginRes.token, process.env.AUTHROCKET_JWT_SECRET);
					_logger2.default.log({
						description: 'verify', verify: _verify,
						func: 'login', obj: 'AuthCtrls'
					});
				}
			}
			var user = { username: token.un, name: token.n, groups: token.m || [] };
			//Convert groups list to object from token if org/group data exists
			if (user.groups.length >= 1 && user.groups[0].o) {
				user.groups = user.groups.map(function (group) {
					return { name: group.o, id: group.oid };
				});
			}
			var response = { user: user, token: loginRes.token };
			res.send(response);
		}, function (err) {
			_logger2.default.error({
				description: 'Error logging in through auth rocket.',
				error: err, func: 'login', obj: 'AuthCtrls'
			});
			res.status(400).send('Invalid Credentials');
		});
	} else {
		//Basic Internal login
		if ((0, _lodash.has)(loginData, 'username')) {
			query = _user.User.findOne({ 'username': loginData.username }).populate({ path: 'groups', select: 'name' }).select({ __v: 0, createdAt: 0, updatedAt: 0 }); // find using username field
		} else {
				query = _user.User.findOne({ 'email': loginData.email }).populate({ path: 'groups', select: 'name' }).select({ __v: 0, createdAt: 0, updatedAt: 0 }); // find using email field
			}
		query.then(function (currentUser) {
			if (!currentUser) {
				_logger2.default.error({
					description: 'User not found.',
					func: 'login', obj: 'AuthCtrl'
				});
				return res.status(409).send('User not found.');
			}
			currentUser.login(req.body.password).then(function (loginRes) {
				_logger2.default.log({
					description: 'Login Successful.',
					func: 'login', obj: 'AuthCtrl'
				});
				res.send(loginRes);
			}, function (err) {
				//TODO: Handle wrong password
				_logger2.default.error({
					description: 'Login Error.', error: err,
					func: 'login', obj: 'AuthCtrl'
				});
				res.status(400).send('Error logging in.');
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Login error', error: err,
				func: 'login', obj: 'AuthCtrl'
			});
			res.status(500).send('Error logging in.');
		});
	}
};

/**
 * @api {post} /logout Logout
 * @apiDescription Logout the currently logged in user and invalidate their token.
 * @apiName Logout
 * @apiGroup Auth
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "Logout successful"
 *     }
 *
 */
function logout(req, res, next) {
	//TODO:Invalidate token
	_logger2.default.log({
		description: 'Logout called.',
		authRocketEnabled: authRocketEnabled,
		body: req.body,
		func: 'logout', obj: 'AuthCtrl'
	});
	if (authRocketEnabled) {
		var token;
		if (req.body && req.body.token) {
			token = req.body.token;
		} else if (req.headers && (req.headers.authorization || req.header('Authorization'))) {
			_logger2.default.log({
				description: 'Getting token from headers.',
				headers: req.headers, func: 'logout', obj: 'AuthCtrl'
			});
			var header = req.headers.authorization || req.header('Authorization');
			token = header.replace("Bearer ", "");
		} else {
			_logger2.default.warn({
				description: 'Token required to logout.',
				func: 'logout', obj: 'AuthCtrl'
			});
			return res.status(401).send('Token required to logout.');
		}
		_logger2.default.log({
			description: 'Attempting log out through authrocket.',
			token: token, func: 'logout', obj: 'AuthCtrl'
		});
		authrocket.logout(token).then(function (logoutRes) {
			_logger2.default.log({
				description: 'Successfully logged out through authrocket.',
				response: logoutRes, func: 'logout', obj: 'AuthCtrl'
			});
			res.send({ message: 'Logout successful.' });
		}, function (err) {
			_logger2.default.error({
				description: 'Error ending session.', error: err,
				func: 'logout', obj: 'AuthCtrl'
			});
			res.status(500).send(err);
		});
	} else {
		//TODO: Handle user not being in req.user
		var user = new _user.User(req.user);
		user.endSession().then(function () {
			_logger2.default.log({
				description: 'Successfully ended session',
				func: 'logout', obj: 'AuthCtrl'
			});
			res.send('Logout successful.');
		}, function (err) {
			_logger2.default.error({
				description: 'Error ending session.', error: err,
				func: 'logout', obj: 'AuthCtrl'
			});
			res.status(500).send({ message: 'Error ending session.' });
		});
	}
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