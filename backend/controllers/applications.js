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

var _ = require('lodash');
var logger = require('../utils/logger');
var Application = require('../models/application').Application;
var Account = require('../models/account').Account;
var Group = require('../models/group').Group;

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
exports.get = (req, res, next) => {
	var isList = true;
	var query = Application.find({}).populate({path:'owner', select:'username name title email'});
	if(req.params.name){ //Get data for a specific application
		logger.log('application request with id:', req.params.name);
		query = Application.findOne({name:req.params.name})
		.populate({path:'owner', select:'username name title email'})
		.populate({path:'groups', select:'name accounts'})
		.populate({path:'directories', select:'name accounts groups'});
		isList = false;
	}
	query.then((result) => {
		if(!result){
			logger.error({description: 'Error finding Application(s).'});
			return res.status(400).send('Application(s) could not be found.');
		}
		logger.log({description: 'Application(s) found.', result: result, func: 'get', obj: 'ApplicationsCtrls'});
		res.send(result);
	}, (err) => {
		logger.error({description: 'Error getting application(s):', error: err, func: 'get', obj: 'ApplicationsCtrls'});
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
exports.getProviders = (req, res, next) => {
	// var query = Application.find({}).populate({path:'owner', select:'username name title email'});
	if(req.params.name){ //Get data for a specific application
		logger.log({description: 'Get Providers request.', params: req.params, func: 'getProviders', obj: 'ApplicationsCtrls'});
		var query = Application.findOne({name:req.params.name});
		query.then((result) => {
			if(!result){
				logger.error('[ApplicationsCtrl.get()] Error finding application(s).');
				return res.status(400).send('Application(s) could not be found.');
			}
			var providerData = {};
			_.each(result.providers, (provider) => {
				providerData[provider.name] = provider.clientId;
			});
			logger.log({description: 'Provider data found.', providerData: providerData, func: 'getProviders', obj: 'ApplicationsCtrls'});
			res.send(providerData);
		}, (err) => {
			logger.error({description: 'Error getting application(s).', error: err, func: 'getProviders', obj: 'ApplicationsCtrls'});
			res.status(500).send('Error getting Application(s).');
		});
	} else {
		logger.info({description: 'Application name required to get providers.', func: 'getProviders', obj: 'ApplicationsCtrls'});
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
exports.add = (req, res, next) => {
	//Query for existing application with same _id
	if(!_.has(req.body, "name")){
		logger.error({description:'Application name required to create a new app.', name: req.body.name, body: req.body, func: 'add', obj: 'ApplicationsCtrl'});
		res.status(400).send("Name is required to create a new app");
	} else {
		logger.log({description:'Applications add called with name.', name: req.body.name, body: req.body, func: 'add', obj: 'ApplicationsCtrl'});
		var appData = _.extend({}, req.body);
		var appName = req.body.name;
		if(!_.has(appData, 'owner')){
			logger.log({description: 'No owner data provided. Using account.', account: req.user, func: 'add', obj: 'ApplicationsCtrl'});
			if(_.has(req, 'userId')){
				appData.owner = req.userId;
			} else if (_.has(req, 'id')) {
				appData.owner = req.userId;
			}
		}
		findApplication(appName).then((foundApp) => {
			logger.error({description: 'Application with this name already exists.', foundApp: foundApp, func: 'add', obj: 'ApplicationsCtrl'});
			res.status(400).send('Application with this name already exists.');
		}, (err) => {
			if(err && err.status == 'EXISTS'){
				res.status(400).send('Application with this name already exists.');
			} else {
				logger.log({description: 'Application does not already exist.', func: 'add', obj: 'Application'});
				//application does not already exist
				var application = new Application(appData);
				logger.log({description: 'Calling create with storage.', appData: appData, func: 'add', obj: 'Application'});
				//Create with template if one is provided
				if(_.has(req.body,'template')){
					//Template name was provided
					application.createWithTemplate(req.body.template).then( (newApp) => {
						logger.log({description: 'Application created with template.', newApp: newApp, func: 'add', obj: 'Application'});
						res.json(newApp);
					}, (err) => {
						logger.error({description: 'Error creating application.', error: err, func: 'add', obj: 'Application'});
						res.status(400).send('Error creating application.');
					});
				} else {
					//Template parameter was not provided
					application.createWithStorage(req.body).then( (newApp) => {
						logger.log({description: 'Application created with storage.', newApp: newApp, func: 'add', obj: 'Application'});
						res.json(newApp);
					},  (err) => {
						//TODO: Handle different errors here
						logger.error({description: 'Error creating new application with storage.', error: err, func: 'add', obj: 'ApplicationsCtrl'});
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
exports.update = (req, res, next) => {
	logger.log({description: 'App update request.', params: req.params});
	if(req.params.name){
		Application.update({name:req.params.name}, req.body, {upsert:false},  (err, numberAffected, result)  => {
			if(err){
				logger.error('[ApplicationsCtrl.update()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error updating Application.');
			}
			//TODO: respond with updated data instead of passing through req.body
			logger.log('Application update successful. Num affected:', numberAffected);
			if(numberAffected.nModified == 0 || numberAffected.n == 0){
				//TODO: Handle Application not found
				res.status(400).send({message:'Application not found'});
			} else {
				res.json(req.body);
			}
		});
	} else {
		res.status(400).send({message:'Application id required'});
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
exports.delete = (req, res, next) => {
	var query = Application.findOneAndRemove({'name':req.params.name}); // find and delete using id field
	query.then((result) => {
		if(result){
			var app = new Application(result);
			app.removeStorage().then(() => {
				logger.log({description: 'Application storage deleted successfully.', func: 'delete', obj: 'ApplicationsCtrl'});
				res.json(result);
			}, (err) => {
				logger.error({description: 'Error removing storage from application.', error: err, func: 'delete', obj: 'ApplicationsCtrl'});
				res.status(400).send(err);
			});
		} else {
			logger.error({description: 'Application not found.', error: err, func: 'delete', obj: 'ApplicationsCtrl'});
			res.status(400).send('Application could not be found.');
		}
	}, (err) => {
		logger.error({description: 'Error getting application.', error: err, func: 'delete', obj: 'ApplicationsCtrl'});
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
exports.files = (req, res, next) => {
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if(req.params.name){ //Get data for a specific application
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.then((foundApp) => {
			if(foundApp){
				foundApp.getStructure().then( (appFiles) => {
					logger.log({description: 'Get structure returned.', structure: appFiles, func: 'files', obj: 'ApplicationsCtrls'});
					res.send(appFiles);
				},  (err) => {
					logger.error({description: 'Error getting application file structure.', error: err, func: 'files', obj: 'ApplicationsCtrls'});
					res.status(400).send('Error getting Application files.');
				});
			} else {
				logger.error({description: 'Application could not be found.', func: 'files', obj: 'ApplicationsCtrls'});
				res.status(400).send('Application could not be found.');
			}
		}, (err) => {
			logger.error({description: 'Error getting application:', error: err, func: 'files', obj: 'ApplicationsCtrls'});
			return res.status(500).send('Error getting Application files.');
		});
	} else {
		logger.info({description: 'Application name is required to get files list.', func: 'files', obj: 'ApplicationsCtrls'});
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
exports.publishFile = (req, res, next) => {
	logger.info({description: 'File publish request.', func: 'publishFile', params: req.params, obj: 'ApplicationsCtrls'});
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if(req.params.name){ //Get data for a specific application
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		isList = false;
		query.then((foundApp) => {
			if(foundApp){
				foundApp.publishFile({content:req.body.content, key:req.body.key, contentType:req.body.contentType}).then( (result) => {
					logger.info({description: 'File published successfully.', func: 'publishFile', result: result, obj: 'ApplicationsCtrls'});
					res.send(result);
				}, (err) => {
					logger.log('Error publishing file:', err);
					res.status(400).send(err);
				});
			} else {
				logger.error({description: 'Error finding application.', func: 'publishFile', params: req.params, obj: 'ApplicationsCtrls'});
				res.status(400).send('Application could not be found.');
			}
		}, (err) => {
			logger.error({description: 'Error finding application.', params: req.params, error: err,  func: 'publishFile', obj: 'ApplicationsCtrls'});
			res.status(500).send('Error publishing file to Application.');
		});
	} else {
		logger.error({description: 'Application name and file data are required to publish a file.', params: req.params,  func: 'publishFile', obj: 'ApplicationsCtrls'});
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
exports.applyTemplate = (req, res, next) => {
	logger.log('apply template request with app name: ' + req.params.name + ' with body:', req.body);
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if(req.params.name){ //Get data for a specific application
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.exec( (err, foundApp) => {
			if(err) {
				logger.error('[ApplicationsCtrl.applyTemplate()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error applying template to Application.');
			}
			if(!foundApp){
				logger.error({description: 'Error finding application'});
				return res.status(400).send('Application could not be found.');
			}
			//TODO: Get url from found app, and get localDir from
			foundApp.applyTemplate(req.body.name).then( (webUrl) => {
				logger.log('Template applied to bucket successfully');
				res.send(webUrl);
			},  (err) => {
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
exports.addStorage = (req, res, next) => {
	logger.log('add storage request with app name: ' + req.params.name + ' with body:', req.body);
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile =>
	if(req.params.name){ //Get data for a specific application
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.exec( (err, foundApp) => {
			if(err) {
				logger.error('[ApplicationsCtrl.addStorage()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error adding storage to application.');
			}
			if(!foundApp){
				logger.error('[ApplicationsCtrl.addStorage()] Error finding application.');
				return res.status(400).send('Application could not be found');
			}
			//TODO: Get url from found app, and get localDir from
			foundApp.createStorage().then( (webUrl) => {
				logger.log('Added storage to application successfully:', webUrl);
				res.send(webUrl);
			},  (err) => {
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
exports.addCollaborators = (req, res, next) => {
	logger.log('add storage request with app name: ' + req.params.name + ' with body:', req.body);
	//TODO: Check that account is allowed to add collaborators
	if(req.params.name && req.body.accounts){ //Get data for a specific application
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.exec( (err, foundApp) => {
			if(err) {
				logger.error('[ApplicationsCtrl.addCollaborators()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error adding collaborators to application.');
			}
			if(!foundApp){
				logger.error('[ApplicationsCtrl.addCollaborators()] Error finding application:');
				return res.status(400).send('Application could not be found');
			}
			foundApp.addCollaborators(req.body.accounts).then( (appWithCollabs) => {
				logger.log('Added storage to application successfully:', appWithCollabs);
				res.send(appWithCollabs);
			},  (err) => {
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
exports.login = (req, res, next) => {
	logger.log('App Login request with app name: ' + req.params.name + ' with body:', req.body);
	if(req.params.name && req.body && _.has(req.body, 'username') && _.has(req.body, 'password')){ //Get data for a specific application
		var loginData = {username:req.body.username, password:req.body.password};
		findApplication(req.params.name).then( (foundApp) => {
			logger.log({description: 'Application found successfully.', foundApp: foundApp, func: 'logout', obj: 'ApplicationCtrl'});
			//Use authrocket login if application has authRocket data
			if (foundApp.authRocket) {
				foundApp.authRocketLogin(loginData).then((loginRes) => {
					logger.log({description: 'Login through application auth rocket successful.', response: loginRes, func: 'login', obj: 'ApplicationsCtrl'});
					res.send(loginRes);
				},  (err) => {
					logger.error({description: 'Error logging in through application authRocket.', error: err, func: 'login', obj: 'ApplicationsCtrl'});
					res.status(400).send(err);
				});
			} else {
				foundApp.login(loginData).then( (loginRes) => {
					logger.log({description: 'Login Successful.', response: loginRes, func: 'login', obj: 'ApplicationsCtrl'});
					res.send(loginRes);
				},  (err) => {
					//TODO: Handle wrong password
					logger.error({description: 'Error logging in.', error: err, func: 'login', obj: 'ApplicationsCtrl'});
					res.status(400).send('Login Error.');
				});
			}
		},  (err) => {
			logger.error('Error:', err);
			res.status(400).send('Application not found.');
		});
	} else {
		res.status(400).send('Application name and accounts array are required to add collaborators.');
	}
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
exports.logout = (req, res, next) => {
	logger.log('App Login request with app name: ' + req.params.name + ' with body:', req.body);
	var userData;
	if(req.user){
		userData = req.user;
	}
	if(req.body.token){
		userData = {token: req.body.token};
	}
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then( (foundApp) => {
			logger.log({description: 'Application found successfully.', foundApp: foundApp, func: 'logout', obj: 'ApplicationCtrl'});
			if(foundApp.authRocket){
				foundApp.authRocketLogout(userData).then( () => {
					logger.log({description: 'Logout successful.', func: 'logout', obj: 'ApplicationCtrl'});
					res.send('Logout successful.');
				},  (err) => {
					logger.error({description: 'Error finding application.', error: err, func: 'logout', obj: 'ApplicationCtrl'});
					res.status(400).send(err);
				});
			} else {
				foundApp.logout(userData).then( () => {
					logger.log({description: 'Logout successful.', func: 'logout', obj: 'ApplicationCtrl'});
					res.send('Logout successful.');
				},  (err) => {
					logger.error({description: 'Error finding application.', error: err, func: 'logout', obj: 'ApplicationCtrl'});
					res.status(400).send('Error logging out.');
				});
			}
		},  (err) => {
			logger.error({description: 'Error finding application.', error: err, func: 'logout', obj: 'ApplicationCtrl'});
			res.status(400).send('Application not found.');
		});
	} else {
		res.status(400).send('Application name and accounts array are required to add collaborators.');
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
exports.signup = (req, res, next) => {
	logger.log({description: 'App signup request with app name.', appName: req.params.name, body: req.body, func: 'signup', obj: 'ApplicationsCtrl'});
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then( (foundApp) => {
			if(foundApp.authRocket){
				foundApp.authRocketSignup(req.body).then( (signupRes) => {
					logger.log({description: 'Signup to application successful.', res: signupRes, appName: req.params.name, body: req.body, func: 'signup', obj: 'ApplicationsCtrl'});
					res.send(signupRes);
				},  (err) => {
					logger.error({description: 'Error signing up to application.', error: err, appName: req.params.name, body: req.body, func: 'signup', obj: 'ApplicationsCtrl'});
					res.status(400).send(err);
				});
			} else {
				foundApp.signup(req.body).then( (signupRes) => {
					logger.log({description: 'Signup to application successful.', res: signupRes, appName: req.params.name, body: req.body, func: 'signup', obj: 'ApplicationsCtrl'});
					res.send(signupRes);
				},  (err) => {
					if(err && err.status == 'EXISTS'){
						res.status(400).send('Account with this username already exists in application.');
					} else {
						//TODO: Handle wrong password
						logger.error({description: 'Error signing up to application.', error: err, appName: req.params.name, body: req.body, func: 'signup', obj: 'ApplicationsCtrl'});
						res.status(400).send('Error signing up.');
					}
				});
			}
		},  (err) => {
			logger.error({description: 'Error finding application.', error: err, appName: req.params.name, body: req.body, func: 'signup', obj: 'ApplicationsCtrl'});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.error({description: 'Application name is required to signup.', func: 'signup', obj: 'ApplicationsCtrl'});
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
exports.verify = (req, res, next) => {
	//TODO:Actually verify account instead of just returning account data
	//TODO: Get applicaiton and verify that user exists within applicaiton
	console.log('verify request:', req.user);
	var query;
	if(req.user){
		//Find by username in token
		if(_.has(req.user, "username")){
			query = Account.findOne({username:req.user.username}).select('username email sessionId');
		}
		//Find by username in token
		else {
			query = Account.findOne({email:req.user.email}).select('username email sessionId');
		}
		query.exec( (err, result) => {
			// console.log('verify returned:', result, err);
			if (err) {
				logger.error({description:'Error querying for account', error: err, func: 'verify', obj: 'ApplicationsCtrl'});
				return res.status(500).send('Unable to verify token.');
			}
			if(!result){ //Matching account already exists
				// TODO: Respond with a specific error code
				logger.error({description:'Error querying for account', error: err, func: 'verify', obj: 'ApplicationsCtrl'});
				return res.status(400).send('Account with this information does not exist.');
			}
			res.json(result);
		});
	} else if(_.has(req, 'body') && _.has(req.body, 'token')) {
		//TODO: Handle invalidating token within body.
		logger.error({description:'Logout token within body instead of header.', func: 'verify', obj: 'ApplicationsCtrl'});
		res.status(401).json({status:401, message:'Valid Auth token required to verify'});
	} else {
		logger.log('Invalid auth token');
		res.status(401).json({status:401, message:'Valid Auth token required to verify'});
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
exports.groups = (req, res, next) => {
	logger.log({description: 'App get group(s) request called.', appName: req.params.name, body: req.body, func: 'groups'});
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then( (foundApp) => {
			//Check application's groups
			if(!req.params.groupName){
				logger.info({description: "Application's groups found.", foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl'});
				res.send(foundApp.groups);
			} else {
				var group = _.findWhere(foundApp.groups, {name: req.params.groupName});
				if(group){
					logger.info({description: "Application group found.", group: group, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl'});
					res.send(group);
				} else {
					//Group has not been added to application
					var query = Group.findOne({name: req.params.groupName, application: foundApp._id});
					query.exec( (err, groupWithoutApp) => {
						if(err){
							logger.error({description: 'Error finding group.', error: err, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl'});
							res.status(500).send('Error finding group.');
						} else if(!groupWithoutApp){
							logger.error({description: 'Group not found.', group: groupWithoutApp, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl'});
							res.status(400).send('Group not found.');
						} else {
							logger.log({description: 'Group found, but not within application. Adding to application.', group: groupWithoutApp, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl'});
							foundApp.addGroup(groupWithoutApp).then( (newGroup) => {
								logger.info({description: 'Existing group added to applicaiton.', group: groupWithoutApp, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl'});
								res.send(groupWithoutApp);
							}, (err) => {
								res.status(500).send('Error adding existing group to application.');
							});
						}
					});
				}
			}
		},  (err) => {
			logger.error({description: 'Error finding application.', error: err, func: 'groups', obj: 'ApplicationsCtrl'});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({description: 'Application name is required to get application.', error: err, func: 'groups', obj: 'ApplicationsCtrl'});
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
exports.addGroup = (req, res, next) => {
	logger.log({description: 'App add group request.', name: req.params.name, body: req.body, func: 'addGroup', obj: 'ApplicationsCtrls'});
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then( (foundApp) => {
			logger.log({description: 'Application found. Adding group.', app: foundApp, func: 'addGroup', obj: 'ApplicationsCtrls'});
			foundApp.addGroup(req.body).then( (newGroup) => {
				logger.info({description: 'Group added to applicaiton successfully.', newGroup: newGroup, func: 'addGroup', obj: 'ApplicationsCtrls'});
				res.send(newGroup);
			},  (err) => {
				//TODO: Handle wrong password
				logger.error({description: 'Error adding group to application.', error: err, func: 'addGroup', obj: 'ApplicationsCtrls'});
				res.status(400).send('Error adding group.');
			});
		},  (err) => {
			logger.error({description: 'Error find application.', error: err, func: 'addGroup', obj: 'ApplicationsCtrls'});
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
exports.updateGroup = (req, res, next) => {
	logger.log({description: "Update application's group called.", appName: req.params.name, body: req.body, func: 'updateGroup', obj: 'ApplicationsCtrl'});
	if(req.params.name){ //Get data for a specific application
		findApplication(req.params.name).then( (foundApp) => {
			//Update is called with null or empty value
			logger.log({description: 'Application found.', foundApp: foundApp, func: 'updateGroup', obj: 'ApplicationsCtrl'});
			if(!_.keys(req.body) || _.keys(req.body).length < 1 || req.body == {} || req.body == null || !req.body){
				logger.log({description: 'Update group with null, will be handled as delete.', func: 'updateGroup', obj: 'ApplicationsCtrl'});
				//Delete group
				foundApp.deleteGroup({name: req.params.groupName}).then( (updatedGroup) => {
					logger.info({description: 'Application group deleted successfully.', updatedGroup: updatedGroup, func: 'updateGroup', obj: 'ApplicationsCtrl'});
					res.send(updatedGroup);
				},  (err) => {
					//TODO: Handle wrong password
					logger.error({description: 'Error deleting application group.', error: err, func: 'updateGroup', obj: 'ApplicationsCtrl'});
					if(err && err.status && err.status == 'NOT_FOUND'){
						res.status(400).send(err.message || 'Error deleting group.');
					} else {
						res.status(500).send('Error deleting group.');
					}
				});
			} else {
				logger.log({description: 'Provided data is valid. Updating application group.', foundApp: foundApp, updateData: req.body, func: 'updateGroup', obj: 'ApplicationsCtrl'});
				var updateData = _.extend({}, req.body);
				updateData.name = req.params.groupName;
				if(_.has(updateData, 'accounts')){
					//TODO: Compare to foundApps current accounts
					//TODO: Handle account usernames array

				}
				//Update group
				foundApp.updateGroup(updateData).then( (updatedGroup) => {
					logger.info({description: 'Application group updated successfully.', updatedGroup: updatedGroup, func: 'updateGroup', obj: 'ApplicationsCtrl'});
					res.send(updatedGroup);
				},  (err) => {
					//TODO: Handle wrong password
					logger.error({description: 'Error updating application group.', error: err, func: 'updateGroup', obj: 'ApplicationsCtrl'});
					res.status(400).send("Error updating application's group.");
				});
			}

		},  (err) => {
			logger.error({description: 'Error finding application.', error: err, func: 'updateGroup', obj: 'ApplicationsCtrl'});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({description: 'Application name is required to update group.', func: 'updateGroup', obj: 'ApplicationsCtrl'});
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
exports.deleteGroup = (req, res, next) => {
	logger.log('App add group request with app name: ' + req.params.name + ' with body:', req.body);
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then( (foundApp) => {
			foundApp.deleteGroup(req.body).then( () => {
				logger.info({description: 'Group deleted successfully.', func: 'deleteGroup', obj: 'ApplicationsCtrl'});
				//TODO: Return something other than this message
				res.send('Group deleted successfully.');
			},  (err) => {
				//TODO: Handle wrong password
				logger.error({description: 'Error deleting group.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl'});
				res.status(400).send('Error deleting group.');
			});
		},  (err) => {
			logger.error({description: 'Error finding application.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl'});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({description: 'Application name is required to delete application group.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl'});
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
exports.directories = (req, res, next) => {
	if(req.params.name){ //Get data for a specific application
		logger.log({description: 'App get application directory/directories request called.', appName: req.params.name, body: req.body, func: 'directories', obj: 'ApplicationsCtrl'});
		findApplication(req.params.name).then( (foundApp) => {
			if(!req.params.directoryName){
				logger.info({description: "Application's directories found.", foundApp: foundApp, func: 'directories', obj: 'ApplicationsCtrl'});
				res.send(foundApp.directories);
			} else {
				var directory = _.findWhere(foundApp.directories, {name: req.params.directoryName});
				logger.info({description: "Application's directory found.", directory: directory, foundApp: foundApp, func: 'directories', obj: 'ApplicationsCtrl'});
				res.send(directory);
			}
		},  (err) => {
			logger.error({description: 'Error finding application.', error: err, func: 'directories', obj: 'ApplicationsCtrl'});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({description: 'Application name is required to get application.', error: err, func: 'directories', obj: 'ApplicationsCtrl'});
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
exports.addDirectory = (req, res, next) => {
	logger.log({description: 'Add directory to application called.', appName: req.params.name, body: req.body, func: 'addDirectory', obj: 'ApplicationsCtrl'});
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then( (foundApp) => {
			foundApp.addDirectory(req.body).then( (newGroup) => {
				logger.info({description: 'Directory added to application successfully.', newDirectory: newDirectory, func: 'addDirectory', obj: 'ApplicationsCtrl'});
				res.send(newGroup);
			},  (err) => {
				//TODO: Handle wrong password
				logger.error({description: 'Error adding directory to application.', error: err, func: 'addDirectory', obj: 'ApplicationsCtrl'});
				res.status(400).send('Error adding directory to application.');
			});
		},  (err) => {
			logger.error({description: 'Error finding application.', error: err, func: 'addDirectory', obj: 'ApplicationsCtrl'});
			//TODO: Handle other errors
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({description: 'Application name is requred to add directory.', body: req.body, func: 'addDirectory', obj: 'ApplicationsCtrl'});
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
exports.updateDirectory = (req, res, next) => {
	if(req.params.name && req.body){ //Get data for a specific application
		logger.log({description: "Update application's directory called.", appName: req.params.name, body: req.body, func: 'updateDirectory', obj: 'ApplicationsCtrl'});
		findApplication(req.params.name).then((foundApp) => {
			foundApp.updateDirectory(req.body).then((updatedDirectory) => {
				logger.info({description: 'Application directory updated successfully.', updatedDirectory: updatedDirectory, func: 'updateDirectory', obj: 'ApplicationsCtrl'});
				res.send(updatedDirectory);
			}, (err) => {
				//TODO: Handle wrong password
				logger.error({description: 'Error updating application directory.', error: err, func: 'updateDirectory', obj: 'ApplicationsCtrl'});
				res.status(400).send("Error updating application's directory.");
			});
		},  (err) => {
			logger.error({description: 'Error finding application.', error: err, func: 'updateDirectory', obj: 'ApplicationsCtrl'});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({description: 'Application name is required to update directory.', func: 'updateDirectory', obj: 'ApplicationsCtrl'});
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
exports.deleteDirectory = (req, res, next) => {
	if(req.params.name && req.body){ //Get data for a specific application
		logger.info({description: 'Application directory delete requested.', appName: req.params.name, body: req.body, func: 'deleteDirectory', obj: 'ApplicationsCtrl'});
		findApplication(req.params.name).then( (foundApp) => {
			foundApp.deleteDirectory(req.body.password).then( () => {
				logger.info({description: 'Directory deleted successfully.', func: 'deleteDirectory', obj: 'ApplicationsCtrl'});
				//TODO: Return something other than this message
				res.send('Directory deleted successfully.');
			}, (err) => {
				//TODO: Handle wrong password
				logger.error({description: 'Error deleting directory from application.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl'});
				res.status(400).send('Error deleting directory from application.');
			});
		}, (err) => {
			logger.error({description: 'Error finding application.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl'});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({description: 'Application name is required to delete application directory.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl'});
		res.status(400).send('Application name is required to delete application directory.');
	}
};
// Utility  => s
//Wrap finding application in a promise that handles errors
//TODO: Allow choosing populate settings
function findApplication(appName) {
	if(!appName){
		logger.error('Application name is required to find application.');
		Promise.reject({message: 'Application name required to find application.'});
	} else {
		var query = Application.findOne({name:appName})
		.populate({path:'owner', select:'username name email'})
		.populate({path:'groups', select:'name accounts'})
		.populate({path:'directories', select:'name accounts groups'})
		return query.then((foundApp) => {
			if(!foundApp){
				logger.error({description: 'Application not found', func: 'findApplication'});
				return Promise.reject({message: 'Application not found'});
			} else {
				logger.log({description: 'Application found:', foundApp: foundApp, func: 'findApplication'});
				return foundApp;
			}
		}, (err) => {
			logger.error({description: 'Error finding application.', error: err, func: 'findApplication'});
			return Promise.reject({message: 'Error finding application.'});
		});
	}
}
