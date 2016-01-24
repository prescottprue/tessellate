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
 * @apiDescription Get a specific project's data or a list of projects.
 * @apiName GetProject
 * @apiGroup Project
 *
 * @apiParam {String} [name] Name of Project.
 *
 * @apiSuccess {object} projectData Object containing projects data if <code>name</code> param is provided
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
	if(name){ //Get data for a specific project
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
	}, error => {
		logger.error({
			description: 'Error getting project(s):',
			error, func: 'get', obj: 'ProjectsCtrls'
		});
		res.status(500).send('Error getting Project(s).');
	});
};
/**
 * @api {get} /projects Get Project's provider data
 * @apiDescription Get a specific project's data or a list of projects.
 * @apiName GetProject
 * @apiGroup Project
 *
 * @apiParam {String} [name] Name of Project.
 *
 * @apiSuccess {object} projectData Object containing projects data if <code>name</code> param is provided
 * @apiSuccess {array} projects Array of projects if <code>name</code> is not provided.
 *
 */
export function getProviders(req, res, next) {
	if(!req.params.name){ //Get data for a specific project
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
	}, error => {
		logger.error({
			description: 'Error getting project(s).',
			error, func: 'getProviders', obj: 'ProjectsCtrls'
		});
		res.status(500).send('Error getting Project(s).');
	});
};

/**
 * @api {post} /projects Add Project
 * @apiDescription Add a new project.
 * @apiName AddProject
 * @apiGroup Project
 *
 * @apiParam {String} name Name of project
 * @apiParam {String} [template] Template to use when creating the project. Default template is used if no template provided
 *
 * @apiSuccess {Object} projectData Object containing newly created projects data.
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
 // TODO: Create project based on username, not on token userId
export function add(req, res, next) {
	//Query for existing project with same _id
	if(!req.body || !req.body.name){
		return res.status(400).send('Name is required to create project');
	}
	logger.log({
		description:'Projects add called with name.',
		body: req.body, user: req.user, func: 'add', obj: 'ProjectsCtrl'
	});
	const name = req.body.name;
	const username = req.params.username;
	const userId = req.user.userId;
	findProject(name, userId).then(foundApp => {
		logger.error({
			description: 'Project with this name already exists.',
			foundApp, func: 'add', obj: 'ProjectsCtrl'
		});
		res.status(400).send('Project with this name already exists.');
	}, error => {
		console.log('error finding project');
		if(typeof error !== 'undefined' && error.status == 'EXISTS'){
			return res.status(400).send('Project with this name already exists.');
		}
		logger.log({
			description: 'Project does not already exist.',
			func: 'add', obj: 'Project'
		});
		let project = new Project({name, owner: userId});
		if(!req.body.template){
			//Template name was not provided
			return project.save().then(newProject => {
				logger.log({
					description: 'Project created successfully.',
					newProject, func: 'add', obj: 'Project'
				});
				res.json(newProject);
			}, error => {
				logger.error({
					description: 'Error creating project.', error,
					func: 'add', obj: 'Project'
				});
				res.status(500).send('Error saving project.');
			});
		}
		//Template name was provided
		let templateData = {name: req.body.template};
		templateData.type = req.body.templateType ? req.body.templateType : 'firebase';
		return project.createWithTemplate(templateData).then(newProject => {
			logger.log({
				description: 'Project created with template.',
				newProject, func: 'add', obj: 'Project'
			});
			res.json(newProject);
		}, error => {
			logger.error({
				description: 'Error creating project.',
				error, func: 'add', obj: 'Project'
			});
			res.status(400).send('Error creating project.');
		});
	});
};

/**
 * @api {put} /projects Update Project
 * @apiDescription Update an project.
 * @apiName UpdateProject
 * @apiGroup Project
 *
 * @apiParam {String} name Name of project
 * @apiParam {Object} owner Owner of project
 * @apiParam {String} owner.username Project owner's username
 *
 * @apiSuccess {Object} projectData Object containing updated projects data.
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
		Project.update({name:req.params.name}, req.body, {upsert:false},  (error, affected, result)  => {
			if (error) {
				logger.error({
					description: 'Error updating project.',
					error, func: 'update', obj: 'ProjectsCtrls'
				});
				return res.status(500).send('Error updating Project.');
			}
			//TODO: respond with updated data instead of passing through req.body
			logger.log({
				description: 'Project update successful.',
				affected, func: 'update', obj: 'ProjectsCtrls'
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
					affected, func: 'update', obj: 'ProjectsCtrls'
				});
				res.json(req.body);
			}
		});
	} else {
		res.status(400).send({message:'Project id required'});
	}
};

/**
 * @api {delete} /project/:id Delete Project
 * @apiDescription Delete an project.
 * @apiName DeleteProject
 * @apiGroup Project
 *
 * @apiParam {String} name Name of project
 *
 * @apiSuccess {Object} projectData Object containing deleted projects data.
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
			let project = new Project(result);
			project.removeStorage().then(() => {
				logger.log({
					description: 'Project storage deleted successfully.',
					func: 'delete', obj: 'ProjectsCtrl'
				});
				res.json(result);
			}, error => {
				logger.error({
					description: 'Error removing storage from project.',
					error, func: 'delete', obj: 'ProjectsCtrl'
				});
				res.status(400).send('Error removing storage from project.');
			});
		} else {
			logger.error({
				description: 'Project not found.', error,
				func: 'delete', obj: 'ProjectsCtrl'
			});
			res.status(400).send('Project could not be found.');
		}
	}, error => {
		logger.error({
			description: 'Error getting project.', error,
			func: 'delete', obj: 'ProjectsCtrl'
		});
		res.status(500).send('Error deleting Project.');
	});
};


/**
 * @api {put} /projects/:name/files  Get Files
 * @apiDescription Get the list of files for a specific project.
 * @apiName Files
 * @apiGroup Project
 *
 * @apiParam {File} file1 File to upload. Key (<code>file1</code>) does not hold significance as all files are uploaded.
 * @apiParam {File} file2 Second File to upload. Again, Key (<code>file2</code>) does not hold significance as all files are uploaded.
 *
 * @apiSuccess {Object} projectData Object containing updated projects data.
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
	//TODO: Lookup project and run uploadFile =>
	if(req.params.name){ //Get data for a specific project
		let query = Project.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.then((foundApp) => {
			if(foundApp){
				foundApp.getStructure().then((projectFiles) => {
					logger.log({
						description: 'Get structure returned.',
						structure: projectFiles, func: 'files', obj: 'ProjectsCtrls'
					});
					res.send(projectFiles);
				}, error => {
					logger.error({
						description: 'Error getting project file structure.',
						error, func: 'files', obj: 'ProjectsCtrls'
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
		}, error => {
			logger.error({
				description: 'Error getting project:', error,
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
 * @apiDescription Publish/Upload a specified file to the storage/hosting for project matching the name provided.
 * @apiName UploadFile
 * @apiGroup Project
 *
 * @apiParam {String} name Name of
 * @apiParam {String} content Text string content of file
 * @apiParam {String} filetype Type of file the be uploaded
 *
 * @apiSuccess {Object} projectData Object containing updated projects data.
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
	//TODO: Lookup project and run uploadFile =>
	if(req.params.name){ //Get data for a specific project
		let query = Project.findOne({name:req.params.name})
		.populate({path:'owner', select:'username name title email'});
		isList = false;
		query.then(foundApp => {
			if(foundApp){
				foundApp.publishFile({content:req.body.content, key:req.body.key, contentType:req.body.contentType}).then((result) => {
					logger.info({
						description: 'File published successfully.',
						func: 'publishFile', result,
						obj: 'ProjectsCtrls'
					});
					res.send(result);
				}, error => {
					logger.log({
						description: 'Error publishing file.',
						error, func: 'publishFile',
						obj: 'ProjectsCtrls'
					});
					res.status(400).send('Error');
				});
			} else {
				logger.error({
					description: 'Error finding project.', func: 'publishFile',
					params: req.params, obj: 'ProjectsCtrls'
				});
				res.status(400).send('Project could not be found.');
			}
		}, error => {
			logger.error({
				description: 'Error finding project.',
				params: req.params, error,
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
 * @apiDescription Apply a template to the project matching the name provided.
 * @apiName projectTemplate
 * @apiGroup Project
 *
 * @apiParam {String} name Name of template
 *
 * @apiSuccess {Object} projectData Object containing project's data.
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
 //TODO: Allow for deleteing/not deleteing all of the bucket files before projecting template
export function projectTemplate(req, res, next) {
	logger.log({
		description: 'project template request with project name: ', name: req.params.name,
		func: 'projectTemplate', obj: 'ProjectsCtrl'
	});
	//TODO: Check that user is owner or collaborator before uploading
	//TODO: Lookup project and run uploadFile =>
	if(req.params.name){ //Get data for a specific project
		let query = Project.findOne({name:req.params.name})
		.populate({path:'owner', select:'username name title email'});
		query.then((foundApp) => {
			if(!foundApp){
				logger.error({
					description: 'Error finding project.',
					func: 'projectTemplate', obj: 'ProjectsCtrl'
				});
				return res.status(400).send('Project could not be found.');
			}
			//TODO: Get url from found project, and get localDir from
			foundApp.applyTemplate(req.body.name).then( (webUrl) => {
				logger.log({
					description: 'Template projectlied to bucket successfully',
					func: 'projectTemplate', obj: 'ProjectsCtrl'
				});
				res.send(webUrl);
			}, error => {
				logger.log({
					description: 'Error projecting template.', error,
					func: 'projectTemplate', obj: 'ProjectsCtrl'
				});
				res.status(400).send('Error');
			});
		}, error => {
			logger.error({
				description: 'Error getting project:', error,
				func: 'projectTemplate', obj: 'ProjectsCtrl'
			});
			res.status(500).send('Error projecting template to Project.');
		});
	} else {
		res.status(400).send('Project name and template name are required to upload file');
	}
};

/**
 * @api {put} /projects/:name/storage  Add File Storage
 * @apiDescription Add File Storage + Hosting to the project matching the name provided. Currently handled with Amazon's S3.
 * @apiName addStorage
 * @apiGroup Project
 *
 * @apiSuccess {Object} projectData Object containing updated projects data.
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
 //TODO: Allow for deleteing/not deleteing all of the bucket files before projecting template
export function addStorage(req, res, next) {
	logger.log({
		description: 'add storage request with project name.',
		projectName: req.params.name, func: 'addStorage', obj: 'ProjectsCtrl'
	});
	//TODO: Check that user is owner or collaborator before uploading
	//TODO: Lookup project and run uploadFile =>
	if(!req.params.name){ //Get data for a specific project
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
		//TODO: Get url from found project, and get localDir from
		foundApp.createStorage().then((webUrl) => {
			logger.log({
				description: 'Added storage to project successfully.',
				storageUrl: 'webUrl', func: 'addStorage', obj: 'ProjectsCtrl'
			});
			res.send(webUrl);
		},  error => {
			logger.log({
				description: 'Error adding storage to project:', error,
				func: 'addStorage', obj: 'ProjectsCtrl'
			});
			res.status(500).send('Error');
		});
	}, error => {
		logger.error({
			description: 'Error getting project.',
			error, func: 'addStorage', obj: 'ProjectsCtrl'
		});
		res.status(500).send('Error adding storage to project.');
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
 //TODO: Allow for deleteing/not deleteing all of the bucket files before projecting template
export function addCollaborators(req, res, next) {
	logger.log({
		description: 'add storage request with project name: ', name: req.params.name,
		func: 'addCollaborators', obj: 'ProjectsCtrl'
	});
	//TODO: Check that user is allowed to add collaborators
	if(req.params.name && req.body.users){ //Get data for a specific project
		let query = Project.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.then((foundApp) => {
			if(!foundApp){
				logger.warn({
					description: 'Project not found.',
					func: 'addCollaborators', obj: 'ProjectsCtrl'
				});
				return res.status(400).send('Project could not be found');
			}
			foundApp.addCollaborators(req.body.users).then((projectWithCollabs) => {
				logger.log({
					description: 'Added storage to project successfully:', project: projectWithCollabs,
					func: 'addCollaborators', obj: 'ProjectsCtrl'
				});
				res.send(projectWithCollabs);
			}, error => {
				logger.log({
					description: 'Error adding collaborators to project:', error,
					func: 'addCollaborators', obj: 'ProjectsCtrl'
				});
				res.status(500).send('Error');
			});
		}, error => {
			logger.error({
				description: 'Error getting project.',
				error, func: 'addCollaborators', obj: 'ProjectsCtrl'
			});
			return res.status(500).send('Error adding collaborators to project.');
		});
	} else {
		res.status(400).send('Project name and users array are required to add collaborators.');
	}
};

/**
 * @api {put} /projects/:name/login  Add File Storage
 * @apiDescription Log into an project
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
 //TODO: Allow for deleteing/not deleteing all of the bucket files before projecting template
export function login(req, res, next) {
	logger.log({
		description: 'App Login request.',
		projectName: req.params.name, body: req.body,
		func: 'login', obj: 'ProjectCtrl'
	});
	if(!req.params.name || !req.body) {
		return res.status(400).send('Project name and users array are required to add collaborators.');
	}
	if ((!_.has(req.body, 'username') && !_.has(req.body, 'email')) || !_.has(req.body, 'password')){ //Get data for a specific project
		logger.log({
			description: 'Username/Email and password are required to login.',
			projectName: req.params.name, body: req.body,
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
		//Use authrocket login if project has authRocket data
		foundApp.login(loginData).then((loginRes) => {
			logger.log({
				description: 'Login Successful.', response: loginRes,
				func: 'login', obj: 'ProjectsCtrl'
			});
			res.send(loginRes);
		}, error => {
			//TODO: Handle wrong password
			logger.error({
				description: 'Error logging in.', error,
				func: 'login', obj: 'ProjectsCtrl'
			});
			res.status(400).send('Login Error.');
		});
	}, error => {
		logger.error({
			description: 'Error finding projectlicaiton.', error,
			func: 'login', obj: 'ProjectsCtrl'
		});
		res.status(400).send('Project not found.');
	});
};

/**
 * @api {put} /projects/:name/logout  Add File Storage
 * @apiDescription Log a user out of an project
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
	if(req.params.name && req.body){ //Get data for a specific project
		findProject(req.params.name).then((foundApp) => {
			logger.log({
				description: 'Project found successfully.',
				foundApp: foundApp, func: 'logout', obj: 'ProjectCtrl'
			});
			logger.log({
				description: 'Logging out of project.',
				foundApp: foundApp, userData: userData,
				func: 'logout', obj: 'ProjectCtrl'
			});
			foundApp.logout(userData).then(() => {
				logger.log({
					description: 'Logout successful.',
					func: 'logout', obj: 'ProjectCtrl'
				});
				res.send('Logout successful.');
			}, error => {
				logger.error({
					description: 'Error logging out of project',
					error, func: 'logout', obj: 'ProjectCtrl'
				});
				res.status(400).send('Error logging out.');
			});
		}, error => {
			logger.error({
				description: 'Error finding project.',
				error, func: 'logout', obj: 'ProjectCtrl'
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
 * @apiDescription Signup a user to an project
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
		projectName: req.params.name, body: req.body,
		func: 'signup', obj: 'ProjectsCtrl'
	});
	if(req.params.name && req.body){ //Get data for a specific project
		findProject(req.params.name).then((foundApp) => {
			logger.log({
				description: 'App found.', foundApp: foundApp,
				func: 'signup', obj: 'ProjectsCtrl'
			});
			if(foundApp.authRocket && foundApp.authRocket.jsUrl){
				logger.log({
					description: 'App signup request.',
					projectName: req.params.name, body: req.body,
					func: 'signup', obj: 'ProjectsCtrl'
				});
				foundApp.authRocketSignup(req.body).then( (signupRes) => {
					logger.log({
						description: 'Signup to project successful.',
						res: signupRes, projectName: req.params.name,
						body: req.body, func: 'signup',
						obj: 'ProjectsCtrl'
					});
					res.send(signupRes);
				}, error => {
					logger.error({
						description: 'Error signing up to project.',
						error, projectName: req.params.name,
						body: req.body, func: 'signup',
						obj: 'ProjectsCtrl'
					});
					res.status(400).send('Error');
				});
			} else {
				let signupData = req.body;
				signupData.project = foundApp._id;
				foundApp.signup(signupData).then((signupRes) => {
					logger.log({
						description: 'Signup to project successful.',
						res: signupRes, projectName: req.params.name,
						body: req.body, func: 'signup', obj: 'ProjectsCtrl'
					});
					res.send(signupRes);
				}, error => {
					if(error && error.status == 'EXISTS'){
						logger.error({
							description: 'User with matching credentials already exists.',
							error, projectName: req.params.name,
							func: 'signup', obj: 'ProjectsCtrl'
						});
						res.status(400).send(error.message || 'User with matching credentials already exists.');
					} else {
						//TODO: Handle wrong password
						logger.error({
							description: 'Error signing up to project.',
							error, projectName: req.params.name,
							body: req.body, func: 'signup',
							obj: 'ProjectsCtrl'
						});
						res.status(400).send(error.message || 'Error signing up.');
					}
				});
			}
		},  error => {
			logger.error({
				description: 'Error finding project.',
				error, projectName: req.params.name,
				body: req.body, func: 'signup',
				obj: 'ProjectsCtrl'
			});
			res.status(400).send('Error finding project.');
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
	//TODO: Get projectlicaiton and verify that user exists within projectlicaiton
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
					description:'Error querying for user', error,
					func: 'verify', obj: 'ProjectsCtrl'
				});
				return res.status(400).send('User with this information does not exist.');
			}
			res.json(result);
		}, error => {
			logger.error({
				description:'Error querying for user', error,
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
 * @api {get} /projects/:projectName/groups/:groupName Group(s)
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
		projectName: req.params.name, body: req.body, func: 'groups'
	});
	if(req.params.name && req.body){ //Get data for a specific project
		findProject(req.params.name).then((foundApp) => {
			//Check project's groups
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
					//Check for project's auth rocket data
					if (foundApp.authRocket) {
						authRocket.Orgs().get().then((groupsRes) => {
							logger.log({
								description: 'Orgs loaded from authrocket.',
								response: groupsRes, func: 'groups',
								obj: 'ProjectsCtrl'
							});
							res.send(groupsRes);
						},  error => {
							logger.error({
								description: 'Error gettings orgs from AuthRocket.',
								error, func: 'groups', obj: 'ProjectsCtrl'
							});
							res.status(400).send('Error');
						});
					} else {
						//Group has not been added to project
						let query = Group.findOne({name: req.params.groupName, project: foundApp._id});
						query.then((groupWithoutApp) => {
							if(!groupWithoutApp){
								logger.error({
									description: 'Group not found.', group: groupWithoutApp,
									foundApp: foundApp, func: 'groups', obj: 'ProjectsCtrl'
								});
								res.status(400).send('Group not found.');
							} else {
								logger.log({
									description: 'Group found, but not within project. Adding to project.',
									group: groupWithoutApp, foundApp: foundApp,
									func: 'groups', obj: 'ProjectsCtrl'
								});
								foundApp.addGroup(groupWithoutApp).then( (newGroup) => {
									logger.info({
										description: 'Existing group added to projectlicaiton.',
										group: groupWithoutApp, foundApp: foundApp,
										func: 'groups', obj: 'ProjectsCtrl'
									});
									res.send(groupWithoutApp);
								}, error => {
									res.status(500).send('Error adding existing group to project.');
								});
							}
						}, error => {
							logger.error({
								description: 'Error finding group.', error,
								foundApp: foundApp, func: 'groups', obj: 'ProjectsCtrl'
							});
							res.status(500).send('Error finding group.');
						});
					}
				}
			}
		},  error => {
			logger.error({
				description: 'Error finding project.',
				error, func: 'groups', obj: 'ProjectsCtrl'
			});
			res.status(400).send('Error finding project.');
		});
	} else {
		logger.log({
			description: 'Project name is required to get project.',
			error, func: 'groups', obj: 'ProjectsCtrl'
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
	if(req.params.name && req.body){ //Get data for a specific project
		findProject(req.params.name).then( (foundApp) => {
			logger.log({
				description: 'Project found. Adding group.',
				project: foundApp, func: 'addGroup', obj: 'ProjectsCtrls'
			});
			foundApp.addGroup(req.body).then( (newGroup) => {
				logger.info({
					description: 'Group added to projectlicaiton successfully.',
					newGroup: newGroup, func: 'addGroup', obj: 'ProjectsCtrls'
				});
				res.send(newGroup);
			},  error => {
				//TODO: Handle wrong password
				logger.error({
					description: 'Error adding group to project.',
					error, func: 'addGroup', obj: 'ProjectsCtrls'
				});
				res.status(400).send('Error adding group.');
			});
		},  error => {
			logger.error({
				description: 'Error find project.',
				error, func: 'addGroup', obj: 'ProjectsCtrls'
			});
			//TODO: Handle other errors
			res.status(400).send('Error finding project.');
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
		description: 'Update project group called.',
		projectName: req.params.name, body: req.body,
		func: 'updateGroup', obj: 'ProjectsCtrl'
	});
	if(req.params.name){ //Get data for a specific project
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
				}, error => {
					logger.error({
						description: 'Error deleting project group.',
						error, func: 'updateGroup', obj: 'ProjectsCtrl'
					});
					if(error && error.status && error.status == 'NOT_FOUND'){
						res.status(400).send(error.message || 'Error deleting group.');
					} else {
						res.status(500).send('Error deleting group.');
					}
				});
			} else {
				logger.log({
					description: 'Provided data is valid. Updating project group.',
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
				}, error => {
					//TODO: Handle wrong password
					logger.error({
						description: 'Error updating project group.',
						error, func: 'updateGroup', obj: 'ProjectsCtrl'
					});
					res.status(400).send("Error updating project's group.");
				});
			}
		}, error => {
			logger.error({
				description: 'Error finding project.',
				error, func: 'updateGroup', obj: 'ProjectsCtrl'
			});
			res.status(400).send('Error finding project.');
		});
	} else {
		logger.log({
			description: 'Project name is required to update group.',
			func: 'updateGroup', obj: 'ProjectsCtrl'
		});
		res.status(400).send('Project name is required to update project group.');
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
		description: 'App add group request with project name.', name: req.params.name,
		func: 'deleteGroup', obj: 'ProjectsCtrl'
	});
	if(req.params.name && req.body){ //Get data for a specific project
		findProject(req.params.name).then((foundApp) => {
			foundApp.deleteGroup(req.body).then(() => {
				logger.info({
					description: 'Group deleted successfully.',
					func: 'deleteGroup', obj: 'ProjectsCtrl'
				});
				//TODO: Return something other than this message
				res.send('Group deleted successfully.');
			},  error => {
				//TODO: Handle wrong password
				logger.error({
					description: 'Error deleting group.', error,
					func: 'deleteGroup', obj: 'ProjectsCtrl'
				});
				res.status(400).send('Error deleting group.');
			});
		},  error => {
			logger.error({
				description: 'Error finding project.', error,
				func: 'deleteGroup', obj: 'ProjectsCtrl'
			});
			res.status(400).send('Error finding project.');
		});
	} else {
		logger.log({
			description: 'Project name is required to delete project group.',
			error, func: 'deleteGroup', obj: 'ProjectsCtrl'
		});
		res.status(400).send('Project name is required to delete project group.');
	}
};
// Utility functions
//Wrap finding project in a promise that handles errors
//TODO: Allow choosing populate settings
function findProject(name, owner) {
	if(!name){
		logger.error({
			description: 'Project name and owner are required to find project.',
			func: 'findProject'
		});
		return Promise.reject({message: 'Project name and owner are required to find project.'});
	}
	let findObj = { name };
	if(owner){
		findObj.owner = owner;
	}
	let query = Project.findOne(findObj)
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
			description: 'Error finding project.',
			error, func: 'findProject'
		});
		return Promise.reject({message: 'Error finding project.'});
	});
}
// Utility functions
//Wrap finding project in a promise that handles errors
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
			description: 'Error finding project.',
			error, func: 'findProject'
		});
		return Promise.reject({message: 'Error finding project.'});
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
