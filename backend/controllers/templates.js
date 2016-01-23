/**
 * @description Template Controller
 */
import _ from 'lodash';
import logger from '../utils/logger';
import { Template } from '../models/template';

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
export function get(req, res, next) {
	let isList = true;
	let query = Template.find({}).populate({path:'author', select:'username name email'});
	if(req.params.name){ //Get data for a specific template
		logger.log({
			description: 'Template request.',
			params: req.params,  func: 'get', obj: 'TemplatesCtrls'
		});
		query = Template.findOne({name:req.params.name}).populate({path:'author', select:'username name email'});
		isList = false;
	}
	query.then((result) => {
		if(!result && isList){
			logger.info({
				description: 'Template could not be found.',
				func: 'get', obj: 'TemplatesCtrls'
			});
			res.status(400).send('Template could not be found.');
		} else {
			logger.log({
				description: 'Template found successfully.',
				func: 'get', obj: 'TemplatesCtrls'
			});
			res.send(result);
		}
	}, (err) => {
		logger.log({
			description: 'Error getting template(s).',
			error: err, func: 'get', obj: 'TemplatesCtrls'
		});
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
export function add(req, res, next) {
	//Query for existing template with same name
	if(!_.has(req.body, "name")){
		res.status(400).send("Name is required to create a new app");
	} else {
		logger.log({
			description: 'Template add request.',
			name: req.body.name, func: 'add', obj: 'TemplatesCtrls'
		});
		let appData = _.extend({}, req.body);
		if(!_.has(appData, 'author')){
			logger.log({
				description: 'No author provided. Using user', user: req.user,
				func: 'add', obj: 'TemplatesCtrls'
			});
			appData.author = req.user.userId;
		}
		let query = Template.findOne({"name":req.body.name}); // find using name field
		query.then((qResult) => {
			if(qResult){ //Matching template already exists
				logger.warn({
					description: 'Template with provided name already exists.',
					func: 'add', obj: 'TemplatesCtrls'
				});
				return res.status(400).send('Template with provided name already exists.');
			}
			//template does not already exist
			//Handle string list of tags as tag param
			if(_.has(appData, 'tags')){
				//TODO: Remove spaces from tags if they exist
				appData.tags = appData.tags.split(",");
			}
			if(_.has(appData, 'frameworks')){
				appData.frameworks = appData.frameworks.split(",");
			}
			logger.log({
				description: 'Creating new template.', template: appData,
				func: 'add', obj: 'TemplatesCtrl'
			});
			let template = new Template(appData);
			template.createNew(req).then( (newTemplate) => {
				logger.log({
					description: 'Template created successfully.',
					func: 'add', obj: 'TemplatesCtrl'
				});
				res.json(newTemplate);
			}, (err) => {
				logger.error({
					description: 'Error creating new template.',
					error: err, func: 'add', obj: 'TemplatesCtrl'
				});
				//TODO: Handle different errors here
				res.status(400).json(err);
			});
		}, (err) => {
			logger.error({
				description: 'Error creating new template.', error: err, func: 'add', obj: 'TemplatesCtrls'
			});
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
export function update(req, res, next) {
	logger.log({
		description: 'app update request. ', name: req.params.name,
		func: 'update', obj: 'TemplatesCtrl'
	});
	if(req.params.name){
		Template.update({name:req.params.name}, req.body, {upsert:false},  (err, numberAffected, result)  => {
			if (err) { return next(err); }
			//TODO: respond with updated data instead of passing through req.body
			logger.log({
				description: 'template data update successful:',
				affected: numberAffected, result: result,
				func: 'update', obj: 'TemplatesCtrl'
			});
			result.uploadFiles(req).then(() => {
				res.json(req.body);
			},  (err) => {
				logger.error({
					description: 'Error uploading files to Template.',
					func: 'update', obj: 'TemplatesCtrl'
				});
				res.status(500).send('Error uploading files to template');
			});
		});
	} else {
		logger.warn({
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
export function upload(req, res, next) {
	logger.log({
		description: 'App update request.',
		template: template, func: 'upload', obj: 'TemplatesCtrls'
	});
	if(req.params.name){
		let query = Template.findOne({name:req.params.name});
		query.then((template) => {
			//TODO: respond with updated data instead of passing through req.body
			logger.log({
				description: 'Template found successfully.',
				template: template, func: 'upload', obj: 'TemplatesCtrls'
			});
			template.uploadFiles(req).then(() => {
				logger.log({
					description: 'Files uploaded successfully.',
					template: template, func: 'upload', obj: 'TemplatesCtrls'
				});
				res.send('Files uploaded successfully');
			}, (err) => {
				logger.error({
					description: 'Error uploading files to template.',
					error: err, func: 'upload', obj: 'TemplatesCtrls'
				});
				res.status(500).send('Error uploading files to template');
			});
		}, (err) => {
			logger.error({
				description: 'Error finding template.', error: err,
				func: 'upload', obj: 'TemplatesCtrls'
			});
			res.status(500).send('Error finding template.');
		});
	} else {
		logger.info({
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
export function del(req, res, next) {
	logger.log({
		description: 'Delete request.', params: req.params,
		func: 'delete', obj: 'TemplatesCtrl'
	});
	if(!_.has(req.body, 'name')){
		res.status(400).send('Template name required to delete template.');
	} else {
		let query = Template.findOneAndRemove({'name':req.body.name}); // find and delete using id field
		query.then(function (result){
			if (!result) {
				logger.warn({
					description: 'Template not found',
					func: 'delete', obj: 'TemplatesCtrl'
				});
				return res.status(400).send('Template not found.');
			}
			res.json(result);
		}, function(err) {
			logger.error({
				description: 'Error removing template.',
				error: err, func: 'delete', obj: 'TemplatesCtrl'
			});
			res.status(500).send('Error removing template.');
		});
	}
};
/**
 * @api {get} /user/:id Search Users
 * @apiDescription Search Users.
 * @apiName SearchUser
 * @apiGroup User
 *
 * @apiParam {String} searchQuery String to search through users with
 *
 * @apiSuccess {Object} userData Object containing deleted users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"user",
 *     }
 *
 */
export function search(req, res, next) {
	//TODO: Search through firebase templates
	let nameQuery = createTemplateQuery('name', req.params.searchQuery);
	//Search templates by name
	nameQuery.then(function(nameResults){
		if(_.isArray(nameResults) && nameResults.length == 0){
			res.json(nameResults);
			//TODO: Search tags
		} else {
			logger.log({
				description: 'Template search by name returned.',
				results: nameResults, func: 'search', obj: 'TemplateCtrl'
			});
			res.json(nameResults);
		}
	}, function (err){
		logger.error({
			description: 'Template could not be found.',
			error: err, func: 'search', obj: 'TemplateCtrl'
		});
		//TODO: Handle other errors here
		res.status(400).send({message:'Template cound not be found.'});
	});
};
/**
 * Create a user query based on provided key and value (in mongo)
 */
function createTemplateQuery(key, val){
	let queryArr = _.map(val.split(' '), function (qr) {
    let queryObj = {};
    queryObj[key] = new RegExp(_.escapeRegExp(qr), 'i');
    return queryObj;
  });
  let find = {$or: queryArr};
	return Template.find(find, {}); // find and delete using id field
}
