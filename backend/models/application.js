var conf  = require('../config/default').config,
db = require('../utils/db'),
mongoose = require('mongoose'),
fileStorage = require('../utils/fileStorage'),
q = require('q'),
_ = require('underscore'),
sqs = require('../utils/sqs');

var Account = require('./account').Account; //undefined?
var Directory = require('./directory').Directory;

//Set bucket prefix
var bucketPrefix = "tessellate-";
if(_.has(conf, 's3') && _.has(conf.s3, 'bucketPrefix')) {
	bucketPrefix = conf.s3.bucketPrefix;
}

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
},
	{
		toJSON:{virtuals:true}
	});

ApplicationSchema.set('collection', 'applications');

/*
 * Id virtual
 */
ApplicationSchema.virtual('id')
.get(function (){
	return this._id;
});

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
	// findPromise:function(){
	// 	var d = q.defer();
	// 	var query = Application.findOne({name:appName}).populate({path:'owner', select:'username name title email'});
	// 	query.exec(function (err, foundApp){
	// 		if(err) { 
	// 			console.error('[Application.findPromise()] Error finding application:', JSON.stringify(err));
	// 			d.reject();
	// 			return res.status(500).send('Error applying template to Application.');
	// 		} else if(!foundApp){
	// 			console.error('[Application.findPromise()] Application not found.');
	// 			return res.status(400).send('Application could not be found.');
	// 		} else {
	// 			d.resolve(foundApp);
	// 		}
	// 	});
	// 	return d.promise;
	// },
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
				findAccount(user).then(function (foundAccount){
					console.log('[Application.addCollaborators()] Found collaborator:', foundAccount);
					//Add Account's ObjectID to application's collaborators
					self.collaborators.push(foundAccount._id);
					d.resolve(foundAccount);
				}, function (err){
					console.error('[Application.addCollaborators()] Error finding user:', user);
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
	login:function(loginData){
		//Search for account in application's directories
		var d = q.defer();
		this.findAccountInDirectories(loginData).then(function (foundAccount){
			foundAccount.login(loginData.password).then(function (loggedInData){
				console.log('Account login successful', loggedInData);
				d.resolve({account:foundAccount.strip(), token:loggedInData});
			}, function (err){
				console.log('Error logging into account');
				d.reject(err);
			});
		}, function (err){
			d.reject(err);
		});
		return d.promise;
	},
	signup:function(signupData) {
		var d = q.defer();
		var self = this;
		/*if(this.directories.length < 1){
			//If no directories exist, create a default one with a users group
			this.addDirectory().then(function (newDir){
				console.log('New Directory created successfully');
				//TODO: Include this into the rest of the promise chain
				// d.resolve(newDir);
			}, function (err){
				console.error('Directory could not be created.');
				d.reject(err);
			});
		}*/
		this.findAccountInDirectories(loginData).then(function (foundAccount){
			console.log('Account already exists in application directories');
			d.reject({message:'Account already exists in application directories.'});
		}, function (err){
			//TODO: Handle other errors

			//Account is not in directories
			console.log('Account does not already exist in directories', err);
			var account = new Account(_.omit(signupData, 'password'));
			account.createWithPass(signupData.password).then(function(newAccount){
				//Account did not yet exist, so it was created

				//TODO: Add to a group if none specified
				// newAccount.addToGroup();
				d.resolve(newAccount);
			}, function (err){
				if(err && err.status == 'EXISTS'){
					//Add to account to directory
					console.log('[Application.signup()] looking for directory with id:', self.directories[0]._id)
					var dQuery = self.models('Directory').findOne({_id:self.directories[0]._id});
					dQuery.exec(function(err, result){
						if(err){
							console.error('[Application.signup()] Error saving new account', err);
							return d.reject(err);
						}
						if(!result){
							console.error('[Application.signup()] Directory not found.');
							return d.reject(err);
						}
						//TODO: Make sure account does not already exist in directory before adding.
						result.addAccount(account).then(function(dirWithAccount){
							console.log('[Application.signup()] Directory with account:', dirWithAccount);
							d.resolve(dirWithAccount);
						}, function (err){
							console.error('[Application.signup()] Error adding account to directory:', err);
							d.reject(err);
						});
					});
				} else {
					console.error('[Application.signup()] Error creating new account.', err);
					d.reject(err);
				}
			});
		});
		return d.promise;
	},
	logout:function(logoutData){
		//Log the user out
		//TODO: Make this work
		// this.model('Account').findOne({username:logoutData.username});
		var d = q.defer();
		this.findAccountInDirectories(loginData).then(function (foundAccount){
			foundAccount.logout(loginData.password).then(function (loggedInData){
				console.log('Account login successful', loggedInData);
				d.resolve(foundAccount.strip());
			}, function (err){
				console.log('Error logging into account');
				d.reject(err);
			});
		}, function (err){
			d.reject(err);
		});
		return d.promise;
	},
	findAccountInDirectories:function(accountData){
		//Loop through directories, checking each one until account is found
		//TODO: Only keep searching until account is found instead of searching all directories
		var self = this;
		var d = q.defer();
		var searchPromises = [];
		if(this.directories.length < 1) {
			d.reject({message:'This application does not have any user directories.'});
		} else {
			_.each(self.directories, function (directoryData){
				//TODO: Find by things other than username
				var dirPromise = q.defer();
				searchPromises.push(dirPromise.promise);
				var directory = new Directory(directoryData);
				directory.findAccount(accountData).then(function (account){
					console.log('[Application.findAccountInDirectories()] account found in directory:', account);
					dirPromise.resolve(account);
				}, function(err){
					console.error('[Application.findAccountInDirectories()] Error finding account in directory', err);
					dirPromise.reject(err);
				});
			});
			q.all(searchPromises).then(function (directorySearches){
				if(directorySearches){
					console.log('[Application.findAccountInDirectories()] directory queries finished:', directorySearches);
					var foundAccountInd = _.findIndex(directorySearches, function (search){
						return search;
					});
					console.log('[Application.findAccountInDirectories()] Index of directory containing account:', foundAccountInd);
					console.log('[Application.findAccountInDirectories()] found account from array:', directorySearches[foundAccountInd]);
					d.resolve(directorySearches[foundAccountInd]);
				} else {
					console.error('[Application.findAccountInDirectories()] No directorySearches array returned.');
					d.reject();
				}
			}, function (err){
				console.error('[Application.findAccountInDirectories()] Error searching directories:', err);
				d.reject(err);
			});
		}
		return d.promise;
	},
	addDirectory:function(directory){
		//TODO: Handle checking for and creating a new directory if one doesn't exist
		//TODO: Make sure this directory does not already exist in this application
		this.directories.push(directory._id);
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
		//TODO: make sure that group does not already exist in this application
		// if(indexOf(this.groups, group._id) == -1){
		// 	console.error('This group already exists application');
		// 	return;
		// }
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
db.tessellate.model('Application', ApplicationSchema);

/*
 * Make model accessible from controllers
 */
var Application = db.tessellate.model('Application');
Application.collectionName = ApplicationSchema.get('collection');

exports.Application = db.tessellate.model('Application');
