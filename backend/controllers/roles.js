/** Roles Ctrl
 * @description Handler functions for roles routes
 */

var mongoose = require('mongoose');
var url = require('url');
var _ = require('underscore');

var Role = require('../models/role').Role;

/**
 * @api {get} /roles Get Role(s)
 * @apiDescription Get a list (array) of all of current the roles.
 * @apiName GetRole
 * @apiGroup Role
 *
 * @apiParam {Number} id Roles unique ID.
 *
 * @apiSuccess {Object} roleData Object containing roles data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "Manager"
 *       accounts: [{username:"hackerguy1"}]
 *       createdAt: 1438737438578,
 *      updatedAt1438737438578
 *     }
 *
 */
exports.getList = function(req, res, next){
	var query = Role.find({}).populate({path:accounts, select:""});
	query.exec(function (err, result){
		if(err) {
			console.error('Error getting roles list: ' + JSON.stringify(err));
			res.status(500).json({message:'Error getting roles list.'});
		} else if(!result){
			res.status(400).json({message:'Role could not be found'});
		} else {
			res.send(result);
		}
	});
};

/**
 * @api {get} /roles Get Role(s)
 * @apiDescription Get a list (array) of all of current the roles.
 * @apiName GetRole
 * @apiGroup Role
 *
 * @apiParam {Number} id Roles unique ID.
 *
 * @apiSuccess {Object} roleData Object containing roles data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "Manager"
 *       accounts: [{username:"hackerguy1"}]
 *       createdAt: 1438737438578,
 *       updatedAt:1438737438578
 *     }
 *
 */
exports.get = function(req, res, next){
	console.log('roles get request:', req.params.name, req.body);
	if(req.params.name){ //Get data for a specific Role
		console.log('Role request:', req.params.name);
		var query = Role.findOne({name:req.params.name}).populate('accounts');
	}
	query.exec(function (err, result){
		if(err) { return next(err);}
		if(!result){
			return next (new Error('Role could not be found'));
		}
		var role = result;
		role.findAccounts().then(function(roleAccounts){
			res.send(result);
		}, function(err){
			res.status(500).send('Error finding accounts for roles');
		});
	});
};

/**
 * @api {post} /roles Add Role
 * @apiDescription Add a new role.
 * @apiName AddRole
 * @apiGroup Role
 *
 * @apiParam {String} name Name of role
 * @apiParam {String} title Title of role
 *
 * @apiSuccess {Object} roleData Object containing newly created roles data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "Manager"
 *       accounts: [{username:"hackerguy1"}]
 *       createdAt: 1438737438578,
 *       updatedAt:1438737438578
 *     }
 *
 *
 */
exports.add = function(req, res, next){
	//Role does not already exist
	console.log('role request with:', req.body);
	if(req.body && _.has(req.body, name)){
		//TODO: Handle array of accounts
		var query = Role.findOne({name:req.body.name}); // find using email field
		query.exec(function (err, role){
			if(err) { return next(err);}
			if(role){
				res.status(400).send('A role with this name already exists');
			} else {
				var role = new Role(req.body);
				console.log('before saveNew:', role);
				role.saveNew().then(function(newRole){
					res.json(newRole);
				}, function(err){
					res.status(500).send('New role could not be added:', err);
				});
			}
		});
	} else {
		res.status(500).send('Role name required');
	}
};

/**
 * @api {put} /roles Update Role
 * @apiDescription Update a role.
 * @apiName UpdateRole
 * @apiGroup Role
 *
 * @apiParam {String} name Name of role
 *
 * @apiSuccess {Object} roleData Object containing updated roles data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "Manager",
 *       accounts: [{username:"hackerguy1"}]
 *       createdAt: 1438737438578,
 *       updatedAt:1438737438578
 *     }
 *
 *
 */
exports.update = function(req, res, next){
	Role.update({_id:req.id}, req.body, {upsert:true}, function (err, numberAffected, result) {
		if (err) { return next(err); }
		if (!result) {
			return next(new Error('Role could not be added.'));
		}
		res.json(result);
	});
};

/**
 * @api {delete} /role/:id Delete Role
 * @apiDescription Delete a role.
 * @apiName DeleteRole
 * @apiGroup Role
 *
 * @apiParam {String} id Id of role
 *
 * @apiSuccess {Object} roleData Object containing deleted role's data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "Manager",
 *       accounts: [{username:"hackerguy1"}]
 *       createdAt: 1438737438578,
 *       updatedAt:1438737438578
 *     }
 *
 */
exports.delete = function(req, res, next){
	var urlParams = url.parse(req.url, true).query;
	var query = Role.findOneAndRemove({'_id':req.params.id}); // find and delete using id field
	query.exec(function (err, result){
		if (err) { return next(err); }
		if (!result) {
			return next(new Error('Translation could not be deleted.'));
		}
		res.json(result);
	});
};
