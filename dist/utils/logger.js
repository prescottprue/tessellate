'use strict';

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

require('winston-loggly');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @description Logger utility that handles Internal and external logging based on environment config
 */

var externalLoggerExists = null;

configureExternalLogger();
// TODO: Handle log level

exports.log = function (logData) {
	var msgStr = buildMessageStr(logData);
	if (_default2.default.envName === 'local') {
		console.log(msgStr);
	} else if (_default2.default.envName === 'production') {
		console.log(msgStr);
		callExternalLogger('log', logData);
	} else {
		console.log(msgStr);
		// callExternalLogger('log', logData);
	}
};
exports.info = function (logData) {
	var msgStr = buildMessageStr(logData);
	if (_default2.default.envName == 'local') {
		console.log(msgStr);
	} else if (_default2.default.envName === 'production') {
		console.info(logData) || console.log(logData);
		callExternalLogger('info', logData);
	} else {
		console.log(msgStr);
		// callExternalLogger('info', logData);
	}
};
exports.debug = function debug(logData) {
	var msgStr = buildMessageStr(logData);
	if (_default2.default.envName == 'local') {
		console.log(msgStr);
	} else if (_default2.default.envName === 'production') {
		console.info(logData) || console.log(logData);
		callExternalLogger('debug', logData);
	} else {
		console.log(msgStr);
		callExternalLogger('debug', logData);
	}
};
exports.warn = function warn(logData) {
	var msgStr = buildMessageStr(logData);
	if (_default2.default.envName == 'local') {
		console.warn(msgStr);
	} else if (_default2.default.envName === 'production') {
		console.warn(logData) || console.log(logData);
		callExternalLogger('warn', logData);
	} else {
		console.warn(msgStr);
		callExternalLogger('warn', logData);
	}
};
exports.error = function error(logData) {
	var msgStr = buildMessageStr(logData);
	if (_default2.default.envName == 'local') {
		console.error(msgStr);
	} else if (_default2.default.envName === 'production') {
		console.error(logData) || console.log(logData);
		callExternalLogger('error', logData);
	} else {
		console.error(msgStr);
		callExternalLogger('error', logData);
	}
};
/**
 * @description Build a message string based on multiple types of logdata. String is human reading and includes line breaks.
 * @param {object|string} logData - Object or string containing a log to be turned into a string.
 * @param {object} logData.func - Function where the log is occuring
 * @param {object} logData.obj - Object that contains the function where the log is occuring.
 */
function buildMessageStr(logData) {
	var msg = "";
	//TODO: Attach time stamp
	if (_underscore2.default.isObject(logData)) {
		if (_underscore2.default.has(logData, 'obj') && _underscore2.default.has(logData, 'func')) {
			msg += '[' + logData.obj + '.' + logData.func + '()] ';
		}
		//Print each key and its value other than obj and func
		_underscore2.default.each(_underscore2.default.omit(_underscore2.default.keys(logData), 'obj', 'func'), function (key, ind, list) {
			if (_underscore2.default.isString(logData[key])) {
				msg += key + ': ' + logData[key] + ', ';
			} else {
				//Print objects differently
				msg += key + ': ' + JSON.stringify(logData[key]) + ', ';
			}
			if (ind != list.length - 1) {
				msg += '\n';
			}
		});
	} else if (_underscore2.default.isString(logData)) {
		msg = logData;
	}
	return msg + '\n';
}
/**
 * @description Configure external logging server.
 * Currently using Loggly through winston. Requires LOGGLY_TOKEN environment variable
 */
function configureExternalLogger() {
	if (_default2.default.logging && _default2.default.logging.external) {
		if (!_underscore2.default.has(process.env, 'LOGGLY_TOKEN')) {
			console.warn('Loggly Token does not exist, so external logging can not be configured.');
			externalLoggerExists = false;
			return;
		}
		externalLoggerExists = true;
		_winston2.default.add(_winston2.default.transports.Loggly, {
			token: process.env.LOGGLY_TOKEN,
			subdomain: "kyper",
			tags: ["Winston-NodeJS"],
			json: true
		});
	} else {
		console.log('External logging is disabled.');
		externalLoggerExists = false;
	}
}
/**
 * @description Call external logging service with loggin type.
 * @param {string} type - Type of log.
 * @param {object|string} msgData - Object or String data of message to log.
 */
function callExternalLogger(type, msgData) {
	if (externalLoggerExists) {
		try {
			// console[type](msgData);
			_winston2.default.log(type, msgData);
		} catch (err) {
			console.log('ERROR: External logging failed.');
			console.log(JSON.stringify(err));
		}
	}
}