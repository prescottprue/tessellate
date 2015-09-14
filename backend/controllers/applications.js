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

var mongoose = require('mongoose');
var url = require('url');
var _ = require('underscore');
var q = require('q');
var logger = require('../utils/logger');
var Application = require('../models/application').Application;
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
exports.get = function(req, res, next){
	var isList = true;
	var query = Application.find({}).populate({path:'owner', select:'username name title email'});
	if(req.params.name){ //Get data for a specific application
		console.log('application request with id:', req.params.name);
		query = Application.findOne({name:req.params.name})
		.populate({path:'owner', select:'username name title email'})
		.populate({path:'groups', select:'name accounts'})
		.populate({path:'directories', select:'name accounts groups'});
		isList = false;
	}
	query.exec(function (err, result){
		if(err){
			console.error('[ApplicationsCtrl.get()] Error getting application(s):', JSON.stringify(err));
			return res.status(500).send('Error getting Application(s).');
		}
		if(!result){
			console.error('[ApplicationsCtrl.get()] Error finding application(s).');
			return res.status(400).send('Application(s) could not be found.');
		}
		res.send(result);
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
exports.getProviders = function(req, res, next){
	// var query = Application.find({}).populate({path:'owner', select:'username name title email'});
	if(req.params.name){ //Get data for a specific application
		console.log('application request with id:', req.params.name);
		var query = Application.findOne({name:req.params.name})
		query.exec(function (err, result){
			if(err){
				console.error('[ApplicationsCtrl.get()] Error getting application(s):', JSON.stringify(err));
				return res.status(500).send('Error getting Application(s).');
			}
			if(!result){
				console.error('[ApplicationsCtrl.get()] Error finding application(s).');
				return res.status(400).send('Application(s) could not be found.');
			}
			var providerData = {};
			_.each(result.providers, function(provider){
				providerData[provider.name] = provider.clientId;
			});
			console.log('returning provider data:', JSON.stringify(providerData));
			res.send(providerData);
		});
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
exports.add = function(req, res, next){
	//Query for existing application with same _id
	if(!_.has(req.body, "name")){
		res.status(400).send("Name is required to create a new app");
	} else {
		console.log({description:'Applications add called with name.', name: req.body.name, body: req.body, func: 'add', obj: 'ApplicationsCtrl'});
		var appData = _.extend({}, req.body);
		var appName = req.body.name;
		if(!_.has(appData, 'owner')){
			console.log('No owner data provided. Using account.', req.user);
			if(_.has(req, 'userId')){
				appData.owner = req.userId;
			} else if (_.has(req, 'id')) {
				appData.owner = req.userId;
			}
		}
		findApplication(appName).then(function (foundApp){
			console.log('Application does not already exist.', foundApp);
			//application does not already exist
			var application = new Application(appData);
			// console.log('about to call create with storage:', appData);
			//Create with template if one is provided
			if(_.has(req.body,'template')){
				//Template name was provided
				application.createWithTemplate(req.body.template).then(function (newApp){
					console.log('Application created with template:', newApp);
					res.json(newApp);
				}, function (err){
					console.log('Error creating new application:', err);
					//TODO: Handle different errors here
					res.status(400).json(err);
				});
			} else {
				//Template name was not provided
				application.createWithStorage().then(function (newApp){
					console.log('Application created with storage:', newApp);
					res.json(newApp);
				}, function (err){
					console.log('Error creating new application:', err);
					//TODO: Handle different errors here
					res.status(400).json(err);
				});
			}
		}, function (err){
			console.log('Error creating new application:', err);
			//TODO: Handle different errors here
			// if(err && err.status == 'EXISTS'){
			// 	res.status(400).send('Application with this name already exists.');
			// }
			res.status(500).send('Error creating application.');
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
exports.update = function(req, res, next){
	console.log('app update request with name: ' + req.params.name + ' with body:', req.body);
	if(req.params.name){
		Application.update({name:req.params.name}, req.body, {upsert:false}, function (err, numberAffected, result) {
			if(err){
				console.error('[ApplicationsCtrl.update()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error updating Application.');
			}
			//TODO: respond with updated data instead of passing through req.body
			console.log('Application update successful. Num affected:', numberAffected);
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
exports.delete = function(req, res, next){
	var query = Application.findOneAndRemove({'name':req.params.name}); // find and delete using id field
	query.exec(function (err, result){
		if(err){
			console.error('[ApplicationsCtrl.delete()] Error getting application:', JSON.stringify(err));
			return res.status(500).send('Error deleting Application.');
		}
		if(!result){
			console.error('[ApplicationsCtrl.delete()] Error deleting application');
			return res.status(400).send('Application could not be found.');
		}
		var app = new Application(result);
		app.removeStorage().then(function(){
			res.json(result);
		}, function(err){
			res.status(400).send(err);
		});
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
exports.files = function(req, res, next){
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile function
	if(req.params.name){ //Get data for a specific application
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.exec(function (err, foundApp){
			if(err){
				console.error('[ApplicationsCtrl.files()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error getting Application files.');
			}
			if(!foundApp){
				console.error('[ApplicationsCtrl.files()] Error finding application');
				return res.status(400).send('Application could not be found.');
			}
			foundApp.getStructure().then(function (appFiles){
				console.log('appFiles returned:', appFiles);
				res.send(appFiles);
			}, function (err){
				res.status(400).send('Error saving file:', err);
			});
		});
	} else {
		res.status(400).send('Application name and fileData are required to upload file')
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
exports.publishFile = function(req, res, next){
	console.log('dir upload request with app name: ' + req.params.name + ' with body:', req.body);
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile function
	if(req.params.name){ //Get data for a specific application
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		isList = false;
		query.exec(function (err, foundApp){
			if(err) {
				console.error('[ApplicationsCtrl.publishFile()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error publishing file to Application.');
			}
			if(!foundApp){
				console.error('[ApplicationsCtrl.publishFile()] Error finding application');
				return res.status(400).send('Application could not be found.');
			}
			//TODO: Get url from found app, and get localDir from
			foundApp.publishFile({content:req.body.content, key:req.body.key, contentType:req.body.contentType}).then(function (webUrl){
				console.log('Buckets web url:', webUrl);
				res.send(webUrl);
			}, function (err){
				console.log('Error publishing file:', err);
				res.status(400).send(err);
			});
		});
	} else {
		res.status(400).send('Application name and fileData are required to upload file')
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
exports.applyTemplate = function(req, res, next){
	console.log('apply template request with app name: ' + req.params.name + ' with body:', req.body);
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile function
	if(req.params.name){ //Get data for a specific application
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.exec(function (err, foundApp){
			if(err) { 
				console.error('[ApplicationsCtrl.applyTemplate()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error applying template to Application.');
			}
			if(!foundApp){
				console.error('[ApplicationsCtrl.applyTemplate()] Error finding application');
				return res.status(400).send('Application could not be found.');
			}
			//TODO: Get url from found app, and get localDir from
			foundApp.applyTemplate(req.body.name).then(function (webUrl){
				console.log('Template applied to bucket successfully');
				res.send(webUrl);
			}, function (err){
				console.log('Error applying template:', err);
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
exports.addStorage = function(req, res, next){
	console.log('add storage request with app name: ' + req.params.name + ' with body:', req.body);
	//TODO: Check that account is owner or collaborator before uploading
	//TODO: Lookup application and run uploadFile function
	if(req.params.name){ //Get data for a specific application
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.exec(function (err, foundApp){
			if(err) { 
				console.error('[ApplicationsCtrl.addStorage()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error adding storage to application.');
			}
			if(!foundApp){
				console.error('[ApplicationsCtrl.addStorage()] Error finding application.');
				return res.status(400).send('Application could not be found');
			}
			//TODO: Get url from found app, and get localDir from
			foundApp.createStorage().then(function (webUrl){
				console.log('Added storage to application successfully:', webUrl);
				res.send(webUrl);
			}, function (err){
				console.log('Error adding storage to application:', JSON.stringify(err));
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
exports.addCollaborators = function(req, res, next){
	console.log('add storage request with app name: ' + req.params.name + ' with body:', req.body);
	//TODO: Check that account is allowed to add collaborators
	if(req.params.name && req.body.accounts){ //Get data for a specific application
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.exec(function (err, foundApp){
			if(err) { 
				console.error('[ApplicationsCtrl.addCollaborators()] Error getting application:', JSON.stringify(err));
				return res.status(500).send('Error adding collaborators to application.');
			}
			if(!foundApp){
				console.error('[ApplicationsCtrl.addCollaborators()] Error finding application:');
				return res.status(400).send('Application could not be found');
			}
			foundApp.addCollaborators(req.body.accounts).then(function (appWithCollabs){
				console.log('Added storage to application successfully:', appWithCollabs);
				res.send(appWithCollabs);
			}, function (err){
				console.log('Error adding collaborators to application:', JSON.stringify(err));
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
exports.login = function(req, res, next){
	console.log('App Login request with app name: ' + req.params.name + ' with body:', req.body);
	if(req.params.name && req.body && _.has(req.body, 'username') && _.has(req.body, 'password')){ //Get data for a specific application
		var loginData = {username:req.body.username, password:req.body.password};
		findApplication(req.params.name).then(function (foundApp){
			console.log({description: 'Application found successfully.', foundApp: foundApp, func: 'logout', obj: 'ApplicationCtrl'});
			foundApp.login(loginData).then(function (loginRes){
				console.log('[ApplicationCtrl.login] Login Successful.', loginRes);
				res.send(loginRes);
			}, function (err){
				//TODO: Handle wrong password
				console.error('[ApplicationCtrl.login] Error logging in:', err);
				res.status(400).send('Login Error.');
			});
		}, function (err){
			console.error('Error:', err);
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
exports.logout = function(req, res, next){
	console.log('App Login request with app name: ' + req.params.name + ' with body:', req.body);
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then(function (foundApp){
			console.log({description: 'Application found successfully.', foundApp: foundApp, func: 'logout', obj: 'ApplicationCtrl'});
			foundApp.logout(req.user).then(function (){
				console.log({description: 'Logout successful.', func: 'logout', obj: 'ApplicationCtrl'});
				res.send('Logout successful.');
			}, function (err){
				console.error({description: 'Error finding application.', error: err, func: 'logout', obj: 'ApplicationCtrl'});
				res.status(400).send('Error logging out.');
			});
		}, function (err){
			console.error({description: 'Error finding application.', error: err, func: 'logout', obj: 'ApplicationCtrl'});
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
exports.signup = function(req, res, next){
	console.log('App Login request with app name: ' + req.params.name + ' with body:', req.body);
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then(function (foundApp){
			foundApp.signup(req.body.password).then(function (token){
				console.log('[ApplicationCtrl.signup] Login Successful. Token:', token);
				res.send({token:token, account:foundApp.strip()});
			}, function (err){
				//TODO: Handle wrong password
				console.error('[ApplicationCtrl.signup] Error signing up:', err);
				res.status(400).send('Error signing up.');
			});
		}, function (err){
			console.error('[ApplicationCtrl.signup] Error finding application:', err);
			res.status(400).send('Error finding application.');
		});
	} else {
		res.status(400).send('Application name is required.');
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
exports.groups = function(req, res, next){
	logger.log({description: 'App get group(s) request called.', appName: req.params.name, body: req.body, func: 'groups'});
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then(function (foundApp){
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
					query.exec(function (err, groupWithoutApp){
						if(err){
							logger.error({description: 'Error finding group.', error: err, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl'});
							res.status(500).send('Error finding group.');
						} else if(!groupWithoutApp){
							logger.error({description: 'Group not found.', group: groupWithoutApp, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl'});
							res.status(400).send('Group not found.');
						} else {
							logger.log({description: 'Group found, but not within application. Adding to application.', group: groupWithoutApp, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl'});
							foundApp.addGroup(groupWithoutApp).then(function (newGroup){
								logger.info({description: 'Existing group added to applicaiton.', group: groupWithoutApp, foundApp: foundApp, func: 'groups', obj: 'ApplicationsCtrl'});
								res.send(groupWithoutApp);
							}, function(err){
								res.status(500).send('Error adding existing group to application.');
							});
						}
					});
				}
			}
		}, function (err){
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
exports.addGroup = function(req, res, next){
	logger.log({description: 'App add group request.', name: req.params.name, body: req.body, func: 'addGroup', obj: 'ApplicationsCtrls'});
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then(function (foundApp){
			logger.log({description: 'Application found. Adding group.', app: foundApp, func: 'addGroup', obj: 'ApplicationsCtrls'});
			foundApp.addGroup(req.body).then(function (newGroup){
				logger.info({description: 'Group added to applicaiton successfully.', newGroup: newGroup, func: 'addGroup', obj: 'ApplicationsCtrls'});
				res.send(newGroup);
			}, function (err){
				//TODO: Handle wrong password
				logger.error({description: 'Error adding group to application.', error: err, func: 'addGroup', obj: 'ApplicationsCtrls'});
				res.status(400).send('Error adding group.');
			});
		}, function (err){
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
exports.updateGroup = function(req, res, next){
	logger.log({description: "Update application's group called.", appName: req.params.name, body: req.body, func: 'updateGroup', obj: 'ApplicationsCtrl'});
	if(req.params.name){ //Get data for a specific application
		findApplication(req.params.name).then(function (foundApp){
			//Update is called with null or empty value
			logger.log({description: 'Application found.', foundApp: foundApp, func: 'updateGroup', obj: 'ApplicationsCtrl'});
			if(!_.keys(req.body) || _.keys(req.body).length < 1 || req.body == {} || req.body == null || !req.body){
				logger.log({description: 'Update group with null, will be handled as delete.', func: 'updateGroup', obj: 'ApplicationsCtrl'});
				//Delete group
				foundApp.deleteGroup({name: req.params.groupName}).then(function (updatedGroup){
					logger.info({description: 'Application group deleted successfully.', updatedGroup: updatedGroup, func: 'updateGroup', obj: 'ApplicationsCtrl'});
					res.send(updatedGroup);
				}, function (err){
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
				foundApp.updateGroup(updateData).then(function (updatedGroup){
					logger.info({description: 'Application group updated successfully.', updatedGroup: updatedGroup, func: 'updateGroup', obj: 'ApplicationsCtrl'});
					res.send(updatedGroup);
				}, function (err){
					//TODO: Handle wrong password
					logger.error({description: 'Error updating application group.', error: err, func: 'updateGroup', obj: 'ApplicationsCtrl'});
					res.status(400).send("Error updating application's group.");
				});
			}
			
		}, function (err){
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
exports.deleteGroup = function(req, res, next){
	console.log('App add group request with app name: ' + req.params.name + ' with body:', req.body);
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then(function (foundApp){
			foundApp.deleteGroup(req.body).then(function (){
				logger.info({description: 'Group deleted successfully.', func: 'deleteGroup', obj: 'ApplicationsCtrl'});
				//TODO: Return something other than this message
				res.send('Group deleted successfully.');
			}, function (err){
				//TODO: Handle wrong password
				logger.error({description: 'Error deleting group.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl'});
				res.status(400).send('Error deleting group.');
			});
		}, function (err){
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
exports.directories = function(req, res, next){
	if(req.params.name){ //Get data for a specific application
		logger.log({description: 'App get application directory/directories request called.', appName: req.params.name, body: req.body, func: 'directories', obj: 'ApplicationsCtrl'});
		findApplication(req.params.name).then(function (foundApp){
			if(!req.params.directoryName){
				logger.info({description: "Application's directories found.", foundApp: foundApp, func: 'directories', obj: 'ApplicationsCtrl'});
				res.send(foundApp.directories);
			} else {
				var directory = _.findWhere(foundApp.directories, {name: req.params.directoryName});
				logger.info({description: "Application's directory found.", directory: directory, foundApp: foundApp, func: 'directories', obj: 'ApplicationsCtrl'});
				res.send(directory);
			}
		}, function (err){
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
exports.addDirectory = function(req, res, next){
	logger.log({description: 'Add directory to application called.', appName: req.params.name, body: req.body, func: 'addDirectory', obj: 'ApplicationsCtrl'});
	if(req.params.name && req.body){ //Get data for a specific application
		findApplication(req.params.name).then(function (foundApp){
			foundApp.addDirectory(req.body).then(function (newGroup){
				logger.info({description: 'Directory added to application successfully.', newDirectory: newDirectory, func: 'addDirectory', obj: 'ApplicationsCtrl'});
				res.send(newGroup);
			}, function (err){
				//TODO: Handle wrong password
				logger.error({description: 'Error adding directory to application.', error: err, func: 'addDirectory', obj: 'ApplicationsCtrl'});
				res.status(400).send('Error adding directory to application.');
			});
		}, function (err){
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
exports.updateDirectory = function(req, res, next){
	if(req.params.name && req.body){ //Get data for a specific application
		logger.log({description: "Update application's directory called.", appName: req.params.name, body: req.body, func: 'updateDirectory', obj: 'ApplicationsCtrl'});
		findApplication(req.params.name).then(function (foundApp){
			foundApp.updateDirectory(req.body).then(function (updatedDirectory){
				logger.info({description: 'Application directory updated successfully.', updatedDirectory: updatedDirectory, func: 'updateDirectory', obj: 'ApplicationsCtrl'});
				res.send(updatedDirectory);
			}, function (err){
				//TODO: Handle wrong password
				logger.error({description: 'Error updating application directory.', error: err, func: 'updateDirectory', obj: 'ApplicationsCtrl'});
				res.status(400).send("Error updating application's directory.");
			});
		}, function (err){
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
exports.deleteDirectory = function(req, res, next){
	if(req.params.name && req.body){ //Get data for a specific application
		logger.info({description: 'Application directory delete requested.', appName: req.params.name, body: req.body, func: 'deleteDirectory', obj: 'ApplicationsCtrl'});
		findApplication(req.params.name).then(function (foundApp){
			foundApp.deleteDirectory(req.body.password).then(function (){
				logger.info({description: 'Directory deleted successfully.', func: 'deleteDirectory', obj: 'ApplicationsCtrl'});
				//TODO: Return something other than this message
				res.send('Directory deleted successfully.');
			}, function (err){
				//TODO: Handle wrong password
				logger.error({description: 'Error deleting directory from application.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl'});
				res.status(400).send('Error deleting directory from application.');
			});
		}, function (err){
			logger.error({description: 'Error finding application.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl'});
			res.status(400).send('Error finding application.');
		});
	} else {
		logger.log({description: 'Application name is required to delete application directory.', error: err, func: 'deleteGroup', obj: 'ApplicationsCtrl'});
		res.status(400).send('Application name is required to delete application directory.');
	}
};
// Utility functions
//Wrap finding application in a promise that handles errors
//TODO: Allow choosing populate settings
function findApplication(appName){
	var d = q.defer();
	if(!appName){
		console.error('Application name is required to find application.');
		d.reject({message: 'Application name required to find application.'});
	} else {
		var query = Application.findOne({name:appName})
		.populate({path:'owner', select:'username name email'})
		.populate({path:'groups', select:'name accounts'})
		.populate({path:'directories', select:'name accounts groups'})
		query.exec(function (err, foundApp){
			if(err) {
				console.error('Error finding application:', err);
				d.reject({message: 'Error finding application.'});
			} else if(!foundApp){
				console.error('Application not found');
				d.reject({message: 'Application not found'});
			} else {
				console.log('Application found:', foundApp);
				d.resolve(foundApp);
			}
		});
	}
	return d.promise;
}