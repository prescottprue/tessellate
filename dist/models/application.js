'use strict';

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sqs = require('../utils/sqs');

var sqs = _interopRequireWildcard(_sqs);

var _authrocket = require('authrocket');

var _authrocket2 = _interopRequireDefault(_authrocket);

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _db = require('../utils/db');

var _db2 = _interopRequireDefault(_db);

var _fileStorage = require('../utils/fileStorage');

var fileStorage = _interopRequireWildcard(_fileStorage);

var _group2 = require('./group');

var _group3 = _interopRequireDefault(_group2);

var _account = require('./account');

var _account2 = _interopRequireDefault(_account);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; } //External Libs

//Internal Config/Utils/Classes

//Set bucket prefix based on config as well as default if config does not exist
var bucketPrefix = "tessellate-";
if (_lodash2.default.has(_default2.default, 's3') && _lodash2.default.has(_default2.default.s3, 'bucketPrefix')) {
	bucketPrefix = _default2.default.s3.bucketPrefix;
}
//Application schema object
var ApplicationSchema = new _mongoose2.default.Schema({
	owner: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Account' },
	name: { type: String, default: '', unique: true, index: true },
	frontend: {
		siteUrl: { type: String },
		bucketUrl: { type: String },
		provider: { type: String },
		bucketName: { type: String }
	},
	backend: {
		url: { type: String },
		provider: { type: String },
		appName: { type: String }
	},
	authRocket: {
		jsUrl: { type: String },
		apiUrl: { type: String },
		accountId: { type: String },
		realmId: { type: String }
	},
	providers: [{ name: String, clientId: String }],
	groups: [{ type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Group' }],
	collaborators: [{ type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Account' }],
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
}, {
	toJSON: { virtuals: true }
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
	saveNew: function saveNew() {
		_logger2.default.warn({
			description: 'saveNew called and is no longer nessesary.',
			func: 'saveNew', obj: 'Application'
		});
		return undefined.save().then(function (savedApp) {
			if (!savedApp) {
				_logger2.default.error({
					description: 'Unable to save Application.',
					func: 'saveNew', obj: 'Application'
				});
				return Promise.reject({ message: 'Application could not be saved.' });
			}
			_logger2.default.info({
				description: 'Application saved successfully.', savedApp: savedApp,
				func: 'saveNew', obj: 'Application'
			});
			return savedApp;
		}, function (err) {
			_logger2.default.error({
				description: 'Error saving Application.',
				error: err, func: 'saveNew', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	createWithTemplate: function createWithTemplate(templateData) {
		var _this = this;

		_logger2.default.log({
			description: 'Create application with template called.',
			templateData: templateData, application: this,
			func: 'createWithTemplate', obj: 'Application'
		});
		return this.save().then(function (newApplication) {
			return newApplication.applyTemplate(templateData).then(function () {
				_logger2.default.info({
					description: 'New project created with template.',
					templateData: templateData, app: newApplication,
					func: 'createWithTemplate', obj: 'Application'
				});
				return newApplication;
			}, function (err) {
				_logger2.default.error({
					description: 'Error applying template to application.', error: err,
					func: 'createWithTemplate', obj: 'Application'
				});
				// Delete application from database if template is not applied successesfully
				var query = _this.model('Application').findOneAndRemove({ name: _this.name });
				return query.then(function (deleteInfo) {
					_logger2.default.info({
						description: 'New application removed from db due to failure of adding template.',
						func: 'createWithTemplate', obj: 'Application'
					});
					return Promise.reject({ message: 'Unable create new application.' });
				}, function (err) {
					_logger2.default.error({
						description: 'Error deleting application after failing to apply template.', error: err,
						func: 'createWithTemplate', obj: 'Application'
					});
					return Promise.reject(err);
				});
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Error creating new project in database', error: err,
				func: 'createWithTemplate', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	createWithStorage: function createWithStorage() {
		_logger2.default.log({
			description: 'Create with storage called.', application: this,
			func: 'createWithStorage', obj: 'Application'
		});
		// TODO: Add a new group by default
		//TODO: Add realm to authrocket if authRocket data is included
		var self = this;
		return self.save().then(function (newApplication) {
			_logger2.default.log({
				description: 'New application added to db.', application: newApplication,
				func: 'createWithStorage', obj: 'Application'
			});
			return self.createFileStorage().then(function () {
				_logger2.default.info({
					description: 'Create storage was successful.', application: self,
					func: 'createWithStorage', obj: 'Application'
				});
				return newApplication;
			}, function (err) {
				_logger2.default.error({
					description: 'Error create application with storage.', error: err,
					func: 'createWithStorage', obj: 'Application'
				});
				return Promise.reject(err);
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Error saving new application.', error: err,
				func: 'createWithStorage', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	createStorage: function createStorage() {
		//TODO: Handle storageData including provider and name prefix
		_logger2.default.log({
			description: 'Create storage for application called.',
			func: 'createFileStorage', obj: 'Application'
		});
		var bucketName = bucketPrefix + this.name;
		var self = this;
		bucketName = bucketName.toLowerCase();
		return fileStorage.createBucket(bucketName).then(function (bucket) {
			_logger2.default.log({
				description: 'New bucket storage created for application.',
				bucket: bucket, func: 'createFileStorage', obj: 'Application'
			});
			// TODO: Handle different bucket regions and site urls
			self.frontend = {
				bucketName: bucketName,
				provider: 'Amazon',
				siteUrl: bucketName + '.s3-website-us-east-1.amazonaws.com',
				bucketUrl: 's3.amazonaws.com/' + bucketName
			};
			return self.save().then(function (appWithStorage) {
				_logger2.default.info({
					description: 'App with storage created successfully.',
					app: appWithStorage, func: 'createFileStorage', obj: 'Application'
				});
				return appWithStorage;
			}, function (err) {
				_logger2.default.error({
					description: 'Error saving new application.', error: err,
					func: 'createFileStorage', obj: 'Application'
				});
				return Promise.reject(err);
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Error creating application bucket.', error: err,
				func: 'createFileStorage', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	removeStorage: function removeStorage() {
		_logger2.default.log({
			description: 'Remove application storage called.',
			func: 'removeStorage', obj: 'Application'
		});
		if (!_lodash2.default.has(this, 'frontend') || !_lodash2.default.has(this.frontend, 'bucketName')) {
			_logger2.default.log({
				description: 'No frontend to remove storage of.',
				func: 'removeStorage', obj: 'Application'
			});
			return Promise.resolve({ message: 'Storage removed successfully.' });
		} else {
			//TODO: Handle different types of storage other than S3
			return fileStorage.deleteBucket(this.frontend.bucketName).then(function () {
				_logger2.default.info({
					description: 'Removing storage was not nessesary.',
					func: 'removeStorage', obj: 'Application'
				});
				return { message: 'Bucket deleted successfully.' };
			}, function (err) {
				if (err && err.code == "NoSuchBucket") {
					_logger2.default.log({
						description: 'Removing storage was not nessesary.',
						func: 'removeStorage', obj: 'Application'
					});
					return { message: 'No storage to remove.' };
				} else {
					_logger2.default.error({
						description: 'Error deleting application storage bucket.',
						func: 'removeStorage', obj: 'Application'
					});
					return Promise.reject(err);
				}
			});
		}
	},
	applyTemplate: function applyTemplate(templateData) {
		if (!templateData || _lodash2.default.isUndefined(templateData.name)) {
			templateData.name = 'default';
		}
		if (!templateData || _lodash2.default.isUndefined(templateData.type)) {
			templateData.type = 'firebase';
		}
		_logger2.default.log({
			description: 'Applying template to project.',
			templateData: templateData, func: 'applyTemplate', obj: 'Application'
		});
		//TODO: Check that the template was actually uploaded
		//New message format
		//fromName, fromType, toName, toType
		var messageArray = [templateData.name, templateData.type, this.name, 'firebase'];
		// console.log('messageArray: ', messageArray);
		if (_default2.default.aws.sqsQueueUrl) {
			return sqs.add(messageArray.join('**'));
		} else {
			//TODO: Download then upload locally instead of pushing to worker queue
			_logger2.default.error({
				description: 'Queue url is currently required to create new templates This will be changed soon.',
				templateData: templateData, func: 'applyTemplate', obj: 'Application'
			});
			return Promise.reject({ message: 'Queue url is required to create an application with a template.' });
		}
	},
	addCollaborators: function addCollaborators(usersArray) {
		_logger2.default.log({
			description: 'Add collaborators to application called.',
			usersArray: usersArray, func: 'addCollaborators', obj: 'Application'
		});
		var userPromises = [];
		var self = this;
		//TODO: Check to see if user exists and is already a collaborator before adding
		//TODO: Check to see if usersArray is a list of objects(userData) or numbers(userIds)
		if (usersArray && _lodash2.default.isArray(usersArray)) {
			usersArray.forEach(function (user) {
				_logger2.default.log({
					description: 'Finding account to add as collaborator.',
					userData: user, func: 'addCollaborators', obj: 'Application'
				});
				var d = _q2.default.defer();
				//Push promise to promises array
				userPromises.push(d);
				_logger2.default.log({
					description: 'Account find promise pushed to promise array.',
					userData: user, func: 'addCollaborators', obj: 'Application'
				});
				self.findAccount(user).then(function (foundAccount) {
					_logger2.default.info({
						description: 'Found account, adding to collaborators.',
						foundAccount: foundAccount, func: 'addCollaborators', obj: 'Application'
					});
					//Add Account's ObjectID to application's collaborators
					self.collaborators.push(foundAccount._id);
					d.resolve(foundAccount);
				}, function (err) {
					_logger2.default.error({
						description: 'Error account in application.',
						error: err, func: 'addCollaborators', obj: 'Application'
					});
					d.reject(err);
				});
			});
		}
		//Run all users account promises then Add save promise to end of promises list
		return Promise.all(accountPromises).then(function (accountsArray) {
			_logger2.default.log({
				description: 'collaborators all found:',
				accountsArray: accountsArray, func: 'addCollaborators', obj: 'Application'
			});
			return self.saveNew();
		}, function (err) {
			_logger2.default.error({
				description: 'Error with accountPromises',
				error: err, func: 'addCollaborators', obj: 'Application'
			});
			return err;
		});
	},
	login: function login(loginData) {
		//Search for account in application's directories
		_logger2.default.log({
			description: 'Login to application called.',
			func: 'login', obj: 'Application'
		});
		//Login to authrocket if data is available
		if (this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0) {
			if (!_lodash2.default.has(loginData, 'username')) {
				//TODO: lookup user data from mongodb then login to allow authRocket login by email
				_logger2.default.log({
					description: 'Username is currently required to login due to AuthRocket. This will be fixed soon.',
					func: 'login', obj: 'Application'
				});
				return Promise.reject('Username is currently required to login due to AuthRocket. This will be fixed soon.');
			}
			//Remove email from data (causes error with authrocket request)
			if (_lodash2.default.has(loginData, 'email')) {
				delete loginData.email;
			}
			return this.authRocketLogin(loginData).then(function (loggedInData) {
				_logger2.default.info({
					description: 'Login through authrocket successful.',
					loggedInData: loggedInData, func: 'login', obj: 'Application'
				});
				return loggedInData;
			}, function (err) {
				_logger2.default.warn({
					description: 'Error logging in through authrocket.',
					error: err, func: 'login', obj: 'Application'
				});
				return Promise.reject('Invalid Credentials.');
			});
		} else {
			//Default user management
			_logger2.default.log({
				description: 'Default account management.',
				loginData: loginData,
				func: 'login', obj: 'Application'
			});
			return this.findAccount(loginData).then(function (foundAccount) {
				_logger2.default.log({
					description: 'Account found.',
					foundAccount: foundAccount,
					func: 'login', obj: 'Application'
				});
				return foundAccount.login(loginData.password).then(function (loggedInData) {
					_logger2.default.info({
						description: 'Login to application successful.',
						loggedInData: loggedInData, func: 'login', obj: 'Application'
					});
					return loggedInData;
				}, function (err) {
					_logger2.default.error({
						description: 'Error logging into acocunt.',
						error: err, func: 'login', obj: 'Application'
					});
					return Promise.reject(err);
				});
			}, function (err) {
				_logger2.default.error({
					description: 'Error finding acocunt.',
					error: err, func: 'login', obj: 'Application'
				});
				return Promise.reject(err);
			});
		}
	},
	signup: function signup(signupData) {
		_logger2.default.log({
			description: 'Signup to application called.',
			signupData: signupData, application: this,
			func: 'signup', obj: 'Application'
		});
		var self = this;
		if (this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0) {
			_logger2.default.log({
				description: 'Authrocket settings exist for application.',
				signupData: signupData, application: this,
				func: 'signup', obj: 'Application'
			});
			return this.appAuthRocket().signup(signupData).then(function (newAccount) {
				_logger2.default.info({
					description: 'Account created through AuthRocket successfully.',
					newAccount: newAccount, func: 'signup', obj: 'Application'
				});
				return newAccount;
			}, function (err) {
				_logger2.default.error({
					description: 'Error signing up through authrocket.',
					error: err, func: 'signup', obj: 'Application'
				});
				return Promise.reject(err);
			});
		} else {
			//Default account management
			_logger2.default.log({
				description: 'Using default account management.',
				application: this, type: _typeof(this.model('Account')),
				func: 'signup', obj: 'Application'
			});
			var AccountModel = this.model('Account');
			var account = new AccountModel(signupData);
			_logger2.default.log({
				description: 'Using default account management.',
				application: account,
				func: 'signup', obj: 'Application'
			});
			return account.createWithPass(signupData.password, this._id).then(function (newAccount) {
				_logger2.default.log({
					description: 'New account created.',
					accountObj: newAccount,
					func: 'signup', obj: 'Application'
				});
				return newAccount.login(signupData.password).then(function (loginRes) {
					_logger2.default.info({
						description: 'New account logged in successfully.',
						loginRes: loginRes, newAccount: newAccount,
						func: 'signup', obj: 'Application'
					});
					//Respond with account and token
					return loginRes;
				}, function (err) {
					_logger2.default.error({
						description: 'Error logging into newly created account.',
						newAccount: newAccount, func: 'signup', obj: 'Application'
					});
					return Promise.reject(err);
				});
			}, function (err) {
				//Handle username already existing return from createWithPass
				if (err && err.status == 'EXISTS') {
					_logger2.default.error({
						description: 'Account already exists.',
						func: 'signup', obj: 'Application'
					});
				}
				_logger2.default.error({
					description: 'Error creating account.',
					error: err, func: 'signup', obj: 'Application'
				});
				return Promise.reject(err);
			});
		}
	},
	//Log user out of application
	logout: function logout(logoutData) {
		_logger2.default.log({
			description: 'Logout of application called.',
			data: logoutData, func: 'logout', obj: 'Application'
		});
		if (!logoutData) {
			_logger2.default.log({
				description: 'Logout data is required to logout.',
				func: 'logout', obj: 'Application'
			});
			return Promise.reject({
				message: 'Logout data requred.'
			});
		}
		//Log the user out
		if (this.authRocket && this.authRocket.jsUrl) {
			return this.appAuthRocket().logout(logoutData).then(function (logoutRes) {
				return logoutRes;
			}, function (err) {
				_logger2.default.error({
					description: 'Error logging out through authrocket.', error: err,
					data: logoutData, func: 'logout', obj: 'Application'
				});
				return Promise.reject(err);
			});
		} else {
			//TODO: Make this work
			// this.model('Account').findOne({username:logoutData.username});
			_logger2.default.log({
				description: 'Default account management logout.',
				logoutData: logoutData,
				func: 'logout', obj: 'Application'
			});
			return this.findAccount(logoutData).then(function (foundAccount) {
				_logger2.default.log({
					description: 'Account found in application. Attempting to logout.',
					account: foundAccount, func: 'logout', obj: 'Application'
				});
				return foundAccount.logout().then(function () {
					_logger2.default.log({
						description: 'Account logout successful.',
						logoutData: logoutData, func: 'logout',
						obj: 'Application'
					});
					return { message: 'Logout successful.' };
				}, function (err) {
					_logger2.default.error({
						description: 'Error logging out of account.',
						error: err, data: logoutData, func: 'logout',
						obj: 'Application'
					});
					return Promise.reject(err);
				});
			}, function (err) {
				_logger2.default.error({
					description: 'Account not found.',
					error: err, data: logoutData,
					func: 'logout', obj: 'Application'
				});
				return Promise.reject(err);
			});
		}
	},
	//Add group to application
	addGroup: function addGroup(groupData) {
		var _this2 = this;

		//TODO: make sure that group does not already exist in this application
		// if(indexOf(this.groups, group._id) == -1){
		// 	console.error('This group already exists application');
		// 	return;
		// }
		if (this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0) {
			//Authrocket group(org) management
			return this.appAuthRocket().Orgs().add(groupData).then(function (updateRes) {
				_logger2.default.log({
					description: 'Group/Org updated successfully.', groupData: groupData,
					response: updateRes, func: 'updateGroup', obj: 'Application'
				});
			}, function (err) {
				_logger2.default.error({
					description: 'Error updating authrocket org.', data: groupData,
					error: err, func: 'updateGroup', obj: 'Application'
				});
				return Promise.reject(err);
			});
		} else {
			var _ret = (function () {
				var self = _this2;
				//Add application id to group
				groupData.application = _this2._id;
				//Add applicaiton id to search
				var findObj = { application: _this2._id };
				_logger2.default.log({
					description: 'Add group to Application called.',
					func: 'addGroup', obj: 'Application'
				});
				if (_lodash2.default.isString(groupData)) {
					//Data is a string (name)
					findObj.name = groupData;
				} else if (_lodash2.default.has(groupData, 'name')) {
					//Data is an object with a name
					findObj.name = groupData.name;
				} else {
					_logger2.default.error({
						description: 'Incorrectly formatted group data.',
						groupData: groupData, func: 'addGroup', obj: 'Application'
					});
					return {
						v: Promise.reject({ message: 'Group could not be added: Incorrectly formatted Group data.' })
					};
				}
				//Do not search for group if a group object was passed
				if (_lodash2.default.has(groupData, '_id') || groupData instanceof _this2.model('Group')) {
					//Group object was passed
					_logger2.default.log({
						description: 'Group instance was passed, adding it to application.',
						groupData: groupData, func: 'addGroup', obj: 'Application'
					});
					self.groups.push(groupData._id);
					return {
						v: self.saveNew().then(function (savedApp) {
							_logger2.default.info({
								description: 'Group successfully added to application.',
								func: 'addGroup', obj: 'Application'
							});
							return groupData;
						}, function (err) {
							_logger2.default.error({
								description: 'Error saving new group to application.', error: err,
								func: 'addGroup', obj: 'Application'
							});
							return Promise.reject(err);
						})
					};
				} else {
					//Group object must be queried
					var query = self.model('Group').findOne(findObj);
					_logger2.default.log({
						description: 'Find object constructed.', find: findObj,
						func: 'addGroup', obj: 'Application'
					});
					return {
						v: query.then(function (group) {
							if (!group) {
								_logger2.default.info({
									description: 'Group does not already exist.',
									func: 'addGroup', obj: 'Application'
								});
								//Group does not already exist, create it
								var _Group = self.model('Group');
								var _group = new _Group(groupData);
								return _group.saveNew().then(function (newGroup) {
									_logger2.default.info({
										description: 'Group created successfully. Adding to application.',
										func: 'addGroup', obj: 'Application'
									});
									//Add group to application
									self.groups.push(newGroup._id);
									return self.saveNew().then(function (savedApp) {
										_logger2.default.info({
											description: 'Group successfully added to application.',
											func: 'addGroup', obj: 'Application'
										});
										return newGroup;
									}, function (err) {
										_logger2.default.error({
											description: 'Error saving new group to application.', error: err,
											func: 'addGroup', obj: 'Application'
										});
										return Promise.reject({ message: 'Error saving new group.' });
									});
								}, function (err) {
									_logger2.default.error({
										description: 'Error creating group.', error: err,
										func: 'addGroup', obj: 'Application'
									});
									return Promise.reject({ message: 'Error creating group.' });
								});
							} else {
								//TODO: Decide if this should happen?
								//Group already exists, add it to applicaiton
								_logger2.default.log({
									description: 'Group already exists. Adding to application.',
									group: group, func: 'addGroup', obj: 'Application'
								});
								self.groups.push(group._id);
								return self.saveNew().then(function (savedApp) {
									_logger2.default.info({
										description: 'Group successfully added to application.', group: group,
										savedApp: savedApp, func: 'addGroup', obj: 'Application'
									});
									return group;
								}, function (err) {
									_logger2.default.error({
										description: 'Error saving Group to application.', error: err,
										group: group, func: 'addGroup', obj: 'Application'
									});
									return Promise.reject(err);
								});
							}
						}, function (err) {
							_logger2.default.error({
								description: 'Error adding group to Application.',
								error: err, func: 'addGroup', obj: 'Application'
							});
							return Promise.reject({ message: 'Error adding group to Application.' });
						})
					};
				}
			})();

			if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
		}
	},
	//Update group within application
	updateGroup: function updateGroup(groupData) {
		_logger2.default.log({
			description: 'Update group called.', groupData: groupData,
			func: 'updateGroup', obj: 'Application'
		});
		if (this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0) {
			//Authrocket group(org) management
			return this.appAuthRocket().Orgs({ id: groupData.name }).update(groupData).then(function (updateRes) {
				_logger2.default.log({
					description: 'Group/Org updated successfully.', groupData: groupData,
					response: updateRes, func: 'updateGroup', obj: 'Application'
				});
			}, function (err) {
				_logger2.default.error({
					description: 'Error updating authrocket org.', data: groupData,
					error: err, func: 'updateGroup', obj: 'Application'
				});
				return Promise.reject(err);
			});
		} else {
			var query = this.model('Group').update({ application: this._id, name: groupData.name });
			return query.then(function (err, group) {
				if (!group) {
					_logger2.default.error({
						description: 'Application Group could not be updated.', groupData: groupData,
						func: 'updateGroup', obj: 'Application'
					});
					return Promise.reject({ message: 'Unable to update group.' });
				}
				_logger2.default.info({
					description: 'Group Updated successfully.',
					func: 'updateGroup', obj: 'Application'
				});
				return group;
			}, function (err) {
				_logger2.default.error({
					description: 'Error updating application Group.', func: 'updateGroup',
					updatedGroup: group, obj: 'Application'
				});
				return Promise.reject(err);
			});
		}
	},
	//Delete group from application
	deleteGroup: function deleteGroup(groupData) {
		var _this3 = this;

		_logger2.default.log({
			description: 'Delete group called.', groupData: groupData,
			app: this, func: 'deleteGroup', obj: 'Application'
		});
		if (this.authRocket) {
			//Authrocket group(org) management
			return this.appAuthRocket().Orgs({ id: groupData.name }).remove().then(function (removeRes) {
				_logger2.default.log({
					description: 'Delete group called.', groupData: groupData,
					app: _this3, func: 'deleteGroup', obj: 'Application'
				});
				return removeRes;
			}, function (err) {
				_logger2.default.error({
					description: 'Error deleting authrocket org.',
					error: err, func: 'deleteGroup', obj: 'Application'
				});
				return Promise.reject(err);
			});
		} else {
			var _ret2 = (function () {
				//Standard group management
				var groupInApp = _lodash2.default.findWhere(_this3.groups, { name: groupData.name });
				var self = _this3;
				//TODO: Check groups before to make sure that group by that name exists
				if (!groupInApp) {
					_logger2.default.log({
						description: 'Group with provided name does not exist within application.',
						groupData: groupData, app: _this3, func: 'deleteGroup', obj: 'Application'
					});
					return {
						v: Promise.reject({ message: 'Group with that name does not exist within application.', status: 'NOT_FOUND' })
					};
				}
				var query = _this3.model('Group').findOneAndRemove({ name: groupData.name });
				return {
					v: query.then(function (group) {
						if (!group) {
							_logger2.default.error({
								description: 'Unable to find group to delete.',
								func: 'deleteGroup', obj: 'Application'
							});
							return Promise.reject({ message: 'Unable delete group.', status: 'NOT_FOUND' });
						} else {
							_logger2.default.info({
								description: 'Group deleted successfully. Removing from application.',
								returnedData: group, func: 'deleteGroup', obj: 'Application'
							});
							//Remove group from application's groups
							_lodash2.default.remove(self.groups, function (currentGroup) {
								//Handle currentGroups being list of IDs
								if (_lodash2.default.isObject(currentGroup) && _lodash2.default.has(currentGroup, '_id') && currentGroup._id == group._id) {
									_logger2.default.info({
										description: 'Removed group by object with id param.',
										returnedData: group, func: 'deleteGroup', obj: 'Application'
									});
									return true;
								} else if (_lodash2.default.isString(currentGroup) && currentGroup == group._id) {
									//String containing group id
									_logger2.default.info({
										description: 'Removed group by string id.', currentGroup: currentGroup,
										returnedData: group, func: 'deleteGroup', obj: 'Application'
									});
									return true;
								} else {
									_logger2.default.error({
										description: 'Could not find group within application.',
										returnedData: group,
										func: 'deleteGroup', obj: 'Application'
									});
									return false;
								}
							});
							//Resolve application's groups without group
							return _this3.groups;
						}
					}, function (err) {
						_logger2.default.error({
							description: 'Error deleting group.',
							func: 'deleteGroup', obj: 'Application'
						});
						return Promise.reject(err);
					})
				};
			})();

			if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
		}
	},
	//Upload file to bucket
	publishFile: function publishFile(fileData) {
		_logger2.default.log({
			description: 'Publish file called.', fileData: fileData,
			func: 'publishFile', obj: 'Application'
		});
		return fileStorage.saveFile(this.frontend.bucketName, fileData).then(function (newFile) {
			_logger2.default.info({
				description: 'File published successfully.', newFile: newFile,
				func: 'publishFile', obj: 'Application'
			});
			return newFile;
		}, function (err) {
			_logger2.default.error({
				description: 'File published successfully.', error: err,
				func: 'publishFile', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	//Get a signed url file actions
	signedUrl: function signedUrl(urlData) {
		return fileStorage.signedUrl(urlData);
	},
	//TODO: Remove, this is handled within grout
	getStructure: function getStructure() {
		return fileStorage.getFiles(this.frontend.bucketName);
	},
	appAuthRocket: function appAuthRocket() {
		if (!this.authRocket || !this.authRocket.jsUrl) {
			_logger2.default.error({
				description: 'Application does not have AuthRocket settings.',
				data: self.authRocket,
				func: 'authRocket', obj: 'Application'
			});
			return Promise.reject({ message: 'AuthRocket settings do not exist.' });
		}
		var self = this;
		_logger2.default.log({
			description: 'Authrocket data of application.', data: self.authRocket,
			func: 'authRocket', obj: 'Application'
		});
		var authrocket = new _authrocket2.default(self.authRocket);
		_logger2.default.log({
			description: 'New authrocket created.', authRocket: authrocket,
			func: 'authRocket', obj: 'Application'
		});
		return authrocket;
	},
	authRocketSignup: function authRocketSignup(signupData) {
		return this.appAuthRocket().signup(signupData).then(function (signupRes) {
			_logger2.default.log({
				description: 'Successfully signed up through authrocket.',
				response: signupRes, func: 'authRocketSignup', obj: 'Application'
			});
			return signupRes;
		}, function (err) {
			_logger2.default.error({
				description: 'Error signing up through authrocket.',
				error: err, func: 'authRocketSignup', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	authRocketLogin: function authRocketLogin(loginData) {
		return this.appAuthRocket().login(loginData).then(function (loginRes) {
			_logger2.default.log({
				description: 'Successfully logged in through authrocket.',
				response: loginRes, func: 'authRocketLogin', obj: 'Application'
			});
			return loginRes;
		}, function (err) {
			_logger2.default.error({
				description: 'Error logging in through authrocket.',
				error: err, func: 'authRocketLogin', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	authRocketLogout: function authRocketLogout(logoutData) {
		return this.appAuthRocket().logout(logoutData).then(function (logoutRes) {
			_logger2.default.log({
				description: 'Successfully logged out through authrocket.',
				response: logoutRes, func: 'authRocketLogout', obj: 'Application'
			});
			return logoutRes;
		}, function (err) {
			_logger2.default.error({
				description: 'Error logging out through authrocket.',
				error: err, func: 'authRocketLogout', obj: 'Application'
			});
			return Promise.reject(err);
		});
	},
	//Find account and make sure it is within application accounts, groups, and directories
	findAccount: function findAccount(accountData) {
		_logger2.default.log({
			description: 'Find account called.', application: this,
			accountData: accountData, func: 'findAccount', obj: 'Application'
		});
		var self = this;
		var findObj = {};
		if (accountData && _lodash2.default.has(accountData, 'username')) {
			findObj.username = accountData.username;
		} else if (_lodash2.default.isString(accountData)) {
			findObj.username = accountData;
		}
		if (this.authRocket && this.authRocket.jsUrl) {
			//Get account from authrocket
			return this.appAuthRocket().Users(findObj.username).get().then(function (loadedUser) {
				_logger2.default.info({
					description: 'Account loaded from authrocket.',
					obj: 'Application', func: 'findAccount'
				});
				return loadedUser;
			}, function (err) {
				_logger2.default.error({
					description: 'Error getting account from AuthRocket.',
					error: err, obj: 'Application', func: 'findAccount'
				});
				return Promise.reject(err);
			});
		} else {
			if (self._id) {
				findObj.application = self._id;
			}
			_logger2.default.info({
				description: 'Looking for account.',
				findObj: findObj,
				obj: 'Application', func: 'findAccount'
			});
			// Default account management
			//Find account based on username then see if its id is within either list
			var accountQuery = self.model('Account').findOne(findObj);
			return accountQuery.then(function (foundAccount) {
				if (!foundAccount) {
					_logger2.default.warn({
						description: 'Account not found.',
						obj: 'Application', func: 'findAccount'
					});
					return Promise.reject({ message: 'Account not found', status: 'NOT_FOUND' });
				}
				_logger2.default.log({
					description: 'Account found.',
					application: self, foundAccount: foundAccount,
					obj: 'Application', func: 'findAccount'
				});
				return foundAccount;
			}, function (err) {
				_logger2.default.error({
					description: 'Error finding account.',
					error: err,
					obj: 'Application', func: 'findAccount'
				});
				return Promise.reject(err);
			});
		}
	}
};
/*
 * Construct `Account` model from `AccountSchema`
 */
_db2.default.tessellate.model('Application', ApplicationSchema);

/*
 * Make model accessible from controllers
 */
var Application = _db2.default.tessellate.model('Application');
Application.collectionName = ApplicationSchema.get('collection');

exports.Application = _db2.default.tessellate.model('Application');