// database handler
var conf = require('../config/default');
var mongoose = require('mongoose');
var dbUrl = conf.config.db.url;
//Add db name to url
if(conf.config.db.name){
	dbUrl += "/" + conf.config.db.name
}

// console.log('Connecting to mongo url:', dbUrl);
var hypercube = mongoose.createConnection(dbUrl);

hypercube.on('error',function (err) {
	console.error('Mongoose error:', err);
});
hypercube.on('connected', function () {
	console.error('Connected to DB');
});
hypercube.on('disconnected', function () {
	console.error('Disconnected from DB');
});

exports.hypercube = hypercube;

