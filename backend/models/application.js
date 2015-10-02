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
		provider:{type:String, default:'Amazon'},
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
	saveNew: () => {
		logger.log({description: 'Save application called.', func: 'saveNew', obj: 'Application'});
		return this.save((err, savedApp) => {
			if (err) {
				logger.error({description: 'Error saving Application.', error: err, func: 'saveNew', obj: 'Application'});
				return Promise.reject(err);
			} else if (!savedApp) {
				logger.error({description: 'Unable to save Application.', func: 'saveNew', obj: 'Application'});
				return Promise.reject({message: 'Application could not be saved.'});
			} else {
				logger.info({description: 'Application saved successfully.', savedApp: savedApp, func: 'saveNew', obj: 'Application'});
				return savedApp;
			}
		});
	},
	//Find Applicaiton by name. Returns a promise
	findPromise: (appName) => {
		logger.log({description: 'Find application called.', func: 'findPromise', obj: 'Application'});
		var query = this.model('Application').findOne({name:appName}).populate({path:'owner', select:'username name title email'});
		return query.then((err, foundApp) => {
			if(!foundApp){
				logger.error({description: 'Application not found.', func: 'findPromise', obj: 'Application'});
				return Promise.reject({message: 'Application not found.'});
			} else {
				logger.info({description: 'Application found successfully.', foundApp: foundApp, func: 'findPromise', obj: 'Application'});
				return foundApp;
			}
		}, (err) => {
			logger.error({description: 'Error finding application.', error: err, func: 'findPromise', obj: 'Application'});
			return Promise.reject(err);
		});
	},
	createWithTemplate: (templateName) => {
		logger.log({description: 'Create application with template called.', templateName: templateName, application: this, func: 'createWithTemplate', obj: 'Application'});
		return this.createWithStorage().then((newApplication) => {
			// console.log('[application.createWithStorage] new app saved successfully', newApplication);
			logger.log({description: 'Create with storage successful.', newApplication: newApplicaiton, func: 'createWithTemplate', obj: 'Application'});
			return this.applyTemplate(templateName).then(() => {
				// console.log('[application.createWithStorage] storage created successfully', newApplication);
				logger.info({description: 'Publish file called.',  func: 'createWithTemplate', obj: 'Application'});
				return newApplication;
			}, (err) => {
				logger.error({description: 'Error applying template to application.', error: err, func: 'createWithTemplate', obj: 'Application'});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({description: 'Error creating application with storage.', error: err, func: 'createWithTemplate', obj: 'Application'});
			return Promise.reject(err);
		});
	},
	createWithStorage: () => {
		logger.log({description: 'Create with storage called.', application: this, func: 'createWithStorage', obj: 'Application'});
		// TODO: Add a new group by default
		return this.saveNew().then((newApplication) => {
			logger.log({description: 'Create with storage called.', application: this, func: 'createWithStorage', obj: 'Application'});
			return this.createStorage().then(() => {
				logger.info({description: 'Create with storage called.', application: this, func: 'createWithStorage', obj: 'Application'});
				return newApplication;
			}, (err) => {
				logger.error({description: 'Error create application with storage.', error: err, func: 'createWithStorage', obj: 'Application'});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({description: 'Error saving new application.', error: err, func: 'createWithStorage', obj: 'Application'});
			return Promise.reject(err);
		});
	},
	createStorage: (storageData) => {
		//TODO: Handle storageData including provider and name prefix
		logger.log({description: 'Create storage for application called.', storageData: storageData, func: 'createStorage', obj: 'Application'});
		var bucketName = bucketPrefix + this.name;
		bucketName = bucketName.toLowerCase();
		return fileStorage.createBucket(bucketName).then((bucket) => {
			logger.log({description: 'New bucket storage created for application.', bucket: bucket, func: 'createStorage', obj: 'Application'});
			// TODO: Handle different bucket regions and site urls
			this.frontend = {
				bucketName:bucketName,
				provider:'Amazon',
				siteUrl:bucketName + '.s3-website-us-east-1.amazonaws.com',
				bucketUrl:'s3.amazonaws.com/' + bucketName
			};
			// console.log('[createStorage()] about to save new with bucket info:', self);
			return this.saveNew().then((appWithStorage) => {
				// console.log('[createStorage()]AppsWithStorage saved with storage:', appWithStorage);
				logger.info({description: 'App with storage created successfully.', app: appWithStorage, func: 'createStorage', obj: 'Application'});
				return appWithStorage;
			}, (err) => {
				logger.error({description: 'Error saving new application.', error: err, func: 'createStorage', obj: 'Application'});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({description: 'Error creating application bucket.', error: err, func: 'createStorage', obj: 'Application'});
			return Promise.reject(err);
		});
	},
	removeStorage: () => {
		logger.log({description: 'Remove application storage called.', func: 'removeStorage', obj: 'Application'});
		if(!_.has(this, 'frontend') || !_.has(this.frontend, 'bucketName')){
			logger.log({description: 'No frontend to remove storage of.', func: 'removeStorage', obj: 'Application'});
			return Promise.resolve({message: 'Storage removed successfully.'});
		} else {
			return fileStorage.deleteBucket(this.frontend.bucketName).then(() => {
				logger.info({description: 'Removing storage was not nessesary.', func: 'removeStorage', obj: 'Application'});
				return {message: 'Bucket deleted successfully.'};
			}, (err) => {
				if(err && err.code == "NoSuchBucket"){
					logger.log({description: 'Removing storage was not nessesary.', func: 'removeStorage', obj: 'Application'});
					return {message: 'No storage to remove.'};
				} else {
					logger.error({description: 'Error deleting application storage bucket.', func: 'removeStorage', obj: 'Application'});
					return Promise.reject(err);
				}
			});
		}
		return d.promise;
	},
	applyTemplate: (templateName) => {
		if(!templateName || _.isUndefined(templateName)){
			templateName = 'default';
		}
		logger.log({description: 'Applying template to project.', templateName: templateName, func: 'applyTemplate', obj: 'Application'});
		//TODO: Check that the template was actually uploaded
		return sqs.add(this.frontend.bucketName + ':' + templateName);
	},
	addCollaborators: (usersArray) => {
		logger.log({description: 'Add collaborators to application called.', usersArray: usersArray, func: 'addCollaborators', obj: 'Application'});
		var userPromises = [];
		//TODO: Check to see if user exists and is already a collaborator before adding
		//TODO: Check to see if usersArray is a list of objects(userData) or numbers(userIds)
		if(usersArray && _.isArray(usersArray)){
			usersArray.forEach((user) => {
				logger.log({description: 'Finding account to add as collaborator.', userData: user, func: 'addCollaborators', obj: 'Application'});
				var d = q.defer();
				//Push promise to promises array
				userPromises.push(d);
				logger.log({description: 'Account find promise pushed to promise array.', userData: user, func: 'addCollaborators', obj: 'Application'});
				this.findAccount(user).then((foundAccount) => {
					logger.info({description: 'Found account, adding to collaborators.', foundAccount: foundAccount, func: 'addCollaborators', obj: 'Application'});
					//Add Account's ObjectID to application's collaborators
					this.collaborators.push(foundAccount._id);
					d.resolve(foundAccount);
				}, (err) => {
					logger.error({description: 'Error account in application.', error: err, func: 'addCollaborators', obj: 'Application'});
					d.reject(err);
				});
			});
		}
		//Run all users account promises then Add save promise to end of promises list
		return q.all(accountPromises).then((accountsArray) => {
			logger.log({description: 'collaborators all found:', accountsArray: accountsArray, func: 'addCollaborators', obj: 'Application'});
			return this.saveNew();
		}, (err) => {
			logger.error({description: 'Error with accountPromises', error: err, func: 'addCollaborators', obj: 'Application'});
			return err;
		});
	},
	login: (loginData) => {
		//Search for account in application's directories
		logger.log({description: 'Login to application called.', loginData: loginData, application: this, func: 'login', obj: 'Application'});
		return this.findAccount(loginData).then((foundAccount) => {
			return foundAccount.login(loginData.password).then((loggedInData) => {
				logger.info({description: 'Login to application successful.', loggedInData: loggedInData, func: 'login', obj: 'Application'});
				return loggedInData;
			}, (err) => {
				logger.error({description: 'Error logging into acocunt.', error: err, func: 'login', obj: 'Application'});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({description: 'Error finding account.', error: err, func: 'login', obj: 'Application'});
			return Promise.reject(err);
		});
	},
	signup: (signupData) => {
		logger.log({description: 'Signup to application called.', signupData: signupData, application: this, func: 'signup', obj: 'Application'});
		return this.findAccount(signupData).then((foundAccount) => {
			logger.info({description: 'Account already exists in application directories', foundAccount: foundAccount, func: 'signup', obj: 'Application'});
			return Promise.reject({message:'Account already exists in application.', status: 'EXISTS'});
		}, (err) => {
			//TODO: Handle other errors
			if(err && err.status == 'NOT_FOUND'){
				//Account does not already exists
				logger.log({description: 'Account does not already exist in directories', func: 'signup', obj: 'Application'});
				var Account = this.model('Account');
				var account = new Account(signupData);
				logger.log({description: 'New account object created.', account: account, func: 'signup', obj: 'Application'});
				return account.createWithPass(signupData.password).then((newAccount) => {
					//Account did not yet exist, so it was created
					logger.info({description: 'New account created successfully.', newAccount: newAccount, func: 'signup', obj: 'Application'});
					return this.addAccountToDirectory(newAccount).then((directoryWithAccount) => {
						logger.info({description: 'New account added to application directory successfully.', newAccount: newAccount, directory: directoryWithAccount, func: 'signup', obj: 'Application'});
						//Log in to newly created account
						return newAccount.login(signupData.password).then((loginRes) => {
							logger.info({description: 'New account logged in successfully.', loginRes: loginRes, newAccount: newAccount, directory: directoryWithAccount, func: 'signup', obj: 'Application'});
							//Respond with account and token
							return loginRes;
						}, (err) => {
							logger.error({description: 'Error logging into newly created account.', newAccount: newAccount, func: 'signup', obj: 'Application'});
							return Promise.reject(err);
						});
					}, (err) => {
						logger.error({description: 'Error adding account to directory.', newAccount: newAccount, func: 'signup', obj: 'Application'});
						return Promise.reject(err);
					});
				}, (err) => {
					//Handle username already existing return from createWithPass
					if(err && err.status == 'EXISTS'){
						//Add to account to directory
						logger.log({description: 'User already exists. Adding account to application directory.', func: 'signup', obj: 'Application'});
						return this.addAccountToDirectory(account).then((directoryWithAccount) => {
							logger.log({description: 'Account added to directory successfully.', directory: directoryWithAccount, func: 'signup', obj: 'Application'});
							d.resolve(directoryWithAccount);
						}, (err) => {
							logger.error({description: 'Error adding account to directory', error: err, func: 'signup', obj: 'Application'});
							return Promise.reject(err);
						});
					} else {
						logger.error('[Application.signup()] Error creating new account.', err);
						return Promise.reject(err);
					}
				});
			} else {
				//Error other than account not found
				logger.error({description: 'Error finding account.', error: JSON.stringify(err), func: 'signup', obj: 'Application'});
				return Promise.reject(err);
			}
		});
	},
	//Log user out of application
	logout: (logoutData) => {
		//Log the user out
		//TODO: Make this work
		// this.model('Account').findOne({username:logoutData.username});
		logger.log({description: 'Logout called.', logoutData: logoutData, func: 'logout', obj: 'Application'});
		return this.findAccount(logoutData).then((foundAccount) => {
			logger.log({description: 'Account found in application. Attempting to logout.', account: foundAccount});
			return foundAccount.logout().then(() => {
				logger.log({description: 'Account loggout successful.', logoutData: logoutData, func: 'logout', obj: 'Application'});
				return {message: 'Logout successful.'};
			}, (err) => {
				logger.error({description: 'Error logging out of account.', error: err, data: logoutData, func: 'logout', obj: 'Application'});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.log({description: 'Account not found.', error: err, data:logoutData, func: 'logout', obj: 'Application'});
			return Promise.reject(err);
		});
	},
	//Find account and make sure it is within application accounts, groups, and directories
	findAccount: (accountData) => {
		var accountUsername;
		logger.log({description: 'Find account called.', accountData: accountData, func: 'findAccount', obj: 'Application'});
		if(_.has(accountData, 'username')){
			accountUsername = accountData.username
		} else if(_.isString(accountData)){
			accountUsername = accountData;
		}
		//Find account based on username then see if its id is within either list
		var accountQuery = this.model('Account').findOne({username:accountUsername}).select({password: 0});
		return accountQuery.then((account) => {
			if(!account){
				logger.info({message:'Account not found.', obj:'Application', func:'findAccount'});
				return Promise.reject({message:'Account not found', status:'NOT_FOUND'});
			}
			if(!_.has(this, 'directories') && !_.has(this, 'groups')) {
				logger.info({message:'Application does not have any groups or directories. Login Not possible. This application does not have any user groups or directories.', obj:'Application', func:'findAccount'});
				return Promise.reject({message:'Application does not have any user groups or directories.'});
			}
			logger.log({message:'Account found, looking for it in application.', application:this, account:account, obj:'Application', func:'findAccount'})
			return this.accountExistsInApp(account).then(() => {
				logger.log({message:'Account exists in application.', application:this, account:account, obj:'Application', func:'findAccount'})
				return account;
			}, (err) => {
				logger.error({message: 'Error looking for account in app', account:account, error: JSON.stringify(err), obj:'Application', func:'findAccount'})
				//TODO:
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({message:'Error finding account.', obj:'Application', func:'findAccount'});
			return Promise.reject(err);
		});
	},
	//See if located account is within application directories/groups/accounts
	//TODO: Accept username as well and find account from username
	accountExistsInApp: (account) => {
		var query = this.model('Application').findById(this._id)
		.populate({path:'directories', select:'accounts groups'})
		.populate({path:'groups', select:'accounts'});
		return query.then((selfData) => {
			var existsInDirectories = _.any(selfData.directories, (directory) => {
				//TODO: Check groups in directories as well
				logger.log({message:'Searching for account within directory.', directory:directory, accounts:directory.accounts, groups:directory.groups, obj:'Application', func:'accountExistsInApp'});
				return _.any(directory.accounts, (testAccountId) => {
					return account._id.toString() === testAccountId;
				});
			});
			var existsInGroups = _.any(selfData.groups, (group) => {
				return _.any(group.accounts, (testAccountId) => {
					return account._id.toString() === testAccountId;
				});
			});
			if(existsInDirectories || existsInGroups){
				logger.info({message:'Account found within application.', obj:'Application', func:'accountExistsInApp', existsInGroups:existsInGroups, existsInDirectories:existsInDirectories});
				return Promise.resolve(true);
			} else {
				logger.info({message:'Account found, but not placed into application groups or directories.', obj:'Application', func:'accountExistsInApp', existsInGroups:existsInGroups, existsInDirectories:existsInDirectories, application:self});
				return selfData.addAccountToDirectory(account).then((newAccount) => {
					logger.info({message:'Account is now within application.', newAccount: newAccount, obj:'Application', func:'accountExistsInApp', existsInGroups:existsInGroups, existsInDirectories:existsInDirectories, application:self});
					return newAccount;
				}, (err) => {
					logger.error({message:'Account could not be placed into application groups or directories.', error: err, obj:'Application', func:'accountExistsInApp', existsInGroups:existsInGroups, existsInDirectories:existsInDirectories, application:self});
					return Promise.reject({message:'Account is not within application groups or directories.', status: 'NOT_FOUND'});
				});
			}
		}, (err) => {
			logger.error({message:'Error finding application.', error: err, obj:'Application', func:'accountExistsInApp', existsInGroups:existsInGroups, existsInDirectories:existsInDirectories, application:self});
			return Promise.reject({message: 'Error finding application.'});
		});
	},
	//Add directory to application
	addDirectory: (directoryData) => {
		//TODO: Handle checking for and creating a new directory if one doesn't exist
		//TODO: Make sure this directory does not already exist in this application
		var query = this.model('Directory').findOne({application: this._id, name: directoryData.name});
		return query.then((newDirectory) => {
			if(err){
				logger.error({description:'', func:'deleteGroup', obj: 'Application'});
				return Promise.reject(err);
			} else if(!newDirectory){
				logger.error({description:'', func:'deleteGroup', obj: 'Application'});
				return Promise.reject({message: 'Unable to add new directory'});
			} else {
				return newDirectory;
			}
		}, (err) => {
			logger.error({description:'Error adding directory.', error: err, func:'deleteGroup', obj: 'Application'});
			return Promise.reject({message: 'Error adding directory.'});
		});
	},
	//Update directory in application
	updateDirectory: (directoryData) => {
		logger.log({description:'Update directory called.', func:'updateDirectory', obj: 'Application'});
		var query = this.model('Directory').findOne({application: this._id, name: directoryData.name});
		return query.then((newDirectory) => {
			if(err){
				logger.error({description:'Error updating directory.', error: err, func:'updateDirectory', obj: 'Application'});
				return Promise.reject({message: 'Error updating directory.'});
			} else if(!newDirectory){
				logger.error({description:'', func:'updateDirectory', obj: 'Application'});
				return Promise.reject({message: 'Unable to update directory'});
			} else {
				return newDirectory;
			}
		}, (err) => {
			logger.error({description:'Error updating directory.', error: err, func:'updateDirectory', obj: 'Application'});
			return Promise.reject({message: 'Error updating directory.'});
		});
	},
	//Delete directory from application
	deleteDirectory: (directoryData) => {
		logger.log({description:'Delete directory called.', func:'deleteDirectory', obj: 'Application'});
		var query = this.model('Directory').findOneAndRemove({application: this._id, name: directoryData.name});
		return query.then((newDirectory) => {
			if(err){
				logger.error({description:'Error deleting application directory.', error: err, directoryData: directoryData, func:'deleteDirectory', obj: 'Application'});
				return Promise.reject(err);
			} else {
				logger.info({description:'Directory deleted successfully.', func:'deleteDirectory', obj: 'Application'});
				return {message: 'Directory deleted successfully.'};
			}
		}, (err) => {
			return Promise.reject({message: 'Error deleting directory.'});
		});
	},
	//Add group to application
	addGroup: (groupData) => {
		//TODO: make sure that group does not already exist in this application
		// if(indexOf(this.groups, group._id) == -1){
		// 	console.error('This group already exists application');
		// 	return;
		// }
		//Add application id to group
		groupData.application = this._id;
		//Add applicaiton id to search
		var findObj = {application: this._id};
		logger.log({description:'Add group to Application called.', func:'addGroup', obj: 'Application'});
		if(_.isString(groupData)){
			//Data is a string (name)
			findObj.name = groupData;
		} else if(_.has(groupData, 'name')){
			//Data is an object with a name
			findObj.name =  groupData.name
		} else {
			logger.error({description:'Incorrectly formatted group data.', groupData: groupData, func:'addGroup', obj: 'Application'});
			return Promise.reject({message: 'Group could not be added: Incorrectly formatted Group data.'});
		}
		//Do not search for group if a group object was passed
		if(_.has(groupData, '_id') || groupData instanceof this.model('Group')){
			logger.log({description:'Group instance was passed, adding it to application.', groupData: groupData, func:'addGroup', obj: 'Application'});
			this.groups.push(groupData._id);
			return this.saveNew().then((savedApp) => {
				logger.info({description:'Group successfully added to application.', func:'addGroup', obj: 'Application'});
				return groupData;
			}, (err) => {
				logger.error({description:'Error saving new group to application.', error: err, func:'addGroup', obj: 'Application'});
				return Promise.reject(err);
			});
		} else {
			var query = this.model('Group').findOne(findObj);
			logger.log({description:'Find object constructed.', find: findObj, func:'addGroup', obj: 'Application'});
			return query.then((group) => {
				if(!group){
					logger.info({description:'Group does not already exist.', func:'addGroup', obj: 'Application'});
					//Group does not already exist, create it
					var Group = this.model('Group');
					var group = new Group(groupData);
					return group.saveNew().then((newGroup) => {
						logger.info({description:'Group created successfully. Adding to application.', func:'addGroup', obj: 'Application'});
						//Add group to application
						this.groups.push(newGroup._id);
						return this.saveNew().then((savedApp) => {
							logger.info({description:'Group successfully added to application.', func:'addGroup', obj: 'Application'});
							return newGroup;
						}, (err) => {
							logger.error({description:'Error saving new group to application.', error: err, func:'addGroup', obj: 'Application'});
							return Promise.reject({message: 'Error saving new group.'});
						});
					}, (err) => {
						logger.error({description:'Error creating group.', error: err, func:'addGroup', obj: 'Application'});
						return Promise.reject({message: 'Error creating group.'});
					});
				} else {
					//TODO: Decide if this should happen?
					//Group already exists, add it to applicaiton
					logger.log({description:'Group already exists. Adding to application.', group: group, func:'addGroup', obj: 'Application'});
					this.groups.push(group._id);
					return this.saveNew().then((savedApp) => {
						logger.info({description:'Group successfully added to application.', group: group, savedApp: savedApp, func:'addGroup', obj: 'Application'});
						return group;
					}, (err) => {
						logger.error({description:'Error saving Group to application.', error: err, group: group, func:'addGroup', obj: 'Application'});
						return Promise.reject(err);
					});
				}
			}, (err) => {
				logger.error({description:'Error adding group to Application.', error: err, func:'addGroup', obj: 'Application'});
				return Promise.reject({message: 'Error adding group to Application.'});
			});
		}
	},
	//Update group within application
	updateGroup: (groupData) => {
		logger.log({description:'Update group called.', groupData: groupData, func:'updateGroup', obj: 'Application'});
		var query = this.model('Group').update({application: this._id, name: groupData.name});
		return query.then((err, group) => {
			if(!group){
				logger.error({description:'Application Group could not be updated.', func:'updateGroup', groupData: groupData, obj: 'Application'});
				return Promise.reject({message: 'Unable to update group.'});
			}
			logger.info({description:'Group Updated successfully.', func:'updateGroup', obj: 'Application'});
			return group;
		}, (err) => {
			logger.error({description:'Error updating application Group.', func:'updateGroup', updatedGroup: group, obj: 'Application'});
			return Promise.reject(err);
		});
	},
	//Delete group from application
	deleteGroup: (groupData) => {
		logger.log({description:'Delete group called.', groupData: groupData, app: this, func:'deleteGroup', obj: 'Application'});
		var groupInApp = _.findWhere(this.groups, {name: groupData.name});
		//TODO: Check groups before to make sure that group by that name exists
		if(!groupInApp){
			logger.log({description:'Group with provided name does not exist within application.', groupData: groupData, app: this, func:'deleteGroup', obj: 'Application'});
			return Promise.reject({message: 'Group with that name does not exist within application.', status: 'NOT_FOUND'});
		}
		var query = this.model('Group').findOneAndRemove({name: groupData.name});
		return query.then((group) => {
			if(!group){
				logger.error({description:'Unable to find group to delete.', func:'deleteGroup', obj: 'Application'});
				return Promise.reject({message: 'Unable delete group.', status: 'NOT_FOUND'});
			} else {
				logger.info({description:'Group deleted successfully. Removing from application.', returnedData: group, func:'deleteGroup', obj: 'Application'});
				//Remove group from application's groups
				_.remove(this.groups, (currentGroup) => {
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
				return this.groups;
			}
		}, (err) => {
			logger.error({description:'Error deleting group.', func:'deleteGroup', obj: 'Application'});
			return Promise.reject(err);
		});
	},
	//Upload file to bucket
	publishFile: (fileData) => {
		logger.log({description: 'Publish file called.', fileData: fileData, func: 'publishFile', obj: 'Application'});
		return fileStorage.saveFile(this.frontend.bucketName, fileData).then((newFile) => {
			logger.info({description: 'File published successfully.', newFile: newFile, func: 'publishFile', obj: 'Application'});
			return newFile;
		}, (err) => {
			logger.error({description: 'File published successfully.', error: err, func: 'publishFile', obj: 'Application'});
			return Promise.reject(err);
		});
	},
	//Get a signed url file actions
	signedUrl: (urlData) => {
		return fileStorage.signedUrl(urlData);
	},
	//TODO: Remove, this is handled within grout
	getStructure: () => {
		return fileStorage.getFiles(this.frontend.bucketName);
	},
	addAccountToDirectory: (accountData, directoryId) => {
		//TODO: Make this work with not just the first directory
		if(this.directories.length >= 1){
			//Application has directories
			logger.log({description: 'Application has directories.', func: 'addAccountToDirectory', obj: 'Application'});
			//Add to 'default' directory
			if(!directoryId){
				//TODO: have this reference a set defualt instead of first directory in list
				directoryId = this.directories[0]._id;
				logger.log({description: 'Directory was not provided. Default directory used.', id: directoryId, func: 'addAccountToDirectory', obj: 'Application'});
			}
			logger.log({description: 'Searching for directory.', id: directoryId, accountData: accountData, func: 'addAccountToDirectory', obj: 'Application'});
			return dQuery.then((result) => {
				if(!result){
					logger.error({description: 'Directory not found.', id: directoryId, func: 'addAccountToDirectory', obj: 'Application'});
					return Promise.reject({message: 'Directory not found.'});
				}
				logger.log({description: 'Directory found. Adding account.', directory: result, func: 'addAccountToDirectory', obj: 'Application'});
				//TODO: Make sure account does not already exist in directory before adding.
				return result.addAccount(accountData).then((dirWithAccount) => {
					logger.log({description: 'Account successfully added to directory.', directory: dirWithAccount, func: 'addAccountToDirectory', obj: 'Application'});
					return dirWithAccount;
				}, (err) => {
					logger.error({description: 'Error adding account to directory.', error: err, func: 'addAccountToDirectory', obj: 'Application'});
					return Promise.reject(err);
				});
			}, (err) => {
				logger.error({description: 'Error finding directory.', error: err, id: directoryId, func: 'addAccountToDirectory', obj: 'Application'});
				return Promise.reject(err);
			});
		} else {
			//TODO: Create a base directory if none exist
			logger.error({description: 'Application does not have any directories into which to add Account.', func: 'addAccountToDirectory', obj: 'Application'});
			d.reject({message: 'Application does not have any directories into which to add Account.', status: 'NOT_FOUND'});
		}
	}
};
//TODO: See if this is used
function findAccount(find){
	logger.log({description: 'Find account called.', findData: find, func: 'findAccount', file: 'Application Model'});
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
	return Account.find(findObj).then((foundAccount) => {
		if(!foundAccount){
			logger.error({description: 'Account could not be found.', func: 'findAccount', file: 'Application Model'});
			return Promise.reject({message:'Account could not be found'});
		}
		logger.info({description: 'Account found successfully.', foundAccount: foundAccount, func: 'findAccount', file: 'Application Model'});
		return foundAccount;
	}, () => {
		logger.error({description: 'Error finding account.', error: err, func: 'findAccount', file: 'Application Model'});
		return Promise.reject({message:'Error Adding collaborator.', error:err});
	});
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
