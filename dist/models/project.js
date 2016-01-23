'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; //External Libs

//Internal Config/Utils/Classes

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

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Set bucket prefix based on config as well as default if config does not exist
var bucketPrefix = "tessellate-";
if (_lodash2.default.has(_default2.default, 's3') && _lodash2.default.has(_default2.default.s3, 'bucketPrefix')) {
	bucketPrefix = _default2.default.s3.bucketPrefix;
}
//Project schema object
var ProjectSchema = new _mongoose2.default.Schema({
	owner: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'User' },
	name: { type: String, default: '', unique: true, index: true },
	frontend: {
		siteUrl: { type: String },
		bucketUrl: { type: String },
		provider: { type: String },
		bucketName: { type: String }
	},
	authRocket: {
		jsUrl: { type: String },
		apiUrl: { type: String },
		userId: { type: String },
		realmId: { type: String }
	},
	providers: [{ name: String, clientId: String }],
	groups: [{ type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Group' }],
	collaborators: [{ type: _mongoose2.default.Schema.Types.ObjectId, ref: 'User' }],
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
}, {
	toJSON: { virtuals: true }
});

//Set collection name
ProjectSchema.set('collection', 'projects');

/*
 * Id virtual
 */
// ProjectSchema.virtual('id')
// .get(function (){
// 	return this._id;
// });

ProjectSchema.methods = {
	//Wrap save functionality in promise and handle errors
	saveNew: function saveNew() {
		_logger2.default.warn({
			description: 'saveNew called and is no longer nessesary.',
			func: 'saveNew', obj: 'Project'
		});
		return undefined.save().then(function (savedApp) {
			if (!savedApp) {
				_logger2.default.error({
					description: 'Unable to save Project.',
					func: 'saveNew', obj: 'Project'
				});
				return Promise.reject({ message: 'Project could not be saved.' });
			}
			_logger2.default.info({
				description: 'Project saved successfully.', savedApp: savedApp,
				func: 'saveNew', obj: 'Project'
			});
			return savedApp;
		}, function (err) {
			_logger2.default.error({
				description: 'Error saving Project.',
				error: err, func: 'saveNew', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	createWithTemplate: function createWithTemplate(templateData) {
		var _this = this;

		_logger2.default.log({
			description: 'Create application with template called.',
			templateData: templateData, application: this,
			func: 'createWithTemplate', obj: 'Project'
		});
		return this.save().then(function (newProject) {
			return newProject.applyTemplate(templateData).then(function () {
				_logger2.default.info({
					description: 'New project created with template.',
					templateData: templateData, app: newProject,
					func: 'createWithTemplate', obj: 'Project'
				});
				return newProject;
			}, function (err) {
				_logger2.default.error({
					description: 'Error applying template to application.', error: err,
					func: 'createWithTemplate', obj: 'Project'
				});
				// Delete application from database if template is not applied successesfully
				var query = _this.model('Project').findOneAndRemove({ name: _this.name });
				return query.then(function (deleteInfo) {
					_logger2.default.info({
						description: 'New application removed from db due to failure of adding template.',
						func: 'createWithTemplate', obj: 'Project'
					});
					return Promise.reject({ message: 'Unable create new application.' });
				}, function (err) {
					_logger2.default.error({
						description: 'Error deleting application after failing to apply template.', error: err,
						func: 'createWithTemplate', obj: 'Project'
					});
					return Promise.reject(err);
				});
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Error creating new project in database', error: err,
				func: 'createWithTemplate', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	createWithStorage: function createWithStorage() {
		_logger2.default.log({
			description: 'Create with storage called.', application: this,
			func: 'createWithStorage', obj: 'Project'
		});
		// TODO: Add a new group by default
		//TODO: Add realm to authrocket if authRocket data is included
		var self = this;
		return self.save().then(function (newProject) {
			_logger2.default.log({
				description: 'New application added to db.', application: newProject,
				func: 'createWithStorage', obj: 'Project'
			});
			return self.createFileStorage().then(function () {
				_logger2.default.info({
					description: 'Create storage was successful.', application: self,
					func: 'createWithStorage', obj: 'Project'
				});
				return newProject;
			}, function (err) {
				_logger2.default.error({
					description: 'Error create application with storage.', error: err,
					func: 'createWithStorage', obj: 'Project'
				});
				return Promise.reject(err);
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Error saving new application.', error: err,
				func: 'createWithStorage', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	createStorage: function createStorage() {
		//TODO: Handle storageData including provider and name prefix
		_logger2.default.log({
			description: 'Create storage for application called.',
			func: 'createFileStorage', obj: 'Project'
		});
		var bucketName = bucketPrefix + this.name;
		var self = this;
		bucketName = bucketName.toLowerCase();
		return fileStorage.createBucket(bucketName).then(function (bucket) {
			_logger2.default.log({
				description: 'New bucket storage created for application.',
				bucket: bucket, func: 'createFileStorage', obj: 'Project'
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
					app: appWithStorage, func: 'createFileStorage', obj: 'Project'
				});
				return appWithStorage;
			}, function (err) {
				_logger2.default.error({
					description: 'Error saving new application.', error: err,
					func: 'createFileStorage', obj: 'Project'
				});
				return Promise.reject(err);
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Error creating application bucket.', error: err,
				func: 'createFileStorage', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	removeStorage: function removeStorage() {
		_logger2.default.log({
			description: 'Remove application storage called.',
			func: 'removeStorage', obj: 'Project'
		});
		if (!_lodash2.default.has(this, 'frontend') || !_lodash2.default.has(this.frontend, 'bucketName')) {
			_logger2.default.log({
				description: 'No frontend to remove storage of.',
				func: 'removeStorage', obj: 'Project'
			});
			return Promise.resolve({ message: 'Storage removed successfully.' });
		} else {
			//TODO: Handle different types of storage other than S3
			return fileStorage.deleteBucket(this.frontend.bucketName).then(function () {
				_logger2.default.info({
					description: 'Removing storage was not nessesary.',
					func: 'removeStorage', obj: 'Project'
				});
				return { message: 'Bucket deleted successfully.' };
			}, function (err) {
				if (err && err.code == "NoSuchBucket") {
					_logger2.default.log({
						description: 'Removing storage was not nessesary.',
						func: 'removeStorage', obj: 'Project'
					});
					return { message: 'No storage to remove.' };
				} else {
					_logger2.default.error({
						description: 'Error deleting application storage bucket.',
						func: 'removeStorage', obj: 'Project'
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
			templateData: templateData, func: 'applyTemplate', obj: 'Project'
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
				templateData: templateData, func: 'applyTemplate', obj: 'Project'
			});
			return Promise.reject({ message: 'Queue url is required to create an application with a template.' });
		}
	},
	addCollaborators: function addCollaborators(usersArray) {
		_logger2.default.log({
			description: 'Add collaborators to application called.',
			usersArray: usersArray, func: 'addCollaborators', obj: 'Project'
		});
		var userPromises = [];
		var self = this;
		//TODO: Check to see if user exists and is already a collaborator before adding
		//TODO: Check to see if usersArray is a list of objects(userData) or numbers(userIds)
		if (usersArray && _lodash2.default.isArray(usersArray)) {
			usersArray.forEach(function (user) {
				_logger2.default.log({
					description: 'Finding user to add as collaborator.',
					userData: user, func: 'addCollaborators', obj: 'Project'
				});
				var d = _q2.default.defer();
				//Push promise to promises array
				userPromises.push(d);
				_logger2.default.log({
					description: 'User find promise pushed to promise array.',
					userData: user, func: 'addCollaborators', obj: 'Project'
				});
				self.findUser(user).then(function (foundUser) {
					_logger2.default.info({
						description: 'Found user, adding to collaborators.',
						foundUser: foundUser, func: 'addCollaborators', obj: 'Project'
					});
					//Add User's ObjectID to application's collaborators
					self.collaborators.push(foundUser._id);
					d.resolve(foundUser);
				}, function (err) {
					_logger2.default.error({
						description: 'Error user in application.',
						error: err, func: 'addCollaborators', obj: 'Project'
					});
					d.reject(err);
				});
			});
		}
		//Run all users user promises then Add save promise to end of promises list
		return Promise.all(userPromises).then(function (usersArray) {
			_logger2.default.log({
				description: 'collaborators all found:',
				usersArray: usersArray, func: 'addCollaborators', obj: 'Project'
			});
			return self.saveNew();
		}, function (err) {
			_logger2.default.error({
				description: 'Error with userPromises',
				error: err, func: 'addCollaborators', obj: 'Project'
			});
			return err;
		});
	},
	login: function login(loginData) {
		//Search for user in application's directories
		_logger2.default.log({
			description: 'Login to application called.',
			func: 'login', obj: 'Project'
		});
		//Login to authrocket if data is available
		if (this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0) {
			if (!_lodash2.default.has(loginData, 'username')) {
				//TODO: lookup user data from mongodb then login to allow authRocket login by email
				_logger2.default.log({
					description: 'Username is currently required to login due to AuthRocket. This will be fixed soon.',
					func: 'login', obj: 'Project'
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
					loggedInData: loggedInData, func: 'login', obj: 'Project'
				});
				return loggedInData;
			}, function (err) {
				_logger2.default.warn({
					description: 'Error logging in through authrocket.',
					error: err, func: 'login', obj: 'Project'
				});
				return Promise.reject('Invalid Credentials.');
			});
		} else {
			//Default user management
			_logger2.default.log({
				description: 'Default user management.',
				loginData: loginData,
				func: 'login', obj: 'Project'
			});
			return this.findUser(loginData).then(function (foundUser) {
				_logger2.default.log({
					description: 'User found.',
					foundUser: foundUser,
					func: 'login', obj: 'Project'
				});
				return foundUser.login(loginData.password).then(function (loggedInData) {
					_logger2.default.info({
						description: 'Login to application successful.',
						loggedInData: loggedInData, func: 'login', obj: 'Project'
					});
					return loggedInData;
				}, function (err) {
					_logger2.default.error({
						description: 'Error logging into acocunt.',
						error: err, func: 'login', obj: 'Project'
					});
					return Promise.reject(err);
				});
			}, function (err) {
				_logger2.default.error({
					description: 'Error finding acocunt.',
					error: err, func: 'login', obj: 'Project'
				});
				return Promise.reject(err);
			});
		}
	},
	signup: function signup(signupData) {
		_logger2.default.log({
			description: 'Signup to application called.',
			signupData: signupData, application: this,
			func: 'signup', obj: 'Project'
		});
		var self = this;
		if (this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0) {
			_logger2.default.log({
				description: 'Authrocket settings exist for application.',
				signupData: signupData, application: this,
				func: 'signup', obj: 'Project'
			});
			return this.appAuthRocket().signup(signupData).then(function (newUser) {
				_logger2.default.info({
					description: 'User created through AuthRocket successfully.',
					newUser: newUser, func: 'signup', obj: 'Project'
				});
				return newUser;
			}, function (err) {
				_logger2.default.error({
					description: 'Error signing up through authrocket.',
					error: err, func: 'signup', obj: 'Project'
				});
				return Promise.reject(err);
			});
		} else {
			//Default user management
			_logger2.default.log({
				description: 'Using default user management.',
				application: this, type: _typeof(this.model('User')),
				func: 'signup', obj: 'Project'
			});
			var UserModel = this.model('User');
			var user = new UserModel(signupData);
			_logger2.default.log({
				description: 'Using default user management.',
				application: user,
				func: 'signup', obj: 'Project'
			});
			return user.createWithPass(signupData.password, this._id).then(function (newUser) {
				_logger2.default.log({
					description: 'New user created.',
					userObj: newUser,
					func: 'signup', obj: 'Project'
				});
				return newUser.login(signupData.password).then(function (loginRes) {
					_logger2.default.info({
						description: 'New user logged in successfully.',
						loginRes: loginRes, newUser: newUser,
						func: 'signup', obj: 'Project'
					});
					//Respond with user and token
					return loginRes;
				}, function (err) {
					_logger2.default.error({
						description: 'Error logging into newly created user.',
						newUser: newUser, func: 'signup', obj: 'Project'
					});
					return Promise.reject(err);
				});
			}, function (err) {
				//Handle username already existing return from createWithPass
				if (err && err.status == 'EXISTS') {
					_logger2.default.error({
						description: 'User already exists.',
						func: 'signup', obj: 'Project'
					});
				}
				_logger2.default.error({
					description: 'Error creating user.',
					error: err, func: 'signup', obj: 'Project'
				});
				return Promise.reject(err);
			});
		}
	},
	//Log user out of application
	logout: function logout(logoutData) {
		_logger2.default.log({
			description: 'Logout of application called.',
			data: logoutData, func: 'logout', obj: 'Project'
		});
		if (!logoutData) {
			_logger2.default.log({
				description: 'Logout data is required to logout.',
				func: 'logout', obj: 'Project'
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
					data: logoutData, func: 'logout', obj: 'Project'
				});
				return Promise.reject(err);
			});
		} else {
			//TODO: Make this work
			// this.model('User').findOne({username:logoutData.username});
			_logger2.default.log({
				description: 'Default user management logout.',
				logoutData: logoutData,
				func: 'logout', obj: 'Project'
			});
			return this.findUser(logoutData).then(function (foundUser) {
				_logger2.default.log({
					description: 'User found in application. Attempting to logout.',
					user: foundUser, func: 'logout', obj: 'Project'
				});
				return foundUser.logout().then(function () {
					_logger2.default.log({
						description: 'User logout successful.',
						logoutData: logoutData, func: 'logout',
						obj: 'Project'
					});
					return { message: 'Logout successful.' };
				}, function (err) {
					_logger2.default.error({
						description: 'Error logging out of user.',
						error: err, data: logoutData, func: 'logout',
						obj: 'Project'
					});
					return Promise.reject(err);
				});
			}, function (err) {
				_logger2.default.error({
					description: 'User not found.',
					error: err, data: logoutData,
					func: 'logout', obj: 'Project'
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
					response: updateRes, func: 'updateGroup', obj: 'Project'
				});
			}, function (err) {
				_logger2.default.error({
					description: 'Error updating authrocket org.', data: groupData,
					error: err, func: 'updateGroup', obj: 'Project'
				});
				return Promise.reject(err);
			});
		} else {
			var _ret = function () {
				var self = _this2;
				//Add application id to group
				groupData.application = _this2._id;
				//Add applicaiton id to search
				var findObj = { application: _this2._id };
				_logger2.default.log({
					description: 'Add group to Project called.',
					func: 'addGroup', obj: 'Project'
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
						groupData: groupData, func: 'addGroup', obj: 'Project'
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
						groupData: groupData, func: 'addGroup', obj: 'Project'
					});
					self.groups.push(groupData._id);
					return {
						v: self.saveNew().then(function (savedApp) {
							_logger2.default.info({
								description: 'Group successfully added to application.',
								func: 'addGroup', obj: 'Project'
							});
							return groupData;
						}, function (err) {
							_logger2.default.error({
								description: 'Error saving new group to application.', error: err,
								func: 'addGroup', obj: 'Project'
							});
							return Promise.reject(err);
						})
					};
				} else {
					//Group object must be queried
					var query = self.model('Group').findOne(findObj);
					_logger2.default.log({
						description: 'Find object constructed.', find: findObj,
						func: 'addGroup', obj: 'Project'
					});
					return {
						v: query.then(function (group) {
							if (!group) {
								_logger2.default.info({
									description: 'Group does not already exist.',
									func: 'addGroup', obj: 'Project'
								});
								//Group does not already exist, create it
								var _Group = self.model('Group');
								var _group = new _Group(groupData);
								return _group.saveNew().then(function (newGroup) {
									_logger2.default.info({
										description: 'Group created successfully. Adding to application.',
										func: 'addGroup', obj: 'Project'
									});
									//Add group to application
									self.groups.push(newGroup._id);
									return self.saveNew().then(function (savedApp) {
										_logger2.default.info({
											description: 'Group successfully added to application.',
											func: 'addGroup', obj: 'Project'
										});
										return newGroup;
									}, function (err) {
										_logger2.default.error({
											description: 'Error saving new group to application.', error: err,
											func: 'addGroup', obj: 'Project'
										});
										return Promise.reject({ message: 'Error saving new group.' });
									});
								}, function (err) {
									_logger2.default.error({
										description: 'Error creating group.', error: err,
										func: 'addGroup', obj: 'Project'
									});
									return Promise.reject({ message: 'Error creating group.' });
								});
							} else {
								//TODO: Decide if this should happen?
								//Group already exists, add it to applicaiton
								_logger2.default.log({
									description: 'Group already exists. Adding to application.',
									group: group, func: 'addGroup', obj: 'Project'
								});
								self.groups.push(group._id);
								return self.saveNew().then(function (savedApp) {
									_logger2.default.info({
										description: 'Group successfully added to application.', group: group,
										savedApp: savedApp, func: 'addGroup', obj: 'Project'
									});
									return group;
								}, function (err) {
									_logger2.default.error({
										description: 'Error saving Group to application.', error: err,
										group: group, func: 'addGroup', obj: 'Project'
									});
									return Promise.reject(err);
								});
							}
						}, function (err) {
							_logger2.default.error({
								description: 'Error adding group to Project.',
								error: err, func: 'addGroup', obj: 'Project'
							});
							return Promise.reject({ message: 'Error adding group to Project.' });
						})
					};
				}
			}();

			if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
		}
	},
	//Update group within application
	updateGroup: function updateGroup(groupData) {
		_logger2.default.log({
			description: 'Update group called.', groupData: groupData,
			func: 'updateGroup', obj: 'Project'
		});
		if (this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0) {
			//Authrocket group(org) management
			return this.appAuthRocket().Orgs({ id: groupData.name }).update(groupData).then(function (updateRes) {
				_logger2.default.log({
					description: 'Group/Org updated successfully.', groupData: groupData,
					response: updateRes, func: 'updateGroup', obj: 'Project'
				});
			}, function (err) {
				_logger2.default.error({
					description: 'Error updating authrocket org.', data: groupData,
					error: err, func: 'updateGroup', obj: 'Project'
				});
				return Promise.reject(err);
			});
		} else {
			var query = this.model('Group').update({ application: this._id, name: groupData.name });
			return query.then(function (err, group) {
				if (!group) {
					_logger2.default.error({
						description: 'Project Group could not be updated.', groupData: groupData,
						func: 'updateGroup', obj: 'Project'
					});
					return Promise.reject({ message: 'Unable to update group.' });
				}
				_logger2.default.info({
					description: 'Group Updated successfully.',
					func: 'updateGroup', obj: 'Project'
				});
				return group;
			}, function (err) {
				_logger2.default.error({
					description: 'Error updating application Group.', func: 'updateGroup',
					updatedGroup: group, obj: 'Project'
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
			app: this, func: 'deleteGroup', obj: 'Project'
		});
		if (this.authRocket) {
			//Authrocket group(org) management
			return this.appAuthRocket().Orgs({ id: groupData.name }).remove().then(function (removeRes) {
				_logger2.default.log({
					description: 'Delete group called.', groupData: groupData,
					app: _this3, func: 'deleteGroup', obj: 'Project'
				});
				return removeRes;
			}, function (err) {
				_logger2.default.error({
					description: 'Error deleting authrocket org.',
					error: err, func: 'deleteGroup', obj: 'Project'
				});
				return Promise.reject(err);
			});
		} else {
			var _ret2 = function () {
				//Standard group management
				var groupInApp = _lodash2.default.findWhere(_this3.groups, { name: groupData.name });
				var self = _this3;
				//TODO: Check groups before to make sure that group by that name exists
				if (!groupInApp) {
					_logger2.default.log({
						description: 'Group with provided name does not exist within application.',
						groupData: groupData, app: _this3, func: 'deleteGroup', obj: 'Project'
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
								func: 'deleteGroup', obj: 'Project'
							});
							return Promise.reject({ message: 'Unable delete group.', status: 'NOT_FOUND' });
						} else {
							_logger2.default.info({
								description: 'Group deleted successfully. Removing from application.',
								returnedData: group, func: 'deleteGroup', obj: 'Project'
							});
							//Remove group from application's groups
							_lodash2.default.remove(self.groups, function (currentGroup) {
								//Handle currentGroups being list of IDs
								if (_lodash2.default.isObject(currentGroup) && _lodash2.default.has(currentGroup, '_id') && currentGroup._id == group._id) {
									_logger2.default.info({
										description: 'Removed group by object with id param.',
										returnedData: group, func: 'deleteGroup', obj: 'Project'
									});
									return true;
								} else if (_lodash2.default.isString(currentGroup) && currentGroup == group._id) {
									//String containing group id
									_logger2.default.info({
										description: 'Removed group by string id.', currentGroup: currentGroup,
										returnedData: group, func: 'deleteGroup', obj: 'Project'
									});
									return true;
								} else {
									_logger2.default.error({
										description: 'Could not find group within application.',
										returnedData: group,
										func: 'deleteGroup', obj: 'Project'
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
							func: 'deleteGroup', obj: 'Project'
						});
						return Promise.reject(err);
					})
				};
			}();

			if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
		}
	},
	//Upload file to bucket
	publishFile: function publishFile(fileData) {
		_logger2.default.log({
			description: 'Publish file called.', fileData: fileData,
			func: 'publishFile', obj: 'Project'
		});
		return fileStorage.saveFile(this.frontend.bucketName, fileData).then(function (newFile) {
			_logger2.default.info({
				description: 'File published successfully.', newFile: newFile,
				func: 'publishFile', obj: 'Project'
			});
			return newFile;
		}, function (err) {
			_logger2.default.error({
				description: 'File published successfully.', error: err,
				func: 'publishFile', obj: 'Project'
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
				description: 'Project does not have AuthRocket settings.',
				data: self.authRocket,
				func: 'authRocket', obj: 'Project'
			});
			return Promise.reject({ message: 'AuthRocket settings do not exist.' });
		}
		var self = this;
		_logger2.default.log({
			description: 'Authrocket data of application.', data: self.authRocket,
			func: 'authRocket', obj: 'Project'
		});
		var authrocket = new _authrocket2.default(self.authRocket);
		_logger2.default.log({
			description: 'New authrocket created.', authRocket: authrocket,
			func: 'authRocket', obj: 'Project'
		});
		return authrocket;
	},
	authRocketSignup: function authRocketSignup(signupData) {
		return this.appAuthRocket().signup(signupData).then(function (signupRes) {
			_logger2.default.log({
				description: 'Successfully signed up through authrocket.',
				response: signupRes, func: 'authRocketSignup', obj: 'Project'
			});
			return signupRes;
		}, function (err) {
			_logger2.default.error({
				description: 'Error signing up through authrocket.',
				error: err, func: 'authRocketSignup', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	authRocketLogin: function authRocketLogin(loginData) {
		return this.appAuthRocket().login(loginData).then(function (loginRes) {
			_logger2.default.log({
				description: 'Successfully logged in through authrocket.',
				response: loginRes, func: 'authRocketLogin', obj: 'Project'
			});
			return loginRes;
		}, function (err) {
			_logger2.default.error({
				description: 'Error logging in through authrocket.',
				error: err, func: 'authRocketLogin', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	authRocketLogout: function authRocketLogout(logoutData) {
		return this.appAuthRocket().logout(logoutData).then(function (logoutRes) {
			_logger2.default.log({
				description: 'Successfully logged out through authrocket.',
				response: logoutRes, func: 'authRocketLogout', obj: 'Project'
			});
			return logoutRes;
		}, function (err) {
			_logger2.default.error({
				description: 'Error logging out through authrocket.',
				error: err, func: 'authRocketLogout', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	//Find user and make sure it is within application users, groups, and directories
	findUser: function findUser(userData) {
		_logger2.default.log({
			description: 'Find user called.', application: this,
			userData: userData, func: 'findUser', obj: 'Project'
		});
		var self = this;
		var findObj = {};
		if (userData && _lodash2.default.has(userData, 'username')) {
			findObj.username = userData.username;
		} else if (_lodash2.default.isString(userData)) {
			findObj.username = userData;
		}
		if (this.authRocket && this.authRocket.jsUrl) {
			//Get user from authrocket
			return this.appAuthRocket().Users(findObj.username).get().then(function (loadedUser) {
				_logger2.default.info({
					description: 'User loaded from authrocket.',
					obj: 'Project', func: 'findUser'
				});
				return loadedUser;
			}, function (err) {
				_logger2.default.error({
					description: 'Error getting user from AuthRocket.',
					error: err, obj: 'Project', func: 'findUser'
				});
				return Promise.reject(err);
			});
		} else {
			if (self._id) {
				findObj.application = self._id;
			}
			_logger2.default.info({
				description: 'Looking for user.',
				findObj: findObj,
				obj: 'Project', func: 'findUser'
			});
			// Default user management
			//Find user based on username then see if its id is within either list
			var userQuery = self.model('User').findOne(findObj);
			return userQuery.then(function (foundUser) {
				if (!foundUser) {
					_logger2.default.warn({
						description: 'User not found.',
						obj: 'Project', func: 'findUser'
					});
					return Promise.reject({ message: 'User not found', status: 'NOT_FOUND' });
				}
				_logger2.default.log({
					description: 'User found.',
					application: self, foundUser: foundUser,
					obj: 'Project', func: 'findUser'
				});
				return foundUser;
			}, function (err) {
				_logger2.default.error({
					description: 'Error finding user.',
					error: err,
					obj: 'Project', func: 'findUser'
				});
				return Promise.reject(err);
			});
		}
	}
};
/*
 * Construct `User` model from `UserSchema`
 */
_db2.default.tessellate.model('Project', ProjectSchema);

/*
 * Make model accessible from controllers
 */
var Project = _db2.default.tessellate.model('Project');
Project.collectionName = ProjectSchema.get('collection');

exports.Project = _db2.default.tessellate.model('Project');