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

var _session = require('../models/session');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @description Session controller functions
 */
/** Session Ctrl
 * @description Log an existing Session in
 * @params {String} email - Email of Session
 * @params {String} password - Password of Session
 */
function get(req, res, next) {
	var query = _session.Session.find({});
	if (req.params.id) {
		//Get data for a specific Session
		logger.log({
			description: 'Session request.', id: req.params.id, func: 'get', obj: 'SessionCtrls'
		});
		query = _session.Session.findById(req.params.id);
	}
	query.then(function (result) {
		if (!result) {
			logger.error({
				description: 'Session could not be found.', func: 'get', obj: 'SessionCtrls'
			});
			return res.status(400).send('Session could not be ended.');
		}
		res.send(result);
	}, function (err) {
		logger.error({
			description: 'Error querying session.', error: err, func: 'get', obj: 'SessionCtrls'
		});
		res.status(500).send('Error ending session.');
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
function add(req, res, next) {
	//Session does not already exist
	var Session = new Session(req.body);
	Session.save(function (result) {
		if (!result) {
			logger.error({
				description: 'Session could not be added.',
				func: 'add', obj: 'SessionCtrls'
			});
			res.status(400).send('Session could not be created.');
		} else {
			res.json(result);
		}
	}, function (err) {
		logger.error({
			description: 'Error saving session.',
			error: err, func: 'add', obj: 'SessionCtrls'
		});
		res.status(500).send('Error starting new session.');
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
function update(req, res, next) {
	_session.Session.update({ _id: req.id }, req.body, { upsert: true }, function (err, numberAffected, result) {
		if (err) {
			logger.error({
				description: 'Error updating session.',
				error: err, func: 'update', obj: 'SessionCtrls'
			});
			return res.status(500).send('Error updating session.');
		}
		if (!result) {
			logger.error({
				description: 'Session could not be updated.',
				func: 'update', obj: 'SessionCtrls'
			});
			return res.status(400).send('Session could not be updated.');
		}
		res.json(result);
	});
};
/** Delete Ctrl
 * @description Delete a Session
 * @params {String} email - Email of Session
 */
function del(req, res, next) {
	var urlParams = _url2.default.parse(req.url, true).query;
	var query = _session.Session.findOneAndRemove({ '_id': req.params.id }); // find and delete using id field
	query.then(function (result) {
		if (!result) {
			logger.error({
				description: 'Sessiong could not be deleted.',
				func: 'delete', obj: 'SessionCtrls'
			});
			return res.status(400).send('Session could not be deleted.');
		}
		res.json(result);
	}, function (err) {
		logger.error({
			description: 'Error deleting session.',
			error: err, func: 'delete', obj: 'SessionCtrls'
		});
		res.status(500).send('Error deleting session.');
	});
};