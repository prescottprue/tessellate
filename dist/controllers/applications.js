/**
 * @description Application Controller
 */
// ------------------------------------------------------------------------------------------
// Current Errors.
// ------------------------------------------------------------------------------------------
/**
 * @apiDefine CreateAccountError
 * @apiVersion 0.0.1
 *
 * @apiError NoAccessRight Only authenticated Admins can access the data.
 * @apiError AccountNameTooShort Minimum of 5 characters required.
 *
 * @apiErrorExample  Response (example):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "AccountNameTooShort"
 *     }
 */

'use strict';

var _ = require('lodash');
var logger = require('../utils/logger');
var Application = require('../models/application').Application;
var Account = require('../models/account').Account;
var Group = require('../models/group').Group;
var authUtil = require('../utils/auth');
/**
 * @api {get} /applications Get Application(s)
 * @apiDescription Get a specific application's data or a list of applications.
 * @apiName GetApplication
 * @apiGroup Application
 *
 * @apiParam {String} [name] Name of Application.
 *
 * @apiSuccess {object} applicationData Object containing applications data if <code>name</code> param is provided
 * @apiSuccess {array} applications Array of applications if <code>name</code> is not provided.
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
 *       "message":"Application not found."
 *     }
 */

exports.get = function (req, res, next) {
	// var user = authUtil.getUserFromRequest(req);
	// logger.log({description: 'User from request.', user: user, func: 'get', obj: 'ApplicationsCtrls'});
	var isList = true;
	var query = Application.find({}).populate({ path: 'owner', select: 'username name title email' });
	if (req.params.name) {
		//Get data for a specific application
		logger.log({
			description: 'Application get request.', name: req.params.name,
			func: 'get', obj: 'ApplicationsCtrls'
		});
		query = Application.findOne({ name: req.params.name }).populate({ path: 'owner', select: 'username name title email' }).populate({ path: 'groups', select: 'name accounts' }).populate({ path: 'directories', select: 'name accounts groups' });
		isList = false;
	}
	query.then(function (result) {
		if (!result) {
			logger.error({ description: 'Error finding Application(s).', func: 'get', obj: 'ApplicationsCtrls' });
			return res.status(400).send('Application(s) could not be found.');
		}
		logger.log({ description: 'Application(s) found.', result: result, func: 'get', obj: 'ApplicationsCtrls' });
		res.send(result);
	}, function (err) {
		logger.error({ description: 'Error getting application(s):', error: err, func: 'get', obj: 'ApplicationsCtrls' });
		res.status(500).send('Error getting Application(s).');
	});
};
/**
 * @api {get} /applications Get Application's provider data
 * @apiDescription Get a specific application's data or a list of applications.
 * @apiName GetApplication
 * @apiGroup Application
 *
 * @apiParam {String} [name] Name of Application.
 *
 * @apiSuccess {object} applicationData Object containing applications data if <code>name</code> param is provided
 * @apiSuccess {array} applications Array of applications if <code>name</code> is not provided.
 *
 */
exports.getProviders = function (req, res, next) {
	// var query = Application.find({}).populate({path:'owner', select:'username name title email'});
	if (req.params.name) {
		//Get data for a specific application
		logger.log({ description: 'Get Providers request.', params: req.params, func: 'getProviders', obj: 'ApplicationsCtrls' });
		var query = Application.findOne({ name: req.params.name });
		query.then(function (result) {
			if (!result) {
				logger.error('[ApplicationsCtrl.get()] Error finding application(s).');
				return res.status(400).send('Application(s) could not be found.');
			}
			var providerData = {};
			_.each(result.providers, function (provider) {
				providerData[provider.name] = provider.clientId;
			});
			logger.log({ description: 'Provider data found.', providerData: providerData, func: 'getProviders', obj: 'ApplicationsCtrls' });
			res.send(providerData);
		}, function (err) {
			logger.error({ description: 'Error getting application(s).', error: err, func: 'getProviders', obj: 'ApplicationsCtrls' });
			res.status(500).send('Error getting Application(s).');
		});
	} else {
		logger.info({ description: 'Application name required to get providers.', func: 'getProviders', obj: 'ApplicationsCtrls' });
		res.status(400).send('Application name required to get providers.');
	}
};

/**
 * @api {post} /applications Add Application
 * @apiDescription Add a new application.
 * @apiName AddApplication
 * @apiGroup Application
 *
 * @apiParam {String} name Name of application
 * @apiParam {String} [template] Template to use when creating the application. Default template is used if no template provided
 *
 * @apiSuccess {Object} applicationData Object containing newly created applications data.
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
 *       "message":"Application by that name already exists."
 *     }
 *
 */
exports.add = function (req, res, next) {
	//Query for existing application with same _id
	if (!_.has(req.body, "name")) {
		logger.error({ description: 'Application name required to create a new app.', name: req.body.name, body: req.body, func: 'add', obj: 'ApplicationsCtrl' });
		res.status(400).send("Name is required to create a new app");
	} else {
		logger.log({ description: 'Applications add called with name.', name: req.body.name, body: req.body, func: 'add', obj: 'ApplicationsCtrl' });
		var appData = _.extend({}, req.body);
		var appName = req.body.name;
		if (!_.has(appData, 'owner')) {
			logger.log({ description: 'No owner data provided. Using account.', account: req.user, func: 'add', obj: 'ApplicationsCtrl' });
			if (_.has(req, 'userId')) {
				appData.owner = req.userId;
			} else if (_.has(req.user, 'id')) {
				appData.owner = req.user.id;
			}
		}
		findApplication(appName).then(function (foundApp) {
			logger.error({ description: 'Application with this name already exists.', foundApp: foundApp, func: 'add', obj: 'ApplicationsCtrl' });
			res.status(400).send('Application with this name already exists.');
		}, function (err) {
			if (err && err.status == 'EXISTS') {
				res.status(400).send('Application with this name already exists.');
			} else {
				logger.log({ description: 'Application does not already exist.', func: 'add', obj: 'Application' });
				//application does not already exist
				var application = new Application(appData);
				logger.log({ description: 'Calling create with storage.', appData: appData, func: 'add', obj: 'Application' });
				//Create with template if one is provided
				if (_.has(req.body, 'template')) {
					//Template name was provided
					application.createWithTemplate(req.body.template).then(function (newApp) {
						logger.log({ description: 'Application created with template.', newApp: newApp, func: 'add', obj: 'Application' });
						res.json(newApp);
					}, function (err) {
						logger.error({ description: 'Error creating application.', error: err, func: 'add', obj: 'Application' });
						res.status(400).send('Error creating application.');
					});
				} else {
					//Template parameter was not provided
					application.createWithStorage(req.body).then(function (newApp) {
						logger.log({ description: 'Application created with storage.', newApp: newApp, func: 'add', obj: 'Application' });
						res.json(newApp);
					}, function (err) {
						//TODO: Handle different errors here
						logger.error({ description: 'Error creating new application with storage.', error: err, func: 'add', obj: 'ApplicationsCtrl' });
						res.status(400).json('Error creating application.');
					});
				}
			}
		});
	}
};

/**
 * @api {put} /applications Update Application
 * @apiDescription Update an application.
 * @apiName UpdateApplication
 * @apiGroup Application
 *
 * @apiParam {String} name Name of application
 * @apiParam {Object} owner Owner of application
 * @apiParam {String} owner.username Application owner's username
 *
 * @apiSuccess {Object} applicationData Object containing updated applications data.
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
 *       "message":"Application not found."
 *     }
 *
 */
exports.update = function (req, res, next) {
	logger.log({ description: 'App update request.', params: req.params });
	if (req.params.name) {
		Application.update({ name: req.params.name }, req.body, { upsert: false }, function (err, affected, result) {
			if (err) {
				logger.error({ description: 'Error updating application.', error: err, func: 'update', obj: 'ApplicationsCtrls' });
				return res.status(500).send('Error updating Application.');
			}
			//TODO: respond with updated data instead of passing through req.body
			logger.log({ description: 'Application update successful.', affected: affected, func: 'update', obj: 'ApplicationsCtrls' });
			if (affected.nModified == 0 || affected.n == 0) {
				//TODO: Handle Application not found
				logger.error({ description: 'Application not found.', affected: affected, func: 'update', obj: 'ApplicationsCtrls' });
				res.status(400).send({ message: 'Application not found' });
			} else {
				logger.error({ description: 'Application updated successfully.', affected: affected, func: 'update', obj: 'ApplicationsCtrls' });
				res.json(req.body);
			}
		});
	} else {
		res.status(400).send({ message: 'Application id required' });
	}
};

/**
 * @api {delete} /application/:id Delete Application
 * @apiDescription Delete an application.
 * @apiName DeleteApplication
 * @apiGroup Application
 *
 * @apiParam {String} name Name of application
 *
 * @apiSuccess {Object} applicationData Object containing deleted applications data.
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
 *       "message":"Application not found."
 *     }
 *
 */
exports['delete'] = function (req, res, next) {
	var query = Application.findOneAndRemove({ 'name': req.params.name }); // find and delete using id field
	query.then(function (result) {
		if (result) {
			var app = new Application(result);
			app.removeStorage().then(function () {
				logger.log({ description: 'Application storage deleted successfully.', func: 'delete', obj: 'ApplicationsCtrl' });
				res.json(result);
			}, function (err) {
				logger.error({ description: 'Error removing storage from application.', error: err, func: 'delete', obj: 'ApplicationsCtrl' });
				res.status(400).send(err);
			});
		} else {
			logger.error({ description: 'Application not found.', error: err, func: 'delete', obj: 'ApplicationsCtrl' });
			res.status(400).send('Application could not be found.');
		}
	}, function (err) {
		logger.error({ description: 'Error getting application.', error: err, func: 'delete', obj: 'ApplicationsCtrl' });
		res.status(500).send('Error deleting Application.');
	});
};

/**
 * @api {put} /applications/:name/files  Get Files
 * @apiDescription Get the list of files for a specific application.
 * @apiName Files
 * @apiGroup Application
 *
 * @apiParam {File} file1 File to upload. Key (<code>file1</code>) does not hold significance as all files are uploaded.
 * @apiParam {File} file2 Second File to upload. Again, Key (<code>file2</code>) does not hold significance as all files are uploaded.
 *
 * @apiSuccess {Object} applicationData Object containing updated applications data.
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
 *       "message":"Application not found."
 *     }
 *
 */
exports.files = function (req, res, next) {
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if (req.params.name) {
		//Get data for a specific application
		var query = Application.findOne({ name: req.params.name }).populate({ path: 'owner', select: 'username name title email' });
		query.then(function (foundApp) {
			if (foundApp) {
				foundApp.getStructure().then(function (appFiles) {
					logger.log({ description: 'Get structure returned.', structure: appFiles, func: 'files', obj: 'ApplicationsCtrls' });
					res.send(appFiles);
				}, function (err) {
					logger.error({ description: 'Error getting application file structure.', error: err, func: 'files', obj: 'ApplicationsCtrls' });
					res.status(400).send('Error getting Application files.');
				});
			} else {
				logger.error({ description: 'Application could not be found.', func: 'files', obj: 'ApplicationsCtrls' });
				res.status(400).send('Application could not be found.');
			}
		}, function (err) {
			logger.error({ description: 'Error getting application:', error: err, func: 'files', obj: 'ApplicationsCtrls' });
			return res.status(500).send('Error getting Application files.');
		});
	} else {
		logger.info({ description: 'Application name is required to get files list.', func: 'files', obj: 'ApplicationsCtrls' });
		res.status(400).send('Application name is required to get files list.');
	}
};

/**
 * @api {put} /applications/:name/publish  Publish File
 * @apiDescription Publish/Upload a specified file to the storage/hosting for application matching the name provided.
 * @apiName UploadFile
 * @apiGroup Application
 *
 * @apiParam {String} name Name of
 * @apiParam {String} content Text string content of file
 * @apiParam {String} filetype Type of file the be uploaded
 *
 * @apiSuccess {Object} applicationData Object containing updated applications data.
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
 *       "message":"Application not found."
 *     }
 *
 */
var localDir = "./public";
exports.publishFile = function (req, res, next) {
	logger.info({ description: 'File publish request.', func: 'publishFile', params: req.params, obj: 'ApplicationsCtrls' });
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if (req.params.name) {
		//Get data for a specific application
		var query = Application.findOne({ name: req.params.name }).populate({ path: 'owner', select: 'username name title email' });
		isList = false;
		query.then(function (foundApp) {
			if (foundApp) {
				foundApp.publishFile({ content: req.body.content, key: req.body.key, contentType: req.body.contentType }).then(function (result) {
					logger.info({
						description: 'File published successfully.',
						func: 'publishFile', result: result,
						obj: 'ApplicationsCtrls'
					});
					res.send(result);
				}, function (err) {
					logger.log({
						description: 'Error publishing file.',
						error: err, func: 'publishFile',
						obj: 'ApplicationsCtrls'
					});
					res.status(400).send(err);
				});
			} else {
				logger.error({
					description: 'Error finding application.', func: 'publishFile',
					params: req.params, obj: 'ApplicationsCtrls'
				});
				res.status(400).send('Application could not be found.');
			}
		}, function (err) {
			logger.error({
				description: 'Error finding application.',
				params: req.params, error: err,
				func: 'publishFile', obj: 'ApplicationsCtrls'
			});
			res.status(500).send('Error publishing file to Application.');
		});
	} else {
		logger.error({
			description: 'Application name and file data are required to publish a file.',
			params: req.params, func: 'publishFile',
			obj: 'ApplicationsCtrls'
		});
		res.status(400).send('Application name and fileData are required to upload file.');
	}
};

/**
 * @api {put} /applications/:name/template  Apply Template
 * @apiDescription Apply a template to the application matching the name provided.
 * @apiName applyTemplate
 * @apiGroup Application
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
 *       "message":"Application not found."
 *     }
 *
 */
//TODO: Allow for deleteing/not deleteing all of the bucket files before applying template
exports.applyTemplate = function (req, res, next) {
	logger.log('apply template request with app name: ' + req.params.name + ' with body:', req.body);
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if (req.params.name) {
		//Get data for a specific application
		var query = Application.findOne({ name: req.params.name }).populate({ path: 'owner', select: 'username name title email' });
		query.exec(function (err, foundApp) {
			if (err) {
				logger.error('[ApplicationsCtrl.applyTemplate()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error applying template to Application.');
			}
			if (!foundApp) {
				logger.error({ description: 'Error finding application' });
				return res.status(400).send('Application could not be found.');
			}
			//TODO: Get url from found app, and get localDir from
			foundApp.applyTemplate(req.body.name).then(function (webUrl) {
				logger.log('Template applied to bucket successfully');
				res.send(webUrl);
			}, function (err) {
				logger.log('Error applying template:', err);
				res.status(400).send(err);
			});
		});
	} else {
		res.status(400).send('Application name and template name are required to upload file');
	}
};

/**
 * @api {put} /applications/:name/storage  Add File Storage
 * @apiDescription Add File Storage + Hosting to the application matching the name provided. Currently handled with Amazon's S3.
 * @apiName addStorage
 * @apiGroup Application
 *
 * @apiSuccess {Object} applicationData Object containing updated applications data.
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
 *       "message":"Application not found."
 *     }
 *
 *
 */
//TODO: Allow for deleteing/not deleteing all of the bucket files before applying template
exports.addStorage = function (req, res, next) {
	logger.log('add storage request with app name: ' + req.params.name + ' with body:', req.body);
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if (req.params.name) {
		//Get data for a specific application
		var query = Application.findOne({ name: req.params.name }).populate({ path: 'owner', select: 'username name title email' });
		query.exec(function (err, foundApp) {
			if (err) {
				logger.error('[ApplicationsCtrl.addStorage()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error adding storage to application.');
			}
			if (!foundApp) {
				logger.error('[ApplicationsCtrl.addStorage()] Error finding application.');
				return res.status(400).send('Application could not be found');
			}
			//TODO: Get url from found app, and get localDir from
			foundApp.createStorage().then(function (webUrl) {
				logger.log('Added storage to application successfully:', webUrl);
				res.send(webUrl);
			}, function (err) {
				logger.log('Error adding storage to application:', JSON.stringify(err));
				res.status(500).send(err);
			});
		});
	} else {
		res.status(400).send('Application name and storage information are required to add storage');
	}
};

/**
 * @api {put} /applications/:name/collaborators  Add File Storage
 * @apiDescription Add collaborators by providing their usernames
 * @apiName addCollaborators
 * @apiGroup Application
 *
 * @apiSuccess {Array} accounts Array containing usernames of accounts to add as collaborators
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
 *       "message":"Application not found."
 *     }
 *
 *
 */
//TODO: Allow for deleteing/not deleteing all of the bucket files before applying template
exports.addCollaborators = function (req, res, next) {
	logger.log('add storage request with app name: ' + req.params.name + ' with body:', req.body);
	//TODO: Check that account is allowed to add collaborators
	if (req.params.name && req.body.accounts) {
		//Get data for a specific application
		var query = Application.findOne({ name: req.params.name }).populate({ path: 'owner', select: 'username name title email' });
		query.exec(function (err, foundApp) {
			if (err) {
				logger.error('[ApplicationsCtrl.addCollaborators()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error adding collaborators to application.');
			}
			if (!foundApp) {
				logger.error('[ApplicationsCtrl.addCollaborators()] Error finding application:');
				return res.status(400).send('Application could not be found');
			}
			foundApp.addCollaborators(req.body.accounts).then(function (appWithCollabs) {
				logger.log('Added storage to application successfully:', appWithCollabs);
				res.send(appWithCollabs);
			}, function (err) {
				logger.log('Error adding collaborators to application:', JSON.stringify(err));
				res.status(500).send(err);
			});
		});
	} else {
		res.status(400).send('Application name and accounts array are required to add collaborators.');
	}
};

/**
 * @api {put} /applications/:name/login  Add File Storage
 * @apiDescription Log into an application
 * @apiName login
 * @apiGroup Application
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
 *       "message":"Account not found."
 *     }
 *
 *
 */
//TODO: Allow for deleteing/not deleteing all of the bucket files before applying template
exports.login = function (req, res, next) {
	logger.log({
		description: 'App Login request.',
		appName: req.params.name, body: req.body,
		func: 'login', obj: 'ApplicationCtrl'
	});
	if (!req.params.name || !req.body) {
		return res.status(400).send('Application name and accounts array are required to add collaborators.');
	}
	if (!_.has(req.body, 'username') && !_.has(req.body, 'email') || !_.has(req.body, 'password')) {
		//Get data for a specific application
		logger.log({
			description: 'Username/Email and password are required to login.',
			appName: req.params.name, body: req.body,
			func: 'login', obj: 'ApplicationCtrl'
		});
		return res.status(400).send('Username/Email and Password are required to login.');
	}
	var loginData = { password: req.body.password };
	if (_.has(req.body, 'username')) {
		if (req.body.username.indexOf('@') !== -1) {
			loginData.email = req.body.username;
		} else {
			loginData.username = req.body.username;
		}
	}
	if (_.has(req.body, 'email')) {
		loginData.email = req.body.email;
	}
	// logger.log({description: 'LoginData built', loginData: loginData, func: 'login', obj: 'ApplicationCtrl'})
	findApplication(req.params.name).then(function (foundApp) {
		logger.log({
			description: 'Application found successfully.',
			foundApp: foundApp, func: 'login',
			obj: 'ApplicationCtrl'
		});
		//Use authrocket login if application has authRocket data
		foundApp.login(loginData).then(function (loginRes) {
			logger.log({
				description: 'Login Successful.', response: loginRes,
				func: 'login', obj: 'ApplicationsCtrl'
			});
			res.send(loginRes);
		}, function (err) {
			//TODO: Handle wrong password
			logger.error({
				description: 'Error logging in.', error: err,
				func: 'login', obj: 'ApplicationsCtrl'
			});
			res.status(400).send(err || 'Login Error.');
		});
	}, function (err) {
		logger.error({
			description: 'Error finding applicaiton.', error: err,
			func: 'login', obj: 'ApplicationsCtrl'
		});
		res.status(400).send('Application not found.');
	});
};

/**
 * @api {put} /applications/:name/logout  Add File Storage
 * @apiDescription Log a user out of an application
 * @apiName logout
 * @apiGroup Application
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
 *       "message":"Account not found."
 *     }
 *
 *
 */
exports.logout = function (req, res, next) {
	logger.log({
		description: 'App Logout request.',
		appName: req.params.name, body: req.body
	});
	var userData;
	if (req.user) {
		userData = req.user;
	}
	if (!req.user && req.body) {
		userData = req.body;
	}
	if (req.params.name && req.body) {
		//Get data for a specific application
		findApplication(req.params.name).then(function (foundApp) {
			logger.log({
				description: 'Application found successfully.',
				foundApp: foundApp, func: 'logout', obj: 'ApplicationCtrl'
			});
			logger.log({
				description: 'Logging out of application.',
				foundApp: foundApp, userData: userData,
				func: 'logout', obj: 'ApplicationCtrl'
			});
			foundApp.logout(userData).then(function () {
				logger.log({
					description: 'Logout successful.',
					func: 'logout', obj: 'ApplicationCtrl'
				});
				res.send('Logout successful.');
			}, function (err) {
				logger.error({
					description: 'Error logging out of application',
					error: err, func: 'logout', obj: 'ApplicationCtrl'
				});
				res.status(400).send('Error logging out.');
			});
		}, function (err) {
			logger.error({
				description: 'Error finding application.',
				error: err, func: 'logout', obj: 'ApplicationCtrl'
			});
			res.status(400).send('Application not found.');
		});
	} else {
		logger.error({
			description: 'Invalid logout request.',
			func: 'logout', obj: 'ApplicationCtrl'
		});
		res.status(400).send('Error logging out.');
	}
};

/**
 * @api {put} /applications/:name/signup  Signup
 * @apiDescription Signup a user to an application
 * @apiName signup
 * @apiGroup Application
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
 *       "message":"Account already exists."
 *     }
 *
 *
 */
exports.signup = function (req, res, next) {
	logger.log({
		description: 'App signup request.',
		appName: req.params.name, body: req.body,
		func: 'signup', obj: 'ApplicationsCtrl'
	});
	if (req.params.name && req.body) {
		//Get data for a specific application
		findApplication(req.params.name).then(function (foundApp) {
			logger.log({
				description: 'App found.', foundApp: foundApp,
				func: 'signup', obj: 'ApplicationsCtrl'
			});
			if (foundApp.authRocket && foundApp.authRocket.jsUrl) {
				logger.log({
					description: 'App signup request.',
					appName: req.params.name, body: req.body,
					func: 'signup', obj: 'ApplicationsCtrl'
				});
				foundApp.authRocketSignup(req.body).then(function (signupRes) {
					logger.log({
						description: 'Signup to application successful.',
						res: signupRes, appName: req.params.name,
						body: req.body, func: 'signup',
						obj: 'ApplicationsCtrl'
					});
					res.send(signupRes);
				}, function (err) {
					logger.error({
						description: 'Error signing up to application.',
						error: err, appName: req.params.name,
						body: req.body, func: 'signup',
						obj: 'ApplicationsCtrl'
					});
					res.status(400).send(err);
				});
			} else {
				var signupData = req.body;
				signupData.application = foundApp._id;
				foundApp.signup(signupData).then(function (signupRes) {
					logger.log({
						description: 'Signup to application successful.',
						res: signupRes, appName: req.params.name,
						body: req.body, func: 'signup', obj: 'ApplicationsCtrl'
					});
					res.send(signupRes);
				}, function (err) {
					if (err && err.status == 'EXISTS') {
						logger.error({
							description: 'Account with matching credentials already exists.',
							error: err, appName: req.params.name,
							func: 'signup', obj: 'ApplicationsCtrl'
						});
						res.status(400).send(err.message || 'Account with matching credentials already exists.');
					} else {
						//TODO: Handle wrong password
						logger.error({
							description: 'Error signing up to application.',
							error: err, appName: req.params.name,
							body: req.body, func: 'signup',
							obj: 'ApplicationsCtrl'
						});
						res.status(400).send(err.message || 'Error signing up.');
					}
				});
			}
		}, function (err) {
			logger.error({
				description: 'Error finding application.',
				error: err, appName: req.params.name,
				body: req.body, func: 'signup',
				obj: 'ApplicationsCtrl'
			});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.error({
			description: 'Application name is required to signup.',
			func: 'signup', obj: 'ApplicationsCtrl'
		});
		res.status(400).send('Application name is required to signup.');
	}
};
/**
 * @api {put} /verify Verify
 * @apiDescription Verify token and get matching account's data.
 * @apiName Verify
 * @apiGroup Auth
 *
 * @apiSuccess {Object} accountData Object containing accounts data.
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
exports.verify = function (req, res, next) {
	//TODO:Actually verify account instead of just returning account data
	//TODO: Get applicaiton and verify that user exists within applicaiton
	console.log('verify request:', req.user);
	var query;
	if (req.user) {
		//Find by username in token
		if (_.has(req.user, "username")) {
			query = Account.findOne({ username: req.user.username }).select('username email sessionId');
		}
		//Find by username in token
		else {
				query = Account.findOne({ email: req.user.email }).select('username email sessionId');
			}
		query.exec(function (err, result) {
			// console.log('verify returned:', result, err);
			if (err) {
				logger.error({ description: 'Error querying for account', error: err, func: 'verify', obj: 'ApplicationsCtrl' });
				return res.status(500).send('Unable to verify token.');
			}
			if (!result) {
				//Matching account already exists
				// TODO: Respond with a specific error code
				logger.error({ description: 'Error querying for account', error: err, func: 'verify', obj: 'ApplicationsCtrl' });
				return res.status(400).send('Account with this information does not exist.');
			}
			res.json(result);
		});
	} else if (_.has(req, 'body') && _.has(req.body, 'token')) {
		//TODO: Handle invalidating token within body.
		logger.error({ description: 'Logout token within body instead of header.', func: 'verify', obj: 'ApplicationsCtrl' });
		res.status(401).json({ status: 401, message: 'Valid Auth token required to verify' });
	} else {
		logger.log('Invalid auth token');
		res.status(401).json({ status: 401, message: 'Valid Auth token required to verify' });
	}
};
/**
 * @api {get} /applications/:appName/groups/:groupName Group(s)
 * @apiDescription Get an applications group(s)
 * @apiName groups
 * @apiGroup Application
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       name:"admins",
 *       accounts:[{username:"superuserguy", email: "test@test.com"}],
 *     }]
 * @apiErrorExample  Error-Response (Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Group does not exist."
 *     }
 *
 *
 */
exports.groups = function (req, res, next) {
	logger.log({ description: 'App get group(s) request called.', appName: req.params.name, body: req.body, func: 'groups' });
	if (req.params.name && req.body) {
		//Get data for a specific application
		findApplication(req.params.name).then(function (foundApp) {
			//Check application's groups
			if (!req.params.groupName) {
				logger.info({ description: "Application's groups found.", foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl' });
				res.send(foundApp.groups);
			} else {
				var group = _.findWhere(foundApp.groups, { name: req.params.groupName });
				if (group) {
					logger.info({ description: "Application group found.", group: group, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl' });
					res.send(group);
				} else {
					//Check for application's auth rocket data
					if (foundApp.authRocket) {
						authRocket.Orgs().get().then(function (groupsRes) {
							logger.log({
								description: 'Orgs loaded from authrocket.',
								response: groupsRes, func: 'groups',
								obj: 'ApplicationsCtrl'
							});
							res.send(groupsRes);
						}, function (err) {
							logger.error({
								description: 'Error gettings orgs from AuthRocket.',
								error: err, func: 'groups', obj: 'ApplicationsCtrl'
							});
							res.status(400).send(err);
						});
					} else {
						//Group has not been added to application
						var query = Group.findOne({ name: req.params.groupName, application: foundApp._id });
						query.then(function (groupWithoutApp) {
							if (!groupWithoutApp) {
								logger.error({ description: 'Group not found.', group: groupWithoutApp, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl' });
								res.status(400).send('Group not found.');
							} else {
								logger.log({ description: 'Group found, but not within application. Adding to application.', group: groupWithoutApp, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl' });
								foundApp.addGroup(groupWithoutApp).then(function (newGroup) {
									logger.info({ description: 'Existing group added to applicaiton.', group: groupWithoutApp, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl' });
									res.send(groupWithoutApp);
								}, function (err) {
									res.status(500).send('Error adding existing group to application.');
								});
							}
						}, function (err) {
							logger.error({ description: 'Error finding group.', error: err, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl' });
							res.status(500).send('Error finding group.');
						});
					}
				}
			}
		}, function (err) {
			logger.error({ description: 'Error finding application.', error: err, func: 'groups', obj: 'ApplicationsCtrl' });
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({ description: 'Application name is required to get application.', error: err, func: 'groups', obj: 'ApplicationsCtrl' });
		res.status(400).send('Application name is required.');
	}
};
/**
 * @api {post} /applications/:name/groups  addGroup
 * @apiDescription Add group
 * @apiName addGroup
 * @apiGroup Application
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       name:"admins",
 *       accounts:[{username:"superuserguy", email: "test@test.com"}],
 *     }]
 * @apiErrorExample  Error-Response (Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Group already exists"
 *     }
 *
 *
 */
exports.addGroup = function (req, res, next) {
	logger.log({
		description: 'App add group request.',
		name: req.params.name, body: req.body,
		func: 'addGroup', obj: 'ApplicationsCtrls'
	});
	if (req.params.name && req.body) {
		//Get data for a specific application
		findApplication(req.params.name).then(function (foundApp) {
			logger.log({
				description: 'Application found. Adding group.',
				app: foundApp, func: 'addGroup', obj: 'ApplicationsCtrls'
			});
			foundApp.addGroup(req.body).then(function (newGroup) {
				logger.info({
					description: 'Group added to applicaiton successfully.',
					newGroup: newGroup, func: 'addGroup', obj: 'ApplicationsCtrls'
				});
				res.send(newGroup);
			}, function (err) {
				//TODO: Handle wrong password
				logger.error({
					description: 'Error adding group to application.',
					error: err, func: 'addGroup', obj: 'ApplicationsCtrls'
				});
				res.status(400).send('Error adding group.');
			});
		}, function (err) {
			logger.error({ description: 'Error find application.', error: err, func: 'addGroup', obj: 'ApplicationsCtrls' });
			//TODO: Handle other errors
			res.status(400).send('Error finding application.');
		});
	} else {
		res.status(400).send('Application name is required.');
	}
};
/**
 * @api {put} /applications/:name/groups  updateGroup
 * @apiDescription Update a group
 * @apiName updateGroup
 * @apiGroup Application
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       name:"admins",
 *       accounts:[{username:"superuserguy", email: "test@test.com"}],
 *     }]
 * @apiErrorExample  Error-Response (Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Error updating group."
 *     }
 *
 *
 */
exports.updateGroup = function (req, res, next) {
	logger.log({ description: "Update application's group called.", appName: req.params.name, body: req.body, func: 'updateGroup', obj: 'ApplicationsCtrl' });
	if (req.params.name) {
		//Get data for a specific application
		findApplication(req.params.name).then(function (foundApp) {
			//Update is called with null or empty value
			logger.log({ description: 'Application found.', foundApp: foundApp, func: 'updateGroup', obj: 'ApplicationsCtrl' });
			if (!_.keys(req.body) || _.keys(req.body).length < 1 || req.body == {} || req.body == null || !req.body) {
				logger.log({ description: 'Update group with null, will be handled as delete.', func: 'updateGroup', obj: 'ApplicationsCtrl' });
				//Delete group
				foundApp.deleteGroup({ name: req.params.groupName }).then(function (updatedGroup) {
					logger.info({ description: 'Application group deleted successfully.', updatedGroup: updatedGroup, func: 'updateGroup', obj: 'ApplicationsCtrl' });
					res.send(updatedGroup);
				}, function (err) {
					//TODO: Handle wrong password
					logger.error({ description: 'Error deleting application group.', error: err, func: 'updateGroup', obj: 'ApplicationsCtrl' });
					if (err && err.status && err.status == 'NOT_FOUND') {
						res.status(400).send(err.message || 'Error deleting group.');
					} else {
						res.status(500).send('Error deleting group.');
					}
				});
			} else {
				logger.log({ description: 'Provided data is valid. Updating application group.', foundApp: foundApp, updateData: req.body, func: 'updateGroup', obj: 'ApplicationsCtrl' });
				var updateData = _.extend({}, req.body);
				updateData.name = req.params.groupName;
				if (_.has(updateData, 'accounts')) {}
				//TODO: Compare to foundApps current accounts
				//TODO: Handle account usernames array

				//Update group
				foundApp.updateGroup(updateData).then(function (updatedGroup) {
					logger.info({ description: 'Application group updated successfully.', updatedGroup: updatedGroup, func: 'updateGroup', obj: 'ApplicationsCtrl' });
					res.send(updatedGroup);
				}, function (err) {
					//TODO: Handle wrong password
					logger.error({ description: 'Error updating application group.', error: err, func: 'updateGroup', obj: 'ApplicationsCtrl' });
					res.status(400).send("Error updating application's group.");
				});
			}
		}, function (err) {
			logger.error({ description: 'Error finding application.', error: err, func: 'updateGroup', obj: 'ApplicationsCtrl' });
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({ description: 'Application name is required to update group.', func: 'updateGroup', obj: 'ApplicationsCtrl' });
		res.status(400).send('Application name is required to update application group.');
	}
};
/**
 * @api {put} /applications/:name/groups  deleteGroup
 * @apiDescription Update a group
 * @apiName deleteGroup
 * @apiGroup Application
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
 *       "message":"Account already exists."
 *     }
 *
 *
 */
exports.deleteGroup = function (req, res, next) {
	logger.log('App add group request with app name: ' + req.params.name + ' with body:', req.body);
	if (req.params.name && req.body) {
		//Get data for a specific application
		findApplication(req.params.name).then(function (foundApp) {
			foundApp.deleteGroup(req.body).then(function () {
				logger.info({ description: 'Group deleted successfully.', func: 'deleteGroup', obj: 'ApplicationsCtrl' });
				//TODO: Return something other than this message
				res.send('Group deleted successfully.');
			}, function (err) {
				//TODO: Handle wrong password
				logger.error({ description: 'Error deleting group.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl' });
				res.status(400).send('Error deleting group.');
			});
		}, function (err) {
			logger.error({ description: 'Error finding application.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl' });
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({ description: 'Application name is required to delete application group.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl' });
		res.status(400).send('Application name is required to delete application group.');
	}
};
/**
 * @api {get} /applications/:appName/directories/:groupName Directory/Directories
 * @apiDescription Get an applications directory/directories
 * @apiName directories
 * @apiGroup Application
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       name:"admins",
 *       accounts:[{username:"superuserguy", email: "test@test.com"}],
 *     }]
 * @apiErrorExample  Error-Response (Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Group does not exist."
 *     }
 *
 *
 */
exports.directories = function (req, res, next) {
	if (req.params.name) {
		//Get data for a specific application
		logger.log({ description: 'App get application directory/directories request called.', appName: req.params.name, body: req.body, func: 'directories', obj: 'ApplicationsCtrl' });
		findApplication(req.params.name).then(function (foundApp) {
			if (!req.params.directoryName) {
				logger.info({ description: "Application's directories found.", foundApp: foundApp, func: 'directories', obj: 'ApplicationsCtrl' });
				res.send(foundApp.directories);
			} else {
				var directory = _.findWhere(foundApp.directories, { name: req.params.directoryName });
				logger.info({ description: "Application's directory found.", directory: directory, foundApp: foundApp, func: 'directories', obj: 'ApplicationsCtrl' });
				res.send(directory);
			}
		}, function (err) {
			logger.error({ description: 'Error finding application.', error: err, func: 'directories', obj: 'ApplicationsCtrl' });
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({ description: 'Application name is required to get application.', error: err, func: 'directories', obj: 'ApplicationsCtrl' });
		res.status(400).send('Application name is required.');
	}
};
/**
 * @api {post} /applications/:name/directories  addGroup
 * @apiDescription Add group
 * @apiName addGroup
 * @apiGroup Application
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       name:"admins",
 *       accounts:[{username:"superuserguy", email: "test@test.com"}],
 *     }]
 * @apiErrorExample  Error-Response (Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Group already exists"
 *     }
 *
 *
 */
exports.addDirectory = function (req, res, next) {
	logger.log({ description: 'Add directory to application called.', appName: req.params.name, body: req.body, func: 'addDirectory', obj: 'ApplicationsCtrl' });
	if (req.params.name && req.body) {
		//Get data for a specific application
		findApplication(req.params.name).then(function (foundApp) {
			foundApp.addDirectory(req.body).then(function (newGroup) {
				logger.info({ description: 'Directory added to application successfully.', newDirectory: newDirectory, func: 'addDirectory', obj: 'ApplicationsCtrl' });
				res.send(newGroup);
			}, function (err) {
				//TODO: Handle wrong password
				logger.error({ description: 'Error adding directory to application.', error: err, func: 'addDirectory', obj: 'ApplicationsCtrl' });
				res.status(400).send('Error adding directory to application.');
			});
		}, function (err) {
			logger.error({ description: 'Error finding application.', error: err, func: 'addDirectory', obj: 'ApplicationsCtrl' });
			//TODO: Handle other errors
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({ description: 'Application name is requred to add directory.', body: req.body, func: 'addDirectory', obj: 'ApplicationsCtrl' });
		res.status(400).send('Application name is required.');
	}
};
/**
 * @api {put} /applications/:name/directories  updateDirectory
 * @apiDescription Update a directory
 * @apiName updateDirectory
 * @apiGroup Application
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       name:"admins",
 *       accounts:[{username:"superuserguy", email: "test@test.com"}],
 *     }]
 * @apiErrorExample  Error-Response (Exists):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message":"Error updating group."
 *     }
 *
 *
 */
exports.updateDirectory = function (req, res, next) {
	if (req.params.name && req.body) {
		//Get data for a specific application
		logger.log({ description: "Update application's directory called.", appName: req.params.name, body: req.body, func: 'updateDirectory', obj: 'ApplicationsCtrl' });
		findApplication(req.params.name).then(function (foundApp) {
			foundApp.updateDirectory(req.body).then(function (updatedDirectory) {
				logger.info({ description: 'Application directory updated successfully.', updatedDirectory: updatedDirectory, func: 'updateDirectory', obj: 'ApplicationsCtrl' });
				res.send(updatedDirectory);
			}, function (err) {
				//TODO: Handle wrong password
				logger.error({ description: 'Error updating application directory.', error: err, func: 'updateDirectory', obj: 'ApplicationsCtrl' });
				res.status(400).send("Error updating application's directory.");
			});
		}, function (err) {
			logger.error({ description: 'Error finding application.', error: err, func: 'updateDirectory', obj: 'ApplicationsCtrl' });
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({ description: 'Application name is required to update directory.', func: 'updateDirectory', obj: 'ApplicationsCtrl' });
		res.status(400).send('Application name is required to update application directory.');
	}
};
/**
 * @api {put} /applications/:name/directories  deleteGroup
 * @apiDescription Update a group
 * @apiName deleteGroup
 * @apiGroup Application
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
 *       "message":"Account already exists."
 *     }
 *
 *
 */
exports.deleteDirectory = function (req, res, next) {
	if (req.params.name && req.body) {
		//Get data for a specific application
		logger.info({ description: 'Application directory delete requested.', appName: req.params.name, body: req.body, func: 'deleteDirectory', obj: 'ApplicationsCtrl' });
		findApplication(req.params.name).then(function (foundApp) {
			foundApp.deleteDirectory(req.body.password).then(function () {
				logger.info({ description: 'Directory deleted successfully.', func: 'deleteDirectory', obj: 'ApplicationsCtrl' });
				//TODO: Return something other than this message
				res.send('Directory deleted successfully.');
			}, function (err) {
				//TODO: Handle wrong password
				logger.error({ description: 'Error deleting directory from application.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl' });
				res.status(400).send('Error deleting directory from application.');
			});
		}, function (err) {
			logger.error({ description: 'Error finding application.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl' });
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({ description: 'Application name is required to delete application directory.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl' });
		res.status(400).send('Application name is required to delete application directory.');
	}
};
// Utility  => s
//Wrap finding application in a promise that handles errors
//TODO: Allow choosing populate settings
function findApplication(appName) {
	if (!appName) {
		logger.error({
			description: 'Application name is required to find application.',
			error: err, func: 'findApplication'
		});
		Promise.reject({ message: 'Application name required to find application.' });
	} else {
		var query = Application.findOne({ name: appName }).populate({ path: 'owner', select: 'username name email' }).populate({ path: 'groups', select: 'name accounts' }).populate({ path: 'directories', select: 'name accounts groups' });
		return query.then(function (foundApp) {
			if (!foundApp) {
				logger.error({
					description: 'Application not found',
					func: 'findApplication'
				});
				return Promise.reject({ message: 'Application not found' });
			} else {
				logger.log({
					description: 'Application found.',
					foundApp: foundApp, func: 'findApplication'
				});
				return foundApp;
			}
		}, function (err) {
			logger.error({
				description: 'Error finding application.',
				error: err, func: 'findApplication'
			});
			return Promise.reject({ message: 'Error finding application.' });
		});
	}
}