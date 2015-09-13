var q = require('q');
var logger = require('../utils/logger');

exports.main = function(req, res, next){
	res.render('index', { title: 'Tessellate Server' });
};
exports.docs = function(req, res, next){
	res.render('docs', { title: 'Tessellate Server' });
};
// var child_process = require("child_process");
// function getHost(){
// 	var defaultHost = 'http://tessellate.elasticbeanstalk.com';
// 	var d = q.defer();
// 	child_process.exec("hostname -f", function(err, stdout, stderr) {
// 	  if(!err){
// 	  	var hostname = stdout.trim();
// 	  	logger.info({description: 'Hostname found successfully.', hostname: hostname, func: 'getHost', obj: 'IndexCtrl'});
// 	  	d.resolve(hostname);
// 	  } else {
// 	  	logger.info({description: 'Error getting hosname. Responding with default.', error: err, func: 'getHost', obj: 'IndexCtrl'});
// 	  	d.resolve(defaultHost);
// 	  }
// 	});
// 	return d.promise;
// }
