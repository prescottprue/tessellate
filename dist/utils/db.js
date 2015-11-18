// database handler
'use strict';

var conf = require('../config/default');
var mongoose = require('mongoose');
var dbUrl = conf.config.db.url;
//Add db name to url
if (conf.config.db.name) {
	dbUrl += "/" + conf.config.db.name;
}
// console.log('Connecting to mongo url:', dbUrl);
if (conf.config.envName !== 'test') {
	var tessellate = mongoose.createConnection(dbUrl);
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
	var tessellate = mongoose.createConnection(dbUrl);
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