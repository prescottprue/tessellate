'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.get = get;
exports.add = add;
exports.update = update;
exports.del = del;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _group = require('../models/group');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @description Group controller functions
 */
/** Group Ctrl
 * @description Log an existing Group in
 * @params {String} email - Email of Group
 * @params {String} password - Password of Group
 */
function get(req, res, next) {
	var isList = true;
	_logger2.default.log({ description: 'Group(s) get request.', params: req.params, func: 'get', obj: 'GroupsCtrls' });
	var query = _group.Group.find({}).populate({ path: 'accounts', select: 'name username email' });
	if (req.params.name) {
		//Get data for a specific Group
		query = _group.Group.findOne({ name: req.params.name }).populate({ path: 'directories', select: 'name accounts groups' }).populate({ path: 'accounts', select: 'name username email' });
		isList = false;
	}
	query.then(function (groupData) {
		if (!groupData) {
			_logger2.default.info({ description: 'Group not found.', func: 'get', obj: 'GroupsCtrls' });
			return res.status(500).send('Group could not be found.');
		}
		res.send(groupData);
	}, function (err) {
		_logger2.default.error({ description: 'Error querying group.', error: err, func: 'get', obj: 'GroupsCtrls' });
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
function add(req, res, next) {
	//Group does not already exist
	_logger2.default.log({ description: 'Group request.', body: req.body, func: 'add', obj: 'GroupsCtrls' });
	if (req.body && _lodash2.default.has(req.body, "name")) {
		//TODO: Handle array of accounts
		var query = _group.Group.findOne({ "name": req.body.name }); // find using email field
		query.then(function () {
			var group = new _group.Group(req.body);
			group.saveNew().then(function (newGroup) {
				res.json(newGroup);
			}, function (err) {
				_logger2.default.error({ description: 'Error saving group', error: err, func: 'add', obj: 'GroupsCtrls' });
				res.status(500).send('New group could not be added:', err);
			});
		}, function (err) {
			_logger2.default.error({ description: 'Error querying group.', error: err, func: 'add', obj: 'GroupsCtrls' });
			res.status(500).send('New group could not be added.');
		});
	} else {
		_logger2.default.info({ description: 'Group name is required to add group.', error: err, func: 'add', obj: 'GroupsCtrls' });
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
function update(req, res, next) {
	_logger2.default.log({ description: 'Update called.', body: req.body, func: 'update', obj: 'GroupsCtrl' });
	if (!req.body || JSON.stringify(req.body) == "{}") {
		_logger2.default.log({ description: 'Body is invalid/null. Deleting group.', func: 'update', obj: 'GroupsCtrl' });
		deleteGroup(req.params).then(function (result) {
			_logger2.default.info({ description: 'Group deleted successfully.', result: result, func: 'update', obj: 'GroupsCtrl' });
			res.send(result);
		}, function (err) {
			_logger2.default.error({ description: 'Error deleting group.', error: err, func: 'update', obj: 'GroupsCtrl' });
			if (err && err.status && err.status == 'NOT_FOUND') {
				res.status(400).send(err.message || 'Error deleting group.');
			} else {
				res.status(500).send('Error deleting group.');
			}
		});
	} else {
		_group.Group.update({ _id: req.id }, req.body, { upsert: true }, function (err, numberAffected, result) {
			if (err) {
				_logger2.default.error('[GroupCtrl.update()] Error updating group:', err);
				return res.status(500).send('Error updating group.');
			} else if (!result) {
				_logger2.default.error('[GroupCtrl.update()] Group not updated.');
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
function del(req, res, next) {
	var urlParams = _url2.default.parse(req.url, true).query;
	deleteGroup(req.params).then(function (result) {
		_logger2.default.log({ description: 'Group deleted successfully', func: 'delete', obj: 'GroupsCtrl' });
		res.send(result);
	}, function (err) {
		_logger2.default.error({ description: 'Error deleting group.', error: err, func: 'delete', obj: 'GroupsCtrl' });
		res.status(500).send(err.message || 'Error deleting group.');
	});
};

function deleteGroup(params) {
	_logger2.default.log({
		description: 'Delete group called.',
		params: params, func: 'deleteGroup', file: 'GroupsCtrl'
	});
	var findObj = {};
	if (_lodash2.default.has(params, 'id')) {
		findObj.id = params.id;
	} else if (_lodash2.default.has(params, 'name')) {
		findObj.name = params.name;
	} else {
		findObj = params;
	}
	_logger2.default.log({
		description: 'Delete group find object created.',
		findObj: findObj, func: 'deleteGroup', file: 'GroupsCtrl'
	});
	var query = _group.Group.findOneAndRemove(findObj); // find and delete using id field
	return query.then(function (result) {
		if (!result) {
			_logger2.default.error({
				description: 'Group not found.',
				func: 'deleteGroup', file: 'GroupsCtrl'
			});
			return Promise.reject({ message: 'Group not found.', status: 'NOT_FOUND' });
		} else {
			_logger2.default.info({
				description: 'Group deleted successfully.',
				result: result, func: 'deleteGroup', file: 'GroupsCtrl'
			});
			return result;
		}
	}, function (err) {
		_logger2.default.error({
			description: 'Error deleting group.',
			error: err, func: 'deleteGroup', file: 'GroupsCtrl'
		});
		return err || { message: 'Error deleting group.' };
	});
}