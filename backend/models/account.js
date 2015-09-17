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
// 			console.log('was a string');
// 			group = JSON.parse(group);
// 		}
// 		console.log('group:', group);
// 		if(_.has(group, 'name')){
// 			return group.name;
// 		} else {
// 			console.log('but it does not exist');
// 			return group;
// 		}
// 	});
// 	console.log('names array:', namesArray);
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
	tokenData: function(){
		var data = _.pick(this.toJSON(), ["username", "groups", "sessionId", "groupNames"]);
		logger.log({description: 'Token data selected.', tokenData: data, func: 'tokenData', obj: 'Account'});
		data.accountId = this.toJSON().id;
		return data;
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
		var d = q.defer();
		logger.log({description: 'Compare password called.', func: 'comparePassword', obj: 'Account'});
		bcrypt.compare(passwordAttempt, self.password, function (err, passwordsMatch){
			if(err){
				logger.error({description: 'Error comparing password.', func: 'comparePassword', obj: 'Account'});
				d.reject(err);
			} else if(!passwordsMatch){
				logger.log({description: 'Passwords do not match.', func: 'comparePassword', obj: 'Account'});
				d.reject({message:'Invalid authentication credentials'});
			} else {
				logger.log({description: 'Passwords match.', func: 'comparePassword', obj: 'Account'});
				d.resolve(true);
			}
		});
		return d.promise;
	},
	generateToken: function(session){
		//Encode a JWT with account info
		logger.log({description: 'Generate token called.', func: 'generateToken', obj: 'Account'});
		var tokenData = this.tokenData();
		var token = jwt.sign(tokenData, conf.jwtSecret);
		logger.log({description: 'Token generated.', token: token, func: 'generateToken', obj: 'Account'});
		return token;
	},
	//Wrap query in promise
	saveNew:function(){
		var d = q.defer();
		var self = this;
		this.save(function (err, result){
			if(err) { d.reject(err);}
			if(!result){
				d.reject(new Error('New Account could not be saved'));
			}
			d.resolve(result);
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
		var deferred = q.defer();
		var session = new Session({accountId:this._id});
		session.save(function (err, result) {
			if (err) { deferred.reject(err); }
			if (!result) {
				deferred.reject(new Error('Session could not be added.'));
			}
			deferred.resolve(result);
		});
		return deferred.promise;
	},
	endSession: function(){
		//Find current session and mark it as ended
		//Set active to false
		console.log('[Account.endSession()] Ending session with id:', this.sessionId);
		/** End Session Function
		 * @description Create a new session and return a promise
		 * @params {String} email - Email of Session
		 */
		var deferred = q.defer();
		//Find session by accountId and update with active false
		Session.update({_id:this.sessionId, active:true}, {active:false, endedAt:Date.now()}, {upsert:false}, function (err, affect, result) {
			console.log('[Account.endSession()] Session update:', err, affect, result);
			if (err) { deferred.reject(err); }
			if (!affect && affect.nModified == 0) {
				console.log('Error finding session to end.');
				deferred.reject(new Error('Session could not be added.'));
			}
			if(affect.nModified != 1){
				console.log('[Account.endSession()] Multiple sessions were ended', affect);
			}
			deferred.resolve(result);
		});
		return deferred.promise;
	},
	hashPassword:function(password){
		var d = q.defer();
		console.log('[Account.hashPassword()] Hashing password');
		bcrypt.genSalt(10, function(err, salt) {
			if(err){
				console.log('[Account.hashPassword()] Error generating salt:', err);
				d.reject(err);
			}
		  bcrypt.hash(password, salt, function(err, hash) {
				//Add hash to accountData
				if(err){
					console.log('[Account.hashPassword()] Error Hashing password:', err);
					d.reject(err);
				}
				d.resolve(hash);
			});
		});
		return d.promise;
	},
	createWithPass:function(password){
		//Save new account with password
		//TODO: Add to default directory if none specified
		var d = q.defer();
		var self = this;
		var query = this.model('Account').findOne({username:self.username});
		query.exec(function(err, result){
			if(err){
				console.log('Error querying accounts:', err);
				return d.reject(err);
			}
			if(result){
				logger.log({description: 'A user with this username already exists', func: 'createWithPass', obj: 'Account'});
				return d.reject({message:'A user with this username already exists', status:'EXISTS'});
			}
			self.hashPassword(password).then(function (hashedPass){
				self.password = hashedPass;
				self.saveNew().then(function (newAccount){
					d.resolve(newAccount);
				}, function (err){
					d.reject(err);
				});
			}, function (err){
				d.reject(err);
			});
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
