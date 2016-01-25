'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _index = require('../controllers/index');

var indexCtrls = _interopRequireWildcard(_index);

var _auth = require('../controllers/auth');

var authCtrls = _interopRequireWildcard(_auth);

var _users = require('../controllers/users');

var usersCtrls = _interopRequireWildcard(_users);

var _user = require('../controllers/user');

var userCtrls = _interopRequireWildcard(_user);

var _projects = require('../controllers/projects');

var projectCtrls = _interopRequireWildcard(_projects);

var _templates = require('../controllers/templates');

var templateCtrls = _interopRequireWildcard(_templates);

var _admin = require('../controllers/admin');

var adminCtrl = _interopRequireWildcard(_admin);

var _groups = require('../controllers/groups');

var groupsCtrl = _interopRequireWildcard(_groups);

var _authrocket = require('../controllers/authrocket');

var authrocketCtrls = _interopRequireWildcard(_authrocket);

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var upload = (0, _multer2.default)({ dest: 'uploads/' });
exports.default = {
	index: [{
		type: 'GET',
		endpoint: '/',
		controller: indexCtrls.main
	}],
	auth: [{
		type: 'POST',
		endpoint: '/signup',
		controller: authCtrls.signup
	}, {
		type: 'PUT',
		endpoint: '/login',
		controller: authCtrls.login
	}, {
		type: 'PUT',
		endpoint: '/logout',
		controller: authCtrls.logout
	}, {
		type: 'POST',
		endpoint: '/recover',
		controller: authCtrls.recover
	}],
	accounts: [{
		type: 'GET',
		endpoint: '/user',
		controller: authCtrls.verify
	}, {
		type: 'GET',
		endpoint: '/users',
		controller: usersCtrls.get
	}, {
		type: 'GET',
		endpoint: '/users/:username',
		controller: usersCtrls.get
	}, {
		type: 'GET',
		endpoint: '/users/:username/projects',
		controller: userCtrls.getProjects
	}, {
		type: 'POST',
		endpoint: '/users/:username/projects',
		controller: projectCtrls.add
	}, {
		type: 'DELETE',
		endpoint: '/users/:username/projects/:projectName',
		controller: projectCtrls.del
	}, {
		type: 'POST',
		endpoint: '/users',
		controller: usersCtrls.add
	}, {
		type: 'PUT',
		endpoint: '/users/:username',
		controller: usersCtrls.update
	}, {
		type: 'POST',
		middleware: upload.single('image'),
		endpoint: '/users/:username/upload',
		controller: usersCtrls.uploadImage
	}, {
		type: 'DELETE',
		endpoint: '/users/:username',
		controller: usersCtrls.del
	}, {
		type: 'GET',
		endpoint: '/users/search/:searchQuery',
		controller: usersCtrls.search
	}],
	projects: [{
		type: 'GET',
		endpoint: '/projects/:owner',
		controller: projectCtrls.get
	}, {
		type: 'GET',
		endpoint: '/projects/:owner/:name',
		controller: projectCtrls.get
	}, {
		type: 'GET',
		endpoint: '/projects/:owner/:name/providers',
		controller: projectCtrls.getProviders
	}, {
		type: 'PUT',
		endpoint: '/projects/:owner/:name/files',
		controller: projectCtrls.files
	}, {
		type: 'POST',
		endpoint: '/projects/:owner/:project/publish',
		controller: projectCtrls.publishFile
	}, {
		type: 'POST',
		endpoint: '/projects/:owner',
		controller: projectCtrls.add
	}, {
		type: 'POST',
		endpoint: '/projects/:owner/:project/template',
		controller: projectCtrls.applyTemplate
	}, {
		type: 'PUT',
		endpoint: '/projects/:owner/:project',
		controller: projectCtrls.update
	}, {
		type: 'DELETE',
		endpoint: '/projects/:owner/:project',
		controller: projectCtrls.del
	}, {
		type: 'PUT',
		endpoint: '/projects/:owner/:project/storage',
		controller: projectCtrls.addStorage
	}, {
		type: 'PUT',
		endpoint: '/projects/:owner/:project/login',
		controller: projectCtrls.login
	}, {
		type: 'PUT',
		endpoint: '/projects/:owner/:project/signup',
		controller: projectCtrls.signup
	}, {
		type: 'GET',
		endpoint: '/projects/:owner/:project/account',
		controller: projectCtrls.verify
	}, {
		type: 'PUT',
		endpoint: '/projects/:owner/:project/account/:username',
		controller: usersCtrls.update
	}, {
		type: 'PUT',
		endpoint: '/projects/:owner/:project/logout',
		controller: projectCtrls.logout
	}, {
		type: 'POST',
		endpoint: '/projects/:owner/:project/signup',
		controller: projectCtrls.signup
	}, {
		type: 'GET',
		endpoint: '/projects/:owner/:project/groups',
		controller: projectCtrls.groups
	}, {
		type: 'GET',
		endpoint: '/projects/:owner/:project/groups/:groupName',
		controller: projectCtrls.groups
	}, {
		type: 'POST',
		endpoint: '/projects/:owner/:project/groups',
		controller: projectCtrls.addGroup
	}, {
		type: 'PUT',
		endpoint: '/projects/:project/groups/:groupName',
		controller: projectCtrls.updateGroup
	}, {
		type: 'DELETE',
		endpoint: '/projects/:project/groups/:groupName',
		controller: projectCtrls.deleteGroup
	}],
	templates: [{
		type: 'GET',
		endpoint: '/templates',
		controller: templateCtrls.get
	}, {
		type: 'GET',
		endpoint: '/templates/:name',
		controller: templateCtrls.get
	}, {
		type: 'GET',
		endpoint: '/templates/search/:searchQuery',
		controller: templateCtrls.search
	}, {
		type: 'POST',
		endpoint: '/templates',
		controller: templateCtrls.add
	}, {
		type: 'PUT',
		endpoint: '/templates/:name',
		controller: templateCtrls.update
	}, {
		type: 'PUT',
		endpoint: '/templates/:name/upload',
		controller: templateCtrls.upload
	}, {
		type: 'DELETE',
		endpoint: '/templates/:name',
		controller: templateCtrls.del
	}],
	groups: [{
		type: 'GET',
		endpoint: '/groups',
		controller: groupsCtrl.get
	}, {
		type: 'GET',
		endpoint: '/groups/:name',
		controller: groupsCtrl.get
	}, {
		type: 'POST',
		endpoint: '/groups',
		controller: groupsCtrl.add
	}, {
		type: 'PUT',
		endpoint: '/groups/:name',
		controller: groupsCtrl.update
	}, {
		type: 'DELETE',
		endpoint: '/groups/:name',
		controller: groupsCtrl.del
	}]
};