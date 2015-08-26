var Session = require('../models/session').Session;
var mongoose = require('mongoose');
var url = require('url');
var _ = require('underscore');
var Q = require('q');
/**
 * @description Session controller functions
 */
/** Session Ctrl
 * @description Log an existing Session in
 * @params {String} email - Email of Session
 * @params {String} password - Password of Session
 */
exports.get = function(req, res, next){
	var isList = true;
	var query = Session.find({});
	if(req.params.id){ //Get data for a specific Session
		console.log('Session request:', req.params.id);
		query = Session.findById(req.params.id);
		isList = false;
	}
	query.exec(function (err, result){
		if(err) { return next(err);}
		if(!result){
			return next (new Error('Session could not be found'));
		}
		var resData = result;
		if(!isList){
			resData = result.strip();
		}
		res.send(resData);
	});
};

/** Add Ctrl
 * @description Add a Session
 * @params {String} email - Email of Session
 * @params {String} password - Password of Session
 * @params {String} name - Name of Session
 * @params {String} title - Title of Session

 * @params {Boolean} tempPassword - Whether or not to set a temporary password (Also set if there is no password param)
 */
exports.add = function(req, res, next){
	//Session does not already exist
	var Session = new Session(req.body);
	Session.save(function (err, result) {
		if (err) { return next(err); }
		if (!result) {

			return next(new Error('Session could not be added.'));
		}
		res.json(result);
	});
};
/** Update Ctrl
 * @description Update a Session
 * @params {String} email - Email of Session
 * @params {String} Sessionname - Sessionname of Session
 * @params {String} password - Password of Session
 * @params {String} name - Name of Session
 * @params {String} title - Title of Session
 */
exports.update = function(req, res, next){
	Session.update({_id:req.id}, req.body, {upsert:true}, function (err, numberAffected, result) {
		if (err) { return next(err); }
		if (!result) {

			return next(new Error('Session could not be added.'));
		}
		res.json(result);
	});
};
/** Delete Ctrl
 * @description Delete a Session
 * @params {String} email - Email of Session
 */
exports.delete = function(req, res, next){
	var urlParams = url.parse(req.url, true).query;
	var query = Session.findOneAndRemove({'_id':req.params.id}); // find and delete using id field
	query.exec(function (err, result){
		if (err) { return next(err); }
		if (!result) {
			return next(new Error('Translation could not be deleted.'));
		}
		res.json(result);
	});
};

