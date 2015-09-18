//Internal Config/Utils/Classes
var conf  = require('../config/default').config,
logger = require('../utils/logger'),
db = require('./../utils/db'),
Session = require('./session').Session,
Group = require('./group').Group;

//External Libs
var mongoose = require('mongoose'),
_ = require('lodash'),
q = require('q'),
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
/*
 * Set collection name to 'account'
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
.get(function (){
	return this._id;
})
// .set(function (id){
// 	return this._id = id;
// });
AccountSchema.methods = {
	//Remove values that should not be sent
	strip: function(){
		var strippedAccount = _.omit(this.toJSON(), ["password", "__v", '$$hashKey']);
		logger.log({description: 'Strip called.', account: this, strippedAccount: strippedAccount, func: 'strip', obj: 'Account'});
		return _.omit(this.toJSON(), ["password", "__v", '$$hashKey']);
	},
	//Get data used within token
	tokenData: function(){
		var data = _.pick(this.toJSON(), ["username", "groups", "sessionId", "groupNames"]);
		logger.log({description: 'Token data selected.', tokenData: data, func: 'tokenData', obj: 'Account'});
		data.accountId = this.toJSON().id;
		return data;
	},
	//Encode a JWT with account info
	generateToken: function(session){
		logger.log({description: 'Generate token called.', func: 'generateToken', obj: 'Account'});
		var tokenData = this.tokenData();
		var token = jwt.sign(tokenData, conf.jwtSecret);
		logger.log({description: 'Token generated.', token: token, func: 'generateToken', obj: 'Account'});
		return token;
	},
	//Log account in
	login:function(passwordAttempt){
		var d = q.defer();
		var self = this;
		//Check password
		logger.log({description: 'Login called.', attempt: passwordAttempt, func: 'login', obj: 'Account'});
		self.comparePassword(passwordAttempt).then(function(){
			logger.log({description: 'Provided password matches.', func: 'login', obj: 'Account'});
			//Start new session
			self.startSession().then(function (sessionInfo){
				logger.info({description: 'Session started successfully.', func: 'login', obj: 'Account'});
				//Create Token
				self.sessionId = sessionInfo._id;
				var token = self.generateToken(sessionInfo);
				d.resolve(token);
			}, function (err){
				logger.error({description: 'Error logging in.', func: 'login', obj: 'Account'});
				d.reject(err);
			});
		}, function (err){
			logger.error({description: 'Error comparing password.', func: 'login', obj: 'Account'});
			d.reject(err);
		});
		return d.promise;
	},
	//Log account out (end session and invalidate token)
	logout:function(){
		var d = q.defer();
		//TODO: Invalidate token?
		//End session
		logger.log({description: 'Logout called.', func: 'logout', obj: 'Account'});
		this.endSession().then(function(){
			logger.log({description: 'Logout successful.', func: 'logout', obj: 'Account'});
			d.resolve({message: 'Logout successful.'});
		}, function (err){
			logger.error({description: 'Error ending session.', error: err, func: 'logout', obj: 'Account'});
			d.resolve({message: 'Logout successful.'});
			// d.reject(err);
		});
		return d.promise;
	},
	comparePassword: function(passwordAttempt){
		var self = this;
		logger.log({description: 'Compare password called.', func: 'comparePassword', obj: 'Account'});
		var d = q.defer();
		bcrypt.compare(passwordAttempt, self.password, function (err, passwordsMatch){
			if(err){
				logger.error({description: 'Error comparing password.', func: 'comparePassword', obj: 'Account'});
				d.reject(err);
			} else if(!passwordsMatch){
				logger.warn({description: 'Passwords do not match.', func: 'comparePassword', obj: 'Account'});
				d.reject({message:'Invalid authentication credentials'});
			} else {
				logger.log({description: 'Passwords match.', func: 'comparePassword', obj: 'Account'});
				d.resolve(true);
			}
		});
		return d.promise;
	},
	//Wrap query in promise
	saveNew:function(){
		var d = q.defer();
		var self = this;
		this.save(function (err, account){
			if(err) {
				logger.error({description: 'Error saving Account.', account: self, func: 'saveNew', obj: 'Account'});
				d.reject(err);
			} else if(!account){
				logger.error({description: 'Account can not be saved.', account: self, error: err, func: 'saveNew', obj: 'Account'});
				d.reject({message: 'Account cannot be saved.'});
			} else {
				logger.log({description: 'Account saved successfully.', savedAccount: account, func: 'saveNew', obj: 'Account'});
				d.resolve(account);
			}
		});
		return d.promise;
	},
	//Create a new session with account information attached
	startSession: function(){
		//Create new session
		/** New Session Function
		 * @description Create a new session and return a promise
		 * @params {String} email - Email of Session
		 */
		//Session does not already exist
		logger.log({description: 'Start session called.', func: 'startSession', obj: 'Account'});
		var d = q.defer();
		var session = new Session({accountId:this._id});
		session.save(function (err, newSession) {
			if (err) {
				logger.error({description: 'Error creating new session.', error: err, func: 'startSession', obj: 'Account'});
				d.reject(err); 
			} else if (!newSession) {
				logger.error({description: 'New session was not created.', func: 'startSession', obj: 'Account'});
				d.reject({message: 'Session could not be started.'});
			} else {
				logger.log({description: 'Session started successfully.', newSession: newSession, func: 'startSession', obj: 'Account'});
				d.resolve(newSession);
			}
		});
		return d.promise;
	},
	/** End Session Function
	 * @description Create a new session and return a promise
	 * @params {String} email - Email of Session
	 */
	endSession: function(){
		//Find current session and mark it as ended
		//Set active to false
		logger.log({description: 'End session called.', func: 'endSession', obj: 'Account'});
		var d = q.defer();
		//Find session by accountId and update with active false
		Session.update({_id:this.sessionId, active:true}, {active:false, endedAt:Date.now()}, {upsert:false}, function (err, affect, result) {
			if (!err && affect.nModified > 0) {
				logger.info({description: 'Session ended successfully.', session: result, affect: affect, func: 'endSession', obj: 'Account'});
				if(affect.nModified != 1){
					logger.error({description: 'More than one session modified.', session: result, affect: affect, func: 'endSession', obj: 'Account'});
				}
				d.resolve(result);
			} else if (err) {
				logger.error({description: 'Error ending session.', error: err, func: 'endSession', obj: 'Account'});
				d.reject({message: 'Error ending session.'}); 
			} else {
				logger.error({description: 'Session could not be ended.', func: 'endSession', obj: 'Account'});
				d.reject({message: 'Session could not be ended.'});
			}
		});
		return d.promise;
	},
	hashPassword:function(password){
		var d = q.defer();
		logger.log('[Account.hashPassword()] Hashing password');
		bcrypt.genSalt(10, function(err, salt) {
			if(err){
				logger.log('[Account.hashPassword()] Error generating salt:', err);
				d.reject(err);
			}
		  bcrypt.hash(password, salt, function(err, hash) {
				//Add hash to accountData
				if(err){
					logger.log('[Account.hashPassword()] Error Hashing password:', err);
					d.reject(err);
				}
				d.resolve(hash);
			});
		});
		return d.promise;
	},
	//Save new account with password
	createWithPass:function(password){
		var d = q.defer();
		var self = this;
		var query = this.model('Account').findOne({username:self.username});
		query.exec(function(err, result){
			if(!err && !result){
				logger.log({description: 'User created successfully.', func: 'createWithPass', obj: 'Account'});
				self.hashPassword(password).then(function (hashedPass){
					self.password = hashedPass;
					self.saveNew().then(function (newAccount){
						logger.log({description: 'New account created successfully.', newAccount: newAccount, func: 'createWithPass', obj: 'Account'});
						d.resolve(newAccount);
					}, function (err){
						logger.error({description: 'Error creating new account.', error: err, func: 'createWithPass', obj: 'Account'});
						d.reject(err);
					});
				}, function (err){
					logger.error({description: 'Error hashing password.', error: err, func: 'createWithPass', obj: 'Account'});
					d.reject(err);
				});
			} else if (result) {
				logger.warn({description: 'A user with this username already exists', user: result, func: 'createWithPass', obj: 'Account'});
				d.reject({message:'A user with this username already exists', status:'EXISTS'});
			} else {
				logger.error({description: 'Error searching for matching account.', error: err, func: 'createWithPass', obj: 'Account'});
				d.reject({message: 'Account could not be created.'});
			}
		});
		return d.promise;
	}
};
/*
 * Construct Account model from AccountSchema
 */
db.tessellate.model('Account', AccountSchema);
/*
 * Make model accessible from controllers
 */
var Account = db.tessellate.model('Account');
Account.collectionName = AccountSchema.get('collection');
exports.Account = db.tessellate.model('Account');
