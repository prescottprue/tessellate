'use strict';

/**
 * @description Template Controller
 */
var _ = require('lodash');
var logger = require('../utils/logger');
var Template = require('../models/template').Template;

/**
 * @api {get} /templates Get Template(s)
 * @apiDescription Get a list of the templates or get a specific template.
 * @apiName GetTemplate
 * @apiGroup Template
 *
 * @apiParam {String} name Name of Template
 *
 * @apiSuccess {Object} templateData Object containing templates data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "App1",
 *       "owner": {username:"Doe"}
 *     }
 *
 */
exports.get = function (req, res, next) {
	var isList = true;
	var query = Template.find({}).populate({ path: 'author', select: 'username name email' });
	if (req.params.name) {
		//Get data for a specific template
		logger.log({ description: 'Template request.', params: req.params, func: 'get', obj: 'TemplatesCtrls' });
		query = Template.findOne({ name: req.params.name }).populate({ path: 'author', select: 'username name title email' });
		isList = false;
	}
	query.then(function (result) {
		if (!result && isList) {
			logger.info({ description: 'Template could not be found.', func: 'get', obj: 'TemplatesCtrls' });
			res.status(400).send('Template could not be found.');
		} else {
			logger.log({ description: 'Template found successfully.', func: 'get', obj: 'TemplatesCtrls' });
			res.send(result);
		}
	}, function (err) {
		logger.log({ description: 'Error getting template(s).', error: err, func: 'get', obj: 'TemplatesCtrls' });
		res.status(500).send('Error getting template(s).');
	});
};

/**
 * @api {post} /templates Add Template
 * @apiDescription Add a new template.
 * @apiName AddTemplate
 * @apiGroup Template
 *
 * @apiParam {String} name Name of template
 *
 * @apiSuccess {Object} templateData Object containing newly created template's data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "template1",
 *       "owner": {"username":"testUser"}
 *     }
 *
 */
exports.add = function (req, res, next) {
	//Query for existing template with same name
	if (!_.has(req.body, "name")) {
		res.status(400).send("Name is required to create a new app");
	} else {
		logger.log({ description: 'Template add request.', name: req.body.name, func: 'add', obj: 'TemplatesCtrls' });
		var appData = _.extend({}, req.body);
		if (!_.has(appData, 'author')) {
			logger.log('No author provided. Using account', req.user);
			appData.author = req.user.accountId;
		}
		var query = Template.findOne({ "name": req.body.name }); // find using name field
		query.then(function (qResult) {
			if (qResult) {
				//Matching template already exists
				logger.info({ description: 'Template with provided name already exists.', func: 'add', obj: 'TemplatesCtrls' });
				return res.status(400).send('Template with provided name already exists.');
			}
			//template does not already exist
			//Handle string list of tags as tag param
			if (_.has(appData, 'tags')) {
				//TODO: Remove spaces from tags if they exist
				appData.tags = appData.tags.split(",");
			}
			if (_.has(appData, 'frameworks')) {
				appData.frameworks = appData.frameworks.split(",");
			}
			logger.log({ description: 'Creating new template.', template: appData }, appData);
			var template = new Template(appData);
			template.createNew(req).then(function (newTemplate) {
				logger.log({ description: 'Template created successfully.', func: 'add', obj: 'TemplatesCtrls' });
				res.json(newTemplate);
			}, function (err) {
				logger.error({ description: 'Error creating new template.', error: err, func: 'add', obj: 'TemplatesCtrls' });
				//TODO: Handle different errors here
				res.status(400).json(err);
			});
		}, function (err) {
			logger.error({ description: 'Error creating new template.', error: err, func: 'add', obj: 'TemplatesCtrls' });
			res.status(500).send('Error adding template.');
		});
	}
};

/**
 * @api {put} /templates Update Template
 * @apiDescription Update a template.
 * @apiName UpdateTemplate
 * @apiGroup Template
 *
 * @apiParam {String} name Name of template
 * @apiParam {Object} owner Owner of template
 * @apiParam {String} owner.username Template owner's username
 *
 * @apiSuccess {Object} templateData Object containing updated templates data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "App1",
 *       "owner": {username:"Doe"}
 *     }
 *
 *
 */
exports.update = function (req, res, next) {
	logger.log('app update request with name: ' + req.params.name + ' with body:', req.body);
	if (req.params.name) {
		Template.update({ name: req.params.name }, req.body, { upsert: false }, function (err, numberAffected, result) {
			if (err) {
				return next(err);
			}
			//TODO: respond with updated data instead of passing through req.body
			logger.log('template data update successful:', numberAffected, result);
			result.uploadFiles(req).then(function () {
				res.json(req.body);
			}, function (err) {
				res.status(500).send({ message: 'Error uploading files to template' });
			});
		});
	} else {
		res.status(400).send({ message: 'Template name required' });
	}
};
/**
 * @api {put} /templates/:name/upload Upload Files
 * @apiDescription Upload files to a template
 * @apiName Upload
 * @apiGroup Template
 *
 * @apiParam {File} file1 File to upload. Key (<code>file1</code>) does not hold significance as all files are uploaded.
 * @apiParam {File} file2 Second File to upload. Again, Key (<code>file2</code>) does not hold significance as all files are uploaded.
 *
 * @apiSuccess {Object} templateData Object containing updated templates data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "App1",
 *       "owner": {username:"Doe"}
 *     }
 *
 *
 */
exports.upload = function (req, res, next) {
	logger.log('app update request with name: ' + req.params.name + ' with body:', req.body);
	if (req.params.name) {
		var query = Template.findOne({ name: req.params.name });
		query.then(function (template) {
			//TODO: respond with updated data instead of passing through req.body
			logger.log({ description: 'Template found successfully.', template: template, func: 'upload', obj: 'TemplatesCtrls' });
			template.uploadFiles(req).then(function () {
				logger.log({ description: 'Files uploaded successfully.', template: template, func: 'upload', obj: 'TemplatesCtrls' });
				res.json({ message: 'Files uploaded successfully' });
			}, function (err) {
				logger.error({ description: 'Error uploading files to template.', error: err, func: 'upload', obj: 'TemplatesCtrls' });
				res.status(500).send('Error uploading files to template');
			});
		}, function (err) {
			logger.error({ description: 'Error finding template.', error: err, func: 'upload', obj: 'TemplatesCtrls' });
			res.status(500).send('Error finding template.');
		});
	} else {
		logger.info({ description: 'Template name is required to upload files.', error: err, func: 'upload', obj: 'TemplatesCtrls' });
		res.status(400).send('Template name required.');
	}
};
/**
 * @api {delete} /templates Delete Template
 * @apiDescription Delete a template
 * @apiName DeleteTemplate
 * @apiGroup Template
 *
 * @apiParam {String} name Name of template to delete
 *
 * @apiSuccess {Object} templateData Object containing deleted templates data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "App1",
 *       "owner": {username:"Doe"}
 *     }
 *
 *
 */
exports.delete = function (req, res, next) {
	logger.log('delete request:', req.params);
	if (!_.has(req.body, 'name')) {
		res.status(400).send('Template name required to delete template.');
	} else {
		var query = Template.findOneAndRemove({ 'name': req.body.name }); // find and delete using id field
		query.exec(function (err, result) {
			if (err) {
				return next(err);
			}
			if (!result) {
				logger.log('no result');
				return next(new Error('Template does not exist.'));
			}
			res.json(result);
		});
	}
};
/**
 * @api {get} /account/:id Search Accounts
 * @apiDescription Search Accounts.
 * @apiName SearchAccount
 * @apiGroup Account
 *
 * @apiParam {String} searchQuery String to search through accounts with
 *
 * @apiSuccess {Object} accountData Object containing deleted accounts data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"account",
 *     }
 *
 */
exports.search = function (req, res, next) {
	var nameQuery = createTemplateQuery('name', req.params.searchQuery);
	// var emailQuery = createAccountQuery('email', req.params.searchQuery);
	//Search templates by name
	nameQuery.then(function (nameResults) {
		if (_.isArray(nameResults) && nameResults.length == 0) {
			res.json(nameResults);
			//TODO: Search tags
			// emailQuery.then(function (emailResults){
			// 	logger.log('Template search by tags resulted:', emailResults);
			// 	res.json(emailResults);
			// }, function (err){
			// 	res.status(500).send({message:'Template cound not be found'});
			// });
		} else {
				logger.log({ description: 'Template search by name returned.', results: nameResults, func: 'search', obj: 'TemplateCtrl' });
				res.json(nameResults);
			}
	}, function (err) {
		logger.error({ description: 'Template could not be found.', error: err, func: 'search', obj: 'TemplateCtrl' });
		//TODO: Handle other errors here
		res.status(400).send({ message: 'Template cound not be found.' });
	});
};
/**
 * Create a account query based on provided key and value
 */
function createTemplateQuery(key, val) {
	var queryArr = _.map(val.split(' '), function (qr) {
		var queryObj = {};
		queryObj[key] = new RegExp(_.escapeRegExp(qr), 'i');
		return queryObj;
	});
	var find = { $or: queryArr };
	return Template.find(find, { email: 1, name: 1, username: 1 }); // find and delete using id field
}