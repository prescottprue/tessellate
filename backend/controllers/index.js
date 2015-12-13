import logger from '../utils/logger';
import AuthRocket from 'authrocket';
import { Application } from '../models/application';
let authrocket = new AuthRocket();

export function main(req, res, next){
	res.render('index', { title: 'Tessellate Server' });
};
export function docs(req, res, next){
	res.render('docs', { title: 'Tessellate Server' });
};
export function authrocket(req, res, next){
	logger.log({description: 'Test request', body: req.body, func: 'authrocket'});
	console.log(req.body);
	res.send('Thanks');
};
export function test(req, res, next){
	console.log('test request', req.body);

};
// export function test(req, res, next){
// 	console.log('test request');
// 	authrocket.Orgs().get().then(function(usersList){
// 		console.error('users list loaded.', usersList);
// 		res.send(usersList);
// 	}, (err) => {
// 		console.error('Error getting users', err);
// 		res.status(500).send(err);
// 	});
// };
// export function test(req, res, next){
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
