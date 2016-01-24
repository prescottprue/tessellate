'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.main = main;
exports.docs = docs;
exports.authrocket = authrocket;
exports.test = test;

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _authrocket = require('authrocket');

var _authrocket2 = _interopRequireDefault(_authrocket);

var _project = require('../models/project');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var authrocket = new _authrocket2.default();

function main(req, res, next) {
	res.render('index', { title: 'Tessellate Server' });
};
function docs(req, res, next) {
	res.render('docs', { title: 'Tessellate Server' });
};
function authrocket(req, res, next) {
	_logger2.default.log({ description: 'Test request', body: req.body, func: 'authrocket' });
	console.log(req.body);
	res.send('Thanks');
};
function test(req, res, next) {
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
// 	if(req.params.name){ //Get data for a specific project
// 		logger.log('project request with id:', req.params.name);
// 		query = Application.findOne({name:'coach'})
// 		.populate({path:'owner', select:'username name title email'})
// 		.populate({path:'groups', select:'name users'})
// 		.populate({path:'directories', select:'name users groups'});
// 		isList = false;
// 	}
// 	query.then((project) => {
// 		if(!project){
// 			logger.error({description: 'Error finding Application(s).'});
// 			return res.status(400).send('Application(s) could not be found.');
// 		}
// 		logger.log({description: 'Application(s) found.', project: project, func: 'test', obj: 'ApplicationsCtrls'});
// 		project.authRocketSignup({email: req.body.email, password: req.body.password, username: req.body.username}).then((signupRes)=>{
// 			res.send(signupRes);
// 		}, (err) => {
// 			logger.error({description: 'Error signing up to project through authrocket.', error: err, func: 'test', obj: 'ApplicationsCtrls'})
// 			res.status(400).send(err);
// 		});
// 	}, (err) => {
// 		logger.error('[ApplicationsCtrl.get()] Error getting project(s):', JSON.stringify(err));
// 		res.status(500).send('Error getting Application(s).');
// 	});
// };