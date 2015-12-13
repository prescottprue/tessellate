'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.signup = signup;
exports.login = login;
exports.logout = logout;
exports.verify = verify;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _account = require('../models/account');

var _session = require('../models/session');

var _authrocket = require('authrocket');

var _authrocket2 = _interopRequireDefault(_authrocket);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _default = require('../config/default');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

console.log('config in auth:', _default.config); /**
                                                  * @description Authentication controller
                                                  */

var authRocketEnabled = _default.config.authRocket ? _default.config.authRocket.enabled : false;
var authrocket = new _authrocket2.default();

/**
 * @api {post} /signup Sign Up
 * @apiDescription Sign up a new account and start a session as that new account
 * @apiName Signup
 * @apiGroup Auth
 *
 * @apiParam {Number} id Accounts unique ID.
 * @apiParam {String} username Accountname of account to signup as.
 * @apiParam {String} [title] Title of account to signup as.
 * @apiParam {String} email Email of account to signup as.
 * @apiParam {String} password Password of account to signup as.
 *
 * @apiSuccess {Object} accountData Object containing accounts data.
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
	var query;
	_logger2.default.log({
		description: 'Signup request.', body: req.body,
		func: 'signup', obj: 'AuthCtrls'
	});
	//Check for username or email
	if (!_lodash2.default.has(req.body, "username") && !_lodash2.default.has(req.body, "email")) {
		return res.status(400).json({
			code: 400,
			message: "Username or Email required to signup"
		});
	}
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
		if (_lodash2.default.has(req.body, "username")) {
			query = _account.Account.findOne({ "username": req.body.username }); // find using username field
		} else {
				query = _account.Account.findOne({ "email": req.body.email }); // find using email field
			}
		query.then(function (result) {
			if (result) {
				//Matching account already exists
				// TODO: Respond with a specific error code
				return res.status(400).send('Account with this information already exists.');
			}
			//account does not already exist
			//Build account data from request
			var account = new _account.Account(req.body);
			// TODO: Start a session with new account
			account.createWithPass(req.body.password).then(function (newAccount) {
				res.send(newAccount);
			}, function (err) {
				res.status(500).json({
					code: 500,
					message: 'Error hashing password',
					error: err
				});
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Error querying for account.',
				error: err, func: 'signup', obj: 'AuthCtrl'
			});
			res.status(500).send('Error querying for account.');
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
 *       account:{
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
	var query;
	if (!_lodash2.default.has(req.body, "username") && !_lodash2.default.has(req.body, "email") || !_lodash2.default.has(req.body, "password")) {
		return res.status(400).send("Username/Email and password required to login");
	}
	var loginData = { password: req.body.password };
	console.log('login request', req.body);
	if (_lodash2.default.has(req.body, 'username')) {
		if (req.body.username.indexOf('@') !== -1) {
			loginData.email = req.body.username;
		} else {
			loginData.username = req.body.username;
		}
	}
	if (authRocketEnabled) {
		//Authrocket login
		//Remove email to avoid Auth Rocket error
		if (_lodash2.default.has(loginData, 'email')) {
			delete loginData.email;
		}
		if (!_lodash2.default.has(req.body, 'username')) {
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
			//TODO: Return account along with token data
			if (loginRes.token) {
				var token = _jsonwebtoken2.default.decode(loginRes.token);
				_logger2.default.log({
					description: 'token', token: token,
					func: 'login', obj: 'AuthCtrls'
				});
				if (!process.env.AUTHROCKET_JWT_SECRET) {
					_logger2.default.error({
						description: 'Authrocket secret not available to verify token',
						func: 'login', obj: 'AuthCtrls'
					});
				} else {
					var verify = _jsonwebtoken2.default.verify(loginRes.token, process.env.AUTHROCKET_JWT_SECRET);
					_logger2.default.log({
						description: 'verify', verify: verify,
						func: 'login', obj: 'AuthCtrls'
					});
				}
			}
			var account = { username: token.un, name: token.n, groups: token.m || [] };
			//Convert groups list to object from token if org/group data exists
			if (account.groups.length >= 1 && account.groups[0].o) {
				account.groups = account.groups.map(function (group) {
					return { name: group.o, id: group.oid };
				});
			}
			var response = { account: account, token: loginRes.token };
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
		if (_lodash2.default.has(loginData, 'username')) {
			query = _account.Account.findOne({ 'username': loginData.username }).populate({ path: 'groups', select: 'name' }).select({ __v: 0, createdAt: 0, updatedAt: 0 }); // find using username field
		} else {
				query = _account.Account.findOne({ 'email': loginData.email }).populate({ path: 'groups', select: 'name' }).select({ __v: 0, createdAt: 0, updatedAt: 0 }); // find using email field
			}
		query.then(function (currentAccount) {
			if (!currentAccount) {
				_logger2.default.error({
					description: 'Account not found.',
					func: 'login', obj: 'AuthCtrl'
				});
				return res.status(409).send('Account not found.');
			}
			console.log('account found', currentAccount);
			currentAccount.login(req.body.password).then(function (loginRes) {
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
 * @apiDescription Logout the currently logged in account and invalidate their token.
 * @apiName Logout
 * @apiGroup Auth
 *
 * @apiSuccess {Object} accountData Object containing accounts data.
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
		var account = new _account.Account(req.user);
		account.endSession().then(function () {
			_logger2.default.log({
				description: 'Successfully ended session',
				func: 'logout', obj: 'AuthCtrl'
			});
			res.send({ message: 'Logout successful.' });
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
 * @api {put} /account Verify
 * @apiDescription Verify token and get matching account's data.
 * @apiName Verify
 * @apiGroup Auth
 *
 * @apiSuccess {Object} accountData Object containing accounts data.
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
	//TODO:Actually verify account instead of just returning account data
	// logger.log('verify request:', req.user);
	var query;
	if (req.user) {
		//Find by username in token
		if (_lodash2.default.has(req.user, "username")) {
			query = _account.Account.findOne({ username: req.user.username }).select({ password: 0, __v: 0, createdAt: 0, updatedAt: 0 });
		}
		//Find by username in token
		else {
				query = _account.Account.findOne({ email: req.user.email }).select({ password: 0, __v: 0, createdAt: 0, updatedAt: 0 });
			}
		query.then(function (result) {
			if (!result) {
				//Matching account already exists
				// TODO: Respond with a specific error code
				_logger2.default.error({ description: 'Account not found.', error: err, func: 'verify', obj: 'AuthCtrl' });
				return res.status(400).send('Account with this information does not exist.');
			}
			res.json(result);
		}, function (err) {
			_logger2.default.error({ description: 'Error querying for account', error: err, func: 'verify', obj: 'AuthCtrl' });
			return res.status(500).send('Unable to verify token.');
		});
	} else {
		_logger2.default.error({ description: 'Invalid auth token.', func: 'verify', obj: 'AuthCtrl' });
		res.status(401).json({ status: 401, message: 'Valid Auth token required to verify' });
	}
};