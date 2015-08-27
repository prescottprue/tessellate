var db = require('./../utils/db');
var mongoose = require('mongoose');
var _ = require('underscore');
var sessionCtrls = require('../controllers/session');
var Session = require('./session').Session;
var Q = require('q');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var config = require('../config/default').config;

//Schema Object
//collection name
//model name

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

// AccountSchema.virtual('id')
// .get(function (){
// 	return this._id;
// })
// .set(function (id){
// 	return this._id = id;
// });
AccountSchema.methods = {
	//Remove values that should not be sent
	strip: function(){
		return _.omit(this.toJSON(), ["password", "__v", "_id", '$$hashKey']);
	},
	tokenData: function(){
		var data = _.pick(this.toJSON(), ["username", "groups", "sessionId"]);
		console.log('[Account.tokenData()] role:', data.role);
		data.accountId = this.toJSON().id;
		return data;
	},
	//Log account in
	login:function(passwordAttempt){
		var d = Q.defer();
		var self = this;
		//Check password
		self.comparePassword(passwordAttempt).then(function(){
			//Start new session
			self.startSession().then(function(sessionInfo){
				//Create Token
				self.sessionId = sessionInfo._id;
				var token = self.generateToken(sessionInfo);
				d.resolve(token);
			}, function(err){
				d.reject(err);
			});
		}, function(err){
			d.reject(err);
		});
		return d.promise;
	},
	comparePassword: function(passwordAttempt){
		var self = this;
		var d = Q.defer();
		bcrypt.compare(passwordAttempt, self.password, function(err, passwordsMatch){
			if(err){d.reject(err);}
			if(!passwordsMatch){
				d.reject(new Error('Invalid authentication credentials'));
			}
			d.resolve(true);
		});
		return d.promise;
	},
	generateToken: function(session){
		//Encode a JWT with account info
		var tokenData = this.tokenData();
		return jwt.sign(tokenData, config.jwtSecret);
	},
	//Wrap query in promise
	saveNew:function(){
		var d = Q.defer();
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
		var deferred = Q.defer();
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
		var deferred = Q.defer();
		//Find session by accountId and update with active false
		Session.update({_id:this.sessionId, active:true}, {active:false, endedAt:Date.now()}, {upsert:false}, function (err, affect, result) {
			console.log('[Account.endSession()] Session update:', err, affect, result);
			if (err) { deferred.reject(err); }
			if (!result) {
				console.log('Error finding session to end');
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
		var d = Q.defer();
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
		//TODO: Hash password
		//Save new account with password
		var d = Q.defer();
		var self = this;
		self.hashPassword(password).then(function (hashedPass){
			self.password = hashedPass;
			self.saveNew().then(function(newAccount){
				d.resolve(newAccount);
			}, function(err){
				d.reject(err);
			});
		}, function(err){
			d.reject(err);
		});
		return d.promise;
	}
};
/*
 * Construct `Account` model from `AccountSchema`
 */
db.hypercube.model('Account', AccountSchema);
/*
 * Make model accessible from controllers
 */
var Account = db.hypercube.model('Account');
Account.collectionName = AccountSchema.get('collection');

exports.Account = db.hypercube.model('Account');
