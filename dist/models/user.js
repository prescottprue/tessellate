'use strict';

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _db = require('./../utils/db');

var _db2 = _interopRequireDefault(_db);

var _session = require('./session');

var _group = require('./group');

var _fileStorage = require('../utils/fileStorage');

var fileStorage = _interopRequireWildcard(_fileStorage);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _lodash = require('lodash');

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _bcryptNodejs = require('bcrypt-nodejs');

var _bcryptNodejs2 = _interopRequireDefault(_bcryptNodejs);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _authrocket = require('authrocket');

var _authrocket2 = _interopRequireDefault(_authrocket);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//External Libs
//Internal Config/Utils/Classes

var authRocketEnabled = _default2.default.authRocket ? _default2.default.authRocket.enabled : false;
var authrocket = new _authrocket2.default();

//User Schema Object
var UserSchema = new _mongoose2.default.Schema({
	username: { type: String, index: true, unique: true },
	name: { type: String },
	image: {
		url: { type: String }
	},
	email: { type: String, index: true, unique: true },
	title: { type: String },
	password: { type: String },
	sessionId: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Session' },
	project: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Project' },
	groups: [{ type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Group' }],
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
}, {
	toJSON: { virtuals: true }
});
/**
 * @description Set collection name to 'user'
 */
UserSchema.set('collection', 'users');
UserSchema.virtual('id').get(function () {
	return this._id;
});
// .set((id) => {
// 	return this._id = id;
// });
UserSchema.methods = {
	/**
  * @function strip
  * @description Remove values that should not be sent
  */
	strip: function strip() {
		var strippedUser = (0, _lodash.omit)(this.toJSON(), ["password", "__v", '$$hashKey']);
		_logger2.default.log({
			description: 'Strip called.', strippedUser: strippedUser,
			func: 'strip', obj: 'User'
		});
		return (0, _lodash.omit)(this.toJSON(), ["password", "__v", '$$hashKey']);
	},
	/**
  * @function tokenData
  * @description Get data used within token
  */
	tokenData: function tokenData() {
		var data = (0, _lodash.pick)(this.toJSON(), ["username", "groups", "sessionId", "groupNames"]);
		_logger2.default.log({
			description: 'Token data selected.',
			func: 'tokenData', obj: 'User'
		});
		data.userId = this._id;
		return data;
	},
	/**
  * @function generateToken
  * @description Encode a JWT with user info
  */
	generateToken: function generateToken(session) {
		_logger2.default.log({
			description: 'Generate token called.',
			func: 'generateToken', obj: 'User'
		});
		try {
			var tokenData = this.tokenData();
			var token = _jsonwebtoken2.default.sign(tokenData, _default2.default.jwtSecret);
			_logger2.default.debug({
				description: 'Token generated.',
				func: 'generateToken', obj: 'User'
			});
			return token;
		} catch (error) {
			_logger2.default.error({
				description: 'Error generating token.',
				error: error, func: 'generateToken', obj: 'User'
			});
		}
	},
	/**
  * @function login
  * @description Log user in based on password attempt
  * @param {string} password - Attempt at password with which to login to user.
  */
	login: function login(passwordAttempt) {
		var _this = this;

		_logger2.default.log({
			description: 'Login called.',
			func: 'login', obj: 'User'
		});
		//Check password
		if (!this.password) {
			_logger2.default.error({
				description: 'User does not include password. Do you need to get the user first?',
				func: 'login', obj: 'User'
			});
			return Promise.reject({
				message: 'Error logging in. Password does not exist.'
			});
		}
		return this.comparePassword(passwordAttempt).then(function () {
			_logger2.default.log({
				description: 'Provided password matches.',
				func: 'login', obj: 'User'
			});
			//Start new session
			return _this.startSession().then(function (sessionInfo) {
				_logger2.default.log({
					description: 'Session started successfully.',
					sessiontInfo: sessionInfo,
					func: 'login', obj: 'User'
				});
				//Create Token
				_this.sessionId = sessionInfo._id;
				var token = _this.generateToken(sessionInfo);
				return { token: token, user: _this.strip() };
			}, function (error) {
				_logger2.default.error({
					description: 'Error starting session.',
					error: error, func: 'login', obj: 'User'
				});
				return Promise.reject(error);
			});
		}, function (error) {
			_logger2.default.error({
				description: 'Error comparing password.',
				error: error, func: 'login', obj: 'User'
			});
			return Promise.reject(error);
		});
	},
	/**
  * @function login
  * @description Log user out (end session and invalidate token)
  */
	logout: function logout() {
		//TODO: Invalidate token?
		_logger2.default.log({
			description: 'Logout called.',
			func: 'logout', obj: 'User'
		});
		return this.endSession().then(function () {
			_logger2.default.log({
				description: 'Logout successful.',
				func: 'logout', obj: 'User'
			});
			return { message: 'Logout successful.' };
		}, function (error) {
			_logger2.default.error({
				description: 'Error ending session.',
				error: error, func: 'logout', obj: 'User'
			});
			return { message: 'Logout successful.' };
		});
	},
	/**
  * @function signup
  * @description Signup a new user
  */
	signup: function signup(signupData) {
		_logger2.default.debug({
			description: 'Signup called.',
			signupData: signupData, func: 'Signup', obj: 'User'
		});
		var email = signupData.email;
		var username = signupData.username;
		var provider = signupData.provider;
		var name = signupData.name;
		var password = signupData.password;

		if (!provider && !password) {
			return Promise.reject({ message: 'Password required to signup.' });
		}
		// TODO: Allow enabling of authrocket
		// if(authRocketEnabled){
		// 	return authrocket.signup({username, password, email});
		// }
		var findObj = username ? { username: username } : { email: email };
		if (provider) {
			findObj.provider = provider;
		}
		var User = this.model('User');
		var user = new User({ username: username, email: email, name: name });
		_logger2.default.debug({
			description: 'Userobject created calling.',
			user: user, func: 'Signup', obj: 'User'
		});
		//Provider signup
		if (provider) {
			return user.createWithProvider();
		}
		//Password signup
		return user.createWithPass(password);
	},
	/**
  * @function comparePassword
  * @description Compare a password attempt with user password
  */
	comparePassword: function comparePassword(passwordAttempt) {
		_logger2.default.log({
			description: 'Compare password called.',
			func: 'comparePassword', obj: 'User'
		});
		var password = this.password;

		return new Promise(function (resolve, reject) {
			_bcryptNodejs2.default.compare(passwordAttempt, password, function (err, passwordsMatch) {
				if (err) {
					_logger2.default.error({
						description: 'Error comparing password.',
						error: err, func: 'comparePassword', obj: 'User'
					});
					return reject(err);
				}
				if (!passwordsMatch) {
					_logger2.default.warn({
						description: 'Passwords do not match.',
						func: 'comparePassword', obj: 'User'
					});
					return reject({
						message: 'Invalid authentication credentials'
					});
				}
				_logger2.default.log({
					description: 'Passwords match.',
					func: 'comparePassword', obj: 'User'
				});
				resolve(true);
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
			func: 'startSession', obj: 'User'
		});
		var session = new _session.Session({ userId: this._id });
		return session.save().then(function (newSession) {
			if (!newSession) {
				_logger2.default.error({
					description: 'New session was not created.',
					func: 'startSession', obj: 'User'
				});
				return Promise.reject({ message: 'Session could not be started.' });
			}
			_logger2.default.log({
				description: 'Session started successfully.',
				newSession: newSession, func: 'startSession', obj: 'User'
			});
			return newSession;
		}, function (error) {
			_logger2.default.error({
				description: 'Error saving new session.', error: error,
				func: 'startSession', obj: 'User'
			});
			return Promise.reject(error);
		});
	},
	/**
  * @function endSession
  * @description End a current user's session. Session is kept, but "active" parameter is set to false
  */
	endSession: function endSession() {
		_logger2.default.log({
			description: 'End session called.', func: 'endSession', obj: 'User'
		});
		var sessionId = this.sessionId;

		return new Promise(function (resolve, reject) {
			_session.Session.update({ _id: sessionId, active: true }, { active: false, endedAt: Date.now() }, { upsert: false }, function (error, affect, result) {
				if (error) {
					_logger2.default.info({
						description: 'Error ending session.', error: error,
						func: 'endSession', obj: 'User'
					});
					return reject({ message: 'Error ending session.' });
				}
				if (affect.nModified > 0) {
					_logger2.default.info({
						description: 'Session ended successfully.', result: result,
						affect: affect, func: 'endSession', obj: 'User'
					});
					if (affect.nModified != 1) {
						_logger2.default.error({
							description: 'More than one session modified.', session: result,
							affect: affect, func: 'endSession', obj: 'User'
						});
					}
					return resolve(result);
				}
				// logger.warn({
				// 	description: 'Affect number incorrect?', func: 'endSession',
				// 	affect, result, obj: 'User'
				// });
				resolve({ id: sessionId });
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
			func: 'hashPassword', obj: 'User'
		});
		if (!password || !(0, _lodash.isString)(password) || password.length < 0) {
			_logger2.default.log({
				description: 'Valid password is required to hash.',
				password: password, func: 'hashPassword', obj: 'User'
			});
			return Promise.reject('Valid password is required to hash.');
		}
		return new Promise(function (resolve, reject) {
			_bcryptNodejs2.default.genSalt(10, function (error, salt) {
				if (error) {
					_logger2.default.log({
						description: 'Error generating salt',
						error: error, func: 'hashPassword', obj: 'User'
					});
					return reject(error);
				}
				_bcryptNodejs2.default.hash(password, salt, null, function (error, hash) {
					//Add hash to userData
					if (error) {
						_logger2.default.log({
							description: 'Error Hashing password.',
							error: error, func: 'hashPassword', obj: 'User'
						});
						return reject(error);
					}
					resolve(hash);
				});
			});
		});
	},
	/**
  * @function createWithPass
  * @description Create new user
  * @param {string} password - Password with which to create user
  * @param {string} project - Application with which to create user
  */
	createWithPass: function createWithPass(password, project) {
		_logger2.default.debug({
			description: 'Create with pass called.',
			func: 'createWithPass', obj: 'User'
		});
		if (!this.username) {
			_logger2.default.warn({
				description: 'Username is required to create a new user.',
				func: 'createWithPass', obj: 'User'
			});
			return Promise.reject({
				message: 'Username required to create a new user.'
			});
		}
		if (!password || !(0, _lodash.isString)(password)) {
			_logger2.default.error({
				description: 'Invalid password.',
				password: password, func: 'createWithPass', obj: 'User'
			});
			return Promise.reject({
				message: 'Invalid password.'
			});
		}
		var findObj = { username: this.username };
		if (project) {
			//TODO: Make sure that this is an id not an project object
			findObj.project = project;
		} else {
			_logger2.default.warn({
				description: 'Creating a user without an project.',
				func: 'createWithPass', obj: 'User'
			});
		}
		var self = this;
		return this.model('User').findOne(findObj).then(function (foundUser) {
			if (foundUser) {
				_logger2.default.warn({
					description: 'A user with provided username already exists',
					foundUser: foundUser, func: 'createWithPass', obj: 'User'
				});
				return Promise.reject({ message: 'A user with that username already exists.' });
			}
			_logger2.default.log({
				description: 'User does not already exist.',
				func: 'createWithPass', obj: 'User'
			});
			return self.hashPassword(password).then(function (hashedPass) {
				self.password = hashedPass;
				_logger2.default.log({
					description: 'Before save.',
					func: 'createWithPass', obj: 'User'
				});
				return self.save().then(function (newUser) {
					_logger2.default.log({
						description: 'New user created successfully.',
						newUser: newUser, func: 'createWithPass', obj: 'User'
					});
					return newUser.login(password);
				}, function (error) {
					_logger2.default.error({
						description: 'Error creating new user.',
						error: error, func: 'createWithPass', obj: 'User'
					});
					if (error && error.code && error.code === 11000) {
						_logger2.default.error({
							description: 'Email is already taken.',
							error: error, func: 'createWithPass', obj: 'User'
						});
						return Promise.reject({
							message: 'Email is associated with an existing user.',
							status: 'EXISTS'
						});
					}
					return Promise.reject(error);
				});
			}, function (error) {
				_logger2.default.error({
					description: 'Error hashing password.',
					error: error, func: 'createWithPass', obj: 'User'
				});
				return Promise.reject(error);
			});
		}, function (error) {
			_logger2.default.error({
				description: 'Error searching for matching user.',
				error: error, func: 'createWithPass', obj: 'User'
			});
			return Promise.reject(error);
		});
	},
	createWithProvider: function createWithProvider(project) {
		_logger2.default.debug({
			description: 'Create with provider called.', project: project,
			func: 'createWithProvider', obj: 'User'
		});
		if (!this.username) {
			_logger2.default.warn({
				description: 'Username is required to create a new user.',
				func: 'createWithPass', obj: 'User'
			});
			return Promise.reject({
				message: 'Username required to create a new user.'
			});
		}
		var findObj = { username: this.username };
		if (project) {
			//TODO: Make sure that this is an id not an project object
			findObj.project = project;
		}
		var query = this.model('User').findOne(findObj);
		return query.then(function (foundUser) {
			if (foundUser) {
				_logger2.default.warn({
					description: 'A user with provided username already exists',
					foundUser: foundUser, func: 'createWithProvider', obj: 'User'
				});
				return Promise.reject({ message: 'A user with that username already exists.' });
			}
			_logger2.default.log({
				description: 'User does not already exist.',
				func: 'createWithProvider', obj: 'User'
			});
			return self.save().then(function (newUser) {
				_logger2.default.log({
					description: 'New user created successfully.',
					newUser: newUser, func: 'createWithProvider', obj: 'User'
				});
				return newUser;
			}, function (error) {
				_logger2.default.error({
					description: 'Error creating new user.',
					error: error, func: 'createWithProvider', obj: 'User'
				});
				if (error && error.code && error.code === 11000) {
					_logger2.default.error({
						description: 'Email is already taken.',
						error: error, func: 'createWithProvider', obj: 'User'
					});
					return Promise.reject({
						message: 'Email is associated with an existing user.',
						status: 'EXISTS'
					});
				}
				return Promise.reject(error);
			});
		}, function (error) {
			_logger2.default.error({
				description: 'Error searching for matching user.',
				error: error, func: 'createWithProvider', obj: 'User'
			});
			return Promise.reject(error);
		});
	},
	/**
  * @function startSession
  * @description Create a new session.
  */
	startSession: function startSession() {
		_logger2.default.log({
			description: 'Start session called.',
			func: 'startSession', obj: 'User'
		});
		var session = new _session.Session({ userId: this._id });
		return session.save().then(function (newSession) {
			if (!newSession) {
				_logger2.default.error({
					description: 'New session was not created.',
					func: 'startSession', obj: 'User'
				});
				return Promise.reject({ message: 'Session could not be started.' });
			}
			_logger2.default.log({
				description: 'Session started successfully.',
				newSession: newSession, func: 'startSession', obj: 'User'
			});
			return newSession;
		}, function (error) {
			_logger2.default.error({
				description: 'Error saving new session.', error: error,
				func: 'startSession', obj: 'User'
			});
			return Promise.reject(error);
		});
	},
	/**
  * @function endSession
  * @description End a current user's session. Session is kept, but "active" parameter is set to false
  */
	endSession: function endSession() {
		_logger2.default.log({
			description: 'End session called.', func: 'endSession', obj: 'User'
		});
		var sessionId = this.sessionId;

		var endedSession = { active: false, endedAt: Date.now() };
		return new Promise(function (resolve, reject) {
			_session.Session.update({ _id: sessionId }, endedSession, { upsert: false }, function (error, affect, session) {
				if (error) {
					_logger2.default.error({
						description: 'Error ending session.', error: error,
						func: 'endSession', obj: 'User'
					});
					return reject({ message: 'Error ending session.' });
				}
				if (affect.nModified > 0) {
					_logger2.default.info({
						description: 'Session ended successfully.', session: session,
						affect: affect, func: 'endSession', obj: 'User'
					});
					if (affect.nModified != 1) {
						_logger2.default.error({
							description: 'More than one session modified.', session: session,
							affect: affect, func: 'endSession', obj: 'User'
						});
					}
					return resolve(session);
				}
				_logger2.default.warn({
					description: 'Affect number in session.', func: 'endSession',
					affect: affect, session: session, obj: 'User'
				});
				resolve({ id: sessionId });
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
			func: 'hashPassword', obj: 'User'
		});
		if (!password || !(0, _lodash.isString)(password) || password.length < 0) {
			_logger2.default.log({
				description: 'Valid password is required to hash.',
				password: password, func: 'hashPassword', obj: 'User'
			});
			return Promise.reject('Valid password is required to hash.');
		}
		return new Promise(function (resolve, reject) {
			_bcryptNodejs2.default.genSalt(10, function (error, salt) {
				if (error) {
					_logger2.default.log({
						description: 'Error generating salt',
						error: error, func: 'hashPassword', obj: 'User'
					});
					return reject(error);
				}
				_bcryptNodejs2.default.hash(password, salt, null, function (error, hash) {
					//Add hash to userData
					if (error) {
						_logger2.default.log({
							description: 'Error Hashing password.',
							error: error, func: 'hashPassword', obj: 'User'
						});
						return reject(error);
					}
					_logger2.default.debug({
						description: 'Password hash successful.',
						func: 'hashPassword', obj: 'User'
					});
					resolve(hash);
				});
			});
		});
	},
	uploadImage: function uploadImage(image) {
		var _this2 = this;

		//Upload image to s3
		_logger2.default.info({
			description: 'Upload image called.', image: image,
			func: 'uploadImage', obj: 'User'
		});
		if (!image || !image.path) {
			return Promise.reject({
				message: 'Image with path and name required to upload.',
				error: 'INVALID_IMG'
			});
		}
		var uploadFile = {
			localFile: image.path,
			key: _default2.default.aws.userImagePrefix + '/' + this._id + '/' + (image.originalname || image.name)
		};
		return fileStorage.saveUserFile(uploadFile).then(function (fileData) {
			//save image url in user
			var url = fileData.url;

			_logger2.default.info({
				description: 'File uploaded', fileData: fileData,
				func: 'uploadImage', obj: 'User'
			});
			_this2.image = { url: url };
			return _this2.save().then(function (updatedUser) {
				_logger2.default.info({
					description: 'User updated with image successfully.',
					updatedUser: updatedUser, func: 'uploadImage', obj: 'User'
				});
				return new Promise(function (resolve, reject) {
					(0, _rimraf2.default)(image.path, {}, function (error) {
						if (error) {
							_logger2.default.error({
								description: 'Error deleting file from local directory.',
								error: error, func: 'uploadImage', obj: 'User'
							});
							return reject(error);
						}
						resolve(updatedUser);
					});
				});
			}, function (error) {
				_logger2.default.error({
					description: 'Error saving user after file upload.', error: error,
					func: 'uploadImage', obj: 'User'
				});
				return Promise.reject(error);
			});
		}, function (error) {
			_logger2.default.error({
				description: 'Error uploading image to user.',
				error: error, func: 'uploadImage', obj: 'User'
			});
			return Promise.reject(error);
		});
	},
	sendRecoveryEmail: function sendRecoveryEmail() {
		//TODO: Send recovery email through nodemailer
		return Promise.resolve();
	}
};
/**
 * @description Construct User model from UserSchema
 */
_db2.default.tessellate.model('User', UserSchema);
/**
 * @description Make model accessible from controllers
 */
var User = _db2.default.tessellate.model('User');
User.collectionName = UserSchema.get('collection');
exports.User = _db2.default.tessellate.model('User');