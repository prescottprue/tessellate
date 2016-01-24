//Internal Config/Utils/Classes
import config  from '../config/default';
import logger from '../utils/logger';
import db from './../utils/db';
import { Session } from './session';
import { Group } from './group';
import * as fileStorage from '../utils/fileStorage';

//External Libs
import mongoose from 'mongoose';
import { isString, omit, pick } from 'lodash';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt-nodejs';
import rimraf from 'rimraf';
import AuthRocket from 'authrocket';

let authRocketEnabled = config.authRocket ? config.authRocket.enabled : false;
let authrocket = new AuthRocket();

//User Schema Object
let UserSchema = new mongoose.Schema(
	{
		username:{type:String, index:true, unique:true},
		name:{type: String},
		image:{
			url:{type: String}
		},
		email:{type: String, index:true, unique:true},
		title:{type: String},
		password:{type: String},
		sessionId:{type:mongoose.Schema.Types.ObjectId, ref:'Session'},
		project:{type:mongoose.Schema.Types.ObjectId, ref:'Project'},
		groups:[{type:mongoose.Schema.Types.ObjectId, ref:'Group'}],
		createdAt: { type: Date, default: Date.now},
		updatedAt: { type: Date, default: Date.now}
	},
	{
		toJSON:{virtuals:true}
	}
);
/**
 * @description Set collection name to 'user'
 */
UserSchema.set('collection', 'users');
UserSchema.virtual('id')
.get(function() {
	return this._id;
})
// .set((id) => {
// 	return this._id = id;
// });
UserSchema.methods = {
	/**
	 * @function strip
	 * @description Remove values that should not be sent
	 */
	strip: function() {
		let strippedUser = omit(this.toJSON(), ["password", "__v", '$$hashKey']);
		logger.log({
			description: 'Strip called.', strippedUser: strippedUser,
			func: 'strip', obj: 'User'
		});
		return omit(this.toJSON(), ["password", "__v", '$$hashKey']);
	},
	/**
	 * @function tokenData
	 * @description Get data used within token
	 */
	tokenData: function() {
		let data = pick(this.toJSON(), ["username", "groups", "sessionId", "groupNames"]);
		logger.log({
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
	generateToken: function (session) {
		logger.log({
			description: 'Generate token called.',
			func: 'generateToken', obj: 'User'
		});
		try {
			const tokenData = this.tokenData();
			const token = jwt.sign(tokenData, config.jwtSecret);
			logger.debug({
				description: 'Token generated.',
				func: 'generateToken', obj: 'User'
			});
			return token;
		} catch (error) {
			logger.error({
				description: 'Error generating token.',
				error, func: 'generateToken', obj: 'User'
			});
		}
	},
	/**
	 * @function login
	 * @description Log user in based on password attempt
	 * @param {string} password - Attempt at password with which to login to user.
	 */
	login: function(passwordAttempt) {
		logger.log({
			description: 'Login called.',
			func: 'login', obj: 'User'
		});
		//Check password
		if(!this.password){
			logger.error({
				description: 'Account does not include password. Do you need to get the account first?',
				func: 'login', obj: 'User'
			});
			return Promise.reject({
				message: 'Error logging in. Password does not exist.'
			});
		}
		return this.comparePassword(passwordAttempt).then(() => {
			logger.log({
				description: 'Provided password matches.',
				func: 'login', obj: 'User'
			});
			//Start new session
			return this.startSession().then(sessionInfo => {
				logger.log({
					description: 'Session started successfully.',
					sessiontInfo: sessionInfo,
					func: 'login', obj: 'User'
				});
				//Create Token
				this.sessionId = sessionInfo._id;
				const token = this.generateToken(sessionInfo);
				return {token, user: this.strip()};
			}, error => {
				logger.error({
					description: 'Error starting session.',
					error, func: 'login', obj: 'User'
				});
				return Promise.reject(error);
			});
		}, error => {
			logger.error({
				description: 'Error comparing password.',
				error, func: 'login', obj: 'User'
			});
			return Promise.reject(error);
		});
	},
	/**
	 * @function login
	 * @description Log user out (end session and invalidate token)
	 */
	logout:function() {
		//TODO: Invalidate token?
		logger.log({
			description: 'Logout called.',
			func: 'logout', obj: 'User'
		});
		return this.endSession().then(() => {
			logger.log({
				description: 'Logout successful.',
				func: 'logout', obj: 'User'
			});
			return {message: 'Logout successful.'};
		}, error => {
			logger.error({
				description: 'Error ending session.',
				error, func: 'logout', obj: 'User'
			});
			return {message: 'Logout successful.'};
		});
	},
	/**
	 * @function signup
	 * @description Signup a new user
	 */
	signup: function (signupData) {
		logger.debug({
			description: 'Signup called.',
			signupData, func: 'Signup', obj: 'Account'
		});
		const { email, username, provider, name, password } = signupData;
		if(!provider && !password){
			return Promise.reject({message: 'Password required to signup.'});
		}
		// TODO: Allow enabling of authrocket
		// if(authRocketEnabled){
		// 	return authrocket.signup({username, password, email});
		// }
		let findObj = username ? { username } : { email };
		if(provider){
			findObj.provider = provider;
		}
		return Account.findOne(findObj).then(matchingAccount => {
			if(matchingAccount){ //Matching account already exists
				// TODO: Respond with a specific error code
				return Promise.reject('Account with this information already exists.');
			}
			var account = new Account(signupData);
			//Provider signup
			if(provider){
				return account.createWithProvider();
			}
			//Password signup
			return account.createWithPass(password);
		}, error => {
			logger.error({
				description: 'Error querying for account.',
				error, func: 'signup', obj: 'Account'
			});
			return Promise.reject({message: 'Error finding matching account.'});
		});
	},
	/**
	 * @function comparePassword
	 * @description Compare a password attempt with user password
	 */
	comparePassword: function(passwordAttempt) {
		logger.log({
			description: 'Compare password called.',
			func: 'comparePassword', obj: 'User'
		});
		const { password } = this;
		return new Promise((resolve, reject) => {
			bcrypt.compare(passwordAttempt, password, (err, passwordsMatch) => {
				if(err){
					logger.error({
						description: 'Error comparing password.',
						error: err, func: 'comparePassword', obj: 'User'
					});
					return reject(err);
				}
				if(!passwordsMatch){
					logger.warn({
						description: 'Passwords do not match.',
						func: 'comparePassword', obj: 'User'
					});
					return reject({
						message:'Invalid authentication credentials'
					});
				}
				logger.log({
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
	startSession: function() {
		logger.log({
			description: 'Start session called.',
			func: 'startSession', obj: 'User'
		});
		const session = new Session({userId: this._id});
		return session.save().then(newSession => {
			if (!newSession) {
				logger.error({
					description: 'New session was not created.',
					func: 'startSession', obj: 'User'
				});
				return Promise.reject({message: 'Session could not be started.'});
			}
			logger.log({
				description: 'Session started successfully.',
				newSession: newSession, func: 'startSession', obj: 'User'
			});
			return newSession;
		}, error => {
			logger.error({
				description: 'Error saving new session.', error,
				func: 'startSession', obj: 'User'
			});
			return Promise.reject(error);
		});
	},
	/**
	 * @function endSession
	 * @description End a current user's session. Session is kept, but "active" parameter is set to false
	 */
	endSession: function() {
		logger.log({
			description: 'End session called.', func: 'endSession', obj: 'User'
		});
		let { sessionId } = this;
		return new Promise((resolve, reject) => {
			Session.update({_id: sessionId, active: true}, {active: false, endedAt: Date.now()}, {upsert:false}, (error, affect, result) => {
				if(error){
					logger.info({
						description: 'Error ending session.', error,
						func: 'endSession', obj: 'User'
					});
					return reject({message: 'Error ending session.'});
				}
				if (affect.nModified > 0) {
					logger.info({
						description: 'Session ended successfully.', result,
						affect, func: 'endSession', obj: 'User'
					});
					if(affect.nModified != 1){
						logger.error({
							description: 'More than one session modified.', session: result,
							affect, func: 'endSession', obj: 'User'
						});
					}
					return resolve(result);
				}
				// logger.warn({
				// 	description: 'Affect number incorrect?', func: 'endSession',
				// 	affect, result, obj: 'User'
				// });
				resolve({id: sessionId});
			});
		});
	},
	/**
	 * @function hashPassword
	 * @description Hash provided password with salt
	 */
	hashPassword: function(password) {
		logger.log({
			description: 'Hashing password.',
			func: 'hashPassword', obj: 'User'
		});
		if(!password || !isString(password) || password.length < 0){
			logger.log({
				description: 'Valid password is required to hash.',
				password, func: 'hashPassword', obj: 'User'
			});
			return Promise.reject('Valid password is required to hash.');
		}
		return new Promise((resolve, reject) => {
			bcrypt.genSalt(10, (error, salt) => {
				if(error){
					logger.log({
						description: 'Error generating salt',
						error, func: 'hashPassword', obj: 'User'
					});
					return reject(error);
				}
			  bcrypt.hash(password, salt, null, (error, hash) => {
					//Add hash to userData
					if(error){
						logger.log({
							description: 'Error Hashing password.',
							error, func: 'hashPassword', obj: 'User'
						});
						return reject(error);
					}
					resolve(hash);
				});
			});
		})
	},
	/**
	 * @function createWithPass
	 * @description Create new user
	 * @param {string} password - Password with which to create user
	 * @param {string} project - Application with which to create user
	 */
	createWithPass: function(password, application) {
		if(!this.username){
			logger.warn({
				description: 'Username is required to create a new user.',
				func: 'createWithPass', obj: 'User'
			});
			return Promise.reject({
				message: 'Username required to create a new user.'
			});
		}
		if(!password || !isString(password)){
			logger.error({
				description: 'Invalid password.',
				password, func: 'createWithPass', obj: 'Account'
			});
			return Promise.reject({
				message: 'Invalid password.'
			});
		}
		let findObj = {username: this.username};
		if(project) {
			//TODO: Make sure that this is an id not an project object
			findObj.project = project;
		} else {
			logger.warn({
				description: 'Creating a user without an project.',
				func: 'createWithPass', obj: 'User'
			});
		}
		let self = this;
		let query = this.model('User').findOne(findObj);
		return query.then(foundUser => {
			if(foundUser){
				logger.warn({
					description: 'A user with provided username already exists',
					foundUser, func: 'createWithPass', obj: 'User'
				});
				return Promise.reject({message: 'A user with that username already exists.'});
			}
			logger.log({
				description: 'User does not already exist.',
				func: 'createWithPass', obj: 'User'
			});
			return self.hashPassword(password).then(hashedPass => {
				self.password = hashedPass;
				logger.log({
					description: 'Before save.',
					func: 'createWithPass', obj: 'User'
				});
				return self.save().then(newUser => {
					logger.log({
						description: 'New user created successfully.',
						newUser: newUser,
						func: 'createWithPass', obj: 'User'
					});
					return newUser;
				}, error => {
					logger.error({
						description: 'Error creating new user.',
						error, func: 'createWithPass', obj: 'User'
					});
					if(error && error.code && error.code === 11000){
						logger.error({
							description: 'Email is already taken.',
							error, func: 'createWithPass', obj: 'Account'
						});
						return Promise.reject({
							message: 'Email is associated with an existing user.',
							status: 'EXISTS'
						});
					}
					return Promise.reject(error);
				});
			}, error => {
				logger.error({
					description: 'Error hashing password.',
					error, func: 'createWithPass', obj: 'Account'
				});
				return Promise.reject(error);
			});
		}, error => {
			logger.error({
				description: 'Error searching for matching account.',
				error, func: 'createWithPass', obj: 'Account'
			});
			return Promise.reject(error);
		});
	},
	createWithProvider: function(project) {
		logger.debug({
			description: 'Create with provider called.', this, project,
			func: 'createWithProvider', obj: 'User'
		});
		if(!this.username){
			logger.warn({
				description: 'Username is required to create a new user.',
				func: 'createWithPass', obj: 'User'
			});
			return Promise.reject({
				message: 'Username required to create a new user.'
			});
		}
		let findObj = { username: this.username };
		if(project){
			//TODO: Make sure that this is an id not an project object
			findObj.project = project;
		}
		let query = this.model('User').findOne(findObj);
		return query.then(foundUser => {
			if(foundUser){
				logger.warn({
					description: 'A user with provided username already exists',
					foundUser, func: 'createWithProvider', obj: 'User'
				});
				return Promise.reject({message: 'A user with that username already exists.'});
			}
			logger.log({
				description: 'User does not already exist.',
				func: 'createWithProvider', obj: 'User'
			});
			return self.save().then(newUser => {
				logger.log({
					description: 'New user created successfully.',
					newUser, func: 'createWithProvider', obj: 'User'
				});
				return newUser;
			}, error => {
				logger.error({
					description: 'Error creating new user.',
					error, func: 'createWithProvider', obj: 'User'
				});
				if(error && error.code && error.code === 11000){
					logger.error({
						description: 'Email is already taken.',
						error, func: 'createWithProvider', obj: 'User'
					});
					return Promise.reject({
						message: 'Email is associated with an existing user.',
						status: 'EXISTS'
					});
				}
				return Promise.reject(error);
			});
		}, error => {
			logger.error({
				description: 'Error searching for matching user.',
				error, func: 'createWithProvider', obj: 'User'
			});
			return Promise.reject(error);
		});
	},
	/**
	 * @function startSession
	 * @description Create a new session.
	 */
	startSession: function() {
		logger.log({
			description: 'Start session called.',
			func: 'startSession', obj: 'Account'
		});
		var session = new Session({accountId: this._id});
		return session.save().then(newSession => {
			if (!newSession) {
				logger.error({
					description: 'New session was not created.',
					func: 'startSession', obj: 'Account'
				});
				return Promise.reject({message: 'Session could not be started.'});
			}
			logger.log({
				description: 'Session started successfully.',
				newSession, func: 'startSession', obj: 'Account'
			});
			return newSession;
		}, error => {
			logger.error({
				description: 'Error saving new session.', error,
				func: 'startSession', obj: 'Account'
			});
			return Promise.reject(error);
		});
	},
	/**
	 * @function endSession
	 * @description End a current account's session. Session is kept, but "active" parameter is set to false
	 */
	endSession: function() {
		logger.log({
			description: 'End session called.', func: 'endSession', obj: 'Account'
		});
		const { sessionId } = this;
		const endedSession = {active: false, endedAt: Date.now()};
		return new Promise((resolve, reject) => {
			Session.update({_id: sessionId}, endedSession, { upsert: false }, (error, affect, session) => {
				if(error){
					logger.error({
						description: 'Error ending session.', error,
						func: 'endSession', obj: 'Account'
					});
					return reject({message: 'Error ending session.'});
				}
				if (affect.nModified > 0) {
					logger.info({
						description: 'Session ended successfully.', session,
						affect, func: 'endSession', obj: 'Account'
					});
					if(affect.nModified != 1){
						logger.error({
							description: 'More than one session modified.', session,
							affect, func: 'endSession', obj: 'Account'
						});
					}
					return resolve(session);
				}
				logger.warn({
					description: 'Affect number in session.', func: 'endSession',
					affect, session, obj: 'Account'
				});
				resolve({id: sessionId});
			});
		});
	},
	/**
	 * @function hashPassword
	 * @description Hash provided password with salt
	 */
	hashPassword: (password) => {
		logger.log({
			description: 'Hashing password.',
			func: 'hashPassword', obj: 'Account'
		});
		if(!password || !isString(password) || password.length < 0){
			logger.log({
				description: 'Valid password is required to hash.',
				password, func: 'hashPassword', obj: 'Account'
			});
			return Promise.reject('Valid password is required to hash.');
		}
		return new Promise((resolve, reject) => {
			bcrypt.genSalt(10, (error, salt) => {
				if(error){
					logger.log({
						description: 'Error generating salt',
						error, func: 'hashPassword', obj: 'Account'
					});
					return reject(error);
				}
			  bcrypt.hash(password, salt, null, (error, hash) => {
					//Add hash to accountData
					if(error){
						logger.log({
							description: 'Error Hashing password.',
							error, func: 'hashPassword', obj: 'Account'
						});
						return reject(error);
					}
					logger.debug({
						description: 'Password hash successful.',
						func: 'hashPassword', obj: 'Account'
					});
					resolve(hash);
				});
			});
		})
	},
	uploadImage: function(image) {
		//Upload image to s3
		logger.info({
			description: 'Upload image called.', image,
			func: 'uploadImage', obj: 'User'
		});
		if(!image || !image.path){
			return Promise.reject({
				message: 'Image with path and name required to upload.',
				error: 'INVALID_IMG'
			});
		}
		const uploadFile = {
			localFile: image.path,
			key: `${config.aws.userImagePrefix}/${this._id}/${image.originalname || image.name}`
		};
		return fileStorage.saveUserFile(uploadFile).then(fileData => {
			//save image url in user
			const { url } = fileData;
			logger.info({
				description: 'File uploaded', fileData,
				func: 'uploadImage', obj: 'User'
			});
			this.image = { url };
			return this.save().then(updatedUser => {
				logger.info({
					description: 'User updated with image successfully.',
					updatedUser, func: 'uploadImage', obj: 'User'
				});
				return new Promise((resolve, reject) => {
					rimraf(image.path, {}, error => {
						if(error){
							logger.error({
								description: 'Error deleting file from local directory.',
								error, func: 'uploadImage', obj: 'User'
							});
							return reject(error);
						}
						resolve(updatedUser);
					});
				});
			}, error => {
				logger.error({
					description: 'Error saving user after file upload.', error,
					func: 'uploadImage', obj: 'User'
				});
				return Promise.reject(error);
			});
		}, error => {
			logger.error({
				description: 'Error uploading image to user.',
				error, func: 'uploadImage', obj: 'User'
			});
			return Promise.reject(error);
		});
	},
	sendRecoveryEmail : function() {
		//TODO: Send recovery email through nodemailer
		return Promise.resolve();
	}
};
/**
 * @description Construct User model from UserSchema
 */
db.tessellate.model('User', UserSchema);
/**
 * @description Make model accessible from controllers
 */
let User = db.tessellate.model('User');
User.collectionName = UserSchema.get('collection');
exports.User = db.tessellate.model('User');
