//Internal Config/Utils/Classes
'use strict';

var conf = require('../config/default').config,
    logger = require('../utils/logger'),
    db = require('./../utils/db'),
    Session = require('./session').Session,
    Group = require('./group').Group;

//External Libs
var mongoose = require('mongoose'),
    _ = require('lodash'),
    jwt = require('jsonwebtoken'),
    bcrypt = require('bcrypt');

//Account Schema Object
var AccountSchema = new mongoose.Schema({
	username: { type: String, index: true, unique: true },
	name: { type: String },
	email: { type: String, index: true, unique: true },
	title: { type: String },
	password: { type: String },
	sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
	application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
	groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
	authrocketId: { type: String },
	createdAt: { type: Date, 'default': Date.now },
	updatedAt: { type: Date, 'default': Date.now }
}, {
	toJSON: { virtuals: true }
});
/**
 * @description Set collection name to 'account'
 */
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
	return undefined._id;
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
		var strippedAccount = _.omit(undefined.toJSON(), ["password", "__v", '$$hashKey']);
		logger.log({ description: 'Strip called.', strippedAccount: strippedAccount, func: 'strip', obj: 'Account' });
		return _.omit(undefined.toJSON(), ["password", "__v", '$$hashKey']);
	},
	/**
  * @function tokenData
  * @description Get data used within token
  */
	tokenData: function tokenData() {
		var data = _.pick(undefined.toJSON(), ["username", "groups", "sessionId", "groupNames"]);
		logger.log({ description: 'Token data selected.', func: 'tokenData', obj: 'Account' });
		data.accountId = undefined.toJSON().id;
		return data;
	},
	/**
  * @function generateToken
  * @description Encode a JWT with account info
  */
	generateToken: function generateToken(session) {
		logger.log({ description: 'Generate token called.', func: 'generateToken', obj: 'Account' });
		var tokenData = undefined.tokenData();
		var token = jwt.sign(tokenData, conf.jwtSecret);
		logger.log({ description: 'Token generated.', func: 'generateToken', obj: 'Account' });
		return token;
	},
	/**
  * @function login
  * @description Log account in based on password attempt
  * @param {string} password - Attempt at password with which to login to account.
  */
	login: function login(passwordAttempt) {
		logger.log({
			description: 'Login called.',
			func: 'login', obj: 'Account'
		});
		//Check password
		var self = undefined; //this contexts were causing errors even though => should pass context automatically
		if (!undefined.password) {
			logger.warn({
				description: 'Original query did not include password. Consider revising.',
				func: 'login', obj: 'Account'
			});
			return undefined.model('Account').find({ _id: self._id }).then(self.login(passwordAttempt));
		}
		return self.comparePassword(passwordAttempt).then(function () {
			logger.log({
				description: 'Provided password matches.',
				func: 'login', obj: 'Account'
			});
			//Start new session
			return self.startSession().then(function (sessionInfo) {
				logger.log({
					description: 'Session started successfully.',
					func: 'login', obj: 'Account'
				});
				//Create Token
				undefined.sessionId = sessionInfo._id;
				var token = self.generateToken(sessionInfo);
				return { token: token, account: self.strip() };
			}, function (err) {
				logger.error({
					description: 'Error starting session.',
					error: err, func: 'login', obj: 'Account'
				});
				return Promise.reject(err);
			});
		}, function (err) {
			logger.error({
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
		logger.log({
			description: 'Logout called.',
			func: 'logout', obj: 'Account'
		});
		return undefined.endSession().then(function () {
			logger.log({
				description: 'Logout successful.',
				func: 'logout', obj: 'Account'
			});
			return { message: 'Logout successful.' };
		}, function (err) {
			logger.error({
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
		logger.log({
			description: 'Signup called.',
			signupData: signupData,
			func: 'Signup', obj: 'Account'
		});
		logger.error({
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
		var selfPassword = undefined.password;
		logger.log({
			description: 'Compare password called.',
			func: 'comparePassword', obj: 'Account'
		});
		return new Promise(function (resolve, reject) {
			bcrypt.compare(passwordAttempt, selfPassword, function (err, passwordsMatch) {
				if (err) {
					logger.error({
						description: 'Error comparing password.',
						error: err, func: 'comparePassword', obj: 'Account'
					});
					reject(err);
				} else if (!passwordsMatch) {
					logger.warn({
						description: 'Passwords do not match.', func: 'comparePassword', obj: 'Account'
					});
					reject({
						message: 'Invalid authentication credentials'
					});
				} else {
					logger.log({ description: 'Passwords match.', func: 'comparePassword', obj: 'Account' });
					resolve(true);
				}
			});
		});
	},
	/**
  * @function saveNew
  * @description DEPRECATED Wrap query in promise
  */
	saveNew: function saveNew() {
		logger.warn({
			description: 'saveNew called.',
			account: undefined, func: 'saveNew',
			obj: 'Account'
		});
		var self = undefined;
		// logger.warn({description: 'saveNew is no longer nessesary since save returns a promise.', func: 'saveNew', obj: 'Account'});
		return new Promise(function (resolve, reject) {
			self.save(function (err) {
				if (!err) {
					logger.log({
						description: 'Account saved successfully.',
						savedAccount: self, func: 'saveNew', obj: 'Account'
					});
					resolve();
				} else {
					logger.error({
						description: 'Error saving Account.',
						account: self, func: 'saveNew', obj: 'Account'
					});
					return reject(err);
				}
			});
		});
	},
	/**
  * @function startSession
  * @description Create a new session.
  */
	startSession: function startSession() {
		var self = undefined;
		logger.log({ description: 'Start session called.', func: 'startSession', obj: 'Account', 'this': self });
		var session = new Session({ accountId: self._id });
		return session.save().then(function (newSession) {
			if (!newSession) {
				logger.error({ description: 'New session was not created.', func: 'startSession', obj: 'Account' });
				return Promise.reject({ message: 'Session could not be started.' });
			} else {
				logger.log({ description: 'Session started successfully.', newSession: newSession, func: 'startSession', obj: 'Account' });
				return newSession;
			}
		}, function (err) {
			logger.error({ description: 'Error saving new session.', error: err, func: 'startSession', obj: 'Account' });
			return Promise.reject(err);
		});
	},
	/**
  * @function endSession
  * @description End a current account's session. Session is kept, but "active" parameter is set to false
  */
	endSession: function endSession() {
		logger.log({ description: 'End session called.', func: 'endSession', obj: 'Account' });
		var self = undefined;
		return new Promise(function (resolve, reject) {
			Session.update({ _id: self.sessionId, active: true }, { active: false, endedAt: Date.now() }, { upsert: false }, function (err, affect, result) {
				if (err) {
					logger.info({ description: 'Error ending session.', error: err, func: 'endSession', obj: 'Account' });
					return reject({ message: 'Error ending session.' });
				}
				if (affect.nModified > 0) {
					logger.info({ description: 'Session ended successfully.', session: result, affect: affect, func: 'endSession', obj: 'Account' });
					if (affect.nModified != 1) {
						logger.error({ description: 'More than one session modified.', session: result, affect: affect, func: 'endSession', obj: 'Account' });
					}
					resolve(result);
				} else {
					logger.warn({ description: 'Affect number incorrect?', func: 'endSession', affect: affect, sesson: result, error: err, obj: 'Account' });
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
		logger.log({
			description: 'Hashing password.',
			func: 'hashPassword', obj: 'Account'
		});
		if (!password || !_.isString(password) || password.length < 0) {
			logger.log({
				description: 'Valid password is required to hash.',
				password: password, func: 'hashPassword', obj: 'Account'
			});
			return Promise.reject('Valid password is required to hash.');
		}
		return new Promise(function (resolve, reject) {
			bcrypt.genSalt(10, function (err, salt) {
				if (err) {
					logger.log({
						description: 'Error generating salt',
						error: err, func: 'hashPassword', obj: 'Account'
					});
					return reject(err);
				}
				bcrypt.hash(password, salt, function (err, hash) {
					//Add hash to accountData
					if (err) {
						logger.log({
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
		var self = undefined;
		if (!self.username) {
			logger.warn({
				description: 'Username is required to create a new account.',
				account: self, func: 'createWithPass', obj: 'Account'
			});
			return Promise.reject({
				message: 'Username required to create a new account.'
			});
		}
		if (!password || !_.isString(password)) {
			logger.error({
				description: 'Invalid password.',
				account: self, password: password,
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
			logger.warn({
				description: 'Creating a user without an application.',
				account: self, func: 'createWithPass', obj: 'Account'
			});
		}
		var query = undefined.model('Account').findOne(findObj);
		return query.then(function (foundAccount) {
			if (foundAccount) {
				logger.warn({
					description: 'A user with provided username already exists',
					user: foundAccount, func: 'createWithPass', obj: 'Account'
				});
				return Promise.reject({ message: 'A user with that username already exists.' });
			}
			logger.log({
				description: 'User does not already exist.',
				func: 'createWithPass', obj: 'Account'
			});
			return self.hashPassword(password).then(function (hashedPass) {
				self.password = hashedPass;
				return self.saveNew().then(function (newAccount) {
					logger.log({
						description: 'New account created successfully.',
						func: 'createWithPass', obj: 'Account'
					});
					return self;
				}, function (err) {
					logger.error({
						description: 'Error creating new account.',
						error: err, func: 'createWithPass', obj: 'Account'
					});
					if (err && err.code && err.code === 11000) {
						logger.error({
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
				logger.error({
					description: 'Error hashing password.',
					error: err, func: 'createWithPass', obj: 'Account'
				});
				return Promise.reject(err);
			});
		}, function (err) {
			logger.error({
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
db.tessellate.model('Account', AccountSchema);
/**
 * @description Make model accessible from controllers
 */
var Account = db.tessellate.model('Account');
Account.collectionName = AccountSchema.get('collection');
exports.Account = db.tessellate.model('Account');