var logger = require('../utils/logger');
var AuthRocket = require('authrocket');
var authrocket = new AuthRocket();

exports.main = function(req, res, next){
	res.render('index', { title: 'Tessellate Server' });
};
exports.docs = function(req, res, next){
	res.render('docs', { title: 'Tessellate Server' });
};
exports.test = function(req, res, next){
	console.log('Test called', req.body);
	authrocket.signup(req.body).then((signupRes) => {
		logger.log({description: 'Successfully signed up.', func:'test', obj: 'IndexCtrl'});
		res.send('Successful signup');
	}, (err) => {
		logger.error({description: 'Error signing up.', error: err, func:'test', obj: 'IndexCtrl'});
		res.status(400).send('Error signing up.');
	});
};
