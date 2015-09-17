//Internal Config/Utils/Classes
var conf  = require('../config/default').config,
logger = require('../utils/logger'),
db = require('../utils/db'),
fileStorage = require('../utils/fileStorage');
var Directory = require('./directory');
var Group = require('./group');
var Account = require('./account');

//External Libs
var mongoose = require('mongoose'),
q = require('q'),
_ = require('lodash'),
sqs = require('../utils/sqs');

//Set bucket prefix based on config as well as default if config does not exist
var bucketPrefix = "tessellate-";
if(_.has(conf, 's3') && _.has(conf.s3, 'bucketPrefix')) {
	bucketPrefix = conf.s3.bucketPrefix;
}
//Application schema object
var ApplicationSchema = new mongoose.Schema({
	owner:{type: mongoose.Schema.Types.ObjectId, ref:'Account'},
	name:{type:String, default:'', unique:true, index:true},
	frontend:{
		siteUrl:{type:String},
		bucketUrl:{type:String},
		provider:{type:String, default:'amazon'},
		bucketName:{type:String}
	},
	backend:{
		url:{type:String},
		provider:{type:String},
		appName:{type:String}
	},
	providers:[{name:String, clientId:String}],
	groups:[{type:mongoose.Schema.Types.ObjectId, ref:'Group'}],
	collaborators:[{type: mongoose.Schema.Types.ObjectId, ref:'Account'}],
	directories:[{type: mongoose.Schema.Types.ObjectId, ref:'Directory'}],
	createdAt: { type: Date, default: Date.now},
	updatedAt: { type: Date, default: Date.now}
},
{
	toJSON:{virtuals:true}
});

//Set collection name
ApplicationSchema.set('collection', 'applications');

/*
 * Id virtual
 */
ApplicationSchema.virtual('id')
.get(function (){
	return this._id;
});

ApplicationSchema.methods = {
	//Wrap save functionality in promise and handle errors
	saveNew: function(){
		logger.log({description: 'Save application called.', func: 'saveNew', obj: 'Application'});
		var d = q.defer();
		this.save(function (err, savedApp) {
			if (err) { 
				logger.error({description: 'Error saving Application.', error: err, func: 'saveNew', obj: 'Application'});
				d.reject(err); 
			} else if (!savedApp) {
				logger.error({description: 'Unable to save Application.', func: 'saveNew', obj: 'Application'});
				d.reject({message: 'Application could not be saved.'});
			} else {
				logger.info({description: 'Application saved successfully.', savedApp: savedApp, func: 'saveNew', obj: 'Application'});
				d.resolve(savedApp);
			}
		});
		return d.promise;
	},
	//Find Applicaiton by name. Returns a promise
	findPromise:function(appName){
		logger.log({description: 'Find application called.', func: 'findPromise', obj: 'Application'});
		var d = q.defer();
		var query = this.model('Application').findOne({name:appName}).populate({path:'owner', select:'username name title email'});
		query.exec(function (err, foundApp){
			if(err) { 
				logger.error({description: 'Error finding application.', error: err, func: 'findPromise', obj: 'Application'});
				d.reject(err);
			} else if(!foundApp){
				logger.error({description: 'Application not found.', func: 'findPromise', obj: 'Application'});
				d.reject({message: 'Application not found.'});
			} else {
				logger.info({description: 'Application found successfully.', foundApp: foundApp, func: 'findPromise', obj: 'Application'});
				d.resolve(foundApp);
			}
		});
		return d.promise;
	},
	createWithTemplate:function(templateName){
		logger.log({description: 'Create application with template called.', templateName: templateName, application: this, func: 'createWithTemplate', obj: 'Application'});
		var self = this;
		var d = q.defer();
		this.createWithStorage().then(function (newApplication){
			// console.log('[application.createWithStorage] new app saved successfully', newApplication);
			logger.log({description: 'Create with storage successful.', newApplication: newApplicaiton, func: 'createWithTemplate', obj: 'Application'});
			self.applyTemplate(templateName).then(function(){
				// console.log('[application.createWithStorage] storage created successfully', newApplication);
				logger.info({description: 'Publish file called.',  func: 'createWithTemplate', obj: 'Application'});
				d.resolve(newApplication);
			}, function (err){
				logger.error({description: 'Error applying template to application.', error: err, func: 'createWithTemplate', obj: 'Application'});
				d.reject(err);
			});
		}, function (err){
			logger.error({description: 'Error creating application with storage.', error: err, func: 'createWithTemplate', obj: 'Application'});
			d.reject(err);
		});
		return d.promise;
	},
	createWithStorage:function(){
		logger.log({description: 'Create with storage called.', application: this, func: 'createWithStorage', obj: 'Application'});
		var self = this;
		var d = q.defer();
		// TODO: Add a new group by default
		this.saveNew().then(function (newApplication){
			logger.log({description: 'Create with storage called.', application: this, func: 'createWithStorage', obj: 'Application'});
			self.createStorage().then(function(){
				logger.info({description: 'Create with storage called.', application: this, func: 'createWithStorage', obj: 'Application'});
				d.resolve(newApplication);
			}, function (err){
				logger.error({description: 'Error create application with storage.', error: err, func: 'createWithStorage', obj: 'Application'});
				d.reject(err);
			});
		}, function (err){
			logger.error({description: 'Error saving new application.', error: err, func: 'createWithStorage', obj: 'Application'});
			d.reject(err);
		});
		return d.promise;
	},
	createStorage:function(storageData){
		//TODO: Handle storageData including provider and name prefix
		logger.log({description: 'Create storage for application called.', storageData: storageData, func: 'createStorage', obj: 'Application'});
		var self = this;
		var d = q.defer();
		var bucketName = bucketPrefix + this.name;
		bucketName = bucketName.toLowerCase();
		fileStorage.createBucket(bucketName).then(function (bucket){
			logger.log({description: 'New bucket storage created for application.', bucket: bucket, func: 'createStorage', obj: 'Application'});
			// TODO: Handle different bucket regions and site urls
			self.frontend = {bucketName:bucketName, provider:'Amazon', siteUrl:bucketName+".s3-website-us-east-1.amazonaws.com", bucketUrl:"s3.amazonaws.com/"+bucketName};
			// console.log('[createStorage()] about to save new with bucket info:', self);
			self.saveNew().then(function (appWithStorage){
				// console.log('[createStorage()]AppsWithStorage saved with storage:', appWithStorage);
				logger.info({description: 'App with storage created successfully.', app: appWithStorage, func: 'createStorage', obj: 'Application'});
				d.resolve(appWithStorage);
			}, function (err){
				logger.error({description: 'Error saving new application.', error: err, func: 'createStorage', obj: 'Application'});
				d.reject(err);
			});
		}, function (err){
			logger.error({description: 'Error creating application bucket.', error: err, func: 'createStorage', obj: 'Application'});
			d.reject(err);
		});
		return d.promise;
	},
	removeStorage:function(){
		logger.log({description: 'Remove application storage called.', func: 'removeStorage', obj: 'Application'});
		var d = q.defer();
		if(!_.has(this, 'frontend') || !_.has(this.frontend, 'bucketName')){
			logger.log({description: 'No frontend to remove storage of.', func: 'removeStorage', obj: 'Application'});
			d.resolve({message: 'Stroage removed successfully.'});
		} else {
			fileStorage.deleteBucket(this.frontend.bucketName).then(function (){
				logger.info({description: 'Removing storage was not nessesary.', func: 'removeStorage', obj: 'Application'});
				d.resolve({message: 'Bucket deleted successfully.'});
			}, function (err){
				if(err && err.code == "NoSuchBucket"){
					logger.log({description: 'Removing storage was not nessesary.', func: 'removeStorage', obj: 'Application'});
					d.resolve({message: 'No storage to remove.'});
				} else {
					logger.error({description: 'Error deleting application storage bucket.', func: 'removeStorage', obj: 'Application'});
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
		logger.log({description: 'Applying template to project.', templateName: templateName, func: 'applyTemplate', obj: 'Application'});
		//TODO: Check that the template was actually uploaded
		return sqs.add(this.frontend.bucketName + ':' + templateName);
	},
	addCollaborators:function(usersArray){
		logger.log({description: 'Add collaborators to application called.', usersArray: usersArray, func: 'addCollaborators', obj: 'Application'});
		var self = this;
		var userPromises = [];
		//TODO: Check to see if user exists and is already a collaborator before adding
		//TODO: Check to see if usersArray is a list of objects(userData) or numbers(userIds)
		if(usersArray && _.isArray(usersArray)){
			usersArray.forEach(function (user){
				logger.log({description: 'Finding account to add as collaborator.', userData: user, func: 'addCollaborators', obj: 'Application'});
				var d = q.defer();
				//Push promise to promises array
				userPromises.push(d);
				logger.log({description: 'Account find promise pushed to promise array.', userData: user, func: 'addCollaborators', obj: 'Application'});
				self.findAccount(user).then(function (foundAccount){
					logger.info({description: 'Found account, adding to collaborators.', foundAccount: foundAccount, func: 'addCollaborators', obj: 'Application'});
					//Add Account's ObjectID to application's collaborators
					self.collaborators.push(foundAccount._id);
					d.resolve(foundAccount);
				}, function (err){
					logger.error({description: 'Error account in application.', error: err, func: 'addCollaborators', obj: 'Application'});
					d.reject(err);
				});
			});
		}
		//Run all users account promises then Add save promise to end of promises list
		return q.all(accountPromises).then(function (accountsArray){
			logger.log({description: 'collaborators all found:', accountsArray: accountsArray, func: 'addCollaborators', obj: 'Application'});
			return self.saveNew();
		}, function (err){
			logger.error({description: 'Error with accountPromises', error: err, func: 'addCollaborators', obj: 'Application'});
			return err;
		});
	},
	login:function(loginData){
		//Search for account in application's directories
		logger.log({description: 'Login to application called.', loginData: loginData, application: this, func: 'login', obj: 'Application'});
		var d = q.defer();
		this.findAccount(loginData).then(function (foundAccount){
			foundAccount.login(loginData.password).then(function (loggedInData){
				logger.info({description: 'Login to application successful.', loggedInData: loggedInData, func: 'login', obj: 'Application'});
				var resultObj = {account:foundAccount.strip(), token:loggedInData};
				logger.log({description: 'Login Result obj constructed.', resultObj: resultObj, func: 'login', obj: 'Application'});
				d.resolve(resultObj);
			}, function (err){
				logger.error({description: 'Error logging into acocunt.', error: err, func: 'login', obj: 'Application'});
				d.reject(err);
			});
		}, function (err){
			logger.error({description: 'Error finding account.', error: err, func: 'login', obj: 'Application'});
			d.reject(err);
		});
		return d.promise;
	},
	signup:function(signupData) {
		logger.log({description: 'Signup to application called.', signupData: signupData, application: this, func: 'signup', obj: 'Application'});
		var d = q.defer();
		var self = this;
		this.findAccount(signupData).then(function (foundAccount){
			logger.info({description: 'Account already exists in application directories', foundAccount: foundAccount, func: 'signup', obj: 'Application'});
			d.reject({message:'Account already exists in application.'});
		}, function (err){
			//TODO: Handle other errors
			if(err && err.status == 'NOT_FOUND'){
				//Account does not already exists
				logger.log({description: 'Account does not already exist in directories', func: 'signup', obj: 'Application'});
				var Account = self.model('Account');
				var account = new Account(signupData);
				logger.log({description: 'New account object created.', account: account, func: 'signup', obj: 'Application'});
				account.createWithPass(signupData.password).then(function (newAccount){
					//Account did not yet exist, so it was created
					logger.info({description: 'New account created successfully.', newAccount: newAccount, func: 'signup', obj: 'Application'});
					self.addAccountToDirectory(newAccount).then(function (directoryWithAccount){
						logger.info({description: 'New account added to application directory successfully.', newAccount: newAccount, directory: directoryWithAccount, func: 'signup', obj: 'Application'});
						//Log in to newly created account
						newAccount.login(signupData.password).then(function (loginRes){
							logger.info({description: 'New account logged in successfully.', loginRes: loginRes, newAccount: newAccount, directory: directoryWithAccount, func: 'signup', obj: 'Application'});
							//Respond with account and token
							d.resolve(loginRes);
						}, function (err){
							logger.error({description: 'Error logging into newly created account.', newAccount: newAccount, func: 'signup', obj: 'Application'});
							d.reject(err);
						});
					}, function (err){
						logger.error({description: 'Error adding account to directory.', newAccount: newAccount, func: 'signup', obj: 'Application'});
						d.reject(err);
					});
				}, function (err){
					//Handle username already existing return from createWithPass
					if(err && err.status == 'EXISTS'){
						//Add to account to directory
						logger.log({description: 'User already exists. Adding account to application directory.', func: 'signup', obj: 'Application'});
						self.addAccountToDirectory(account).then(function (directoryWithAccount){
							logger.log({description: 'Account added to directory successfully.', directory: directoryWithAccount, func: 'signup', obj: 'Application'});
							d.resolve(directoryWithAccount);
						}, function (err){
							logger.error({description: 'Error adding account to directory', error: err, func: 'signup', obj: 'Application'});
							d.reject(err);
						});
					} else {
						logger.error('[Application.signup()] Error creating new account.', err);
						d.reject(err);
					}
				});
			} else {
				//Error other than account not found				
				logger.error({description: 'Error finding account.', error: JSON.stringify(err), func: 'signup', obj: 'Application'});
				d.reject(err);
			}
		});
		return d.promise;
	},
	//Log user out of application
	logout:function(logoutData){
		//Log the user out
		//TODO: Make this work
		// this.model('Account').findOne({username:logoutData.username});
		var d = q.defer();
		logger.log({description: 'Logout called.', logoutData: logoutData, func: 'logout', obj: 'Application'});
		this.findAccount(logoutData).then(function (foundAccount){
			logger.log({description: 'Account found in application. Attempting to logout.', account: foundAccount});
			foundAccount.logout().then(function (){
				logger.log({description: 'Account loggout successful.', logoutData: logoutData, func: 'logout', obj: 'Application'});
				d.resolve();
			}, function (err){
				logger.error({description: 'Error logging out of account.', error: err, data: logoutData, func: 'logout', obj: 'Application'});
				d.reject(err);
			});
		}, function (err){
			logger.log({description: 'Account not found.', error: err, data:logoutData, func: 'logout', obj: 'Application'});
			d.reject(err);
		});
		return d.promise;
	},
	//Find account and make sure it is within application accounts, groups, and directories
	findAccount:function(accountData){
		var self = this;
		var d = q.defer();
		var accountUsername;
		logger.log({description: 'Find account called.', accountData: accountData, func: 'findAccount', obj: 'Application'});
		if(_.has(accountData, 'username')){
			accountUsername = accountData.username
		} else if(_.isString(accountData)){
			accountUsername = accountData;
		}
		//Find account based on username then see if its id is within either list
		var accountQuery = this.model('Account').findOne({username:accountUsername});
		accountQuery.exec(function(err, account){
			if(err){
				logger.error({message:'Error finding account.', obj:'Application', func:'findAccount'});
				return d.reject(err);
			}
			if(!account){
				logger.info({message:'Account not found.', obj:'Application', func:'findAccount'});
				return d.reject({message:'Account not found', status:'NOT_FOUND'});
			}
			if(self.directories.length < 1 && self.groups.length < 1) {
				logger.info({message:'Application does not have any groups or directories. Login Not possible. This application does not have any user groups or directories.', obj:'Application', func:'findAccount'});
				return d.reject({message:'Application does not have any user groups or directories.'});
			}
			logger.log({message:'Account found, looking for it in application.', application:self, account:account, obj:'Application', func:'findAccount'})
			self.accountExistsInApp(account).then(function(){
				logger.log({message:'Account exists in application.', application:self, account:account, obj:'Application', func:'findAccount'})
				d.resolve(account);
			}, function (err){
				logger.error({message: 'Error looking for account in app', application:self, account:account, error: err, obj:'Application', func:'findAccount'})
				d.reject(err);
			});
		});
		return d.promise;
	},
	//See if located account is within application directories/groups/accounts
	//TODO: Accept username as well and find account from username
	accountExistsInApp:function(account){
		var self = this;
		var d = q.defer();
		var query = self.model('Application').findById(self._id)
		.populate({path:'directories', select:'accounts groups'})
		.populate({path:'groups', select:'accounts'});
		query.exec(function(err, selfData){
			var existsInDirectories = _.any(selfData.directories, function(directory){
				//TODO: Check groups in directories as well
				logger.log({message:'Searching for account within directory.', directory:directory, accounts:directory.accounts, groups:directory.groups, obj:'Application', func:'accountExistsInApp'});
				return _.any(directory.accounts, function(testAccountId){
					return account._id.toString() == testAccountId;
				});
			});
			var existsInGroups = _.any(selfData.groups, function(group){
				return _.any(group.accounts, function(testAccountId){
					return account._id.toString() == testAccountId;
				});
			});
			if(existsInDirectories || existsInGroups){
				logger.info({message:'Account found within application.', obj:'Application', func:'accountExistsInApp', existsInGroups:existsInGroups, existsInDirectories:existsInDirectories});
				d.resolve(true);
			} else {
				logger.info({message:'Account found, but not placed into application groups or directories.', obj:'Application', func:'accountExistsInApp', existsInGroups:existsInGroups, existsInDirectories:existsInDirectories, application:self});
				d.reject({message:'Account is not within application groups or directories.'});
			}
		});
		return d.promise;
	},
	//Add directory to application
	addDirectory:function(directoryData){
		//TODO: Handle checking for and creating a new directory if one doesn't exist
		//TODO: Make sure this directory does not already exist in this application
		var self = this;
		var query = this.model('Directory').findOne({application: self._id, name: directoryData.name});
		var d = q.defer();
		query.exec(function(err, newDirectory){
			if(err){
				logger.error({description:'', func:'deleteGroup', obj: 'Application'});
				
				d.reject(err);
			} else if(!newDirectory){
				logger.error({description:'', func:'deleteGroup', obj: 'Application'});
				
				d.reject({message: 'Unable to add new directory'});
			} else {
				d.resolve(newDirectory);
			}
		});
		return d.promise;
	},
	//Update directory in application
	updateDirectory:function(directoryData){
		logger.log({description:'Update directory called.', func:'deleteGroup', obj: 'Application'});
		var self = this;
		var query = this.model('Directory').findOne({application: self._id, name: directoryData.name});
		var d = q.defer();
		query.exec(function (err, newDirectory){
			if(err){
				logger.error({description:'', func:'deleteGroup', obj: 'Application'});
				d.reject(err);
			} else if(!newDirectory){
				logger.error({description:'', func:'deleteGroup', obj: 'Application'});
				d.reject({message: 'Unable to update directory'});
			} else {
				d.resolve(newDirectory);
			}
		});
		return d.promise;
	},
	//Delete directory from application
	deleteDirectory:function(directoryData){
		logger.log({description:'Delete directory called.', func:'deleteDirectory', obj: 'Application'});
		var self = this;
		var query = this.model('Directory').findOne({application: self._id, name: directoryData.name});
		var d = q.defer();
		query.exec(function (err, newDirectory){
			if(err){
				logger.error({description:'Error deleting application directory.', error: err, directoryData: directoryData, func:'deleteDirectory', obj: 'Application'});
				d.reject(err);
			} else if(!newDirectory){
				logger.error({description:'Unable to delete application directory.', func:'deleteDirectory', obj: 'Application'});
				d.reject({message: 'Unable to delete directory from application.'});
			} else {
				logger.info({description:'Directory deleted successfully.', func:'deleteDirectory', obj: 'Application'});
				d.resolve(newDirectory);
			}
		});
		return d.promise;
	},
	//Add group to application
	addGroup:function(groupData){
		//TODO: make sure that group does not already exist in this application
		// if(indexOf(this.groups, group._id) == -1){
		// 	console.error('This group already exists application');
		// 	return;
		// }
		var self = this;
		//Add application id to group
		groupData.application = this._id;
		//Add applicaiton id to search
		var findObj = {application: this._id};
		logger.log({description:'Add group to Application called.', func:'addGroup', obj: 'Application'});
		var d = q.defer();
		if(_.isString(groupData)){
			//Data is a string (name)
			findObj.name = groupData;
		} else if(_.has(groupData, 'name')){
			//Data is an object with a name
			findObj.name =  groupData.name
		} else {
			logger.error({description:'Incorrectly formatted group data.', groupData: groupData, func:'addGroup', obj: 'Application'});
			d.reject({message: 'Group could not be added: Incorrectly formatted Group data.'});
		}
		//Do not search for group if a group object was passed
		if(_.has(groupData, '_id') || groupData instanceof self.model('Group')){
			logger.log({description:'Group instance was passed, adding it to application.', groupData: groupData, instance: groupData instanceof self.model('Group'), func:'addGroup', obj: 'Application'});
			self.groups.push(groupData._id);
			self.saveNew().then(function (savedApp){
				logger.info({description:'Group successfully added to application.', func:'addGroup', obj: 'Application'});
				d.resolve(groupData);
			}, function (err){
				logger.error({description:'Error saving new group to application.', error: err, func:'addGroup', obj: 'Application'});
				d.reject(err);
			});
		} else {
			var query = this.model('Group').findOne(findObj);
			logger.log({description:'Find object constructed.', find: findObj, func:'addGroup', obj: 'Application'});
			query.exec(function (err, group){
				if(err){
					logger.error({description:'Error adding group to Application.', error: err, func:'addGroup', obj: 'Application'});
					d.reject(err);
				} else if(!group){
					logger.info({description:'Group does not already exist.', func:'addGroup', obj: 'Application'});
					//Group does not already exist, create it
					var Group = self.model('Group');
					var group = new Group(groupData);
					group.saveNew().then(function (newGroup){
						logger.info({description:'Group created successfully. Adding to application.', func:'addGroup', obj: 'Application'});
						//Add group to application
						self.groups.push(newGroup._id);
						self.saveNew().then(function (savedApp){
							logger.info({description:'Group successfully added to application.', func:'addGroup', obj: 'Application'});
							d.resolve(newGroup);
						}, function (err){
							logger.error({description:'Error saving new group to application.', error: err, func:'addGroup', obj: 'Application'});
							d.reject(err);
						});
					}, function (err){
						logger.error({description:'Error creating group.', error: err, func:'addGroup', obj: 'Application'});
						d.reject(err);
					});
				} else {
					//TODO: Decide if this should happen?
					//Group already exists, add it to applicaiton
					logger.log({description:'Group already exists. Adding to application.', group: group, func:'addGroup', obj: 'Application'});
					self.groups.push(group._id);
					self.saveNew().then(function (savedApp){
						logger.info({description:'Group successfully added to application.', group: group, savedApp: savedApp, func:'addGroup', obj: 'Application'});
						d.resolve(group);
					}, function (err){
						logger.error({description:'Error saving Group to application.', error: err, group: group, func:'addGroup', obj: 'Application'});
						d.reject(err);
					});
				}
			});
		}

		return d.promise;
	},
	//Update group within application
	updateGroup:function(groupData){
		logger.log({description:'Update group called.', groupData: groupData, func:'updateGroup', obj: 'Application'});
		var self = this;
		var query = this.model('Group').update({application: self._id, name: groupData.name});
		var d = q.defer();
		query.exec(function (err, group){
			if(err){
				logger.error({description:'Error updating application Group.', func:'updateGroup', updatedGroup: group, obj: 'Application'});
				d.reject(err);
			} else if(!group){
				logger.error({description:'Application Group could not be updated.', func:'updateGroup', groupData: groupData, obj: 'Application'});
				d.reject({message: 'Unable to update group.'});
			} else {
				logger.info({description:'', func:'updateGroup', obj: 'Application'});
				d.resolve(group);
			}
		});
		return d.promise;
	},
	//Delete group from application
	deleteGroup:function(groupData){
		logger.log({description:'Delete group called.', groupData: groupData, app: this, func:'deleteGroup', obj: 'Application'});
		var self = this;
		var d = q.defer();
		var groupInApp = _.findWhere(this.groups, {name: groupData.name});
		//TODO: Check groups before to make sure that group by that name exists
		if(!groupInApp){
			logger.log({description:'Group with provided name does not exist within application.', groupData: groupData, app: this, func:'deleteGroup', obj: 'Application'});
			d.reject({message: 'Group with that name does not exist within application.', status: 'NOT_FOUND'});
		} else {
			var query = this.model('Group').findOneAndRemove({name: groupData.name});
			query.exec(function (err, group){
				if(err){
					logger.error({description:'Error deleting group.', func:'deleteGroup', obj: 'Application'});
					d.reject(err);
				} else if(!group){
					logger.error({description:'Unable to find group to delete.', func:'deleteGroup', obj: 'Application'});
					d.reject({message: 'Unable delete group.', status: 'NOT_FOUND'});
				} else {
					logger.info({description:'Group deleted successfully. Removing from application.', returnedData: group, func:'deleteGroup', obj: 'Application'});
					//Remove group from application's groups
					_.remove(self.groups, function(currentGroup){
						//Handle currentGroups being list of IDs
						if(_.isObject(currentGroup) && _.has(currentGroup, '_id') && currentGroup._id == group._id){
							logger.info({description:'Removed group by object with id param.', returnedData: group, func:'deleteGroup', obj: 'Application'});
							return true;
						} else if(_.isString(currentGroup) && currentGroup == group._id) {
							//String containing group id
							logger.info({description:'Removed group by string id.', currentGroup: currentGroup, returnedData: group, func:'deleteGroup', obj: 'Application'});
							return true;
						} else {
							logger.error({description:'Could not find group within application.', returnedData: group, func:'deleteGroup', obj: 'Application'});
							return false;
						}
					});
					//Resolve application's groups without group
					d.resolve(self.groups);
				}
			});
		}

		return d.promise;
	},	
	//Upload file to bucket
	publishFile: function(fileData){
		logger.log({description: 'Publish file called.', fileData: fileData, func: 'publishFile', obj: 'Application'});
		var d = q.defer();
		var self = this;
		fileStorage.saveFile(this.frontend.bucketName, fileData).then(function (newFile){
			logger.info({description: 'File published successfully.', newFile: newFile, func: 'publishFile', obj: 'Application'});
			d.resolve(newFile);
		}, function (err){
			logger.error({description: 'File published successfully.', error: err, func: 'publishFile', obj: 'Application'});
			d.reject(err);
		});
		return d.promise;
	},
	//Get a signed url file actions
	signedUrl:function(urlData){
		return fileStorage.signedUrl(urlData);
	},
	//TODO: Remove, this is handled within grout
	getStructure:function(){
		return fileStorage.getFiles(this.frontend.bucketName);
	},
	addAccountToDirectory:function(accountData, directoryId){
		var d = q.defer();
		//TODO: Make this work with not just the first directory
		if(this.directories.length >= 1){
			//Application has directories
			logger.log({description: 'Application has directories.', id: directoryId, func: 'addAccountToDirectory', obj: 'Application'});
			
			//Add to 'default' directory
			if(!directoryId){
				//TODO: have this reference a set defualt instead of first directory in list
				directoryId = self.directories[0]._id;
				logger.log({description: 'Directory was not provided. Default directory used.', id: directoryId, func: 'addAccountToDirectory', obj: 'Application'});
			}

			var dQuery = self.model('Directory').findOne({_id:directoryId});
			dQuery.exec(function (err, result){
				if(err){
					logger.error({description: 'Error finding directory.', id: directoryId, error: err, func: 'addAccountToDirectory', obj: 'Application'});
					return d.reject(err);
				}
				if(!result){
					logger.error({description: 'Directory not found.', id: directoryId, func: 'addAccountToDirectory', obj: 'Application'});
					return d.reject({message: 'Directory not found.'});
				}
				logger.log({description: 'Directory found. Adding account.', directory: result, func: 'addAccountToDirectory', obj: 'Application'});
				//TODO: Make sure account does not already exist in directory before adding.
				result.addAccount(account).then(function (dirWithAccount){
					logger.log({description: 'Account successfully added to directory.', directory: dirWithAccount, func: 'addAccountToDirectory', obj: 'Application'});
					d.resolve(dirWithAccount);
				}, function (err){
					logger.error({description: 'Error adding account to directory.', error: err, func: 'addAccountToDirectory', obj: 'Application'});
					d.reject(err);
				});
			});
		} else {
			//TODO: Create a base directory if none exist
			logger.error({description: 'Application does not have any directories into which to add Account.', func: 'addAccountToDirectory', obj: 'Application'});
			d.reject({message: 'Application does not have any directories into which to add Account.', status: 'NOT_FOUND'});
		}
		return d.promise;
	}
};
//TODO: See if this is used
function findAccount(find){
	logger.log({description: 'Find account called.', findData: find, func: 'findAccount', file: 'Application Model'});
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
	logger.log({description: 'Find object built.', findObj: findObj, func: 'findAccount', file: 'Application Model'});
	Account.find(findObj).exec(function (err, foundAccount){
		if(err) {
			logger.error({description: 'Error finding account.', error: err, func: 'findAccount', file: 'Application Model'});
			d.reject({message:'Error Adding collaborator.', error:err});
		} else if(!foundAccount){
			logger.error({description: 'Account could not be found.', func: 'findAccount', file: 'Application Model'});
			d.reject({message:'Account could not be found'});
		} else {
			logger.info({description: 'Account found successfully.', foundAccount: foundAccount, func: 'findAccount', file: 'Application Model'});
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
