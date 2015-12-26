'use strict';

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _db = require('./../utils/db');

var _db2 = _interopRequireDefault(_db);

var _session = require('./session');

var _group = require('./group');

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _bcryptNodejs = require('bcrypt-nodejs');

var _bcryptNodejs2 = _interopRequireDefault(_bcryptNodejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Account Schema Object

//External Libs
var AccountSchema = new _mongoose2.default.Schema({
	username: { type: String, index: true, unique: true },
	name: { type: String },
	email: { type: String, index: true, unique: true },
	title: { type: String },
	password: { type: String },
	sessionId: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Session' },
	application: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Application' },
	groups: [{ type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Group' }],
	authrocketId: { type: String },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
}, {
	toJSON: { virtuals: true }
});
/**
 * @description Set collection name to 'account'
 */
//Internal Config/Utils/Classes
AccountSchema.set('collection', 'accounts');
/*
 * Groups virtual to return names
 */
// AccountSchema.virtual('groupNames')
// .get(function (){
// 	// return "test";
// 	var self = this;
// 	var namesArray = _.map(self.groups, function(group){
// 		if(_.isString(group)){
// 			logger.log('was a string');
// 			group = JSON.parse(group);
// 		}
// 		logger.log('group:', group);
// 		if(_.has(group, 'name')){
// 			return group.name;
// 		} else {
// 			logger.log('but it does not exist');
// 			return group;
// 		}
// 	});
// 	logger.log('names array:', namesArray);
// 	return namesArray;
// });
AccountSchema.virtual('id').get(function () {
	return this._id;
});
// .set( (id) => {
// 	return this._id = id;
// });
AccountSchema.methods = {
	/**
  * @function strip
  * @description Remove values that should not be sent
  */
	strip: function strip() {
		var strippedAccount = _lodash2.default.omit(this.toJSON(), ["password", "__v", '$$hashKey']);
		_logger2.default.log({
			description: 'Strip called.', strippedAccount: strippedAccount,
			func: 'strip', obj: 'Account'
		});
		return _lodash2.default.omit(this.toJSON(), ["password", "__v", '$$hashKey']);
	},
	/**
  * @function tokenData
  * @description Get data used within token
  */
	tokenData: function tokenData() {
		var data = _lodash2.default.pick(this.toJSON(), ["username", "groups", "sessionId", "groupNames"]);
		_logger2.default.log({
			description: 'Token data selected.',
			func: 'tokenData', obj: 'Account'
		});
		data.accountId = this._id;
		return data;
	},
	/**
  * @function generateToken
  * @description Encode a JWT with account info
  */
	generateToken: function generateToken(session) {
		_logger2.default.log({
			description: 'Generate token called.',
			func: 'generateToken', obj: 'Account'
		});
		try {
			var tokenData = this.tokenData();
			var token = _jsonwebtoken2.default.sign(tokenData, _default2.default.jwtSecret);
			_logger2.default.log({
				description: 'Token generated.',
				func: 'generateToken', obj: 'Account'
			});
			return token;
		} catch (err) {
			_logger2.default.error({
				description: 'Error generating token.',
				error: err, func: 'generateToken', obj: 'Account'
			});
		}
	},
	/**
  * @function login
  * @description Log account in based on password attempt
  * @param {string} password - Attempt at password with which to login to account.
  */
	login: function login(passwordAttempt) {
		_logger2.default.log({
			description: 'Login called.',
			func: 'login', obj: 'Account'
		});
		//Check password
		var self = this; //this contexts were causing errors even though => should pass context automatically
		if (!this.password) {
			_logger2.default.warn({
				description: 'Original query did not include password. Consider revising.',
				func: 'login', obj: 'Account'
			});
			return this.model('Account').find({ _id: this._id }).then(self.login(passwordAttempt));
		}
		return this.comparePassword(passwordAttempt).then(function () {
			_logger2.default.log({
				description: 'Provided password matches.',
				func: 'login', obj: 'Account'
			});
			//Start new session
			return self.startSession().then(function (sessionInfo) {
				_logger2.default.log({
					description: 'Session started successfully.',
					sessiontInfo: sessionInfo,
					func: 'login', obj: 'Account'
				});
				//Create Token
				self.sessionId = sessionInfo._id;
				var token = self.generateToken(sessionInfo);
				return { token: token, account: self.strip() };
			}, function (err) {
				_logger2.default.error({
					description: 'Error starting session.',
					error: err, func: 'login', obj: 'Account'
				});
				return Promise.reject(err);
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Error comparing password.',
				attempt: passwordAttempt, error: err,
				func: 'login', obj: 'Account'
			});
			return Promise.reject(err);
		});
	},
	/**
  * @function login
  * @description Log account out (end session and invalidate token)
  */
	logout: function logout() {
		//TODO: Invalidate token?
		_logger2.default.log({
			description: 'Logout called.',
			func: 'logout', obj: 'Account'
		});
		return this.endSession().then(function () {
			_logger2.default.log({
				description: 'Logout successful.',
				func: 'logout', obj: 'Account'
			});
			return { message: 'Logout successful.' };
		}, function (err) {
			_logger2.default.error({
				description: 'Error ending session.',
				error: err, func: 'logout', obj: 'Account'
			});
			return { message: 'Logout successful.' };
		});
	},
	/**
  * @function signup
  * @description Signup a new account
  */
	signup: function signup(signupData) {
		_logger2.default.log({
			description: 'Signup called.',
			signupData: signupData,
			func: 'Signup', obj: 'Account'
		});
		_logger2.default.error({
			description: 'Sigup to account is disabled.',
			func: 'Signup', obj: 'Account'
		});
		return Promise.reject({});
	},
	/**
  * @function comparePassword
  * @description Compare a password attempt with account password
  */
	comparePassword: function comparePassword(passwordAttempt) {
		_logger2.default.log({
			description: 'Compare password called.',
			func: 'comparePassword', obj: 'Account'
		});
		var selfPassword = this.password;
		return new Promise(function (resolve, reject) {
			_bcryptNodejs2.default.compare(passwordAttempt, selfPassword, function (err, passwordsMatch) {
				if (err) {
					_logger2.default.error({
						description: 'Error comparing password.',
						error: err, func: 'comparePassword', obj: 'Account'
					});
					reject(err);
				} else if (!passwordsMatch) {
					_logger2.default.warn({
						description: 'Passwords do not match.', func: 'comparePassword', obj: 'Account'
					});
					reject({
						message: 'Invalid authentication credentials'
					});
				} else {
					_logger2.default.log({
						description: 'Passwords match.',
						func: 'comparePassword', obj: 'Account'
					});
					resolve(true);
				}
			});
		});
	},
	/**
  * @function startSession
  * @description Create a new session.
  */
	startSession: function startSession() {
		_logger2.default.log({
			description: 'Start session called.',
			func: 'startSession', obj: 'Account'
		});
		var session = new _session.Session({ accountId: this._id });
		return session.save().then(function (newSession) {
			if (!newSession) {
				_logger2.default.error({
					description: 'New session was not created.',
					func: 'startSession', obj: 'Account'
				});
				return Promise.reject({ message: 'Session could not be started.' });
			} else {
				_logger2.default.log({
					description: 'Session started successfully.',
					newSession: newSession, func: 'startSession', obj: 'Account'
				});
				return newSession;
			}
		}, function (err) {
			_logger2.default.error({
				description: 'Error saving new session.', error: err,
				func: 'startSession', obj: 'Account'
			});
			return Promise.reject(err);
		});
	},
	/**
  * @function endSession
  * @description End a current account's session. Session is kept, but "active" parameter is set to false
  */
	endSession: function endSession() {
		_logger2.default.log({
			description: 'End session called.', func: 'endSession', obj: 'Account'
		});
		var self = this;
		return new Promise(function (resolve, reject) {
			_session.Session.update({ _id: self.sessionId, active: true }, { active: false, endedAt: Date.now() }, { upsert: false }, function (err, affect, result) {
				if (err) {
					_logger2.default.info({
						description: 'Error ending session.', error: err, func: 'endSession', obj: 'Account'
					});
					return reject({ message: 'Error ending session.' });
				}
				if (affect.nModified > 0) {
					_logger2.default.info({
						description: 'Session ended successfully.', session: result, affect: affect, func: 'endSession', obj: 'Account'
					});
					if (affect.nModified != 1) {
						_logger2.default.error({
							description: 'More than one session modified.', session: result, affect: affect, func: 'endSession', obj: 'Account'
						});
					}
					resolve(result);
				} else {
					_logger2.default.warn({
						description: 'Affect number incorrect?', func: 'endSession',
						affect: affect, sesson: result, error: err, obj: 'Account'
					});
					resolve({ id: self.sessionId });
				}
			});
		});
	},
	/**
  * @function hashPassword
  * @description Hash provided password with salt
  */
	hashPassword: function hashPassword(password) {
		_logger2.default.log({
			description: 'Hashing password.',
			func: 'hashPassword', obj: 'Account'
		});
		if (!password || !_lodash2.default.isString(password) || password.length < 0) {
			_logger2.default.log({
				description: 'Valid password is required to hash.',
				password: password, func: 'hashPassword', obj: 'Account'
			});
			return Promise.reject('Valid password is required to hash.');
		}
		return new Promise(function (resolve, reject) {
			_bcryptNodejs2.default.genSalt(10, function (err, salt) {
				if (err) {
					_logger2.default.log({
						description: 'Error generating salt',
						error: err, func: 'hashPassword', obj: 'Account'
					});
					return reject(err);
				}
				_bcryptNodejs2.default.hash(password, salt, function (err, hash) {
					//Add hash to accountData
					if (err) {
						_logger2.default.log({
							description: 'Error Hashing password.',
							error: err, func: 'hashPassword', obj: 'Account'
						});
						return reject(err);
					}
					resolve(hash);
				});
			});
		});
	},
	/**
  * @function createWithPass
  * @description Create new account
  * @param {string} password - Password with which to create account
  * @param {string} application - Application with which to create account
  */
	createWithPass: function createWithPass(password, application) {
		var self = this;
		if (!self.username) {
			_logger2.default.warn({
				description: 'Username is required to create a new account.',
				func: 'createWithPass', obj: 'Account'
			});
			return Promise.reject({
				message: 'Username required to create a new account.'
			});
		}
		if (!password || !_lodash2.default.isString(password)) {
			_logger2.default.error({
				description: 'Invalid password.',
				password: password,
				func: 'createWithPass', obj: 'Account'
			});
			return Promise.reject({
				message: 'Invalid password.'
			});
		}
		var findObj = { username: self.username };
		if (application) {
			//TODO: Make sure that this is an id not an application object
			findObj.application = application;
		} else {
			_logger2.default.warn({
				description: 'Creating a user without an application.',
				func: 'createWithPass', obj: 'Account'
			});
		}
		var query = self.model('Account').findOne(findObj);
		return query.then(function (foundAccount) {
			if (foundAccount) {
				_logger2.default.warn({
					description: 'A user with provided username already exists',
					user: foundAccount, func: 'createWithPass', obj: 'Account'
				});
				return Promise.reject({ message: 'A user with that username already exists.' });
			}
			_logger2.default.log({
				description: 'User does not already exist.',
				func: 'createWithPass', obj: 'Account'
			});
			return self.hashPassword(password).then(function (hashedPass) {
				self.password = hashedPass;
				_logger2.default.log({
					description: 'Before save.',
					func: 'createWithPass', obj: 'Account'
				});
				return self.save().then(function (newAccount) {
					_logger2.default.log({
						description: 'New account created successfully.',
						newAccount: newAccount,
						func: 'createWithPass', obj: 'Account'
					});
					return newAccount;
				}, function (err) {
					_logger2.default.error({
						description: 'Error creating new account.',
						error: err, func: 'createWithPass', obj: 'Account'
					});
					if (err && err.code && err.code === 11000) {
						_logger2.default.error({
							description: 'Email is already taken.',
							error: err, func: 'createWithPass', obj: 'Account'
						});
						return Promise.reject({
							message: 'Email is associated with an existing account.',
							status: 'EXISTS'
						});
					}
					return Promise.reject(err);
				});
			}, function (err) {
				_logger2.default.error({
					description: 'Error hashing password.',
					error: err, func: 'createWithPass', obj: 'Account'
				});
				return Promise.reject(err);
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Error searching for matching account.',
				error: err, func: 'createWithPass', obj: 'Account'
			});
			return Promise.reject(err);
		});
	}
};
/**
 * @description Construct Account model from AccountSchema
 */
_db2.default.tessellate.model('Account', AccountSchema);
/**
 * @description Make model accessible from controllers
 */
var Account = _db2.default.tessellate.model('Account');
Account.collectionName = AccountSchema.get('collection');
exports.Account = _db2.default.tessellate.model('Account');