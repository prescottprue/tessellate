var conf  = require('../config/default').config,
db = require('../utils/db'),
mongoose = require('mongoose'),
fileStorage = require('../utils/fileStorage'),
q = require('q'),
_ = require('underscore'),
sqs = require('../utils/sqs');



var Account = require('./account').Account;

var ApplicationSchema = new mongoose.Schema({
	owner:{type: mongoose.Schema.Types.ObjectId, ref:'Account'},
	name:{type:String, default:'', unique:true, index:true},
	frontend:{
		siteUrl:{type:String},
		bucketUrl:{type:String},
		provider:{type:String, default:'amazon'},
		bucketName:{type:String}
	},
	server:{
		url:{type:String},
		provider:{type:String},
		appName:{type:String}
	},
	groups:[{type:mongoose.Schema.Types.ObjectId, ref:'Group'}],
	collaborators:[{type: mongoose.Schema.Types.ObjectId, ref:'Account'}],
	directories:[{type: mongoose.Schema.Types.ObjectId, ref:'Directory'}],
	createdAt: { type: Date, default: Date.now},
	updatedAt: { type: Date, default: Date.now}
});

ApplicationSchema.set('collection', 'applications');

//Set bucket prefix
var bucketPrefix = "tessellate-";
if(_.has(conf, 's3') && _.has(conf.s3, 'bucketPrefix')) {
	bucketPrefix = conf.s3.bucketPrefix;
}

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
	addCollaborators:function(accountsArray){
		var self = this;
		var accountPromises = [];
		//TODO: Check to see if account exists and is already a collaborator before adding
		if(accountsArray && _.isArray(accountsArray)){
			accountsArray.forEach(function (account){
				var d = q.defer();
				accountPromises.push(d);
				findAccount(account).then(function (foundAccount){
					console.log('[Application.addCollaborators()] Found collaborator:', foundAccount);
					//Add Account's ObjectID to application's collaborators
					self.collaborators.push(foundAccount._id);
					d.resolve(foundAccount);
				}, function (err){
					console.error('[Application.addCollaborators()] Error finding account:', account);
					d.reject(err);
				});
			});
		}
		//Add save promise to end of promises list
		return q.all(accountPromises).then(function (accountsArray){
			console.log('collaborators all found:', accountsArray);
			return self.saveNew();
		}, function(err){
			console.error('Error with accountPromises', err);
			return;
		});
	},
	login:function(){
		//Search for account in application's directories
		var searchPromises = [];
		var d = Q.defer();
		var self = this;
		//TODO: Only search directories until a user is found (instead of all)
		_.each(this.directories, function(directory){
			//TODO: Find by things other than username
			var d = Q.defer();
			searchPromises.push(d);
			directory.findAccount(self).then(function (account){
				d.resolve(account);
			}, function(err){
				console.error('Error finding account in directory', err);
				d.reject(err);
			});
		});
		Q.all(searchPromises).then(function (directorySearches){
			if(directorySearches){
				console.log('directory queries finished:', directorySearches);
				var foundAccount = _.find(directorySearches, function (search){
					return search;
				});
				var account = new Account(foundAccount);
				account.login(loginData).then(function(loggedInAccount){
					console.log('Account login successful', loggedInAccount);
					d.resolve(loggedInAccount);
				}, function(err){
					d.reject(err);
				});
			}
		}, function (err){
			console.error('Error searching directories:', err);
			d.reject(err);
		});
		return d.promise;
	},
	signup:function(signupData) {

	},
	logout:function(){

	},
	addDirectory:function(directory){
		//TODO: Handle checking for and creating a new directory if one doesn't exist
		this.accounts.push(directory._id);
		return this.saveNew();
	},
	addNewGroup:function(){
		var group = new Group(groupData);
		var self = this;
		return group.saveNew().then(function(){
			self.groups.push(group._id);
			return self.saveNew();
		});
	},
	addGroup:function(group){
		//TODO: make sure that group does not already exist
		this.groups.push(group._id);
		return this.saveNew();
	}
};
function findAccount(find){
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
	Account.find(findObj).exec(function (err, foundAccount){
		if(err) {
			console.error('Error finding account:', account);
			d.reject({message:'Error Adding collaborator.', error:err});
		} else if(!foundAccount){
			console.error('Account could not be found:', account);
			d.reject({message:'Account could not be found', account:account});
		} else {
			d.resolve(foundAccount);
		}
	});
	return d.promise;
}
/*
 * Construct `Account` model from `AccountSchema`
 */
db.hypercube.model('Application', ApplicationSchema);

/*
 * Make model accessible from controllers
 */
var Application = db.hypercube.model('Application');
Application.collectionName = ApplicationSchema.get('collection');

exports.Application = db.hypercube.model('Application');
