var db = require('./../lib/db');
var mongoose = require('mongoose');
var fileStorage = require('../lib/fileStorage');
var q = require('q');
var _ = require('underscore');
var sqs = require('./../lib/sqs');

var User = require('./user').User;

var ApplicationSchema = new mongoose.Schema({
	owner:{type: mongoose.Schema.Types.ObjectId, ref:'User'},
	name:{type:String, default:'', unique:true, index:true},
	frontend:{
		siteUrl:{type:String},
		bucketUrl:{type:String},
		provider:{type:String, default:'amazon'},
		bucketName:{type:String}
	},
	// server:{
	// 	url:{type:String, default:''},
	// 	provider:{type:String, default:'Heroku'},
	// 	appName:{type:String, default:''}
	// },
	groups:[{type:mongoose.Schema.Types.ObjectId, ref:'Group'}],
	collaborators:[{type: mongoose.Schema.Types.ObjectId, ref:'User'}],
	createdAt: { type: Date, default: Date.now},
	updatedAt: { type: Date, default: Date.now}
});

ApplicationSchema.set('collection', 'applications');

// Prefix applied to bucketname
var bucketPrefix = "hypercube-test1-";

ApplicationSchema.methods = {
	saveNew: function(){
		var d = q.defer();
		this.save(function (err, newApplication) {
			if (err) { 
				console.error('[Application.saveNew()] Error saving Application:', err);
				d.reject(err); 
			}
			if (!newApplication) {
				console.error('[Application.saveNew()] Application could not be saved');
				d.reject(Error('Application could not be saved.'));
			}
			d.resolve(newApplication);
		});
		return d.promise;
	},
	findPromise:function(){
		var d = q.defer();
		var query = Application.findOne({name:appName}).populate({path:'owner', select:'username name title email'});
		query.exec(function (err, foundApp){
			if(err) { 
				console.error('[Application.findPromise()] Error finding application:', JSON.stringify(err));
				d.reject();
				return res.status(500).send('Error applying template to Application.');
			} else if(!foundApp){
				console.error('[Application.findPromise()] Application not found.');
				return res.status(400).send('Application could not be found.');
			} else {
				d.resolve(foundApp);
			}
		});
		return d.promise;
	},
	createWithTemplate:function(templateName){
		var self = this;
		var d = q.defer();
		this.createWithStorage().then(function (newApplication){
			// console.log('[application.createWithStorage] new app saved successfully', newApplication);
			self.applyTemplate(templateName).then(function(){
				// console.log('[application.createWithStorage] storage created successfully', newApplication);
				d.resolve(newApplication);
			}, function (err){
				console.log('[Application.createWithStorage] error creating storage', err);
				d.reject(err);
			});
		}, function (err){
			console.log('[Application.createWithStorage] error saving new', err);
			d.reject(err);
		});
		return d.promise;
	},
	createWithStorage:function(){
		var self = this;
		var d = q.defer();
		this.saveNew().then(function (newApplication){
			// console.log('[application.createWithStorage] new app saved successfully', newApplication);
			self.createStorage().then(function(){
				// console.log('[application.createWithStorage] storage created successfully', newApplication);
				d.resolve(newApplication);
			}, function (err){
				console.log('[Application.createWithStorage] error creating storage', err);
				d.reject(err);
			});
		}, function (err){
			console.log('[Application.createWithStorage] error saving new', err);
			d.reject(err);
		});
		return d.promise;
	},
	createStorage:function(storageData){
		//TODO: Handle storageData including provider and name prefix
		var self = this;
		var d = q.defer();
		var bucketName = bucketPrefix + this.name;
		bucketName = bucketName.toLowerCase();
		fileStorage.createBucket(bucketName).then(function(bucket){
			console.log("[Application.createStorage()] New storage created:", bucket);
			// TODO: Handle different bucket regions and site urls
			self.frontend = {bucketName:bucketName, provider:'Amazon', siteUrl:bucketName+".s3-website-us-east-1.amazonaws.com", bucketUrl:"s3.amazonaws.com/"+bucketName};
			// console.log('[createStorage()] about to save new with bucket info:', self);
			self.saveNew().then(function (appWithStorage){
				// console.log('[createStorage()]AppsWithStorage saved with storage:', appWithStorage);
				d.resolve(appWithStorage);
			}, function (err){
				console.error('[Application.createStorage()] Error saving storage information to application :', err);
				d.reject(err);
			});
		}, function (err){
			console.error('[Application.createStorage()] Error creating bucket :', err);
			d.reject(err);
		});
		return d.promise;
	},
	removeStorage:function(){
		var d = q.defer();
		if(!_.has(this, 'frontend') || !_.has(this.frontend, 'bucketName')){
			console.log('No frontend to remove storage of');
			d.resolve();
		} else {
			fileStorage.deleteBucket(this.frontend.bucketName).then(function (){
				d.resolve();
			}, function (err){
				if(err && err.code == "NoSuchBucket"){
					console.log('Removing storage was not nessesary');
					d.resolve();
				} else {
					d.reject(err);
				}
			});
		}
		return d.promise;
	},
	applyTemplate:function(templateName){
		if(!templateName || _.isUndefined(templateName)){
			templateName = 'default';
		}
		//TODO: Check that the template was actually uploaded
		return sqs.add(this.frontend.bucketName + ':' + templateName);
	},
	//Upload file to bucket
	publishFile: function(fileData){
		var d = q.defer();
		var self = this;
		fileStorage.saveFile(this.frontend.bucketName, fileData).then(function (newFile){
			d.resolve(newFile);
		}, function (err){
			console.error('[Application.publishFile()] Error publishing file:', err);
			d.reject(err);
		});
		return d.promise;
	},
	//Get a signed url file actions
	signedUrl:function(urlData){
		return fileStorage.signedUrl(urlData);
	},
	getStructure:function(){
		return fileStorage.getFiles(this.frontend.bucketName);
	},
	addCollaborators:function(usersArray){
		var self = this;
		var userPromises = [];
		//TODO: Check to see if user exists and is already a collaborator before adding
		if(usersArray && _.isArray(usersArray)){
			usersArray.forEach(function (user){
				var d = q.defer();
				userPromises.push(d);
				findUser(user).then(function (foundUser){
					console.log('[Application.addCollaborators()] Found collaborator:', foundUser);
					//Add User's ObjectID to application's collaborators
					self.collaborators.push(foundUser._id);
					d.resolve(foundUser);
				}, function (err){
					console.error('[Application.addCollaborators()] Error finding user:', user);
					d.reject(err);
				});
			});
		}
		//Add save promise to end of promises list
		return q.all(userPromises).then(function (usersArray){
			console.log('collaborators all found:', usersArray);
			return self.saveNew();
		}, function(err){
			console.error('Error with userPromises', err);
			return;
		});
	}
};
function findUser(find){
	var d = q.defer();
	var findObj = {};
	if(_.isString(find)){
		//Assume username
		findObj = {username:find};
	} else if(_.isNumber()){
		//Assume find is objectId
		findObj._id = find;
	} else {
		//Assume find is object
		findObj = find;
	}
	User.find(findObj).exec(function (err, foundUser){
		if(err) {
			console.error('Error finding user:', user);
			d.reject({message:'Error Adding collaborator.', error:err});
		} else if(!foundUser){
			console.error('User could not be found:', user);
			d.reject({message:'User could not be found', user:user});
		} else {
			d.resolve(foundUser);
		}
	});
	return d.promise;
}
/*
 * Construct `User` model from `UserSchema`
 */
db.hypercube.model('Application', ApplicationSchema);

/*
 * Make model accessible from controllers
 */
var Application = db.hypercube.model('Application');
Application.collectionName = ApplicationSchema.get('collection');

exports.Application = db.hypercube.model('Application');
