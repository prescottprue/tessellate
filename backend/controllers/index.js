var logger = require('../utils/logger');
var AuthRocket = require('authrocket');
var authrocket = new AuthRocket();
var Application = require('../models/application').Application;
console.log('authrocket:', authrocket.Users);
exports.main = function(req, res, next){
	res.render('index', { title: 'Tessellate Server' });
};
exports.docs = function(req, res, next){
	res.render('docs', { title: 'Tessellate Server' });
};
exports.test = function(req, res, next){
	authrocket.Users.get().then(function(usersList){
		console.error('users list loaded.', usersList);
		res.send(usersList);
	}, (err) => {
		console.error('Error getting users', err);
		res.status(500).send(err);
	})
};
// exports.test = function(req, res, next){
// 	console.log('Test called', req.body);
//
// 	var query = Application.findOne({name: 'tessellate'}).populate({path:'owner', select:'username name title email'});
// 	if(req.params.name){ //Get data for a specific application
// 		logger.log('application request with id:', req.params.name);
// 		query = Application.findOne({name:'coach'})
// 		.populate({path:'owner', select:'username name title email'})
// 		.populate({path:'groups', select:'name accounts'})
// 		.populate({path:'directories', select:'name accounts groups'});
// 		isList = false;
// 	}
// 	query.then((application) => {
// 		if(!application){
// 			logger.error({description: 'Error finding Application(s).'});
// 			return res.status(400).send('Application(s) could not be found.');
// 		}
// 		logger.log({description: 'Application(s) found.', application: application, func: 'test', obj: 'ApplicationsCtrls'});
// 		application.authRocketSignup({email: req.body.email, password: req.body.password, username: req.body.username}).then((signupRes)=>{
// 			res.send(signupRes);
// 		}, (err) => {
// 			logger.error({description: 'Error signing up to application through authrocket.', error: err, func: 'test', obj: 'ApplicationsCtrls'})
// 			res.status(400).send(err);
// 		});
// 	}, (err) => {
// 		logger.error('[ApplicationsCtrl.get()] Error getting application(s):', JSON.stringify(err));
// 		res.status(500).send('Error getting Application(s).');
// 	});
// };
