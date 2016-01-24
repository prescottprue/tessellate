//Internal Config/Utils/Classes
import config  from '../config/default';
import logger from '../utils/logger';
import db from './../utils/db';
import { Session } from './session';
import { Group } from './group';
import * as fileStorage from '../utils/fileStorage';

//External Libs
import mongoose from 'mongoose';
import _ from 'lodash';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt-nodejs';
import rimraf from 'rimraf';

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
/*
 * Groups virtual to return names
 */
// UserSchema.virtual('groupNames')
// .get(function (){
// 	// return "test";
// 	let self = this;
// 	let namesArray = _.map(self.groups, function(group){
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
UserSchema.virtual('id')
.get(function() {
	return this._id;
})
// .set( (id) => {
// 	return this._id = id;
// });
UserSchema.methods = {
	/**
	 * @function strip
	 * @description Remove values that should not be sent
	 */
	strip: function() {
		let strippedUser = _.omit(this.toJSON(), ["password", "__v", '$$hashKey']);
		logger.log({
			description: 'Strip called.', strippedUser: strippedUser,
			func: 'strip', obj: 'User'
		});
		return _.omit(this.toJSON(), ["password", "__v", '$$hashKey']);
	},
	/**
	 * @function tokenData
	 * @description Get data used within token
	 */
	tokenData: function() {
		let data = _.pick(this.toJSON(), ["username", "groups", "sessionId", "groupNames"]);
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
			let tokenData = this.tokenData();
			let token = jwt.sign(tokenData, config.jwtSecret);
			logger.log({
				description: 'Token generated.',
				func: 'generateToken', obj: 'User'
			});
			return token;
		} catch (err) {
			logger.error({
				description: 'Error generating token.',
				error: err, func: 'generateToken', obj: 'User'
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
		let self = this; //this contexts were causing errors even though => should pass context automatically
		if(!this.password){
			logger.error({
				description: 'Original query did not include password. Consider revising.',
				func: 'login', obj: 'User'
			});
			return this.model('User').find({_id:this._id}).then(self.login(passwordAttempt));
		}
		return this.comparePassword(passwordAttempt).then(() => {
			logger.log({
				description: 'Provided password matches.',
				func: 'login', obj: 'User'
			});
			//Start new session
			return self.startSession().then((sessionInfo) => {
				logger.log({
					description: 'Session started successfully.',
					sessiontInfo: sessionInfo,
					func: 'login', obj: 'User'
				});
				//Create Token
				self.sessionId = sessionInfo._id;
				let token = self.generateToken(sessionInfo);
				return {token: token, user: self.strip()};
			}, (err) => {
				logger.error({
					description: 'Error starting session.',
					error: err, func: 'login', obj: 'User'
				});
				return Promise.reject(err);
			});
		}, err => {
			logger.error({
				description: 'Error comparing password.',
				attempt: passwordAttempt, error: err,
				func: 'login', obj: 'User'
			});
			return Promise.reject(err);
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
		}, err => {
			logger.error({
				description: 'Error ending session.',
				error: err, func: 'logout', obj: 'User'
			});
			return {message: 'Logout successful.'};
		});
	},
	/**
	 * @function signup
	 * @description Signup a new user
	 */
	signup: function (signupData) {
		logger.log({
			description: 'Signup called.',
			signupData: signupData,
			func: 'Signup', obj: 'User'
		});
		logger.error({
			description: 'Sigup to user is disabled.',
			func: 'Signup', obj: 'User'
		});
		return Promise.reject({});
	},
	/**
	 * @function comparePassword
	 * @description Compare a password attempt with user password
	 */
	comparePassword: function (passwordAttempt) {
		logger.log({
			description: 'Compare password called.',
			func: 'comparePassword', obj: 'User'
		});
		let selfPassword = this.password;
		return new Promise((resolve, reject) => {
			bcrypt.compare(passwordAttempt, selfPassword, (err, passwordsMatch) => {
				if(err){
					logger.error({
						description: 'Error comparing password.',
						error: err, func: 'comparePassword', obj: 'User'
					});
					reject(err);
				} else if(!passwordsMatch){
					logger.warn({
						description: 'Passwords do not match.',
						func: 'comparePassword', obj: 'User'
					});
					reject({
						message:'Invalid authentication credentials'
					});
				} else {
					logger.log({
						description: 'Passwords match.',
						func: 'comparePassword', obj: 'User'
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
	startSession: function() {
		logger.log({
			description: 'Start session called.',
			func: 'startSession', obj: 'User'
		});
		let session = new Session({userId:this._id});
		return session.save().then(newSession => {
			if (!newSession) {
				logger.error({
					description: 'New session was not created.',
					func: 'startSession', obj: 'User'
				});
				return Promise.reject({message: 'Session could not be started.'});
			} else {
				logger.log({
					description: 'Session started successfully.',
					newSession: newSession, func: 'startSession', obj: 'User'
				});
				return newSession;
			}
		}, err => {
			logger.error({
				description: 'Error saving new session.', error: err,
				func: 'startSession', obj: 'User'
			});
			return Promise.reject(err);
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
		let self = this;
		return new Promise((resolve, reject) => {
			Session.update({_id:self.sessionId, active:true}, {active:false, endedAt:Date.now()}, {upsert:false}, (err, affect, result) => {
				if(err){
					logger.info({
						description: 'Error ending session.', error: err, func: 'endSession', obj: 'User'
					});
					return reject({message: 'Error ending session.'});
				}
				if (affect.nModified > 0) {
					logger.info({
						description: 'Session ended successfully.', session: result,
						affect: affect, func: 'endSession', obj: 'User'
					});
					if(affect.nModified != 1){
						logger.error({
							description: 'More than one session modified.', session: result,
							affect: affect, func: 'endSession', obj: 'User'
						});
					}
					resolve(result);
				} else {
					logger.warn({
						description: 'Affect number incorrect?', func: 'endSession',
						affect: affect, sesson: result, error: err, obj: 'User'
					});
					resolve({id: self.sessionId});
				}
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
		if(!password || !_.isString(password) || password.length < 0){
			logger.log({
				description: 'Valid password is required to hash.',
				password, func: 'hashPassword', obj: 'User'
			});
			return Promise.reject('Valid password is required to hash.');
		}
		return new Promise((resolve, reject) => {
			bcrypt.genSalt(10, (err, salt) => {
				if(err){
					logger.log({
						description: 'Error generating salt',
						error: err, func: 'hashPassword', obj: 'User'
					});
					return reject(err);
				}
			  bcrypt.hash(password, salt, null, (err, hash) => {
					//Add hash to userData
					if(err){
						logger.log({
							description: 'Error Hashing password.',
							error: err, func: 'hashPassword', obj: 'User'
						});
						return reject(err);
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
	createWithPass: function(password, project) {
		let self = this;
		if(!self.username){
			logger.warn({
				description: 'Username is required to create a new user.',
				func: 'createWithPass', obj: 'User'
			});
			return Promise.reject({
				message: 'Username required to create a new user.'
			});
		}
		if(!password || !_.isString(password)){
			logger.error({
				description: 'Invalid password.',
				password: password,
				func: 'createWithPass', obj: 'User'
			});
			return Promise.reject({
				message: 'Invalid password.'
			});
		}
		let findObj = {username: self.username};
		if(project) {
			//TODO: Make sure that this is an id not an project object
			findObj.project = project;
		} else {
			logger.warn({
				description: 'Creating a user without an project.',
				func: 'createWithPass', obj: 'User'
			});
		}
		let query = self.model('User').findOne(findObj);
		return query.then((foundUser) => {
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
				}, (err) => {
					logger.error({
						description: 'Error creating new user.',
						error: err, func: 'createWithPass', obj: 'User'
					});
					if(err && err.code && err.code === 11000){
						logger.error({
							description: 'Email is already taken.',
							error: err, func: 'createWithPass', obj: 'User'
						});
						return Promise.reject({
							message: 'Email is associated with an existing user.',
							status: 'EXISTS'
						});
					}
					return Promise.reject(err);
				});
			}, (err) => {
				logger.error({
					description: 'Error hashing password.',
					error: err, func: 'createWithPass', obj: 'User'
				});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({
				description: 'Error searching for matching user.',
				error: err, func: 'createWithPass', obj: 'User'
			});
			return Promise.reject(err);
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
						if(!error){
							resolve(updatedUser);
						} else {
							logger.error({
								description: 'Error deleting file from local directory.',
								error, func: 'uploadImage', obj: 'User'
							});
							reject(error);
						}
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
