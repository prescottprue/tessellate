'use strict';

var Group = require('../models/group').Group;
var mongoose = require('mongoose');
var url = require('url');
var _ = require('lodash');
var logger = require('../utils/logger');

/**
 * @description Group controller functions
 */
/** Group Ctrl
 * @description Log an existing Group in
 * @params {String} email - Email of Group
 * @params {String} password - Password of Group
 */
exports.get = function (req, res, next) {
	var isList = true;
	logger.log({ description: 'Group(s) get request.', params: req.params, func: 'get', obj: 'GroupsCtrls' });
	var query = Group.find({}).populate({ path: 'accounts', select: 'name username email' });
	if (req.params.name) {
		//Get data for a specific Group
		query = Group.findOne({ name: req.params.name }).populate({ path: 'directories', select: 'name accounts groups' }).populate({ path: 'accounts', select: 'name username email' });
		isList = false;
	}
	query.then(function (groupData) {
		if (!groupData) {
			logger.info({ description: 'Group not found.', func: 'get', obj: 'GroupsCtrls' });
			return res.status(500).send('Group could not be found.');
		}
		res.send(groupData);
	}, function (err) {
		logger.error({ description: 'Error querying group.', error: err, func: 'get', obj: 'GroupsCtrls' });
		return res.status(500).send('Error getting group(s).');
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
exports.add = function (req, res, next) {
	//Group does not already exist
	logger.log({ description: 'Group request.', body: req.body, func: 'add', obj: 'GroupsCtrls' });
	if (req.body && _.has(req.body, "name")) {
		//TODO: Handle array of accounts
		var query = Group.findOne({ "name": req.body.name }); // find using email field
		query.then(function () {
			var group = new Group(req.body);
			group.saveNew().then(function (newGroup) {
				res.json(newGroup);
			}, function (err) {
				logger.error({ description: 'Error saving group', error: err, func: 'add', obj: 'GroupsCtrls' });
				res.status(500).send('New group could not be added:', err);
			});
		}, function (err) {
			logger.error({ description: 'Error querying group.', error: err, func: 'add', obj: 'GroupsCtrls' });
			res.status(500).send('New group could not be added.');
		});
	} else {
		logger.info({ description: 'Group name is required to add group.', error: err, func: 'add', obj: 'GroupsCtrls' });
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
exports.update = function (req, res, next) {
	logger.log({ description: 'Update called.', body: req.body, func: 'update', obj: 'GroupsCtrl' });
	if (!req.body || JSON.stringify(req.body) == "{}") {
		logger.log({ description: 'Body is invalid/null. Deleting group.', func: 'update', obj: 'GroupsCtrl' });
		deleteGroup(req.params).then(function (result) {
			logger.info({ description: 'Group deleted successfully.', result: result, func: 'update', obj: 'GroupsCtrl' });
			res.send(result);
		}, function (err) {
			logger.error({ description: 'Error deleting group.', error: err, func: 'update', obj: 'GroupsCtrl' });
			if (err && err.status && err.status == 'NOT_FOUND') {
				res.status(400).send(err.message || 'Error deleting group.');
			} else {
				res.status(500).send('Error deleting group.');
			}
		});
	} else {
		Group.update({ _id: req.id }, req.body, { upsert: true }, function (err, numberAffected, result) {
			if (err) {
				logger.error('[GroupCtrl.update()] Error updating group:', err);
				return res.status(500).send('Error updating group.');
			} else if (!result) {
				logger.error('[GroupCtrl.update()] Group not updated.');
				return res.status(500).send('Group could not be updated.');
			} else {
				res.send(result);
			}
		});
	}
};
/** Delete Ctrl
 * @description Delete a Group
 * @params {String} email - Email of Group
 */
exports.delete = function (req, res, next) {
	var urlParams = url.parse(req.url, true).query;
	deleteGroup(req.params).then(function (result) {
		logger.log({ description: 'Group deleted successfully', func: 'delete', obj: 'GroupsCtrl' });
		res.send(result);
	}, function (err) {
		logger.error({ description: 'Error deleting group.', error: err, func: 'delete', obj: 'GroupsCtrl' });
		res.status(500).send(err.message || 'Error deleting group.');
	});
};

function deleteGroup(params) {
	logger.log({ description: 'Delete group called.', params: params, func: 'deleteGroup', file: 'GroupsCtrl' });
	var findObj = {};
	if (_.has(params, 'id')) {
		findObj.id = params.id;
	} else if (_.has(params, 'name')) {
		findObj.name = params.name;
	} else {
		findObj = params;
	}
	logger.log({ description: 'Delete group find object created.', findObj: findObj, func: 'deleteGroup', file: 'GroupsCtrl' });
	var query = Group.findOneAndRemove(findObj); // find and delete using id field
	return query.then(function (result) {
		if (!result) {
			logger.error({ description: 'Group not found.', func: 'deleteGroup', file: 'GroupsCtrl' });
			return Promise.reject({ message: 'Group not found.', status: 'NOT_FOUND' });
		} else {
			logger.info({ description: 'Group deleted successfully.', result: result, func: 'deleteGroup', file: 'GroupsCtrl' });
			return result;
		}
	}, function (err) {
		logger.error({ description: 'Error deleting group.', error: err, func: 'deleteGroup', file: 'GroupsCtrl' });
		return err || { message: 'Error deleting group.' };
	});
}