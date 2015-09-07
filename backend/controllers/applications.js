/**
 * @description Application Controller
 */
// ------------------------------------------------------------------------------------------
// Current Errors.
// ------------------------------------------------------------------------------------------
/**
 * @apiDefine CreateAccountError
 * @apiVersion 0.2.0
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
var Application = require('../models/application').Application;
var mongoose = require('mongoose');
var url = require('url');
var _ = require('underscore');
var q = require('q');

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
 *       frontend:{bucketName:"hypercube-exampleApp", provider:"Amazon", siteUrl:"hypercube-exampleApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *      },
 *       name: "testApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"hypercube-testApp", provider:"Amazon", siteUrl:"hypercube-testApp.s3website.com"},
 *       createdAt:1438737438578,
 *       updatedAt:1438737438578
 *      }
 *     ]
 * @apiSuccessExample Success-Response (Name Provided):
 *     HTTP/1.1 200 OK
 *     {
 *       name: "exampleApp",
 *       owner: {username:"hackerguy1", email:"test@test.com", name:"John Doe"},
 *       frontend:{bucketName:"hypercube-exampleApp", provider:"Amazon", siteUrl:"hypercube-exampleApp.s3website.com"},
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
 *       frontend:{bucketName:"hypercube-exampleApp", provider:"Amazon", siteUrl:"hypercube-exampleApp.s3website.com"},
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
		console.log('add request with name: ' + req.body.name + ' with body:', req.body);
		var appData = _.extend({}, req.body);
		if(!_.has(appData, 'owner')){
			console.log('No owner provided. Using account', req.user);
			if(_.has(req, 'userId')){
				appData.owner = req.userId;
			} else if (_.has(req, 'id')) {
				appData.owner = req.userId;
			}
		}
		var query = Application.findOne({"name":req.body.name}); // find using name field
		query.exec(function (qErr, qResult){
			if(qErr){
				console.error('[ApplicationsCtrl.add()] Error getting application:', JSON.stringify(qErr));
				return res.status(500).send('Error Adding Application.');
			}
			if(qResult){
				console.error('[ApplicationsCtrl.add()] Application already exists:', qResult);
				return res.status(400).send('Application with this name already exists.');
			}
			//application does not already exist
			var application = new Application(appData);
			// console.log('about to call create with storage:', appData);
			//Create with template if one is provided
			if(_.has(req.body,'template')){
				application.createWithTemplate(req.body.template).then(function (newApp){
					console.log('Application created with template:', newApp);
					res.json(newApp);
				}, function(err){
					console.log('Error creating new application:', err);
					//TODO: Handle different errors here
					res.status(400).json(err);
				});
			} else {
				application.createWithStorage().then(function (newApp){
					console.log('Application created with storage:', newApp);
					res.json(newApp);
				}, function(err){
					console.log('Error creating new application:', err);
					//TODO: Handle different errors here
					res.status(400).json(err);
				});
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
 *       frontend:{bucketName:"hypercube-exampleApp", provider:"Amazon", siteUrl:"hypercube-exampleApp.s3website.com"},
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
 *       frontend:{bucketName:"hypercube-exampleApp", provider:"Amazon", siteUrl:"hypercube-exampleApp.s3website.com"},
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
		if(!foundApp){
			console.error('[ApplicationsCtrl.delete()] Error finding application');
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
 *       frontend:{bucketName:"hypercube-exampleApp", provider:"Amazon", siteUrl:"hypercube-exampleApp.s3website.com"},
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
 *       frontend:{bucketName:"hypercube-exampleApp", provider:"Amazon", siteUrl:"hypercube-exampleApp.s3website.com"},
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
 *       frontend:{bucketName:"hypercube-exampleApp", provider:"Amazon", siteUrl:"hypercube-exampleApp.s3website.com"},
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
 *       frontend:{bucketName:"hypercube-exampleApp", provider:"Amazon", siteUrl:"hypercube-exampleApp.s3website.com"},
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
 *       frontend:{bucketName:"hypercube-exampleApp", provider:"Amazon", siteUrl:"hypercube-exampleApp.s3website.com"},
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
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'}).populate({path:'directories', select:'name'});
		query.exec(function (err, foundApp){
			if(err) {
				console.error('[ApplicationCtrl.login] Login error:', err);
				return res.status(500).send('Error logging in.');
			}
			if(!foundApp){
				console.error('[ApplicationCtrl.login] Account not found');
				return res.status(409).send('Application does not exist');
			}
			foundApp.login({username:req.body.username, password:req.body.password}).then(function (loginRes){
				// console.log('[ApplicationCtrl.login] Login Successful. Token:', token);
				res.send(loginRes);
			}, function (err){
				//TODO: Handle wrong password
				console.error('[ApplicationCtrl.login] Error logging in:', err);
				res.status(400).send('Login Error.');
			});
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
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.exec(function (err, foundApp){
			if(err) {
				console.error('[ApplicationCtrl.logout] Login error:', err);
				return res.status(500).send('Error logging in.');
			}
			if(!foundApp){
				console.error('[ApplicationCtrl.logout] Account not found');
				return res.status(401).send('Invalid Authentication Credentials');
			}
			console.log('before logout call:', req.user);

			foundApp.logout(req.user).then(function (){
				// console.log('[ApplicationCtrl.logout] Login Successful. Token:', token);
				res.send('Logout successful.');
			}, function (err){
				//TODO: Handle wrong password
				res.status(400).send('[ApplicationCtrl.logout] Login Error:', err);
			});
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
		var query = Application.findOne({name:req.params.name}).populate({path:'owner', select:'username name title email'});
		query.exec(function (err, foundApp){
			if(err) {
				console.error('[ApplicationCtrl.signup] Login error:', err);
				return res.status(500).send('Error logging in.');
			}
			if(!foundApp){
				console.error('[ApplicationCtrl.signup] Account not found');
				return res.status(401).send('Invalid Authentication Credentials');
			}
			foundApp.signup(req.body.password).then(function (token){
				// console.log('[ApplicationCtrl.signup] Login Successful. Token:', token);
				res.send({token:token, account:foundApp.strip()});
			}, function (err){
				//TODO: Handle wrong password
				res.status(400).send('[ApplicationCtrl.signup] Login Error:', err);
			});
		});
	} else {
		res.status(400).send('Application name is required.');
	}
};