//Internal Config/Utils/Classes
import { config }  from '../config/default';
import logger from '../utils/logger';
import db from './../utils/db';
import { Session } from './session';
import { Group } from './group';

//External Libs
import mongoose from 'mongoose';
import _ from 'lodash';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

//Account Schema Object
let AccountSchema = new mongoose.Schema(
	{
		username:{type:String, index:true, unique:true},
		name:{type: String},
		email:{type: String, index:true, unique:true},
		title:{type: String},
		password:{type: String},
		sessionId:{type:mongoose.Schema.Types.ObjectId, ref:'Session'},
		application:{type:mongoose.Schema.Types.ObjectId, ref:'Application'},
		groups:[{type:mongoose.Schema.Types.ObjectId, ref:'Group'}],
		authrocketId:{type:String},
		createdAt: { type: Date, default: Date.now},
		updatedAt: { type: Date, default: Date.now}
	},
	{
		toJSON:{virtuals:true}
	}
);
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
AccountSchema.virtual('id')
.get(function() {
	return this._id;
})
// .set( (id) => {
// 	return this._id = id;
// });
AccountSchema.methods = {
	/**
	 * @function strip
	 * @description Remove values that should not be sent
	 */
	strip: function() {
		var strippedAccount = _.omit(this.toJSON(), ["password", "__v", '$$hashKey']);
		logger.log({
			description: 'Strip called.', strippedAccount: strippedAccount,
			func: 'strip', obj: 'Account'
		});
		return _.omit(this.toJSON(), ["password", "__v", '$$hashKey']);
	},
	/**
	 * @function tokenData
	 * @description Get data used within token
	 */
	tokenData: function() {
		var data = _.pick(this.toJSON(), ["username", "groups", "sessionId", "groupNames"]);
		logger.log({
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
	generateToken: function (session) {
		logger.log({
			description: 'Generate token called.',
			func: 'generateToken', obj: 'Account'
		});
		try {
			var tokenData = this.tokenData();
			var token = jwt.sign(tokenData, config.jwtSecret);
			logger.log({
				description: 'Token generated.',
				func: 'generateToken', obj: 'Account'
			});
			return token;
		} catch (err) {
			logger.error({
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
	login: function(passwordAttempt) {
		logger.log({
			description: 'Login called.',
			func: 'login', obj: 'Account'
		});
		//Check password
		var self = this; //this contexts were causing errors even though => should pass context automatically
		if(!this.password){
			logger.warn({
				description: 'Original query did not include password. Consider revising.',
				func: 'login', obj: 'Account'
			});
			return this.model('Account').find({_id:this._id}).then(self.login(passwordAttempt));
		}
		return this.comparePassword(passwordAttempt).then(() => {
			logger.log({
				description: 'Provided password matches.',
				func: 'login', obj: 'Account'
			});
			//Start new session
			return self.startSession().then((sessionInfo) => {
				logger.log({
					description: 'Session started successfully.',
					sessiontInfo: sessionInfo,
					func: 'login', obj: 'Account'
				});
				//Create Token
				self.sessionId = sessionInfo._id;
				var token = self.generateToken(sessionInfo);
				return {token: token, account: self.strip()};
			}, (err) => {
				logger.error({
					description: 'Error starting session.',
					error: err, func: 'login', obj: 'Account'
				});
				return Promise.reject(err);
			});
		}, (err) => {
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
	logout:function() {
		//TODO: Invalidate token?
		logger.log({
			description: 'Logout called.',
			func: 'logout', obj: 'Account'
		});
		return this.endSession().then(() => {
			logger.log({
				description: 'Logout successful.',
				func: 'logout', obj: 'Account'
			});
			return {message: 'Logout successful.'};
		}, (err) => {
			logger.error({
				description: 'Error ending session.',
				error: err, func: 'logout', obj: 'Account'
			});
			return {message: 'Logout successful.'};
		});
	},
	/**
	 * @function signup
	 * @description Signup a new account
	 */
	signup: function (signupData) {
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
	comparePassword: function (passwordAttempt) {
		logger.log({
			description: 'Compare password called.',
			func: 'comparePassword', obj: 'Account'
		});
		var selfPassword = this.password;
		return new Promise((resolve, reject) => {
			bcrypt.compare(passwordAttempt, selfPassword, (err, passwordsMatch) => {
				if(err){
					logger.error({
						description: 'Error comparing password.',
						error: err, func: 'comparePassword', obj: 'Account'
					});
					reject(err);
				} else if(!passwordsMatch){
					logger.warn({
						description: 'Passwords do not match.', func: 'comparePassword', obj: 'Account'
					});
					reject({
						message:'Invalid authentication credentials'
					});
				} else {
					logger.log({
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
	startSession: function() {
		logger.log({
			description: 'Start session called.',
			func: 'startSession', obj: 'Account'
		});
		var session = new Session({accountId:this._id});
		return session.save().then((newSession) => {
			if (!newSession) {
				logger.error({
					description: 'New session was not created.',
					func: 'startSession', obj: 'Account'
				});
				return Promise.reject({message: 'Session could not be started.'});
			} else {
				logger.log({
					description: 'Session started successfully.',
					newSession: newSession, func: 'startSession', obj: 'Account'
				});
				return newSession;
			}
		}, (err) => {
			logger.error({
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
	endSession: function() {
		logger.log({
			description: 'End session called.', func: 'endSession', obj: 'Account'
		});
		var self = this;
		return new Promise((resolve, reject) => {
			Session.update({_id:self.sessionId, active:true}, {active:false, endedAt:Date.now()}, {upsert:false}, (err, affect, result) => {
				if(err){
					logger.info({
						description: 'Error ending session.', error: err, func: 'endSession', obj: 'Account'
					});
					return reject({message: 'Error ending session.'});
				}
				if (affect.nModified > 0) {
					logger.info({
						description: 'Session ended successfully.', session: result, affect: affect, func: 'endSession', obj: 'Account'
					});
					if(affect.nModified != 1){
						logger.error({
							description: 'More than one session modified.', session: result, affect: affect, func: 'endSession', obj: 'Account'
						});
					}
					resolve(result);
				} else {
					logger.warn({
						description: 'Affect number incorrect?', func: 'endSession',
						affect: affect, sesson: result, error: err, obj: 'Account'
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
	hashPassword:(password) => {
		logger.log({
			description: 'Hashing password.',
			func: 'hashPassword', obj: 'Account'
		});
		if(!password || !_.isString(password) || password.length < 0){
			logger.log({
				description: 'Valid password is required to hash.',
				password: password, func: 'hashPassword', obj: 'Account'
			});
			return Promise.reject('Valid password is required to hash.');
		}
		return new Promise((resolve, reject) => {
			bcrypt.genSalt(10, (err, salt) => {
				if(err){
					logger.log({
						description: 'Error generating salt',
						error: err, func: 'hashPassword', obj: 'Account'
					});
					return reject(err);
				}
			  bcrypt.hash(password, salt, (err, hash) => {
					//Add hash to accountData
					if(err){
						logger.log({
							description: 'Error Hashing password.',
							error: err, func: 'hashPassword', obj: 'Account'
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
	 * @description Create new account
	 * @param {string} password - Password with which to create account
	 * @param {string} application - Application with which to create account
	 */
	createWithPass: function(password, application) {
		var self = this;
		if(!self.username){
			logger.warn({
				description: 'Username is required to create a new account.',
				func: 'createWithPass', obj: 'Account'
			});
			return Promise.reject({
				message: 'Username required to create a new account.'
			});
		}
		if(!password || !_.isString(password)){
			logger.error({
				description: 'Invalid password.',
				password: password,
				func: 'createWithPass', obj: 'Account'
			});
			return Promise.reject({
				message: 'Invalid password.'
			});
		}
		var findObj = {username: self.username};
		if(application) {
			//TODO: Make sure that this is an id not an application object
			findObj.application = application;
		} else {
			logger.warn({
				description: 'Creating a user without an application.',
				func: 'createWithPass', obj: 'Account'
			});
		}
		var query = self.model('Account').findOne(findObj);
		return query.then((foundAccount) => {
			if(foundAccount){
				logger.warn({
					description: 'A user with provided username already exists',
					user: foundAccount, func: 'createWithPass', obj: 'Account'
				});
				return Promise.reject({message: 'A user with that username already exists.'});
			}
			logger.log({
				description: 'User does not already exist.',
				func: 'createWithPass', obj: 'Account'
			});
			return self.hashPassword(password).then((hashedPass) => {
				self.password = hashedPass;
				logger.log({
					description: 'Before save.',
					func: 'createWithPass', obj: 'Account'
				});
				return self.save().then((newAccount) => {
					logger.log({
						description: 'New account created successfully.',
						newAccount: newAccount,
						func: 'createWithPass', obj: 'Account'
					});
					return newAccount;
				}, (err) => {
					logger.error({
						description: 'Error creating new account.',
						error: err, func: 'createWithPass', obj: 'Account'
					});
					if(err && err.code && err.code === 11000){
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
			}, (err) => {
				logger.error({
					description: 'Error hashing password.',
					error: err, func: 'createWithPass', obj: 'Account'
				});
				return Promise.reject(err);
			});
		}, (err) => {
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
