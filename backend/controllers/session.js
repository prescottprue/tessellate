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
		if(err) {
			console.error('[SessionCtrl.get()] Error querying session:', err);
			return res.status(500).send('Error ending session.');
		}
		if(!result){
			console.error('[SessionCtrl.get()] Session could not be found.');
			return res.status(500).send('Session could not be ended.');
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
		if(err) {
			console.error('[SessionCtrl.add()] Error saving session:', err);
			return res.status(500).send('Error starting new session.');
		}
		if(!result){
			console.error('[SessionCtrl.add()] Session could not be saved.');
			return res.status(500).send('Session could not be created.');
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
		if(err) {
			console.error('[SessionCtrl.update()] Error updating session:', err);
			return res.status(500).send('Error updating session.');
		}
		if(!result){
			console.error('[SessionCtrl.update()] Session could not be updated.');
			return res.status(500).send('Session could not be updated.');
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
		if(err) {
			console.error('[SessionCtrl.delete()] Error deleting session:', err);
			return res.status(500).send('Error deleting session.');
		}
		if(!result){
			console.error('[SessionCtrl.delete()] Session could not be deleted.');
			return res.status(500).send('Session could not be deleted.');
		}
		res.json(result);
	});
};

