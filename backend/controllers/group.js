var Group = require('../models/group').Group;
var mongoose = require('mongoose');
var url = require('url');
var _ = require('underscore');
var mp = require('../lib/mongoPromise');

/**
 * @description Group controller functions
 */
/** Group Ctrl
 * @description Log an existing Group in
 * @params {String} email - Email of Group
 * @params {String} password - Password of Group
 */
exports.get = function(req, res, next){
	var isList = true;
	var query = Group.find({});
	if(req.params.name){ //Get data for a specific Group
		console.log('Group request:', req.params.name);
		query = Group.findOne({name:req.params.name}).populate({path:'accounts', select:'name title role'});
		isList = false;
	}
	query.exec(function (err, result){
		if(err) { return next(err);}
		if(!result){
			return next (new Error('Group could not be found'));
		}
		var resData = result;
		res.send(resData);
	});
};

/** Add Ctrl
 * @description Add a Group
 * @params {String} email - Email of Group
 * @params {String} password - Password of Group
 * @params {String} name - Name of Group
 * @params {String} title - Title of Group

 * @params {Boolean} tempPassword - Whether or not to set a temporary password (Also set if there is no password param)
 */
exports.add = function(req, res, next){
	//Group does not already exist
	console.log('group request with:', req.body);
	if(req.body && _.has(req.body, "name")){
		//TODO: Handle array of accounts
		var query = Group.findOne({"name":req.body.name}); // find using email field
		mp.runQuery(query).then(function(){
			var group = new Group(req.body);
			console.log('before saveNew:', group);
			group.saveNew().then(function(newGroup){
				res.json(newGroup);
			}, function(err){
				res.status(500).send('New group could not be added:', err);
			})
		}, function(err){
			res.status(500).send('New group could not be added:', err);
		});
	} else {
		res.status(500).send('Group name required');
	}
};
/** Update Ctrl
 * @description Update a Group
 * @params {String} email - Email of Group
 * @params {String} Groupname - Groupname of Group
 * @params {String} password - Password of Group
 * @params {String} name - Name of Group
 * @params {String} title - Title of Group
 */
exports.update = function(req, res, next){
	Group.update({_id:req.id}, req.body, {upsert:true}, function (err, numberAffected, result) {
		if (err) { return next(err); }
		if (!result) {
			return next(new Error('Group could not be added.'));
		}
		res.json(result);
	});
};
/** Delete Ctrl
 * @description Delete a Group
 * @params {String} email - Email of Group
 */
exports.delete = function(req, res, next){
	var urlParams = url.parse(req.url, true).query;
	var query = Group.findOneAndRemove({'_id':req.params.id}); // find and delete using id field
	query.exec(function (err, result){
		if (err) { return next(err); }
		if (!result) {
			return next(new Error('Translation could not be deleted.'));
		}
		res.json(result);
	});
};

