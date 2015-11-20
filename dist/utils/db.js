'use strict';

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// database handler

var dbUrl = _default2.default.config.db.url;
var tessellate = undefined;
//Add db name to url
if (_default2.default.config.db.name) {
	dbUrl += "/" + _default2.default.config.db.name;
}
// console.log('Connecting to mongo url:', dbUrl);
if (_default2.default.config.envName !== 'test') {
	tessellate = _mongoose2.default.createConnection(dbUrl);
	tessellate.on('error', function (err) {
		console.error('Mongoose error:', err);
	});
	tessellate.on('connected', function () {
		console.error('Connected to DB');
	});
	tessellate.on('disconnected', function () {
		console.error('Disconnected from DB');
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
		}, 1000);
	});
	tessellate.on('disconnected', function () {
		console.error('Disconnected from DB');
	});
}

exports.tessellate = tessellate;