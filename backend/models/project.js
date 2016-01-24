//External Libs
import  mongoose from 'mongoose';
import q from 'q';
import _ from 'lodash';
import * as sqs from '../utils/sqs';
import AuthRocket from 'authrocket';

//Internal Config/Utils/Classes
import config from '../config/default';
import logger from '../utils/logger';
import db from '../utils/db';
import * as fileStorage from '../utils/fileStorage';
import Group from './group';
import User from './user';

//Set bucket prefix based on config as well as default if config does not exist
let bucketPrefix = "tessellate-";
if(_.has(config, 's3') && _.has(config.s3, 'bucketPrefix')) {
	bucketPrefix = config.s3.bucketPrefix;
}
//Project schema object
let ProjectSchema = new mongoose.Schema({
	owner: {type: mongoose.Schema.Types.ObjectId, ref:'User'},
	name: {type:String, default:'', unique:true, index:true},
	frontend: {
		siteUrl: {type:String},
		bucketUrl: {type:String},
		provider: {type:String},
		bucketName: {type:String}
	},
	authRocket:{
		jsUrl: {type:String},
		apiUrl: {type:String},
		userId: {type:String},
		realmId: {type:String}
	},
	providers: [{name:String, clientId:String}],
	groups: [{type:mongoose.Schema.Types.ObjectId, ref:'Group'}],
	collaborators: [{type: mongoose.Schema.Types.ObjectId, ref:'User'}],
	createdAt: { type: Date, default: Date.now},
	updatedAt: { type: Date, default: Date.now}
},
{
	toJSON: {virtuals: true}
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
	saveNew: () => {
		logger.warn({
			description: 'saveNew called and is no longer nessesary.',
			func: 'saveNew', obj: 'Project'
		});
		return this.save().then((savedApp) => {
			if (!savedApp) {
				logger.error({
					description: 'Unable to save Project.',
					func: 'saveNew', obj: 'Project'
				});
				return Promise.reject({message: 'Project could not be saved.'});
			}
			logger.info({
				description: 'Project saved successfully.', savedApp: savedApp,
				func: 'saveNew', obj: 'Project'
			});
			return savedApp;
		}, (err) => {
			logger.error({
				description: 'Error saving Project.',
				error: err, func: 'saveNew', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	createWithTemplate: function (templateData){
		logger.log({
			description: 'Create project with template called.',
			templateData: templateData, project: this,
			func: 'createWithTemplate', obj: 'Project'
		});
		return this.save().then((newProject) => {
			return newProject.applyTemplate(templateData).then(() => {
				logger.info({
					description: 'New project created with template.',
					templateData: templateData, app: newProject,
					func: 'createWithTemplate', obj: 'Project'
				});
				return newProject;
			}, err => {
				logger.error({
					description: 'Error applying template to project.', error: err,
					func: 'createWithTemplate', obj: 'Project'
				});
				// Delete project from database if template is not applied successesfully
				let query = this.model('Project').findOneAndRemove({name: this.name});
				return query.then(deleteInfo => {
					logger.info({
						description: 'New project removed from db due to failure of adding template.',
						func: 'createWithTemplate', obj: 'Project'
					});
					return Promise.reject({message: 'Unable create new project.'});
				}, err => {
					logger.error({
						description: 'Error deleting project after failing to apply template.', error: err,
						func: 'createWithTemplate', obj: 'Project'
					});
					return Promise.reject(err);
				});
			});
		}, err => {
			logger.error({
				description: 'Error creating new project in database', error: err,
				func: 'createWithTemplate', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	createWithStorage: function() {
		logger.log({
			description: 'Create with storage called.', project: this,
			func: 'createWithStorage', obj: 'Project'
		});
		// TODO: Add a new group by default
		//TODO: Add realm to authrocket if authRocket data is included
		let self = this;
		return self.save().then((newProject) => {
			logger.log({
				description: 'New project added to db.', project: newProject,
				func: 'createWithStorage', obj: 'Project'
			});
			return self.createFileStorage().then(() => {
				logger.info({
					description: 'Create storage was successful.', project: self,
					func: 'createWithStorage', obj: 'Project'
				});
				return newProject;
			}, (err) => {
				logger.error({
					description: 'Error create project with storage.', error: err,
					func: 'createWithStorage', obj: 'Project'
				});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({
				description: 'Error saving new project.', error: err,
				func: 'createWithStorage', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	createStorage: function() {
		//TODO: Handle storageData including provider and name prefix
		logger.log({
			description: 'Create storage for project called.',
			func: 'createFileStorage', obj: 'Project'
		});
		let bucketName = bucketPrefix + this.name;
		let self = this;
		bucketName = bucketName.toLowerCase();
		return fileStorage.createBucket(bucketName).then((bucket) => {
			logger.log({
				description: 'New bucket storage created for project.',
				bucket: bucket, func: 'createFileStorage', obj: 'Project'
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
					app: appWithStorage, func: 'createFileStorage', obj: 'Project'
				});
				return appWithStorage;
			}, (err) => {
				logger.error({
					description: 'Error saving new project.', error: err,
					func: 'createFileStorage', obj: 'Project'
				});
				return Promise.reject(err);
			});
		}, (err) => {
			logger.error({
				description: 'Error creating project bucket.', error: err,
				func: 'createFileStorage', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	removeStorage: function() {
		logger.log({
			description: 'Remove project storage called.',
			func: 'removeStorage', obj: 'Project'
		});
		if(!_.has(this, 'frontend') || !_.has(this.frontend, 'bucketName')){
			logger.log({
				description: 'No frontend to remove storage of.',
				func: 'removeStorage', obj: 'Project'
			});
			return Promise.resolve({message: 'Storage removed successfully.'});
		} else {
			//TODO: Handle different types of storage other than S3
			return fileStorage.deleteBucket(this.frontend.bucketName).then(() => {
				logger.info({
					description: 'Removing storage was not nessesary.',
					func: 'removeStorage', obj: 'Project'
				});
				return {message: 'Bucket deleted successfully.'};
			}, (err) => {
				if(err && err.code == "NoSuchBucket"){
					logger.log({
						description: 'Removing storage was not nessesary.',
						func: 'removeStorage', obj: 'Project'
					});
					return {message: 'No storage to remove.'};
				} else {
					logger.error({
						description: 'Error deleting project storage bucket.',
						func: 'removeStorage', obj: 'Project'
					});
					return Promise.reject(err);
				}
			});
		}
	},
	applyTemplate: function(templateData) {
		if(!templateData || _.isUndefined(templateData.name)){
			templateData.name = 'default';
		}
		if(!templateData || _.isUndefined(templateData.type)){
			templateData.type = 'firebase';
		}
		logger.log({
			description: 'Applying template to project.',
			templateData: templateData, func: 'applyTemplate', obj: 'Project'
		});
		//TODO: Check that the template was actually uploaded
		//New message format
		//fromName, fromType, toName, toType
		let messageArray = [templateData.name, templateData.type, this.name, 'firebase'];
		// console.log('messageArray: ', messageArray);
		if(config.aws.sqsQueueUrl){
			return sqs.add(messageArray.join('**'));
		} else {
			//TODO: Download then upload locally instead of pushing to worker queue
			logger.error({
				description: 'Queue url is currently required to create new templates This will be changed soon.',
				templateData: templateData, func: 'applyTemplate', obj: 'Project'
			});
			return Promise.reject({message: 'Queue url is required to create an project with a template.'});
		}
	},
	addCollaborators: function(usersArray) {
		logger.log({
			description: 'Add collaborators to project called.',
			usersArray: usersArray, func: 'addCollaborators', obj: 'Project'
		});
		let userPromises = [];
		let self = this;
		//TODO: Check to see if user exists and is already a collaborator before adding
		//TODO: Check to see if usersArray is a list of objects(userData) or numbers(userIds)
		if(usersArray && _.isArray(usersArray)){
			usersArray.forEach((user) => {
				logger.log({
					description: 'Finding user to add as collaborator.',
					userData: user, func: 'addCollaborators', obj: 'Project'
				});
				let d = q.defer();
				//Push promise to promises array
				userPromises.push(d);
				logger.log({
					description: 'User find promise pushed to promise array.',
					userData: user, func: 'addCollaborators', obj: 'Project'
				});
				self.findUser(user).then((foundUser) => {
					logger.info({
						description: 'Found user, adding to collaborators.',
						foundUser: foundUser, func: 'addCollaborators', obj: 'Project'
					});
					//Add User's ObjectID to project's collaborators
					self.collaborators.push(foundUser._id);
					d.resolve(foundUser);
				}, (err) => {
					logger.error({
						description: 'Error user in project.',
						error: err, func: 'addCollaborators', obj: 'Project'
					});
					d.reject(err);
				});
			});
		}
		//Run all users user promises then Add save promise to end of promises list
		return Promise.all(userPromises).then((usersArray) => {
			logger.log({
				description: 'collaborators all found:',
				usersArray: usersArray, func: 'addCollaborators', obj: 'Project'
			});
			return self.saveNew();
		}, (err) => {
			logger.error({
				description: 'Error with userPromises',
				error: err, func: 'addCollaborators', obj: 'Project'
			});
			return err;
		});
	},
	login: function(loginData) {
		//Search for user in project's directories
		logger.log({
			description: 'Login to project called.',
			func: 'login', obj: 'Project'
		});
		//Login to authrocket if data is available
		if(this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0){
			if(!_.has(loginData, 'username')){
				//TODO: lookup user data from mongodb then login to allow authRocket login by email
				logger.log({
					description: 'Username is currently required to login due to AuthRocket. This will be fixed soon.',
					func: 'login', obj: 'Project'
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
					loggedInData: loggedInData, func: 'login', obj: 'Project'
				});
				return loggedInData;
			}, (err) => {
				logger.warn({
					description: 'Error logging in through authrocket.',
					error: err, func: 'login', obj: 'Project'
				});
				return Promise.reject('Invalid Credentials.');
			});
		} else {
			//Default user management
			logger.log({
				description: 'Default user management.',
				loginData: loginData,
				func: 'login', obj: 'Project'
			});
			return this.findUser(loginData).then((foundUser) => {
				logger.log({
					description: 'User found.',
					foundUser: foundUser,
					func: 'login', obj: 'Project'
				});
				return foundUser.login(loginData.password).then((loggedInData) => {
					logger.info({
						description: 'Login to project successful.',
						loggedInData: loggedInData, func: 'login', obj: 'Project'
					});
					return loggedInData;
				}, (err) => {
					logger.error({
						description: 'Error logging into acocunt.',
						error: err, func: 'login', obj: 'Project'
					});
					return Promise.reject(err);
				});
			}, (err) => {
				logger.error({
					description: 'Error finding acocunt.',
					error: err, func: 'login', obj: 'Project'
				});
				return Promise.reject(err);
			});
		}
	},
	signup: function(signupData) {
		logger.log({
			description: 'Signup to project called.',
			signupData: signupData, project: this,
			func: 'signup', obj: 'Project'
		});
		let self = this;
		if(this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0){
			logger.log({
				description: 'Authrocket settings exist for project.',
				signupData: signupData, project: this,
				func: 'signup', obj: 'Project'
			});
			return this.appAuthRocket().signup(signupData).then((newUser) => {
				logger.info({
					description: 'User created through AuthRocket successfully.',
					newUser: newUser, func: 'signup', obj: 'Project'
				});
				return newUser;
			}, (err) => {
				logger.error({
					description: 'Error signing up through authrocket.',
					error: err, func: 'signup', obj: 'Project'
				});
				return Promise.reject(err);
			});
		} else {
			//Default user management
			logger.log({
				description: 'Using default user management.',
				project: this, type: typeof this.model('User'),
				func: 'signup', obj: 'Project'
			});
			let UserModel = this.model('User');
			let user = new UserModel(signupData);
			logger.log({
				description: 'Using default user management.',
				project: user,
				func: 'signup', obj: 'Project'
			});
			return user.createWithPass(signupData.password, this._id).then((newUser) => {
				logger.log({
					description: 'New user created.',
					userObj: newUser,
					func: 'signup', obj: 'Project'
				});
				return newUser.login(signupData.password).then((loginRes) => {
					logger.info({
						description: 'New user logged in successfully.',
						loginRes: loginRes, newUser: newUser,
						func: 'signup', obj: 'Project'
					});
					//Respond with user and token
					return loginRes;
				}, (err) => {
					logger.error({
						description: 'Error logging into newly created user.',
						newUser: newUser, func: 'signup', obj: 'Project'
					});
					return Promise.reject(err);
				});
			}, (err) => {
				//Handle username already existing return from createWithPass
				if(err && err.status == 'EXISTS'){
					logger.error({
						description: 'User already exists.',
						func: 'signup', obj: 'Project'
					});
				}
				logger.error({
					description: 'Error creating user.',
					error: err, func: 'signup', obj: 'Project'
				});
				return Promise.reject(err);
			});
		}
	},
	//Log user out of project
	logout: function(logoutData) {
		logger.log({
			description: 'Logout of project called.',
			data: logoutData, func: 'logout', obj: 'Project'
		});
		if(!logoutData){
			logger.log({
				description: 'Logout data is required to logout.',
				func: 'logout', obj: 'Project'
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
					data: logoutData, func: 'logout', obj: 'Project'
				});
				return Promise.reject(err);
			});
		} else {
			//TODO: Make this work
			// this.model('User').findOne({username:logoutData.username});
			logger.log({
				description: 'Default user management logout.',
				logoutData: logoutData,
				func: 'logout', obj: 'Project'
			});
			return this.findUser(logoutData).then((foundUser) => {
				logger.log({
					description: 'User found in project. Attempting to logout.',
					user: foundUser, func: 'logout', obj: 'Project'
				});
				return foundUser.logout().then(() => {
					logger.log({
						description: 'User logout successful.',
						logoutData: logoutData, func: 'logout',
						obj: 'Project'
					});
					return {message: 'Logout successful.'};
				}, (err) => {
					logger.error({
						description: 'Error logging out of user.',
						error: err, data: logoutData, func: 'logout',
						obj: 'Project'
					});
					return Promise.reject(err);
				});
			}, (err) => {
				logger.error({
					description: 'User not found.',
					error: err, data:logoutData,
					func: 'logout', obj: 'Project'
				});
				return Promise.reject(err);
			});
		}
	},
	//Add group to project
	addGroup: function(groupData) {
		//TODO: make sure that group does not already exist in this project
		// if(indexOf(this.groups, group._id) == -1){
		// 	console.error('This group already exists project');
		// 	return;
		// }
		if(this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0){
			//Authrocket group(org) management
			return this.appAuthRocket().Orgs().add(groupData).then((updateRes) => {
				logger.log({
					description:'Group/Org updated successfully.', groupData: groupData,
					response: updateRes, func:'updateGroup', obj: 'Project'
				});
			}, (err) => {
				logger.error({
					description:'Error updating authrocket org.', data: groupData,
					error: err, func:'updateGroup', obj: 'Project'
				});
				return Promise.reject(err);
			});
		} else {
			let self = this;
			//Add project id to group
			groupData.project = this._id;
			//Add applicaiton id to search
			let findObj = {project: this._id};
			logger.log({
				description:'Add group to Project called.',
				func:'addGroup', obj: 'Project'
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
					groupData: groupData, func:'addGroup', obj: 'Project'
				});
				return Promise.reject({message: 'Group could not be added: Incorrectly formatted Group data.'});
			}
			//Do not search for group if a group object was passed
			if(_.has(groupData, '_id') || groupData instanceof this.model('Group')){
				//Group object was passed
				logger.log({
					description:'Group instance was passed, adding it to project.',
					groupData: groupData, func:'addGroup', obj: 'Project'
				});
				self.groups.push(groupData._id);
				return self.saveNew().then((savedApp) => {
					logger.info({
						description:'Group successfully added to project.',
						func:'addGroup', obj: 'Project'
					});
					return groupData;
				}, (err) => {
					logger.error({
						description:'Error saving new group to project.', error: err,
						func:'addGroup', obj: 'Project'
					});
					return Promise.reject(err);
				});
			} else {
				//Group object must be queried
				let query = self.model('Group').findOne(findObj);
				logger.log({
					description:'Find object constructed.', find: findObj,
					func:'addGroup', obj: 'Project'
				});
				return query.then((group) => {
					if(!group){
						logger.info({
							description:'Group does not already exist.',
							func:'addGroup', obj: 'Project'
						});
						//Group does not already exist, create it
						let Group = self.model('Group');
						let group = new Group(groupData);
						return group.saveNew().then((newGroup) => {
							logger.info({
								description:'Group created successfully. Adding to project.',
								func:'addGroup', obj: 'Project'
							});
							//Add group to project
							self.groups.push(newGroup._id);
							return self.saveNew().then((savedApp) => {
								logger.info({
									description:'Group successfully added to project.',
									func:'addGroup', obj: 'Project'
								});
								return newGroup;
							}, (err) => {
								logger.error({
									description:'Error saving new group to project.', error: err,
									func:'addGroup', obj: 'Project'
								});
								return Promise.reject({message: 'Error saving new group.'});
							});
						}, (err) => {
							logger.error({
								description:'Error creating group.', error: err,
								func:'addGroup', obj: 'Project'
							});
							return Promise.reject({message: 'Error creating group.'});
						});
					} else {
						//TODO: Decide if this should happen?
						//Group already exists, add it to applicaiton
						logger.log({
							description:'Group already exists. Adding to project.',
							group: group, func:'addGroup', obj: 'Project'
						});
						self.groups.push(group._id);
						return self.saveNew().then((savedApp) => {
							logger.info({
								description:'Group successfully added to project.', group: group,
								savedApp: savedApp, func:'addGroup', obj: 'Project'
							});
							return group;
						}, (err) => {
							logger.error({
								description:'Error saving Group to project.', error: err,
								group: group, func:'addGroup', obj: 'Project'
							});
							return Promise.reject(err);
						});
					}
				}, (err) => {
					logger.error({
						description:'Error adding group to Project.',
						error: err, func:'addGroup', obj: 'Project'
					});
					return Promise.reject({message: 'Error adding group to Project.'});
				});
			}
		}

	},
	//Update group within project
	updateGroup: function(groupData) {
		logger.log({
			description:'Update group called.', groupData: groupData,
			func:'updateGroup', obj: 'Project'
		});
		if(this.authRocket && this.authRocket.jsUrl && this.authRocket.jsUrl.length > 0){
			//Authrocket group(org) management
			return this.appAuthRocket().Orgs({id: groupData.name}).update(groupData).then((updateRes) => {
				logger.log({
					description:'Group/Org updated successfully.', groupData: groupData,
					response: updateRes, func:'updateGroup', obj: 'Project'
				});
			}, (err) => {
				logger.error({
					description:'Error updating authrocket org.', data: groupData,
					error: err, func:'updateGroup', obj: 'Project'
				});
				return Promise.reject(err);
			});
		} else {
			let query = this.model('Group').update({project: this._id, name: groupData.name});
			return query.then((err, group) => {
				if(!group){
					logger.error({
						description:'Project Group could not be updated.', groupData: groupData,
						func:'updateGroup', obj: 'Project'
					});
					return Promise.reject({message: 'Unable to update group.'});
				}
				logger.info({
					description:'Group Updated successfully.',
					func:'updateGroup', obj: 'Project'
				});
				return group;
			}, (err) => {
				logger.error({
					description:'Error updating project Group.', func:'updateGroup',
					updatedGroup: group, obj: 'Project'
				});
				return Promise.reject(err);
			});
		}
	},
	//Delete group from project
	deleteGroup: function(groupData) {
		logger.log({
			description:'Delete group called.', groupData: groupData,
			app: this, func:'deleteGroup', obj: 'Project'
		});
		if(this.authRocket){
			//Authrocket group(org) management
			return this.appAuthRocket().Orgs({id: groupData.name}).remove().then((removeRes) => {
				logger.log({
					description:'Delete group called.', groupData: groupData,
					app: this, func:'deleteGroup', obj: 'Project'
				});
				return removeRes;
			}, (err) => {
				logger.error({
					description:'Error deleting authrocket org.',
					error: err, func:'deleteGroup', obj: 'Project'
				});
				return Promise.reject(err);
			});
		} else {
			//Standard group management
			let groupInApp = _.findWhere(this.groups, {name: groupData.name});
			let self = this;
			//TODO: Check groups before to make sure that group by that name exists
			if(!groupInApp){
				logger.log({
					description:'Group with provided name does not exist within project.',
					groupData: groupData, app: this, func:'deleteGroup', obj: 'Project'
				});
				return Promise.reject({message: 'Group with that name does not exist within project.', status: 'NOT_FOUND'});
			}
			let query = this.model('Group').findOneAndRemove({name: groupData.name});
			return query.then((group) => {
				if(!group){
					logger.error({
						description:'Unable to find group to delete.',
						func:'deleteGroup', obj: 'Project'
					});
					return Promise.reject({message: 'Unable delete group.', status: 'NOT_FOUND'});
				} else {
					logger.info({
						description:'Group deleted successfully. Removing from project.',
						returnedData: group, func:'deleteGroup', obj: 'Project'
					});
					//Remove group from project's groups
					_.remove(self.groups, (currentGroup) => {
						//Handle currentGroups being list of IDs
						if(_.isObject(currentGroup) && _.has(currentGroup, '_id') && currentGroup._id == group._id){
							logger.info({
								description:'Removed group by object with id param.',
								returnedData: group, func:'deleteGroup', obj: 'Project'
							});
							return true;
						} else if(_.isString(currentGroup) && currentGroup == group._id) {
							//String containing group id
							logger.info({
								description:'Removed group by string id.', currentGroup: currentGroup,
								returnedData: group, func:'deleteGroup', obj: 'Project'
							});
							return true;
						} else {
							logger.error({
								description:'Could not find group within project.',
								returnedData: group,
								func:'deleteGroup', obj: 'Project'
							});
							return false;
						}
					});
					//Resolve project's groups without group
					return this.groups;
				}
			}, (err) => {
				logger.error({
					description:'Error deleting group.',
					func:'deleteGroup', obj: 'Project'
				});
				return Promise.reject(err);
			});
		}
	},
	//Upload file to bucket
	publishFile: function(fileData) {
		logger.log({
			description: 'Publish file called.', fileData: fileData,
			func: 'publishFile', obj: 'Project'
		});
		return fileStorage.saveFile(this.frontend.bucketName, fileData).then((newFile) => {
			logger.info({
				description: 'File published successfully.', newFile: newFile,
				func: 'publishFile', obj: 'Project'
			});
			return newFile;
		}, (err) => {
			logger.error({
				description: 'File published successfully.', error: err,
				func: 'publishFile', obj: 'Project'
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
				description: 'Project does not have AuthRocket settings.',
				data: self.authRocket,
				func: 'authRocket', obj: 'Project'
			});
			return Promise.reject({message: 'AuthRocket settings do not exist.'});
		}
		let self = this;
		logger.log({
			description: 'Authrocket data of project.', data: self.authRocket,
			func: 'authRocket', obj: 'Project'
		});
		let authrocket = new AuthRocket(self.authRocket);
		logger.log({
			description: 'New authrocket created.', authRocket: authrocket,
			func: 'authRocket', obj: 'Project'
		});
		return authrocket;
	},
	authRocketSignup: function(signupData) {
		return this.appAuthRocket().signup(signupData).then((signupRes) => {
			logger.log({
				description: 'Successfully signed up through authrocket.',
				response: signupRes, func:'authRocketSignup', obj: 'Project'
			});
			return signupRes;
		}, (err) => {
			logger.error({
				description: 'Error signing up through authrocket.',
				error: err, func:'authRocketSignup', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	authRocketLogin: function(loginData) {
		return this.appAuthRocket().login(loginData).then((loginRes) => {
			logger.log({
				description: 'Successfully logged in through authrocket.',
				response: loginRes, func:'authRocketLogin', obj: 'Project'
			});
			return loginRes;
		}, (err) => {
			logger.error({
				description: 'Error logging in through authrocket.',
				error: err, func:'authRocketLogin', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	authRocketLogout: function(logoutData) {
		return this.appAuthRocket().logout(logoutData).then((logoutRes) => {
			logger.log({
				description: 'Successfully logged out through authrocket.',
				response: logoutRes, func:'authRocketLogout', obj: 'Project'
			});
			return logoutRes;
		}, (err) => {
			logger.error({
				description: 'Error logging out through authrocket.',
				error: err, func:'authRocketLogout', obj: 'Project'
			});
			return Promise.reject(err);
		});
	},
	//Find user and make sure it is within project users, groups, and directories
	findUser: function(userData) {
		logger.log({
			description: 'Find user called.', project: this,
			userData: userData, func: 'findUser', obj: 'Project'
		});
		let self = this;
		let findObj = {};
		if(userData && _.has(userData, 'username')){
			findObj.username = userData.username
		} else if(_.isString(userData)){
			findObj.username = userData;
		}
		if(this.authRocket && this.authRocket.jsUrl){
			//Get user from authrocket
			return this.appAuthRocket().Users(findObj.username).get().then((loadedUser) => {
				logger.info({
					description:'User loaded from authrocket.',
					obj:'Project', func:'findUser'
				});
				return loadedUser;
			}, (err) => {
				logger.error({
					description: 'Error getting user from AuthRocket.',
					error: err, obj:'Project', func:'findUser'
				});
				return Promise.reject(err);
			});
		} else {
			if(self._id){
				findObj.project = self._id;
			}
			logger.info({
				description:'Looking for user.',
				findObj: findObj,
				obj:'Project', func:'findUser'
			});
			// Default user management
			//Find user based on username then see if its id is within either list
			let userQuery = self.model('User').findOne(findObj);
			return userQuery.then((foundUser) => {
				if(!foundUser){
					logger.warn({
						description:'User not found.',
						obj:'Project', func:'findUser'
					});
					return Promise.reject({message:'User not found', status:'NOT_FOUND'});
				}
				logger.log({
					description:'User found.',
					project:self, foundUser:foundUser,
					obj:'Project', func:'findUser'
				});
				return foundUser;
			}, (err) => {
				logger.error({
					description:'Error finding user.',
					error: err,
					obj:'Project', func:'findUser'
				});
				return Promise.reject(err);
			});
		}
	}
};
/*
 * Construct `User` model from `UserSchema`
 */
db.tessellate.model('Project', ProjectSchema);

/*
 * Make model accessible from controllers
 */
let Project = db.tessellate.model('Project');
Project.collectionName = ProjectSchema.get('collection');

exports.Project = db.tessellate.model('Project');
