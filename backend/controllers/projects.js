/**
 * @description Project Controller
 */


import _ from 'lodash';
import logger from '../utils/logger';
import { Project } from '../models/project';
import { User } from '../models/user';
import { Group } from '../models/group';
import authUtil from '../utils/auth';
/**
 * @api {get} /projects Get Project(s)
 * @apiDescription Get a specific application's data or a list of projects.
 * @apiName GetProject
 * @apiGroup Project
 *
 * @apiParam {String} [name] Name of Project.
 *
 * @apiSuccess {object} applicationData Object containing projects data if <code>name</code> param is provided
 * @apiSuccess {array} projects Array of projects if <code>name</code> is not provided.
 *
 * @apiSuccessExample Success-Response (No Name Provided):
 *     HTTP/1.1 200 OK
 *     [
 *      {
 *       name: "exampleApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"tessellate-exampleApp", provider:"Amazon", siteUrl:"tessellate-exampleApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *      },
 *       name: "testApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"tessellate-testApp", provider:"Amazon", siteUrl:"tessellate-testApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *      }
 *     ]
 * @apiSuccessExample Success-Response (Name Provided):
 *     HTTP/1.1 200 OK
 *     {
 *       name: "exampleApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"tessellate-exampleApp", provider:"Amazon", siteUrl:"tessellate-exampleApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *     }
 * @apiErrorExample  Error-Response (Not Found):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Project not found."
 *     }
 */

export function get(req, res, next) {
	// let user = authUtil.getUserFromRequest(req);
	// logger.log({description: 'User from request.', user: user, func: 'get', obj: 'ProjectsCtrls'});
	let isList = true;
	let findObj = {};
	const { name } = req.params;
	const { username } = req.body;
	if(!req.user && !username){
		return res.status(400).json('Username and Token are required');
	}
	if(name){ //Get data for a specific application
		logger.log({
			description: 'Project get request.', name,
			func: 'get', obj: 'ProjectsCtrls'
		});
		findObj.name = name;
		isList = false;
	} else {
		//Find projects that current user as owner or as a collaborator
		if(req.user){
			findObj.$or = [{'owner': req.user.userId}, {'collaborators': {$in:[req.user.userId]}}]
		}
	}
	logger.log({
		description: 'Get find object created.', findObj: findObj,
		func: 'get', obj: 'ProjectsCtrls'
	});
	Project.findOne(findObj)
	.populate({path:'owner', select:'username name email'})
	.populate({path:'collaborators', select:'username name email'})
	.populate({path:'groups', select:'name users'})
	.then(result => {
		if(!result){
			logger.error({
				description: 'Error finding Project(s).',
				func: 'get', obj: 'ProjectsCtrls'
			});
			return res.status(400).send('Project(s) could not be found.');
		}
		logger.log({
			description: 'Project(s) found.',
			func: 'get', obj: 'ProjectsCtrls'
		});
		res.send(result);
	}, err => {
		logger.error({
			description: 'Error getting application(s):',
			error: err, func: 'get', obj: 'ProjectsCtrls'
		});
		res.status(500).send('Error getting Project(s).');
	});
};
/**
 * @api {get} /projects Get Project's provider data
 * @apiDescription Get a specific application's data or a list of projects.
 * @apiName GetProject
 * @apiGroup Project
 *
 * @apiParam {String} [name] Name of Project.
 *
 * @apiSuccess {object} applicationData Object containing projects data if <code>name</code> param is provided
 * @apiSuccess {array} projects Array of projects if <code>name</code> is not provided.
 *
 */
export function getProviders(req, res, next) {
	if(!req.params.name){ //Get data for a specific application
		logger.warn({
			description: 'Project name required to get providers.',
			func: 'getProviders', obj: 'ProjectsCtrls'
		});
		return res.status(400).send('Project name required to get providers.');
	}
	logger.log({
		description: 'Get Providers request.', params: req.params,
		func: 'getProviders', obj: 'ProjectsCtrls'
	});
	let query = Project.findOne({name:req.params.name});
	query.then((result) => {
		if(!result){
			logger.warn({
				description: 'Project not found.',
				func: 'getProviders', obj: 'ProjectsCtrls'
			});
			return res.status(400).send('Project could not be found.');
		}
		let providerData = {};
		_.each(result.providers, (provider) => {
			providerData[provider.name] = provider.clientId;
		});
		logger.log({
			description: 'Provider data found.', providerData: providerData,
			func: 'getProviders', obj: 'ProjectsCtrls'
		});
		res.send(providerData);
	}, (err) => {
		logger.error({
			description: 'Error getting application(s).',
			error: err, func: 'getProviders', obj: 'ProjectsCtrls'
		});
		res.status(500).send('Error getting Project(s).');
	});
};

/**
 * @api {post} /projects Add Project
 * @apiDescription Add a new application.
 * @apiName AddProject
 * @apiGroup Project
 *
 * @apiParam {String} name Name of application
 * @apiParam {String} [template] Template to use when creating the application. Default template is used if no template provided
 *
 * @apiSuccess {Object} applicationData Object containing newly created projects data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "exampleApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"tessellate-exampleApp", provider:"Amazon", siteUrl:"tessellate-exampleApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *     }
 *
 * @apiErrorExample  Error-Response (Already Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Project by that name already exists."
 *     }
 *
 */
export function add(req, res, next) {
	//Query for existing application with same _id
	if(!_.has(req.body, "name")){
		logger.error({
			description:'Project name required to create a new app.',
			body: req.body, func: 'add', obj: 'ProjectsCtrl'
		});
		res.status(400).send('Name is required to create a new app');
	} else {
		logger.log({
			description:'Projects add called with name.',
			name: req.body.name, body: req.body, func: 'add', obj: 'ProjectsCtrl'
		});
		let appData = _.extend({}, req.body);
		let appName = req.body.name;
		if(!_.has(appData, 'owner')){
			logger.log({
				description: 'No owner data provided. Using user.',
				user: req.user, func: 'add', obj: 'ProjectsCtrl'
			});
			if(_.has(req, 'userId') || _.has(req, 'userId')){
				appData.owner = req.userId ? req.userId : req.userId;
			} else if (req.user && (_.has(req.user, 'id') || _.has(req.user, 'userId'))) {
				appData.owner = req.user.id ? req.user.id : req.user.userId;
			} else {
				logger.error({
					description: 'Invalid owner data provided.',
					func: 'add', obj: 'ProjectsCtrl'
				});
				return res.status(400).send('Owner is required to create application');
			}
		}
		findProject(appName).then((foundApp) => {
			logger.error({
				description: 'Project with this name already exists.',
				foundApp: foundApp, func: 'add', obj: 'ProjectsCtrl'
			});
			res.status(400).send('Project with this name already exists.');
		}, (err) => {
			if(err && err.status == 'EXISTS'){
				return res.status(400).send('Project with this name already exists.');
			}
			logger.log({
				description: 'Project does not already exist.',
				func: 'add', obj: 'Project'
			});
			let application = new Project(appData);
			if(_.has(req.body,'template')){
				//Template name was provided
				let templateData = {name: req.body.template};
				templateData.type = req.body.templateType ? req.body.templateType : 'firebase';
				application.createWithTemplate(templateData).then((newApp) => {
					logger.log({
						description: 'Project created with template.',
						newApp: newApp, func: 'add', obj: 'Project'
					});
					res.json(newApp);
				}, (err) => {
					logger.error({
						description: 'Error creating application.',
						error: err, func: 'add', obj: 'Project'
					});
					res.status(400).send('Error creating application.');
				});
			} else {
				//Template name was not provided
				application.save().then((newProject) => {
					logger.log({
						description: 'Project created successfully.',
						application: newProject, func: 'add', obj: 'Project'
					});
					res.send(newProject);
				}, (err) => {
					logger.error({
						description: 'Project does not already exist.',
						error: err, func: 'add', obj: 'Project'
					});
					res.send(500).send('Error saving application.');
				});
			}
		});
	}
};

/**
 * @api {put} /projects Update Project
 * @apiDescription Update an application.
 * @apiName UpdateProject
 * @apiGroup Project
 *
 * @apiParam {String} name Name of application
 * @apiParam {Object} owner Owner of application
 * @apiParam {String} owner.username Project owner's username
 *
 * @apiSuccess {Object} applicationData Object containing updated projects data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "exampleApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"tessellate-exampleApp", provider:"Amazon", siteUrl:"tessellate-exampleApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *     }
 * @apiErrorExample  Error-Response (Not Found):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Project not found."
 *     }
 *
 */
export function update(req, res, next) {
	logger.log({
		description: 'App update request.', params: req.params,
		func: 'update', obj: 'ProjectsCtrls'
	});
	if(req.params.name){
		Project.update({name:req.params.name}, req.body, {upsert:false},  (err, affected, result)  => {
			if(err){
				logger.error({
					description: 'Error updating application.',
					error: err, func: 'update', obj: 'ProjectsCtrls'
				});
				return res.status(500).send('Error updating Project.');
			}
			//TODO: respond with updated data instead of passing through req.body
			logger.log({
				description: 'Project update successful.',
				affected: affected, func: 'update', obj: 'ProjectsCtrls'
			});
			if(affected.nModified == 0 || affected.n == 0){
				//TODO: Handle Project not found
				logger.error({
					description: 'Project not found.', affected: affected,
					func: 'update', obj: 'ProjectsCtrls'
				});
				res.status(400).send({message:'Project not found'});
			} else {
				logger.error({
					description: 'Project updated successfully.',
					affected: affected, func: 'update', obj: 'ProjectsCtrls'
				});
				res.json(req.body);
			}
		});
	} else {
		res.status(400).send({message:'Project id required'});
	}
};

/**
 * @api {delete} /application/:id Delete Project
 * @apiDescription Delete an application.
 * @apiName DeleteProject
 * @apiGroup Project
 *
 * @apiParam {String} name Name of application
 *
 * @apiSuccess {Object} applicationData Object containing deleted projects data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "exampleApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"tessellate-exampleApp", provider:"Amazon", siteUrl:"tessellate-exampleApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *     }
 *
 * @apiErrorExample  Error-Response (Not Found):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Project not found."
 *     }
 *
 */
export function del(req, res, next) {
	let query = Project.findOneAndRemove({'name':req.params.name}); // find and delete using id field
	query.then((result) => {
		if(result){
			let app = new Project(result);
			app.removeStorage().then(() => {
				logger.log({
					description: 'Project storage deleted successfully.',
					func: 'delete', obj: 'ProjectsCtrl'
				});
				res.json(result);
			}, (err) => {
				logger.error({
					description: 'Error removing storage from application.',
					error: err, func: 'delete', obj: 'ProjectsCtrl'
				});
				res.status(400).send(err);
			});
		} else {
			logger.error({
				description: 'Project not found.', error: err,
				func: 'delete', obj: 'ProjectsCtrl'
			});
			res.status(400).send('Project could not be found.');
		}
	}, (err) => {
		logger.error({
			description: 'Error getting application.', error: err,
			func: 'delete', obj: 'ProjectsCtrl'
		});
		res.status(500).send('Error deleting Project.');
	});
};


/**
 * @api {put} /projects/:name/files  Get Files
 * @apiDescription Get the list of files for a specific application.
 * @apiName Files
 * @apiGroup Project
 *
 * @apiParam {File} file1 File to upload. Key (<code>file1</code>) does not hold significance as all files are uploaded.
 * @apiParam {File} file2 Second File to upload. Again, Key (<code>file2</code>) does not hold significance as all files are uploaded.
 *
 * @apiSuccess {Object} applicationData Object containing updated projects data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "exampleApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"tessellate-exampleApp", provider:"Amazon", siteUrl:"tessellate-exampleApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *     }
 *
 * @apiErrorExample  Error-Response (Not Found):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Project not found."
 *     }
 *
 */
export function files(req, res, next) {
	//TODO: Check that user is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if(req.params.name){ //Get data for a specific application
		let query = Project.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.then((foundApp) => {
			if(foundApp){
				foundApp.getStructure().then((appFiles) => {
					logger.log({
						description: 'Get structure returned.',
						structure: appFiles, func: 'files', obj: 'ProjectsCtrls'
					});
					res.send(appFiles);
				}, (err) => {
					logger.error({
						description: 'Error getting application file structure.',
						error: err, func: 'files', obj: 'ProjectsCtrls'
					});
					res.status(400).send('Error getting Project files.');
				});
			} else {
				logger.error({
					description: 'Project could not be found.',
					func: 'files', obj: 'ProjectsCtrls'
				});
				res.status(400).send('Project could not be found.');
			}
		}, (err) => {
			logger.error({
				description: 'Error getting application:', error: err,
				func: 'files', obj: 'ProjectsCtrls'
			});
			return res.status(500).send('Error getting Project files.');
		});
	} else {
		logger.info({
			description: 'Project name is required to get files list.',
			func: 'files', obj: 'ProjectsCtrls'
		});
		res.status(400).send('Project name is required to get files list.');
	}
};

/**
 * @api {put} /projects/:name/publish  Publish File
 * @apiDescription Publish/Upload a specified file to the storage/hosting for application matching the name provided.
 * @apiName UploadFile
 * @apiGroup Project
 *
 * @apiParam {String} name Name of
 * @apiParam {String} content Text string content of file
 * @apiParam {String} filetype Type of file the be uploaded
 *
 * @apiSuccess {Object} applicationData Object containing updated projects data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "exampleApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"tessellate-exampleApp", provider:"Amazon", siteUrl:"tessellate-exampleApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *     }
 *
 * @apiErrorExample  Error-Response (Not Found):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Project not found."
 *     }
 *
 */
 let localDir = "./public";
export function publishFile(req, res, next) {
	logger.info({
		description: 'File publish request.', func: 'publishFile',
		params: req.params, obj: 'ProjectsCtrls'
	});
	//TODO: Check that user is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if(req.params.name){ //Get data for a specific application
		let query = Project.findOne({name:req.params.name})
		.populate({path:'owner', select:'username name title email'});
		isList = false;
		query.then((foundApp) => {
			if(foundApp){
				foundApp.publishFile({content:req.body.content, key:req.body.key, contentType:req.body.contentType}).then((result) => {
					logger.info({
						description: 'File published successfully.',
						func: 'publishFile', result: result,
						obj: 'ProjectsCtrls'
					});
					res.send(result);
				}, (err) => {
					logger.log({
						description: 'Error publishing file.',
						error: err, func: 'publishFile',
						obj: 'ProjectsCtrls'
					});
					res.status(400).send(err);
				});
			} else {
				logger.error({
					description: 'Error finding application.', func: 'publishFile',
					params: req.params, obj: 'ProjectsCtrls'
				});
				res.status(400).send('Project could not be found.');
			}
		}, (err) => {
			logger.error({
				description: 'Error finding application.',
				params: req.params, error: err,
				func: 'publishFile', obj: 'ProjectsCtrls'
			});
			res.status(500).send('Error publishing file to Project.');
		});
	} else {
		logger.error({
			description: 'Project name and file data are required to publish a file.',
			params: req.params, func: 'publishFile',
			obj: 'ProjectsCtrls'
		});
		res.status(400).send('Project name and fileData are required to upload file.');
	}
};

/**
 * @api {put} /projects/:name/template  Apply Template
 * @apiDescription Apply a template to the application matching the name provided.
 * @apiName applyTemplate
 * @apiGroup Project
 *
 * @apiParam {String} name Name of template
 *
 * @apiSuccess {Object} applicationData Object containing application's data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "exampleApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"tessellate-exampleApp", provider:"Amazon", siteUrl:"tessellate-exampleApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *     }
 *
 * @apiErrorExample  Error-Response (Not Found):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Project not found."
 *     }
 *
 */
 //TODO: Allow for deleteing/not deleteing all of the bucket files before applying template
export function applyTemplate(req, res, next) {
	logger.log({
		description: 'apply template request with app name: ', name: req.params.name,
		func: 'applyTemplate', obj: 'ProjectsCtrl'
	});
	//TODO: Check that user is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if(req.params.name){ //Get data for a specific application
		let query = Project.findOne({name:req.params.name})
		.populate({path:'owner', select:'username name title email'});
		query.then((foundApp) => {
			if(!foundApp){
				logger.error({
					description: 'Error finding application.',
					func: 'applyTemplate', obj: 'ProjectsCtrl'
				});
				return res.status(400).send('Project could not be found.');
			}
			//TODO: Get url from found app, and get localDir from
			foundApp.applyTemplate(req.body.name).then( (webUrl) => {
				logger.log({
					description: 'Template applied to bucket successfully',
					func: 'applyTemplate', obj: 'ProjectsCtrl'
				});
				res.send(webUrl);
			}, (err) => {
				logger.log({
					description: 'Error applying template.', error: err,
					func: 'applyTemplate', obj: 'ProjectsCtrl'
				});
				res.status(400).send(err);
			});
		}, (err) => {
			logger.error({
				description: 'Error getting application:', error: err,
				func: 'applyTemplate', obj: 'ProjectsCtrl'
			});
			res.status(500).send('Error applying template to Project.');
		});
	} else {
		res.status(400).send('Project name and template name are required to upload file');
	}
};

/**
 * @api {put} /projects/:name/storage  Add File Storage
 * @apiDescription Add File Storage + Hosting to the application matching the name provided. Currently handled with Amazon's S3.
 * @apiName addStorage
 * @apiGroup Project
 *
 * @apiSuccess {Object} applicationData Object containing updated projects data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "exampleApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"tessellate-exampleApp", provider:"Amazon", siteUrl:"tessellate-exampleApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *     }
 * @apiErrorExample  Error-Response (Not Found):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Project not found."
 *     }
 *
 *
 */
 //TODO: Allow for deleteing/not deleteing all of the bucket files before applying template
export function addStorage(req, res, next) {
	logger.log({
		description: 'add storage request with app name.',
		appName: req.params.name, func: 'addStorage', obj: 'ProjectsCtrl'
	});
	//TODO: Check that user is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if(!req.params.name){ //Get data for a specific application
		return res.status(400).send('Project name and storage information are required to add storage');
	}
	let query = Project.findOne({name:req.params.name})
	.populate({path:'owner', select:'username name title email'});
	query.then((foundApp) => {
		if(!foundApp){
			logger.warn({
				description: 'Project not found.',
				func: 'addStorage', obj: 'ProjectsCtrl'
			});
			return res.status(400).send('Project could not be found');
		}
		//TODO: Get url from found app, and get localDir from
		foundApp.createStorage().then((webUrl) => {
			logger.log({
				description: 'Added storage to application successfully.',
				storageUrl: 'webUrl', func: 'addStorage', obj: 'ProjectsCtrl'
			});
			res.send(webUrl);
		},  (err) => {
			logger.log({
				description: 'Error adding storage to application:', error: err,
				func: 'addStorage', obj: 'ProjectsCtrl'
			});
			res.status(500).send(err);
		});
	}, (err) => {
		logger.error({
			description: 'Error getting application.',
			error: err, func: 'addStorage', obj: 'ProjectsCtrl'
		});
		res.status(500).send('Error adding storage to application.');
	});
};

/**
 * @api {put} /projects/:name/collaborators  Add File Storage
 * @apiDescription Add collaborators by providing their usernames
 * @apiName addCollaborators
 * @apiGroup Project
 *
 * @apiSuccess {Array} users Array containing usernames of users to add as collaborators
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "exampleApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"tessellate-exampleApp", provider:"Amazon", siteUrl:"tessellate-exampleApp.s3website.com"},
 *       collaborators:[],
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *     }
 * @apiErrorExample  Error-Response (Not Found):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Project not found."
 *     }
 *
 *
 */
 //TODO: Allow for deleteing/not deleteing all of the bucket files before applying template
export function addCollaborators(req, res, next) {
	logger.log({
		description: 'add storage request with app name: ', name: req.params.name,
		func: 'addCollaborators', obj: 'ProjectsCtrl'
	});
	//TODO: Check that user is allowed to add collaborators
	if(req.params.name && req.body.users){ //Get data for a specific application
		let query = Project.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.then((foundApp) => {
			if(!foundApp){
				logger.warn({
					description: 'Project not found.',
					func: 'addCollaborators', obj: 'ProjectsCtrl'
				});
				return res.status(400).send('Project could not be found');
			}
			foundApp.addCollaborators(req.body.users).then((appWithCollabs) => {
				logger.log({
					description: 'Added storage to application successfully:', app: appWithCollabs,
					func: 'addCollaborators', obj: 'ProjectsCtrl'
				});
				res.send(appWithCollabs);
			}, (err) => {
				logger.log({
					description: 'Error adding collaborators to application:', error: err,
					func: 'addCollaborators', obj: 'ProjectsCtrl'
				});
				res.status(500).send(err);
			});
		}, (err) => {
			logger.error({
				description: 'Error getting application.',
				error: err, func: 'addCollaborators', obj: 'ProjectsCtrl'
			});
			return res.status(500).send('Error adding collaborators to application.');
		});
	} else {
		res.status(400).send('Project name and users array are required to add collaborators.');
	}
};

/**
 * @api {put} /projects/:name/login  Add File Storage
 * @apiDescription Log into an application
 * @apiName login
 * @apiGroup Project
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       username:"hackerguy1",
 *       email:"test@test.com",
 *       name:"John Doe"
 *     }
 * @apiErrorExample  Error-Response (Not Found):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"User not found."
 *     }
 *
 *
 */
 //TODO: Allow for deleteing/not deleteing all of the bucket files before applying template
export function login(req, res, next) {
	logger.log({
		description: 'App Login request.',
		appName: req.params.name, body: req.body,
		func: 'login', obj: 'ProjectCtrl'
	});
	if(!req.params.name || !req.body) {
		return res.status(400).send('Project name and users array are required to add collaborators.');
	}
	if ((!_.has(req.body, 'username') && !_.has(req.body, 'email')) || !_.has(req.body, 'password')){ //Get data for a specific application
		logger.log({
			description: 'Username/Email and password are required to login.',
			appName: req.params.name, body: req.body,
			func: 'login', obj: 'ProjectCtrl'
		});
		return res.status(400).send('Username/Email and Password are required to login.');
	}
	let loginData =  {password: req.body.password};
	if (_.has(req.body, 'username')) {
		if(req.body.username.indexOf('@') !== -1){
			loginData.email = req.body.username;
		} else {
			loginData.username = req.body.username
		}
	}
	if (_.has(req.body, 'email')) {
		loginData.email = req.body.email;
	}
	// logger.log({description: 'LoginData built', loginData: loginData, func: 'login', obj: 'ProjectCtrl'})
	findProject(req.params.name).then((foundApp) => {
		logger.log({
			description: 'Project found successfully.',
			foundApp: foundApp, func: 'login',
			obj: 'ProjectCtrl'
		});
		//Use authrocket login if application has authRocket data
		foundApp.login(loginData).then((loginRes) => {
			logger.log({
				description: 'Login Successful.', response: loginRes,
				func: 'login', obj: 'ProjectsCtrl'
			});
			res.send(loginRes);
		}, (err) => {
			//TODO: Handle wrong password
			logger.error({
				description: 'Error logging in.', error: err,
				func: 'login', obj: 'ProjectsCtrl'
			});
			res.status(400).send(err || 'Login Error.');
		});
	}, (err) => {
		logger.error({
			description: 'Error finding applicaiton.', error: err,
			func: 'login', obj: 'ProjectsCtrl'
		});
		res.status(400).send('Project not found.');
	});
};

/**
 * @api {put} /projects/:name/logout  Add File Storage
 * @apiDescription Log a user out of an application
 * @apiName logout
 * @apiGroup Project
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       username:"hackerguy1",
 *       email:"test@test.com",
 *       name:"John Doe"
 *     }
 * @apiErrorExample  Error-Response (Not Found):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"User not found."
 *     }
 *
 *
 */
export function logout(req, res, next) {
	logger.log({
		description: 'App Logout request.',
		func: 'logout', obj: 'ProjectCtrl'
	});
	let userData;
	if(req.user){
		userData = req.user;
	}
	if(!req.user && req.body){
		userData = req.body;
	}
	if(req.params.name && req.body){ //Get data for a specific application
		findProject(req.params.name).then((foundApp) => {
			logger.log({
				description: 'Project found successfully.',
				foundApp: foundApp, func: 'logout', obj: 'ProjectCtrl'
			});
			logger.log({
				description: 'Logging out of application.',
				foundApp: foundApp, userData: userData,
				func: 'logout', obj: 'ProjectCtrl'
			});
			foundApp.logout(userData).then(() => {
				logger.log({
					description: 'Logout successful.',
					func: 'logout', obj: 'ProjectCtrl'
				});
				res.send('Logout successful.');
			}, (err) => {
				logger.error({
					description: 'Error logging out of application',
					error: err, func: 'logout', obj: 'ProjectCtrl'
				});
				res.status(400).send('Error logging out.');
			});
		}, (err) => {
			logger.error({
				description: 'Error finding application.',
				error: err, func: 'logout', obj: 'ProjectCtrl'
			});
			res.status(400).send('Project not found.');
		});
	} else {
		logger.error({
			description: 'Invalid logout request.',
			func: 'logout', obj: 'ProjectCtrl'
		});
		res.status(400).send('Error logging out.');
	}
};

/**
 * @api {put} /projects/:name/signup  Signup
 * @apiDescription Signup a user to an application
 * @apiName signup
 * @apiGroup Project
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       username:"hackerguy1",
 *       email:"test@test.com",
 *       name:"John Doe"
 *     }
 * @apiErrorExample  Error-Response (Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"User already exists."
 *     }
 *
 *
 */
export function signup(req, res, next) {
	logger.log({
		description: 'App signup request.',
		appName: req.params.name, body: req.body,
		func: 'signup', obj: 'ProjectsCtrl'
	});
	if(req.params.name && req.body){ //Get data for a specific application
		findProject(req.params.name).then((foundApp) => {
			logger.log({
				description: 'App found.', foundApp: foundApp,
				func: 'signup', obj: 'ProjectsCtrl'
			});
			if(foundApp.authRocket && foundApp.authRocket.jsUrl){
				logger.log({
					description: 'App signup request.',
					appName: req.params.name, body: req.body,
					func: 'signup', obj: 'ProjectsCtrl'
				});
				foundApp.authRocketSignup(req.body).then( (signupRes) => {
					logger.log({
						description: 'Signup to application successful.',
						res: signupRes, appName: req.params.name,
						body: req.body, func: 'signup',
						obj: 'ProjectsCtrl'
					});
					res.send(signupRes);
				}, (err) => {
					logger.error({
						description: 'Error signing up to application.',
						error: err, appName: req.params.name,
						body: req.body, func: 'signup',
						obj: 'ProjectsCtrl'
					});
					res.status(400).send(err);
				});
			} else {
				let signupData = req.body;
				signupData.application = foundApp._id;
				foundApp.signup(signupData).then((signupRes) => {
					logger.log({
						description: 'Signup to application successful.',
						res: signupRes, appName: req.params.name,
						body: req.body, func: 'signup', obj: 'ProjectsCtrl'
					});
					res.send(signupRes);
				},  (err) => {
					if(err && err.status == 'EXISTS'){
						logger.error({
							description: 'User with matching credentials already exists.',
							error: err, appName: req.params.name,
							func: 'signup', obj: 'ProjectsCtrl'
						});
						res.status(400).send(err.message || 'User with matching credentials already exists.');
					} else {
						//TODO: Handle wrong password
						logger.error({
							description: 'Error signing up to application.',
							error: err, appName: req.params.name,
							body: req.body, func: 'signup',
							obj: 'ProjectsCtrl'
						});
						res.status(400).send(err.message || 'Error signing up.');
					}
				});
			}
		},  (err) => {
			logger.error({
				description: 'Error finding application.',
				error: err, appName: req.params.name,
				body: req.body, func: 'signup',
				obj: 'ProjectsCtrl'
			});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.error({
			description: 'Project name is required to signup.',
			func: 'signup', obj: 'ProjectsCtrl'
		});
		res.status(400).send('Project name is required to signup.');
	}
};
/**
 * @api {put} /verify Verify
 * @apiDescription Verify token and get matching user's data.
 * @apiName Verify
 * @apiGroup Auth
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "John Doe",
 *       username:"hackerguy1",
 *       title: "Front End Developer",
 *       role:"admin",
 *       createdAt:1438737438578
 *       updatedAt:1438737438578
 *     }
 *
 */
export function verify(req, res, next) {
	//TODO:Actually verify user instead of just returning user data
	//TODO: Get applicaiton and verify that user exists within applicaiton
	let findObj = {};
	if(req.user){
		//Find by username in token
		if(_.has(req.user, "username")){
			findObj.username = req.user.username;
		} else {
			//Find by email in token
			findObj.email = req.user.email;
		}
		let query = User.findOne(findObj).select('username email sessionId');
		query.then((result) => {
			if(!result){
				//Matching user already exists
				// TODO: Respond with a specific error code
				logger.error({
					description:'Error querying for user', error: err,
					func: 'verify', obj: 'ProjectsCtrl'
				});
				return res.status(400).send('User with this information does not exist.');
			}
			res.json(result);
		}, (err) => {
			logger.error({
				description:'Error querying for user', error: err,
				func: 'verify', obj: 'ProjectsCtrl'
			});
			res.status(500).send('Unable to verify token.');
		});
	} else if(_.has(req, 'body') && _.has(req.body, 'token')) {
		//TODO: Handle invalidating token within body.
		logger.error({
			description:'Logout token within body instead of header.',
			func: 'verify', obj: 'ProjectsCtrl'
		});
		res.status(401).send('Valid Auth token required to verify');
	} else {
		logger.log({
			description: 'Invalid auth token.',
			func: 'verify', obj: 'ProjectsCtrl'
		});
		res.status(401).send('Valid Auth token required to verify');
	}
};
/**
 * @api {get} /projects/:appName/groups/:groupName Group(s)
 * @apiDescription Get an projects group(s)
 * @apiName groups
 * @apiGroup Project
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       name:"admins",
 *       users:[{username:"superuserguy", email: "test@test.com"}],
 *     }]
 * @apiErrorExample  Error-Response (Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Group does not exist."
 *     }
 *
 *
 */
export function groups(req, res, next) {
	logger.log({
		description: 'App get group(s) request called.',
		appName: req.params.name, body: req.body, func: 'groups'
	});
	if(req.params.name && req.body){ //Get data for a specific application
		findProject(req.params.name).then((foundApp) => {
			//Check application's groups
			if(!req.params.groupName){
				logger.info({
					description: 'Project groups found.',
					foundApp: foundApp, func: 'groups', obj: 'ProjectsCtrl'
				});
				res.send(foundApp.groups);
			} else {
				let group = _.findWhere(foundApp.groups, {name: req.params.groupName});
				if(group){
					logger.info({
						description: 'Project group found.',
						group: group, foundApp: foundApp,
						func: 'groups', obj: 'ProjectsCtrl'
					});
					res.send(group);
				} else {
					//Check for application's auth rocket data
					if (foundApp.authRocket) {
						authRocket.Orgs().get().then((groupsRes) => {
							logger.log({
								description: 'Orgs loaded from authrocket.',
								response: groupsRes, func: 'groups',
								obj: 'ProjectsCtrl'
							});
							res.send(groupsRes);
						},  (err) => {
							logger.error({
								description: 'Error gettings orgs from AuthRocket.',
								error: err, func: 'groups', obj: 'ProjectsCtrl'
							});
							res.status(400).send(err);
						});
					} else {
						//Group has not been added to application
						let query = Group.findOne({name: req.params.groupName, application: foundApp._id});
						query.then((groupWithoutApp) => {
							if(!groupWithoutApp){
								logger.error({
									description: 'Group not found.', group: groupWithoutApp,
									foundApp: foundApp, func: 'groups', obj: 'ProjectsCtrl'
								});
								res.status(400).send('Group not found.');
							} else {
								logger.log({
									description: 'Group found, but not within application. Adding to application.',
									group: groupWithoutApp, foundApp: foundApp,
									func: 'groups', obj: 'ProjectsCtrl'
								});
								foundApp.addGroup(groupWithoutApp).then( (newGroup) => {
									logger.info({
										description: 'Existing group added to applicaiton.',
										group: groupWithoutApp, foundApp: foundApp,
										func: 'groups', obj: 'ProjectsCtrl'
									});
									res.send(groupWithoutApp);
								}, (err) => {
									res.status(500).send('Error adding existing group to application.');
								});
							}
						}, (err) => {
							logger.error({
								description: 'Error finding group.', error: err,
								foundApp: foundApp, func: 'groups', obj: 'ProjectsCtrl'
							});
							res.status(500).send('Error finding group.');
						});
					}
				}
			}
		},  (err) => {
			logger.error({
				description: 'Error finding application.',
				error: err, func: 'groups', obj: 'ProjectsCtrl'
			});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({
			description: 'Project name is required to get application.',
			error: err, func: 'groups', obj: 'ProjectsCtrl'
		});
		res.status(400).send('Project name is required.');
	}
};
/**
 * @api {post} /projects/:name/groups  addGroup
 * @apiDescription Add group
 * @apiName addGroup
 * @apiGroup Project
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       name:"admins",
 *       users:[{username:"superuserguy", email: "test@test.com"}],
 *     }]
 * @apiErrorExample  Error-Response (Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Group already exists"
 *     }
 *
 *
 */
export function addGroup(req, res, next) {
	logger.log({
		description: 'App add group request.',
		name: req.params.name, body: req.body,
		func: 'addGroup', obj: 'ProjectsCtrls'
	});
	if(req.params.name && req.body){ //Get data for a specific application
		findProject(req.params.name).then( (foundApp) => {
			logger.log({
				description: 'Project found. Adding group.',
				app: foundApp, func: 'addGroup', obj: 'ProjectsCtrls'
			});
			foundApp.addGroup(req.body).then( (newGroup) => {
				logger.info({
					description: 'Group added to applicaiton successfully.',
					newGroup: newGroup, func: 'addGroup', obj: 'ProjectsCtrls'
				});
				res.send(newGroup);
			},  (err) => {
				//TODO: Handle wrong password
				logger.error({
					description: 'Error adding group to application.',
					error: err, func: 'addGroup', obj: 'ProjectsCtrls'
				});
				res.status(400).send('Error adding group.');
			});
		},  (err) => {
			logger.error({
				description: 'Error find application.',
				error: err, func: 'addGroup', obj: 'ProjectsCtrls'
			});
			//TODO: Handle other errors
			res.status(400).send('Error finding application.');
		});
	} else {
		res.status(400).send('Project name is required.');
	}
};
/**
 * @api {put} /projects/:name/groups  updateGroup
 * @apiDescription Update a group
 * @apiName updateGroup
 * @apiGroup Project
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       name:"admins",
 *       users:[{username:"superuserguy", email: "test@test.com"}],
 *     }]
 * @apiErrorExample  Error-Response (Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Error updating group."
 *     }
 *
 *
 */
export function updateGroup(req, res, next) {
	logger.log({
		description: 'Update application group called.',
		appName: req.params.name, body: req.body,
		func: 'updateGroup', obj: 'ProjectsCtrl'
	});
	if(req.params.name){ //Get data for a specific application
		findProject(req.params.name).then( (foundApp) => {
			//Update is called with null or empty value
			logger.log({
				description: 'Project found.', foundApp: foundApp,
				func: 'updateGroup', obj: 'ProjectsCtrl'
			});
			if(!_.keys(req.body) || _.keys(req.body).length < 1 || req.body == {} || req.body == null || !req.body){
				logger.log({
					description: 'Update group with null, will be handled as delete.',
					func: 'updateGroup', obj: 'ProjectsCtrl'
				});
				//Delete group
				foundApp.deleteGroup({name: req.params.groupName}).then( (updatedGroup) => {
					logger.info({
						description: 'Project group deleted successfully.',
						updatedGroup: updatedGroup, func: 'updateGroup', obj: 'ProjectsCtrl'
					});
					res.send(updatedGroup);
				}, (err) => {
					//TODO: Handle wrong password
					logger.error({
						description: 'Error deleting application group.',
						error: err, func: 'updateGroup', obj: 'ProjectsCtrl'
					});
					if(err && err.status && err.status == 'NOT_FOUND'){
						res.status(400).send(err.message || 'Error deleting group.');
					} else {
						res.status(500).send('Error deleting group.');
					}
				});
			} else {
				logger.log({
					description: 'Provided data is valid. Updating application group.',
					foundApp: foundApp, updateData: req.body,
					func: 'updateGroup', obj: 'ProjectsCtrl'
				});
				let updateData = _.extend({}, req.body);
				updateData.name = req.params.groupName;
				if(_.has(updateData, 'users')){
					//TODO: Compare to foundApps current users
					//TODO: Handle user usernames array
				}
				//Update group
				foundApp.updateGroup(updateData).then((updatedGroup) => {
					logger.info({
						description: 'Project group updated successfully.',
						updatedGroup: updatedGroup, func: 'updateGroup', obj: 'ProjectsCtrl'
					});
					res.send(updatedGroup);
				}, (err) => {
					//TODO: Handle wrong password
					logger.error({
						description: 'Error updating application group.',
						error: err, func: 'updateGroup', obj: 'ProjectsCtrl'
					});
					res.status(400).send("Error updating application's group.");
				});
			}
		}, (err) => {
			logger.error({
				description: 'Error finding application.',
				error: err, func: 'updateGroup', obj: 'ProjectsCtrl'
			});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({
			description: 'Project name is required to update group.',
			func: 'updateGroup', obj: 'ProjectsCtrl'
		});
		res.status(400).send('Project name is required to update application group.');
	}
};
/**
 * @api {put} /projects/:name/groups  deleteGroup
 * @apiDescription Update a group
 * @apiName deleteGroup
 * @apiGroup Project
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       username:"hackerguy1",
 *       email:"test@test.com",
 *       name:"John Doe"
 *     }
 * @apiErrorExample  Error-Response (Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"User already exists."
 *     }
 *
 *
 */
export function deleteGroup(req, res, next) {
	logger.log({
		description: 'App add group request with app name.', name: req.params.name,
		func: 'deleteGroup', obj: 'ProjectsCtrl'
	});
	if(req.params.name && req.body){ //Get data for a specific application
		findProject(req.params.name).then((foundApp) => {
			foundApp.deleteGroup(req.body).then(() => {
				logger.info({
					description: 'Group deleted successfully.',
					func: 'deleteGroup', obj: 'ProjectsCtrl'
				});
				//TODO: Return something other than this message
				res.send('Group deleted successfully.');
			},  (err) => {
				//TODO: Handle wrong password
				logger.error({
					description: 'Error deleting group.', error: err,
					func: 'deleteGroup', obj: 'ProjectsCtrl'
				});
				res.status(400).send('Error deleting group.');
			});
		},  (err) => {
			logger.error({
				description: 'Error finding application.', error: err,
				func: 'deleteGroup', obj: 'ProjectsCtrl'
			});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({
			description: 'Project name is required to delete application group.',
			error: err, func: 'deleteGroup', obj: 'ProjectsCtrl'
		});
		res.status(400).send('Project name is required to delete application group.');
	}
};
// Utility functions
//Wrap finding application in a promise that handles errors
//TODO: Allow choosing populate settings
function findProject(appName) {
	if(!appName){
		logger.error({
			description: 'Project name is required to find application.',
			error: err, func: 'findProject'
		});
		Promise.reject({message: 'Project name required to find application.'});
	} else {
		let query = Project.findOne({name:appName})
		.populate({path:'owner', select:'username name email'})
		.populate({path:'groups', select:'name users'})
		.populate({path:'directories', select:'name users groups'})
		return query.then((foundApp) => {
			if(!foundApp){
				logger.error({
					description: 'Project not found',
					func: 'findProject'
				});
				return Promise.reject({message: 'Project not found'});
			} else {
				logger.log({
					description: 'Project found.',
					foundApp: foundApp, func: 'findProject'
				});
				return foundApp;
			}
		}, (err) => {
			logger.error({
				description: 'Error finding application.',
				error: err, func: 'findProject'
			});
			return Promise.reject({message: 'Error finding application.'});
		});
	}
}
// Utility functions
//Wrap finding application in a promise that handles errors
//TODO: Allow choosing populate settings
export function findProjectsByUserId(userId) {
	if(!userId){
		logger.error({
			description: 'User id is required to find projects.',
			func: 'findProjectsByUserId'
		});
		return Promise.reject({message: 'User id is required to find projects.'});
	}
	const findObj = {owner: userId, $or: [{'owner': userId}, {'collaborators': {$in:[userId]}}]};
	let query = Project.find(findObj)
	.populate({path:'owner', select:'username name email'})
	return query.then(foundApp => {
		if(!foundApp){
			logger.error({
				description: 'Project not found',
				func: 'findProject'
			});
			return Promise.reject({message: 'Project not found'});
		}
		logger.log({
			description: 'Project found.',
			foundApp, func: 'findProject'
		});
		return foundApp;
	}, error => {
		logger.error({
			description: 'Error finding application.',
			error, func: 'findProject'
		});
		return Promise.reject({message: 'Error finding application.'});
	});
}
// ------------------------------------------------------------------------------------------
// Current Errors.
// ------------------------------------------------------------------------------------------
/**
 * @apiDefine CreateUserError
 * @apiVersion 0.0.1
 *
 * @apiError NoAccessRight Only authenticated Admins can access the data.
 * @apiError UserNameTooShort Minimum of 5 characters required.
 *
 * @apiErrorExample  Response (example):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "UserNameTooShort"
 *     }
 */
