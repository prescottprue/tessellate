/**
 * @description Directory controller functions
 */
var mongoose = require('mongoose');
var url = require('url');
var _ = require('lodash');
var w = require('../utils/mongoPromise');
var url = require('url');
var Directory = require('../models/directory').Directory;

/**
 * @api {get} /directorys Get Directories
 * @apiDescription Get list of directorys
 * @apiName GetDirectory
 * @apiGroup Directory
 *
 * @apiParam {Number} id Directorys unique ID.
 *
 * @apiSuccess {Object} directoryData Object containing directorys data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John Doe",
 *       "title": "Doe",
 *       "directoryName": "john123",
 *       "email": "john123@gmail.com",
 *       "role":"directory",
 *     }
 *
 */
exports.get = (req, res, next) => {
	var isList = true;
	var query = Directory.find({}, {name:1, email:1});
	if(_.has(req.params, "name")){ //Get data for a specific directory
		logger.log({description: 'Directory request.', name: req.params.name, func: 'get', obj: 'DirectoriesCtrl'});
		query = Directory.findOne({name:req.params.name}, {password:0, __v:0}); //? There shouldn't be a password
		isList = false;
	}
	query.then((directoryData) => {
		//Remove sensitivedirectory data from directory
		logger.log({description: 'Directory data loaded.', directory: directoryData, func: 'get', obj: 'DirectoriesCtrl'});
		res.send(directoryData);
	}, (err) => {
		logger.log({description: 'Error getting directory/directories.', error: err, func: 'get', obj: 'DirectoriesCtrl'});
		res.status(500).send('Error getting directory/directories.');
	});
};
/**
 * @api {post} /directorys Add Directory
 * @apiDescription Add a new directory.
 * @apiName AddDirectory
 * @apiGroup Directory
 *
 * @apiParam {String} directoryName Directoryname of directory
 * @apiParam {String} email Email of directory
 * @apiParam {String} password Password of directory
 * @apiParam {String} name Name of directory
 * @apiParam {String} title Title of directory
 * @apiParam {Boolean} tempPassword Whether or not to set a temporary password (Also set if there is no password param)
 *
 * @apiSuccess {Object} directoryData Object containing newly created directorys data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"directory",
 *     }
 *
 */
exports.add = function(req, res, next){
	//Query for existing directory with same _id
	var query = Directory.findOne({"directoryName":req.body.directoryName}); // find using directoryName field
	var query;
	if(!_.has(req.body, "directoryName") && !_.has(req.body, "email")){
		return res.status(400).json({code:400, message:"Directoryname or Email required to add a new directory"});
	}
	if(_.has(req.body, "directoryName")){
		query = Directory.findOne({"directoryName":req.body.directoryName}); // find using directoryName field
	} else {
		query = Directory.findOne({"email":req.body.email}); // find using email field
	}
	query.then(() => {
		var directory = new Directory(req.body);
		directory.saveNew().then((newDirectory) => {
			//TODO: Set temporary password
			res.json(newDirectory);
		}, (err) => {
			logger.error({
				description: 'Error creating new directory.',
				error: err, func: 'add', obj: 'DirectoriesCtrls'
			});
			res.status(500).send('Directory could not be added');
		});
	}, (err) => {
		//next() //Pass error on
		logger.error({
			description: 'Error querying directory.',
			error: err, func: 'add', obj: 'DirectoriesCtrls'
		});
		res.status(500).send('Directory could not be added.');
	});
};
/**
 * @api {put} /directorys Update Directory
 * @apiDescription Update a directory.
 * @apiName UpdateDirectory
 * @apiGroup Directory
 *
 * @apiParam {String} directoryName Email of directory
 * @apiParam {String} password Password of directory
 * @apiParam {String} name Name of directory
 * @apiParam {String} title Title of directory
 * @apiParam {String} role Role of directory (admin, directory)
 *
 * @apiSuccess {Object} directoryData Object containing updated directorys data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"directory",
 *     }
 *
 */
exports.update = (req, res, next) => {
	if(_.has(req.params, "directoryName")){
		Directory.update({directoryName:req.params.directoryName}, req.body, {upsert:false}, function (err, numberAffected, result) {
			if (err) { return next(err); }
			//TODO: respond with updated data instead of passing through req.body
			res.json(req.body);
		});
	} else {
		res.status(400).send({message:'Directory id required'});
	}
};
/**
 * @api {delete} /directory/:id Delete Directory
 * @apiDescription Delete a directory.
 * @apiName DeleteDirectory
 * @apiGroup Directory
 *
 * @apiParam {String} directoryName Email of directory
 *
 * @apiSuccess {Object} directoryData Object containing deleted directorys data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"directory",
 *     }
 *
 */
exports.delete = (req, res, next) => {
	// var urlParams = url.parse(req.url, true).query;
	if(_.has(req.params, "directoryName")){
		var query = Directory.findOneAndRemove({'directoryName':req.params.directoryName}); // find and delete using id field
		query.then((result) => {
			logger.log({description: 'Directory deleted successfully:', func: 'delete', obj: 'DirectoriesCtrl'});
			res.json(result);
		}, (err) => {
			logger.error({description: 'Directory could not be deleted:', error: err, func: 'delete', obj: 'DirectoriesCtrl'});
			res.status(500).send({message:'Directory cound not be deleted'});
		});
	}
};
/**
 * @api {delete} /directory/:id Search Directorys
 * @apiDescription Search Directorys.
 * @apiName SearchDirectory
 * @apiGroup Directory
 *
 * @apiParam {String} searchQuery String to search through directorys with
 *
 * @apiSuccess {Object} directoryData Object containing deleted directorys data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"directory",
 *     }
 *
 */
exports.search = (req, res, next) => {
	// var urlParams = url.parse(req.url, true).query;
	var directoryNameQuery = createDirectoryQuery('directoryName', req.params.searchQuery);
	var emailQuery = createDirectoryQuery('email', req.params.searchQuery);
	//Search directoryNames
	directoryNameQuery.then((directoryNameResults) => {
		if(_.isArray(directoryNameResults) && directoryNameResults.length == 0){
			//Search emails
			emailQuery.then((emailResults) => {
				logger.log({description: 'Directory search by email resulted.', results: emailResults, func: 'search', obj: 'DirectoriesCtrls'});
				res.json(emailResults);
			},  (err) => {
				res.status(500).send({message:'Directory cound not be found.'});
			});
		} else {
			logger.log({description: 'Directory search by directoryName resulted.', results: directoryNameResults, func: 'search', obj: 'DirectoriesCtrls'});
			res.json(directoryNameResults);
		}
	},  (err) => {
		logger.error({description: 'Directory could not be found:', error: err, func: 'search', obj: 'DirectoriesCtrls'});
		res.status(500).send({message:'Directory cound not be found'});
	});
};
/**
 * Escape special characters
 */
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
/**
 * Create a directory query based on provided key and value
 */
function createDirectoryQuery(key, val){
	var queryArr = _.map(val.split(' '), (q) => {
    var queryObj = {};
    queryObj[key] = new RegExp(escapeRegExp(q), 'i');
    return queryObj;
  });
  var find = {$or: queryArr};
	return Directory.find(find, {email:1, name:1, directoryName:1}); // find and delete using id field
}
