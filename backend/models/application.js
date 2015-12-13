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
sqs = require('../utils/sqs'),
AuthRocket = require('authrocket');

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
		provider:{type:String},
		bucketName:{type:String}
	},
	backend:{
		url:{type:String},
		provider:{type:String},
		appName:{type:String}
	},
	authRocket:{
		jsUrl:{type:String},
		apiUrl:{type:String},
		accountId:{type:String},
		realmId:{type:String}
	},
	providers:[{name:String, clientId:String}],
	groups:[{type:mongoose.Schema.Types.ObjectId, ref:'Group'}],
	collaborators:[{type: mongoose.Schema.Types.ObjectId, ref:'Account'}],
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
// ApplicationSchema.virtual('id')
// .get(function (){
// 	return this._id;
// });

ApplicationSchema.methods = {
	//Wrap save functionality in promise and handle errors
	saveNew: () => {
		logger.warn({
			description: 'saveNew called and is no longer nessesary.',
			func: 'saveNew', obj: 'Application'
		});
		return this.save().then((savedApp) => {
			if (!savedApp) {
				logger.error({
					description: 'Unable to save Application.',
					func: 'saveNew', obj: 'Application'
				});
				return Promise.reject({message: 'Application could not be saved.'});
			}
			logger.info({
				description: 'Application saved successfully.', savedApp: savedApp,
				func: 'saveNew', obj: 'Application'
			});
			return savedApp;
		}, (err) => {
			logger.error({
				description: 'Error saving Application.',
				error: err, func: 'saveNew', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	createWithTemplate: function (templateName, templateType){
		logger.log({
			description: 'Create application with template called.',
			templateData: templateData, application: this,
			func: 'createWithTemplate', obj: 'Application'
		});
		this.save().then((newApplication) => {
			newApplication.applyTemplate(templateData, storageData).then(() => {
				logger.info({
					description: 'Publish file called.',
					func: 'createWithTemplate', obj: 'Application'
				});
				return newApplication;
			}, (err) => {
				logger.error({
					description: 'Error applying template to application.', error: err,
					func: 'createWithTemplate', obj: 'Application'
				});
				return Promise.reject(err);
			});
		});
	},
	createWithStorage: function() {
		logger.log({
			description: 'Create with storage called.', application: this,
			func: 'createWithStorage', obj: 'Application'
		});
		// TODO: Add a new group by default
		//TODO: Add realm to authrocket if authRocket data is included
		var self = this;
		return self.save().then((newApplication) => {
			logger.log({
				description: 'New application added to db.', application: newApplication,
				func: 'createWithStorage', obj: 'Application'
			});
			return self.createFileStorage().then(() => {
				logger.info({
					description: 'Create storage was successful.', application: self,
					func: 'createWithStorage', obj: 'Application'
				});
				return newApplication;
			}, (err) => {
				logger.error({
					description: 'Error create application with storage.', error: err,
					func: 'createWithStorage', obj: 'Application'
				});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({
				description: 'Error saving new application.', error: err,
				func: 'createWithStorage', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	createStorage: function() {
		//TODO: Handle storageData including provider and name prefix
		logger.log({
			description: 'Create storage for application called.',
			func: 'createFileStorage', obj: 'Application'
		});
		var bucketName = bucketPrefix + this.name;
		var self = this;
		bucketName = bucketName.toLowerCase();
		return fileStorage.createBucket(bucketName).then((bucket) => {
			logger.log({
				description: 'New bucket storage created for application.',
				bucket: bucket, func: 'createFileStorage', obj: 'Application'
			});
			// TODO: Handle different bucket regions and site urls
			self.frontend = {
				bucketName:bucketName,
				provider:'Amazon',
				siteUrl:bucketName + '.s3-website-us-east-1.amazonaws.com',
				bucketUrl:'s3.amazonaws.com/' + bucketName
			};
			return self.save().then((appWithStorage) => {
				logger.info({
					description: 'App with storage created successfully.',
					app: appWithStorage, func: 'createFileStorage', obj: 'Application'
				});
				return appWithStorage;
			}, (err) => {
				logger.error({
					description: 'Error saving new application.', error: err,
					func: 'createFileStorage', obj: 'Application'
				});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({
				description: 'Error creating application bucket.', error: err,
				func: 'createFileStorage', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	removeStorage: function() {
		logger.log({
			description: 'Remove application storage called.',
			func: 'removeStorage', obj: 'Application'
		});
		if(!_.has(this, 'frontend') || !_.has(this.frontend, 'bucketName')){
			logger.log({
				description: 'No frontend to remove storage of.',
				func: 'removeStorage', obj: 'Application'
			});
			return Promise.resolve({message: 'Storage removed successfully.'});
		} else {
			//TODO: Handle different types of storage other than S3
			return fileStorage.deleteBucket(this.frontend.bucketName).then(() => {
				logger.info({
					description: 'Removing storage was not nessesary.',
					func: 'removeStorage', obj: 'Application'
				});
				return {message: 'Bucket deleted successfully.'};
			}, (err) => {
				if(err && err.code == "NoSuchBucket"){
					logger.log({
						description: 'Removing storage was not nessesary.',
						func: 'removeStorage', obj: 'Application'
					});
					return {message: 'No storage to remove.'};
				} else {
					logger.error({
						description: 'Error deleting application storage bucket.',
						func: 'removeStorage', obj: 'Application'
					});
					return Promise.reject(err);
				}
			});
		}
	},
	applyTemplate: function(templateName, templateType) {
		if(!templateName || _.isUndefined(templateName)){
			templateName = 'default';
		}
		if(!templateType || _.isUndefined(templateType)){
			templateName = 'firebase';
		}
		logger.log({
			description: 'Applying template to project.',
			templateName: templateName, func: 'applyTemplate', obj: 'Application'
		});
		//TODO: Check that the template was actually uploaded
		//New message format
		//fromName, fromType, toName, toType
		var messageArray = [templateName, templateType, this.name, 'firebase'];
		if(conf.aws.sqsQueueUrl){
			return sqs.add(messageArray.join('**'));
		} else {
			//TODO: Download then upload locally instead of pushing to worker queue
			logger.error({
				description: 'Queue url is currently required to create new templates This will be changed soon.',
				templateName: templateName, func: 'applyTemplate', obj: 'Application'
			});
		}
	},
	addCollaborators: function(usersArray) {
		logger.log({
			description: 'Add collaborators to application called.',
			usersArray: usersArray, func: 'addCollaborators', obj: 'Application'
		});
		var userPromises = [];
		var self = this;
		//TODO: Check to see if user exists and is already a collaborator before adding
		//TODO: Check to see if usersArray is a list of objects(userData) or numbers(userIds)
		if(usersArray && _.isArray(usersArray)){
			usersArray.forEach((user) => {
				logger.log({
					description: 'Finding account to add as collaborator.',
					userData: user, func: 'addCollaborators', obj: 'Application'
				});
				var d = q.defer();
				//Push promise to promises array
				userPromises.push(d);
				logger.log({
					description: 'Account find promise pushed to promise array.',
					userData: user, func: 'addCollaborators', obj: 'Application'
				});
				self.findAccount(user).then((foundAccount) => {
					logger.info({
						description: 'Found account, adding to collaborators.',
						foundAccount: foundAccount, func: 'addCollaborators', obj: 'Application'
					});
					//Add Account's ObjectID to application's collaborators
					self.collaborators.push(foundAccount._id);
					d.resolve(foundAccount);
				}, (err) => {
					logger.error({
						description: 'Error account in application.',
						error: err, func: 'addCollaborators', obj: 'Application'
					});
					d.reject(err);
				});
			});
		}
		//Run all users account promises then Add save promise to end of promises list
		return Promise.all(accountPromises).then((accountsArray) => {
			logger.log({
				description: 'collaborators all found:',
				accountsArray: accountsArray, func: 'addCollaborators', obj: 'Application'
			});
			return self.saveNew();
		}, (err) => {
			logger.error({
				description: 'Error with accountPromises',
				error: err, func: 'addCollaborators', obj: 'Application'
			});
			return err;
		});
	},
	login: function(loginData) {
		//Search for account in application's directories
		logger.log({
			description: 'Login to application called.',
			func: 'login', obj: 'Application'
		});
		//Login to authrocket if data is available
		if(this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0){
			if(!_.has(loginData, 'username')){
				//TODO: lookup user data from mongodb then login to allow authRocket login by email
				logger.log({
					description: 'Username is currently required to login due to AuthRocket. This will be fixed soon.',
					func: 'login', obj: 'Application'
				});
				return Promise.reject('Username is currently required to login due to AuthRocket. This will be fixed soon.');
			}
			//Remove email from data (causes error with authrocket request)
			if(_.has(loginData, 'email')){
				delete loginData.email;
			}
			return this.authRocketLogin(loginData).then((loggedInData) =>{
				logger.info({
					description: 'Login through authrocket successful.',
					loggedInData: loggedInData, func: 'login', obj: 'Application'
				});
				return loggedInData;
			}, (err) => {
				logger.warn({
					description: 'Error logging in through authrocket.',
					error: err, func: 'login', obj: 'Application'
				});
				return Promise.reject('Invalid Credentials.');
			});
		} else {
			//Default user management
			logger.log({
				description: 'Default account management.',
				loginData: loginData,
				func: 'login', obj: 'Application'
			});
			return this.findAccount(loginData).then((foundAccount) => {
				logger.log({
					description: 'Account found.',
					foundAccount: foundAccount,
					func: 'login', obj: 'Application'
				});
				return foundAccount.login(loginData.password).then((loggedInData) => {
					logger.info({
						description: 'Login to application successful.',
						loggedInData: loggedInData, func: 'login', obj: 'Application'
					});
					return loggedInData;
				}, (err) => {
					logger.error({
						description: 'Error logging into acocunt.',
						error: err, func: 'login', obj: 'Application'
					});
					return Promise.reject(err);
				});
			}, (err) => {
				logger.error({
					description: 'Error finding acocunt.',
					error: err, func: 'login', obj: 'Application'
				});
				return Promise.reject(err);
			});
		}
	},
	signup: function(signupData) {
		logger.log({
			description: 'Signup to application called.',
			signupData: signupData, application: this,
			func: 'signup', obj: 'Application'
		});
		var self = this;
		if(this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0){
			logger.log({
				description: 'Authrocket settings exist for application.',
				signupData: signupData, application: this,
				func: 'signup', obj: 'Application'
			});
			return this.appAuthRocket().signup(signupData).then((newAccount) => {
				logger.info({
					description: 'Account created through AuthRocket successfully.',
					newAccount: newAccount, func: 'signup', obj: 'Application'
				});
				return newAccount;
			}, (err) => {
				logger.error({
					description: 'Error signing up through authrocket.',
					error: err, func: 'signup', obj: 'Application'
				});
				return Promise.reject(err);
			});
		} else {
			//Default account management
			logger.log({
				description: 'Using default account management.',
				application: this, type: typeof this.model('Account'),
				func: 'signup', obj: 'Application'
			});
			var AccountModel = this.model('Account');
			var account = new AccountModel(signupData);
			logger.log({
				description: 'Using default account management.',
				application: account,
				func: 'signup', obj: 'Application'
			});
			return account.createWithPass(signupData.password, this._id).then((newAccount) => {
				logger.log({
					description: 'New account created.',
					accountObj: newAccount,
					func: 'signup', obj: 'Application'
				});
				return newAccount.login(signupData.password).then((loginRes) => {
					logger.info({
						description: 'New account logged in successfully.',
						loginRes: loginRes, newAccount: newAccount,
						func: 'signup', obj: 'Application'
					});
					//Respond with account and token
					return loginRes;
				}, (err) => {
					logger.error({
						description: 'Error logging into newly created account.',
						newAccount: newAccount, func: 'signup', obj: 'Application'
					});
					return Promise.reject(err);
				});
			}, (err) => {
				//Handle username already existing return from createWithPass
				if(err && err.status == 'EXISTS'){
					logger.error({
						description: 'Account already exists.',
						func: 'signup', obj: 'Application'
					});
				}
				logger.error({
					description: 'Error creating account.',
					error: err, func: 'signup', obj: 'Application'
				});
				return Promise.reject(err);
			});
		}
	},
	//Log user out of application
	logout: function(logoutData) {
		logger.log({
			description: 'Logout of application called.',
			data: logoutData, func: 'logout', obj: 'Application'
		});
		if(!logoutData){
			logger.log({
				description: 'Logout data is required to logout.',
				func: 'logout', obj: 'Application'
			});
			return Promise.reject({
				message: 'Logout data requred.'
			});
		}
		//Log the user out
		if(this.authRocket && this.authRocket.jsUrl){
			return this.appAuthRocket().logout(logoutData).then((logoutRes) => {
				return logoutRes;
			}, (err) => {
				logger.error({
					description: 'Error logging out through authrocket.', error: err,
					data: logoutData, func: 'logout', obj: 'Application'
				});
				return Promise.reject(err);
			});
		} else {
			//TODO: Make this work
			// this.model('Account').findOne({username:logoutData.username});
			logger.log({
				description: 'Default account management logout.',
				logoutData: logoutData,
				func: 'logout', obj: 'Application'
			});
			return this.findAccount(logoutData).then((foundAccount) => {
				logger.log({
					description: 'Account found in application. Attempting to logout.',
					account: foundAccount, func: 'logout', obj: 'Application'
				});
				return foundAccount.logout().then(() => {
					logger.log({
						description: 'Account logout successful.',
						logoutData: logoutData, func: 'logout',
						obj: 'Application'
					});
					return {message: 'Logout successful.'};
				}, (err) => {
					logger.error({
						description: 'Error logging out of account.',
						error: err, data: logoutData, func: 'logout',
						obj: 'Application'
					});
					return Promise.reject(err);
				});
			}, (err) => {
				logger.error({
					description: 'Account not found.',
					error: err, data:logoutData,
					func: 'logout', obj: 'Application'
				});
				return Promise.reject(err);
			});
		}
	},
	//Add group to application
	addGroup: function(groupData) {
		//TODO: make sure that group does not already exist in this application
		// if(indexOf(this.groups, group._id) == -1){
		// 	console.error('This group already exists application');
		// 	return;
		// }
		if(this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0){
			//Authrocket group(org) management
			return this.appAuthRocket().Orgs().add(groupData).then((updateRes) => {
				logger.log({
					description:'Group/Org updated successfully.', groupData: groupData,
					response: updateRes, func:'updateGroup', obj: 'Application'
				});
			}, (err) => {
				logger.error({
					description:'Error updating authrocket org.', data: groupData,
					error: err, func:'updateGroup', obj: 'Application'
				});
				return Promise.reject(err);
			});
		} else {
			var self = this;
			//Add application id to group
			groupData.application = this._id;
			//Add applicaiton id to search
			var findObj = {application: this._id};
			logger.log({
				description:'Add group to Application called.',
				func:'addGroup', obj: 'Application'
			});
			if(_.isString(groupData)){
				//Data is a string (name)
				findObj.name = groupData;
			} else if(_.has(groupData, 'name')){
				//Data is an object with a name
				findObj.name =  groupData.name
			} else {
				logger.error({
					description:'Incorrectly formatted group data.',
					groupData: groupData, func:'addGroup', obj: 'Application'
				});
				return Promise.reject({message: 'Group could not be added: Incorrectly formatted Group data.'});
			}
			//Do not search for group if a group object was passed
			if(_.has(groupData, '_id') || groupData instanceof this.model('Group')){
				//Group object was passed
				logger.log({
					description:'Group instance was passed, adding it to application.',
					groupData: groupData, func:'addGroup', obj: 'Application'
				});
				self.groups.push(groupData._id);
				return self.saveNew().then((savedApp) => {
					logger.info({
						description:'Group successfully added to application.',
						func:'addGroup', obj: 'Application'
					});
					return groupData;
				}, (err) => {
					logger.error({
						description:'Error saving new group to application.', error: err,
						func:'addGroup', obj: 'Application'
					});
					return Promise.reject(err);
				});
			} else {
				//Group object must be queried
				var query = self.model('Group').findOne(findObj);
				logger.log({
					description:'Find object constructed.', find: findObj,
					func:'addGroup', obj: 'Application'
				});
				return query.then((group) => {
					if(!group){
						logger.info({
							description:'Group does not already exist.',
							func:'addGroup', obj: 'Application'
						});
						//Group does not already exist, create it
						var Group = self.model('Group');
						var group = new Group(groupData);
						return group.saveNew().then((newGroup) => {
							logger.info({
								description:'Group created successfully. Adding to application.',
								func:'addGroup', obj: 'Application'
							});
							//Add group to application
							self.groups.push(newGroup._id);
							return self.saveNew().then((savedApp) => {
								logger.info({
									description:'Group successfully added to application.',
									func:'addGroup', obj: 'Application'
								});
								return newGroup;
							}, (err) => {
								logger.error({
									description:'Error saving new group to application.', error: err,
									func:'addGroup', obj: 'Application'
								});
								return Promise.reject({message: 'Error saving new group.'});
							});
						}, (err) => {
							logger.error({
								description:'Error creating group.', error: err,
								func:'addGroup', obj: 'Application'
							});
							return Promise.reject({message: 'Error creating group.'});
						});
					} else {
						//TODO: Decide if this should happen?
						//Group already exists, add it to applicaiton
						logger.log({
							description:'Group already exists. Adding to application.',
							group: group, func:'addGroup', obj: 'Application'
						});
						self.groups.push(group._id);
						return self.saveNew().then((savedApp) => {
							logger.info({
								description:'Group successfully added to application.', group: group,
								savedApp: savedApp, func:'addGroup', obj: 'Application'
							});
							return group;
						}, (err) => {
							logger.error({
								description:'Error saving Group to application.', error: err,
								group: group, func:'addGroup', obj: 'Application'
							});
							return Promise.reject(err);
						});
					}
				}, (err) => {
					logger.error({
						description:'Error adding group to Application.',
						error: err, func:'addGroup', obj: 'Application'
					});
					return Promise.reject({message: 'Error adding group to Application.'});
				});
			}
		}

	},
	//Update group within application
	updateGroup: function(groupData) {
		logger.log({
			description:'Update group called.', groupData: groupData,
			func:'updateGroup', obj: 'Application'
		});
		if(this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0){
			//Authrocket group(org) management
			return this.appAuthRocket().Orgs({id: groupData.name}).update(groupData).then((updateRes) => {
				logger.log({
					description:'Group/Org updated successfully.', groupData: groupData,
					response: updateRes, func:'updateGroup', obj: 'Application'
				});
			}, (err) => {
				logger.error({
					description:'Error updating authrocket org.', data: groupData,
					error: err, func:'updateGroup', obj: 'Application'
				});
				return Promise.reject(err);
			});
		} else {
			var query = this.model('Group').update({application: this._id, name: groupData.name});
			return query.then((err, group) => {
				if(!group){
					logger.error({
						description:'Application Group could not be updated.', groupData: groupData,
						func:'updateGroup', obj: 'Application'
					});
					return Promise.reject({message: 'Unable to update group.'});
				}
				logger.info({
					description:'Group Updated successfully.',
					func:'updateGroup', obj: 'Application'
				});
				return group;
			}, (err) => {
				logger.error({
					description:'Error updating application Group.', func:'updateGroup',
					updatedGroup: group, obj: 'Application'
				});
				return Promise.reject(err);
			});
		}
	},
	//Delete group from application
	deleteGroup: function(groupData) {
		logger.log({
			description:'Delete group called.', groupData: groupData,
			app: this, func:'deleteGroup', obj: 'Application'
		});
		if(this.authRocket){
			//Authrocket group(org) management
			return this.appAuthRocket().Orgs({id: groupData.name}).remove().then((removeRes) => {
				logger.log({
					description:'Delete group called.', groupData: groupData,
					app: this, func:'deleteGroup', obj: 'Application'
				});
				return removeRes;
			}, (err) => {
				logger.error({
					description:'Error deleting authrocket org.',
					error: err, func:'deleteGroup', obj: 'Application'
				});
				return Promise.reject(err);
			});
		} else {
			//Standard group management
			var groupInApp = _.findWhere(this.groups, {name: groupData.name});
			var self = this;
			//TODO: Check groups before to make sure that group by that name exists
			if(!groupInApp){
				logger.log({
					description:'Group with provided name does not exist within application.',
					groupData: groupData, app: this, func:'deleteGroup', obj: 'Application'
				});
				return Promise.reject({message: 'Group with that name does not exist within application.', status: 'NOT_FOUND'});
			}
			var query = this.model('Group').findOneAndRemove({name: groupData.name});
			return query.then((group) => {
				if(!group){
					logger.error({
						description:'Unable to find group to delete.',
						func:'deleteGroup', obj: 'Application'
					});
					return Promise.reject({message: 'Unable delete group.', status: 'NOT_FOUND'});
				} else {
					logger.info({
						description:'Group deleted successfully. Removing from application.',
						returnedData: group, func:'deleteGroup', obj: 'Application'
					});
					//Remove group from application's groups
					_.remove(self.groups, (currentGroup) => {
						//Handle currentGroups being list of IDs
						if(_.isObject(currentGroup) && _.has(currentGroup, '_id') && currentGroup._id == group._id){
							logger.info({
								description:'Removed group by object with id param.',
								returnedData: group, func:'deleteGroup', obj: 'Application'
							});
							return true;
						} else if(_.isString(currentGroup) && currentGroup == group._id) {
							//String containing group id
							logger.info({
								description:'Removed group by string id.', currentGroup: currentGroup,
								returnedData: group, func:'deleteGroup', obj: 'Application'
							});
							return true;
						} else {
							logger.error({
								description:'Could not find group within application.',
								returnedData: group,
								func:'deleteGroup', obj: 'Application'
							});
							return false;
						}
					});
					//Resolve application's groups without group
					return this.groups;
				}
			}, (err) => {
				logger.error({
					description:'Error deleting group.',
					func:'deleteGroup', obj: 'Application'
				});
				return Promise.reject(err);
			});
		}
	},
	//Upload file to bucket
	publishFile: function(fileData) {
		logger.log({
			description: 'Publish file called.', fileData: fileData,
			func: 'publishFile', obj: 'Application'
		});
		return fileStorage.saveFile(this.frontend.bucketName, fileData).then((newFile) => {
			logger.info({
				description: 'File published successfully.', newFile: newFile,
				func: 'publishFile', obj: 'Application'
			});
			return newFile;
		}, (err) => {
			logger.error({
				description: 'File published successfully.', error: err,
				func: 'publishFile', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	//Get a signed url file actions
	signedUrl: (urlData) => {
		return fileStorage.signedUrl(urlData);
	},
	//TODO: Remove, this is handled within grout
	getStructure: function() {
		return fileStorage.getFiles(this.frontend.bucketName);
	},
	appAuthRocket: function() {
		if(!this.authRocket || !this.authRocket.jsUrl){
			logger.error({
				description: 'Application does not have AuthRocket settings.',
				data: self.authRocket,
				func: 'authRocket', obj: 'Application'
			});
			return Promise.reject({message: 'AuthRocket settings do not exist.'});
		}
		var self = this;
		logger.log({
			description: 'Authrocket data of application.', data: self.authRocket,
			func: 'authRocket', obj: 'Application'
		});
		var authrocket = new AuthRocket(self.authRocket);
		logger.log({
			description: 'New authrocket created.', authRocket: authrocket,
			func: 'authRocket', obj: 'Application'
		});
		return authrocket;
	},
	authRocketSignup: function(signupData) {
		return this.appAuthRocket().signup(signupData).then((signupRes) => {
			logger.log({
				description: 'Successfully signed up through authrocket.',
				response: signupRes, func:'authRocketSignup', obj: 'Application'
			});
			return signupRes;
		}, (err) => {
			logger.error({
				description: 'Error signing up through authrocket.',
				error: err, func:'authRocketSignup', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	authRocketLogin: function(loginData) {
		return this.appAuthRocket().login(loginData).then((loginRes) => {
			logger.log({
				description: 'Successfully logged in through authrocket.',
				response: loginRes, func:'authRocketLogin', obj: 'Application'
			});
			return loginRes;
		}, (err) => {
			logger.error({
				description: 'Error logging in through authrocket.',
				error: err, func:'authRocketLogin', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	authRocketLogout: function(logoutData) {
		return this.appAuthRocket().logout(logoutData).then((logoutRes) => {
			logger.log({
				description: 'Successfully logged out through authrocket.',
				response: logoutRes, func:'authRocketLogout', obj: 'Application'
			});
			return logoutRes;
		}, (err) => {
			logger.error({
				description: 'Error logging out through authrocket.',
				error: err, func:'authRocketLogout', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	//Find account and make sure it is within application accounts, groups, and directories
	findAccount: function(accountData) {
		logger.log({
			description: 'Find account called.', application: this,
			accountData: accountData, func: 'findAccount', obj: 'Application'
		});
		var self = this;
		var findObj = {};
		if(accountData && _.has(accountData, 'username')){
			findObj.username = accountData.username
		} else if(_.isString(accountData)){
			findObj.username = accountData;
		}
		if(this.authRocket && this.authRocket.jsUrl){
			//Get account from authrocket
			return this.appAuthRocket().Users(findObj.username).get().then((loadedUser) => {
				logger.info({
					description:'Account loaded from authrocket.',
					obj:'Application', func:'findAccount'
				});
				return loadedUser;
			}, (err) => {
				logger.error({
					description: 'Error getting account from AuthRocket.',
					error: err, obj:'Application', func:'findAccount'
				});
				return Promise.reject(err);
			});
		} else {
			if(self._id){
				findObj.application = self._id;
			}
			logger.info({
				description:'Looking for account.',
				findObj: findObj,
				obj:'Application', func:'findAccount'
			});
			// Default account management
			//Find account based on username then see if its id is within either list
			var accountQuery = self.model('Account').findOne(findObj);
			return accountQuery.then((foundAccount) => {
				if(!foundAccount){
					logger.warn({
						description:'Account not found.',
						obj:'Application', func:'findAccount'
					});
					return Promise.reject({message:'Account not found', status:'NOT_FOUND'});
				}
				logger.log({
					description:'Account found.',
					application:self, foundAccount:foundAccount,
					obj:'Application', func:'findAccount'
				});
				return foundAccount;
			}, (err) => {
				logger.error({
					description:'Error finding account.',
					error: err,
					obj:'Application', func:'findAccount'
				});
				return Promise.reject(err);
			});
		}
	},
	// addAccountToDirectory: function(accountData, directoryId) {
	// 	//TODO: Make this work with not just the first directory
	// 	if(this.directories.length >= 1){
	// 		//Application has directories
	// 		logger.log({
	// 			description: 'Application has directories.',
	// 			func: 'addAccountToDirectory', obj: 'Application'
	// 		});
	// 		//Add to 'default' directory
	// 		if(!directoryId){
	// 			//TODO: have this reference a set defualt instead of first directory in list
	// 			directoryId = this.directories[0]._id;
	// 			logger.log({
	// 				description: 'Directory was not provided. Default directory used.',
	// 				id: directoryId, func: 'addAccountToDirectory', obj: 'Application'
	// 			});
	// 		}
	// 		logger.log({
	// 			description: 'Searching for directory.', id: directoryId,
	// 			accountData: accountData, func: 'addAccountToDirectory', obj: 'Application'
	// 		});
	// 		return dQuery.then((result) => {
	// 			if(!result){
	// 				logger.error({description: 'Directory not found.', id: directoryId,
	// 				func: 'addAccountToDirectory', obj: 'Application'
	// 			});
	// 				return Promise.reject({message: 'Directory not found.'});
	// 			}
	// 			logger.log({
	// 				description: 'Directory found. Adding account.', directory: result,
	// 				func: 'addAccountToDirectory', obj: 'Application'
	// 			});
	// 			//TODO: Make sure account does not already exist in directory before adding.
	// 			return result.addAccount(accountData).then((dirWithAccount) => {
	// 				logger.log({
	// 					description: 'Account successfully added to directory.', directory: dirWithAccount,
	// 					func: 'addAccountToDirectory', obj: 'Application'
	// 				});
	// 				return dirWithAccount;
	// 			}, (err) => {
	// 				logger.error({
	// 					description: 'Error adding account to directory.', error: err,
	// 					func: 'addAccountToDirectory', obj: 'Application'
	// 				});
	// 				return Promise.reject(err);
	// 			});
	// 		}, (err) => {
	// 			logger.error({
	// 				description: 'Error finding directory.', error: err,
	// 				id: directoryId, func: 'addAccountToDirectory', obj: 'Application'
	// 			});
	// 			return Promise.reject(err);
	// 		});
	// 	} else {
	// 		//TODO: Create a base directory if none exist
	// 		logger.error({
	// 			description: 'Application does not have any directories into which to add Account.',
	// 			func: 'addAccountToDirectory', obj: 'Application'
	// 		});
	// 		return Promise.reject({
	// 			message: 'Application does not have any directories into which to add Account.',
	// 			status: 'NOT_FOUND'
	// 		});
	// 	}
	// },
	// //Add directory to application
	// addDirectory: function(directoryData) {
	// 	//TODO: Handle checking for and creating a new directory if one doesn't exist
	// 	//TODO: Make sure this directory does not already exist in this application
	// 	var self = this;
	// 	var query = this.model('Directory').findOne({application: self._id, name: directoryData.name});
	// 	return query.then((directory) => {
	// 		if(err){
	// 			logger.error({
	// 				description:'Error adding directory.',
	// 				func:'deleteGroup', obj: 'Application'
	// 			});
	// 			return Promise.reject(err);
	// 		} else if(directory){
	// 			logger.error({
	// 				description:'Directory with this information already exists.',
	// 				func:'addDirectory', obj: 'Application'
	// 			});
	// 			return Promise.reject({message: 'Unable to add new directory'});
	// 		} else {
	// 			var newDirectory = new Directory({application:self._id, name: directoryData.name});
	// 			return newDirectory.saveNew();
	// 		}
	// 	}, (err) => {
	// 		logger.error({
	// 			description:'Error adding directory.', error: err,
	// 			func:'deleteGroup', obj: 'Application'
	// 		});
	// 		return Promise.reject({message: 'Error adding directory.'});
	// 	});
	// },
	// //Update directory in application
	// updateDirectory: function(directoryData) {
	// 	logger.log({
	// 		description:'Update directory called.',
	// 		func:'updateDirectory', obj: 'Application'
	// 	});
	// 	var query = this.model('Directory').findOne({application: this._id, name: directoryData.name});
	// 	return query.then((newDirectory) => {
	// 		if(err){
	// 			logger.error({
	// 				description:'Error updating directory.', error: err,
	// 				func:'updateDirectory', obj: 'Application'
	// 			});
	// 			return Promise.reject({message: 'Error updating directory.'});
	// 		} else if(!newDirectory){
	// 			logger.error({description:'', func:'updateDirectory', obj: 'Application'});
	// 			return Promise.reject({message: 'Unable to update directory'});
	// 		} else {
	// 			return newDirectory;
	// 		}
	// 	}, (err) => {
	// 		logger.error({
	// 			description:'Error updating directory.', error: err,
	// 			func:'updateDirectory', obj: 'Application'
	// 		});
	// 		return Promise.reject({message: 'Error updating directory.'});
	// 	});
	// },
	// //Delete directory from application
	// deleteDirectory: function(directoryData) {
	// 	logger.log({
	// 		description:'Delete directory called.',
	// 		func:'deleteDirectory', obj: 'Application'
	// 	});
	// 	var query = this.model('Directory').findOneAndRemove({application: this._id, name: directoryData.name});
	// 	return query.then((newDirectory) => {
	// 		if(err){
	// 			logger.error({
	// 				description:'Error deleting application directory.', error: err,
	// 				directoryData: directoryData, func:'deleteDirectory', obj: 'Application'
	// 			});
	// 			return Promise.reject(err);
	// 		} else {
	// 			logger.info({
	// 				description:'Directory deleted successfully.',
	// 				func:'deleteDirectory',obj: 'Application'
	// 			});
	// 			return {message: 'Directory deleted successfully.'};
	// 		}
	// 	}, (err) => {
	// 		return Promise.reject({message: 'Error deleting directory.'});
	// 	});
	// }
};
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
