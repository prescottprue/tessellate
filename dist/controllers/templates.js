'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.get = get;
exports.add = add;
exports.update = update;
exports.upload = upload;
exports.del = del;
exports.search = search;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _template = require('../models/template');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
function get(req, res, next) {
	var isList = true;
	var query = _template.Template.find({}).populate({ path: 'author', select: 'username name email' });
	if (req.params.name) {
		//Get data for a specific template
		_logger2.default.log({
			description: 'Template request.',
			params: req.params, func: 'get', obj: 'TemplatesCtrls'
		});
		query = _template.Template.findOne({ name: req.params.name }).populate({ path: 'author', select: 'username name email' });
		isList = false;
	}
	query.then(function (result) {
		if (!result && isList) {
			_logger2.default.info({
				description: 'Template could not be found.',
				func: 'get', obj: 'TemplatesCtrls'
			});
			res.status(400).send('Template could not be found.');
		} else {
			_logger2.default.log({
				description: 'Template found successfully.',
				func: 'get', obj: 'TemplatesCtrls'
			});
			res.send(result);
		}
	}, function (err) {
		_logger2.default.log({
			description: 'Error getting template(s).',
			error: err, func: 'get', obj: 'TemplatesCtrls'
		});
		res.status(500).send('Error getting template(s).');
	});
} /**
   * @description Template Controller
   */
;

/**
 * @api {post} /templates Add Template
 * @apiDescription Add a new template.
 * @apiName AddTemplate
 * @apiGroup Template
 *
 * @apiParam {String} name Name of template
 * @apiParam {String} type Type/Location of template (git, Firebase, S3) to copy
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
function add(req, res, next) {
	//Query for existing template with same name
	if (!_lodash2.default.has(req.body, "name")) {
		res.status(400).send("Name is required to create a new app");
	} else {
		(function () {
			_logger2.default.log({
				description: 'Template add request.',
				name: req.body.name, func: 'add', obj: 'TemplatesCtrls'
			});
			var appData = _lodash2.default.extend({}, req.body);
			if (!_lodash2.default.has(appData, 'author')) {
				_logger2.default.log({
					description: 'No author provided. Using account', user: req.user,
					func: 'add', obj: 'TemplatesCtrls'
				});
				appData.author = req.user.accountId;
			}
			var query = _template.Template.findOne({ "name": req.body.name }); // find using name field
			query.then(function (qResult) {
				if (qResult) {
					//Matching template already exists
					_logger2.default.warn({
						description: 'Template with provided name already exists.',
						func: 'add', obj: 'TemplatesCtrls'
					});
					return res.status(400).send('Template with provided name already exists.');
				}
				//template does not already exist
				//Handle string list of tags as tag param
				if (_lodash2.default.has(appData, 'tags')) {
					//TODO: Remove spaces from tags if they exist
					appData.tags = appData.tags.split(",");
				}
				if (_lodash2.default.has(appData, 'frameworks')) {
					appData.frameworks = appData.frameworks.split(",");
				}
				_logger2.default.log({
					description: 'Creating new template.', template: appData,
					func: 'add', obj: 'TemplatesCtrl'
				});
				var template = new _template.Template(appData);
				template.createNew(req).then(function (newTemplate) {
					_logger2.default.log({
						description: 'Template created successfully.',
						func: 'add', obj: 'TemplatesCtrl'
					});
					res.json(newTemplate);
				}, function (err) {
					_logger2.default.error({
						description: 'Error creating new template.',
						error: err, func: 'add', obj: 'TemplatesCtrl'
					});
					//TODO: Handle different errors here
					res.status(400).json(err);
				});
			}, function (err) {
				_logger2.default.error({
					description: 'Error creating new template.', error: err, func: 'add', obj: 'TemplatesCtrls'
				});
				res.status(500).send('Error adding template.');
			});
		})();
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
function update(req, res, next) {
	_logger2.default.log({
		description: 'app update request. ', name: req.params.name,
		func: 'update', obj: 'TemplatesCtrl'
	});
	if (req.params.name) {
		_template.Template.update({ name: req.params.name }, req.body, { upsert: false }, function (err, numberAffected, result) {
			if (err) {
				return next(err);
			}
			//TODO: respond with updated data instead of passing through req.body
			_logger2.default.log({
				description: 'template data update successful:',
				affected: numberAffected, result: result,
				func: 'update', obj: 'TemplatesCtrl'
			});
			result.uploadFiles(req).then(function () {
				res.json(req.body);
			}, function (err) {
				_logger2.default.error({
					description: 'Error uploading files to Template.',
					func: 'update', obj: 'TemplatesCtrl'
				});
				res.status(500).send('Error uploading files to template');
			});
		});
	} else {
		_logger2.default.warn({
			description: 'Template name is required.',
			func: 'update', obj: 'TemplatesCtrl'
		});
		res.status(400).send('Template name required');
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
function upload(req, res, next) {
	_logger2.default.log({
		description: 'App update request.',
		template: template, func: 'upload', obj: 'TemplatesCtrls'
	});
	if (req.params.name) {
		var query = _template.Template.findOne({ name: req.params.name });
		query.then(function (template) {
			//TODO: respond with updated data instead of passing through req.body
			_logger2.default.log({
				description: 'Template found successfully.',
				template: template, func: 'upload', obj: 'TemplatesCtrls'
			});
			template.uploadFiles(req).then(function () {
				_logger2.default.log({
					description: 'Files uploaded successfully.',
					template: template, func: 'upload', obj: 'TemplatesCtrls'
				});
				res.send('Files uploaded successfully');
			}, function (err) {
				_logger2.default.error({
					description: 'Error uploading files to template.',
					error: err, func: 'upload', obj: 'TemplatesCtrls'
				});
				res.status(500).send('Error uploading files to template');
			});
		}, function (err) {
			_logger2.default.error({
				description: 'Error finding template.', error: err,
				func: 'upload', obj: 'TemplatesCtrls'
			});
			res.status(500).send('Error finding template.');
		});
	} else {
		_logger2.default.info({
			description: 'Template name is required to upload files.',
			error: err, func: 'upload', obj: 'TemplatesCtrls'
		});
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
function del(req, res, next) {
	_logger2.default.log({
		description: 'Delete request.', params: req.params,
		func: 'delete', obj: 'TemplatesCtrl'
	});
	if (!_lodash2.default.has(req.body, 'name')) {
		res.status(400).send('Template name required to delete template.');
	} else {
		var query = _template.Template.findOneAndRemove({ 'name': req.body.name }); // find and delete using id field
		query.then(function (result) {
			if (!result) {
				_logger2.default.warn({
					description: 'Template not found',
					func: 'delete', obj: 'TemplatesCtrl'
				});
				return res.status(400).send('Template not found.');
			}
			res.json(result);
		}, function (err) {
			_logger2.default.error({
				description: 'Error removing template.',
				error: err, func: 'delete', obj: 'TemplatesCtrl'
			});
			res.status(500).send('Error removing template.');
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
function search(req, res, next) {
	//TODO: Search through firebase templates
	var nameQuery = createTemplateQuery('name', req.params.searchQuery);
	//Search templates by name
	nameQuery.then(function (nameResults) {
		if (_lodash2.default.isArray(nameResults) && nameResults.length == 0) {
			res.json(nameResults);
			//TODO: Search tags
		} else {
				_logger2.default.log({
					description: 'Template search by name returned.',
					results: nameResults, func: 'search', obj: 'TemplateCtrl'
				});
				res.json(nameResults);
			}
	}, function (err) {
		_logger2.default.error({
			description: 'Template could not be found.',
			error: err, func: 'search', obj: 'TemplateCtrl'
		});
		//TODO: Handle other errors here
		res.status(400).send({ message: 'Template cound not be found.' });
	});
};
/**
 * Create a account query based on provided key and value (in mongo)
 */
function createTemplateQuery(key, val) {
	var queryArr = _lodash2.default.map(val.split(' '), function (qr) {
		var queryObj = {};
		queryObj[key] = new RegExp(_lodash2.default.escapeRegExp(qr), 'i');
		return queryObj;
	});
	var find = { $or: queryArr };
	return _template.Template.find(find, {}); // find and delete using id field
}