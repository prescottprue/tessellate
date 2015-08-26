/**
 * @description Template Controller
 */
var Template = require('../models/template').Template;
var mongoose = require('mongoose');
var url = require('url');
var _ = require('underscore');
var q = require('q');
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
exports.get = function(req, res, next){
	var isList = true;
	var query = Template.find({}).populate({path:'author', select:'username name email'});
	if(req.params.name){ //Get data for a specific template
		console.log('template get request with id:', req.params.name);
		query = Template.findOne({name:req.params.name}).populate({path:'author', select:'username name title email'});
		isList = false;
	}
	query.exec(function (err, result){
		if(err) { return next(err);}
		if(!result){
			return next (new Error('Template could not be found'));
		}
		res.send(result);
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
exports.add = function(req, res, next){
	//Query for existing template with same name
	if(!_.has(req.body, "name")){
		res.status(400).send("Name is required to create a new app");
	} else {
		console.log('add request with name: ' + req.body.name + ' with body:', req.body);
		var appData = _.extend({}, req.body);
		if(!_.has(appData, 'author')){
			console.log('No author provided. Using user', req.user);
			appData.author = req.user.userId;
		}
		var query = Template.findOne({"name":req.body.name}); // find using name field
		query.exec(function (qErr, qResult){
			if (qErr) { return next(qErr); }
			if(qResult){ //Matching template already exists
				return next(new Error('Template with this name already exists.'));
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
			console.log('creating new template with:', appData);
			var template = new Template(appData);
			template.createNew(req).then(function (newTemplate){
				console.log('Template created successfully:', newTemplate);
				res.json(newTemplate);
			}, function(err){
				console.log('Error creating new template:', err);
				//TODO: Handle different errors here
				res.status(400).json(err);
			});
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
exports.update = function(req, res, next){
	console.log('app update request with name: ' + req.params.name + ' with body:', req.body);
	if(req.params.name){
		Template.update({name:req.params.name}, req.body, {upsert:false}, function (err, numberAffected, result) {
			if (err) { return next(err); }
			//TODO: respond with updated data instead of passing through req.body
			console.log('template data update successful:', numberAffected, result);
			result.uploadFiles(req).then(function(){
				res.json(req.body);
			}, function (err){
				res.status(500).send({message:'Error uploading files to template'});
			});
		});
	} else {
		res.status(400).send({message:'Template name required'});
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
exports.upload = function(req, res, next){
	console.log('app update request with name: ' + req.params.name + ' with body:', req.body);
	if(req.params.name){
		Template.findOne({name:req.params.name}, function (err, template) {
			if (err) { return next(err); }
			//TODO: respond with updated data instead of passing through req.body
			console.log('template found successfully:', template);
			template.uploadFiles(req).then(function(){
				res.json({message:'Files uploaded successfully'});
			}, function (err){
				res.status(500).send({message:'Error uploading files to template'});
			});
		});
	} else {
		res.status(400).send({message:'Template name required'});
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
exports.delete = function(req, res, next){
	console.log('delete request:', req.params);
	if(!_.has(req.body, 'name')){
		res.status(400).send('Template name required to delete template.');
	} else {
		var query = Template.findOneAndRemove({'name':req.body.name}); // find and delete using id field
		query.exec(function (err, result){
			if (err) { return next(err); }
			if (!result) {
				console.log('no result');
				return next(new Error('Template does not exist.'));
			}
				res.json(result);
		});
	}
};
