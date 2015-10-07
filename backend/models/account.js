//Internal Config/Utils/Classes
var conf  = require('../config/default').config,
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
var AccountSchema = new mongoose.Schema(
	{
		username:{type:String, index:true, unique:true},
		name:{type: String},
		email:{type: String, index:true, unique:true},
		title:{type: String},
		password:{type: String},
		sessionId:{type:mongoose.Schema.Types.ObjectId, ref:'Session'},
		groups:[{type:mongoose.Schema.Types.ObjectId, ref:'Group'}],
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
.get(() => {
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
	strip: () => {
		var strippedAccount = _.omit(this.toJSON(), ["password", "__v", '$$hashKey']);
		logger.log({description: 'Strip called.', strippedAccount: strippedAccount, func: 'strip', obj: 'Account'});
		return _.omit(this.toJSON(), ["password", "__v", '$$hashKey']);
	},
	/**
	 * @function tokenData
	 * @description Get data used within token
	 */
	tokenData: () => {
		var data = _.pick(this.toJSON(), ["username", "groups", "sessionId", "groupNames"]);
		logger.log({description: 'Token data selected.', func: 'tokenData', obj: 'Account'});
		data.accountId = this.toJSON().id;
		return data;
	},
	/**
	 * @function generateToken
	 * @description Encode a JWT with account info
	 */
	generateToken: (session) => {
		logger.log({description: 'Generate token called.', func: 'generateToken', obj: 'Account'});
		var tokenData = this.tokenData();
		var token = jwt.sign(tokenData, conf.jwtSecret);
		logger.log({description: 'Token generated.', func: 'generateToken', obj: 'Account'});
		return token;
	},
	/**
	 * @function login
	 * @description Log account in based on password attempt
	 * @param {string} password - Attempt at password with which to login to account.
	 */
	login:(passwordAttempt) => {
		logger.log({description: 'Login called.', func: 'login', obj: 'Account'});
		//Check password
		var self = this; //this contexts were causing errors even though => should pass context automatically
		if(!this.password){
			logger.warn({description: 'Original query did not include password. Consider revising.', func: 'login', obj: 'Account'});
			return this.model('Account').findById(self._id).then(self.login(passwordAttempt));
		}
		return self.comparePassword(passwordAttempt).then(() => {
			logger.log({description: 'Provided password matches.', func: 'login', obj: 'Account'});
			//Start new session
			return self.startSession().then((sessionInfo) => {
				logger.log({description: 'Session started successfully.', func: 'login', obj: 'Account'});
				//Create Token
				this.sessionId = sessionInfo._id;
				var token = self.generateToken(sessionInfo);
				return {token: token, account: self.strip()};
			}, (err) => {
				logger.error({description: 'Error starting session.', error: err, func: 'login', obj: 'Account'});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({description: 'Error comparing password.', attempt: passwordAttempt, error: err, func: 'login', obj: 'Account'});
			return Promise.reject(err);
		});
	},
	/**
	 * @function login
	 * @description Log account out (end session and invalidate token)
	 */
	logout:() => {
		//TODO: Invalidate token?
		logger.log({description: 'Logout called.', func: 'logout', obj: 'Account'});
		return this.endSession().then(() => {
			logger.log({description: 'Logout successful.', func: 'logout', obj: 'Account'});
			return {message: 'Logout successful.'};
		}, (err) => {
			logger.error({description: 'Error ending session.', error: err, func: 'logout', obj: 'Account'});
			return {message: 'Logout successful.'};
		});
	},
	/**
	 * @function signup
	 * @description Signup a new account
	 */
	signup: (signupData) => {
		logger.log({description: 'Signup called.', signupData: signupData, func: 'Signup', obj: 'Account'});
		var query;
	},
	/**
	 * @function comparePassword
	 * @description Compare a password attempt with account password
	 */
	comparePassword: (passwordAttempt) => {
		var selfPassword = this.password;
		logger.log({description: 'Compare password called.', func: 'comparePassword', obj: 'Account'});
		return new Promise((resolve, reject) => {
			bcrypt.compare(passwordAttempt, selfPassword, (err, passwordsMatch) => {
				if(err){
					logger.error({description: 'Error comparing password.', error: err, func: 'comparePassword', obj: 'Account'});
					reject(err);
				} else if(!passwordsMatch){
					logger.warn({description: 'Passwords do not match.', func: 'comparePassword', obj: 'Account'});
					reject({message:'Invalid authentication credentials'});
				} else {
					logger.log({description: 'Passwords match.', func: 'comparePassword', obj: 'Account'});
					resolve(true);
				}
			});
		});
	},
	/**
	 * @function saveNew
	 * @description DEPRECATED Wrap query in promise
	 */
	saveNew:() => {
		logger.warn({description: 'saveNew is no longer nessesary since save returns a promise.', func: 'saveNew', obj: 'Account'});
		return this.save().then((account) => {
			if(!account){
				logger.error({description: 'Account could not be saved.', account: this, func: 'saveNew', obj: 'Account'});
				return Promise.reject({message: 'Account cannot be saved.'});
			} else {
				logger.log({description: 'Account saved successfully.', savedAccount: account, func: 'saveNew', obj: 'Account'});
				return account;
			}
		}, (err) => {
			logger.error({description: 'Error saving Account.', account: this, func: 'saveNew', obj: 'Account'});
			return Promise.reject(err);
		});
	},
	/**
	 * @function startSession
	 * @description Create a new session.
	 */
	startSession: () => {
		var self = this;
		logger.log({description: 'Start session called.', func: 'startSession', obj: 'Account', this: self});
		var session = new Session({accountId:self._id});
		return session.save().then((newSession) => {
			if (!newSession) {
				logger.error({description: 'New session was not created.', func: 'startSession', obj: 'Account'});
				return Promise.reject({message: 'Session could not be started.'});
			} else {
				logger.log({description: 'Session started successfully.', newSession: newSession, func: 'startSession', obj: 'Account'});
				return newSession;
			}
		}, (err) => {
			logger.error({description: 'Error saving new session.', error: err, func: 'startSession', obj: 'Account'});
			return Promise.reject(err);
		});
	},
	/**
	 * @function endSession
	 * @description End a current account's session. Session is kept, but "active" parameter is set to false
	 */
	endSession: () => {
		logger.log({description: 'End session called.', func: 'endSession', obj: 'Account'});
		var self = this;
		return new Promise((resolve, reject) => {
			Session.update({_id:self.sessionId, active:true}, {active:false, endedAt:Date.now()}, {upsert:false}, (err, affect, result) => {
				if(err){
					logger.info({description: 'Error ending session.', error: err, func: 'endSession', obj: 'Account'});
					return reject({message: 'Error ending session.'});
				}
				if (affect.nModified > 0) {
					logger.info({description: 'Session ended successfully.', session: result, affect: affect, func: 'endSession', obj: 'Account'});
					if(affect.nModified != 1){
						logger.error({description: 'More than one session modified.', session: result, affect: affect, func: 'endSession', obj: 'Account'});
					}
					resolve(result);
				} else {
					logger.warn({description: 'Affect number incorrect?', func: 'endSession', affect: affect, sesson: result, error: err, obj: 'Account'});
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
		logger.log({description: 'Hashing password.', func: 'hashPassword', obj: 'Account'});
		return new Promise((resolve, reject) => {
			bcrypt.genSalt(10, (err, salt) => {
				if(err){
					logger.log({description: 'Error generating salt', error: err, func: 'hashPassword', obj: 'Account'});
					return reject(err);
				}
			  bcrypt.hash(password, salt, (err, hash) => {
					//Add hash to accountData
					if(err){
						logger.log({description: 'Error Hashing password.', error: err, func: 'hashPassword', obj: 'Account'});
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
	 */
	createWithPass: (password) => {
		var self = this;
		var query = this.model('Account').findOne({username: self.username});
		return query.then((result) => {
			if(result){
				logger.warn({description: 'A user with provided username already exists', user: result, func: 'createWithPass', obj: 'Account'});
				return Promise.reject({message: 'A user with that username already exists.'});
			}
			logger.log({description: 'User created successfully.', func: 'createWithPass', obj: 'Account'});
			return self.hashPassword(password).then((hashedPass) => {
				self.password = hashedPass;
				return self.saveNew().then((newAccount) => {
					logger.log({description: 'New account created successfully.', func: 'createWithPass', obj: 'Account'});
					return newAccount;
				}, (err) => {
					logger.error({description: 'Error creating new account.', error: err, func: 'createWithPass', obj: 'Account'});
					return Promise.reject(err);
				});
			}, (err) => {
				logger.error({description: 'Error hashing password.', error: err, func: 'createWithPass', obj: 'Account'});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({description: 'Error searching for matching account.', error: err, func: 'createWithPass', obj: 'Account'});
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
