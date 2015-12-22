'use strict';

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dbUrl = _default2.default.db.url; // database handler

var tessellate = undefined;
//Add db name to url
if (_default2.default.db.name) {
	dbUrl += "/" + _default2.default.db.name;
}
// console.log('Connecting to mongo url:', dbUrl);
if (_default2.default.envName !== 'test') {
	tessellate = _mongoose2.default.createConnection(dbUrl);
	tessellate.on('error', function (err) {
		_logger2.default.error({
			description: 'Mongoose error:', error: err,
			func: 'createConnection', obj: 'db'
		});
	});
	tessellate.on('connected', function () {
		console.log('Connected to DB');
	});
	tessellate.on('disconnected', function () {
		_logger2.default.log({
			description: 'Disconnected from DB',
			func: 'createConnection', obj: 'db'
		});
	});
} else {
	//TODO: handle mock mongo
	tessellate = _mongoose2.default.createConnection(dbUrl);
	tessellate.on('error', function (err) {
		console.error('Mongoose error:', err);
	});
	tessellate.on('connected', function () {
		console.error('Connected to test DB');
		setTimeout(function () {
			tessellate.close();
		}, 10000);
	});
	tessellate.on('disconnected', function () {
		console.error('Disconnected from DB');
	});
}

exports.tessellate = tessellate;