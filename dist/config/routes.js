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

var _accounts = require('../controllers/accounts');

var accountsCtrls = _interopRequireWildcard(_accounts);

var _account = require('../controllers/account');

var accountCtrls = _interopRequireWildcard(_account);

var _applications = require('../controllers/applications');

var appCtrls = _interopRequireWildcard(_applications);

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

	// {
	// 	type:'GET',
	// 	endpoint:'/test',
	// 	controller: indexCtrls.test
	// }
	authRocket: [{
		type: 'POST',
		endpoint: '/authrocket',
		controller: authrocketCtrls.events
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
		endpoint: '/account',
		controller: authCtrls.verify
	}, {
		type: 'GET',
		endpoint: '/accounts',
		controller: accountsCtrls.get
	}, {
		type: 'GET',
		endpoint: '/accounts/:username',
		controller: accountsCtrls.get
	}, {
		type: 'GET',
		endpoint: '/accounts/:username/projects',
		controller: accountCtrls.getProjects
	}, {
		type: 'POST',
		endpoint: '/accounts',
		controller: accountsCtrls.add
	}, {
		type: 'PUT',
		endpoint: '/account/:username',
		controller: accountsCtrls.update
	}, {
		type: 'POST',
		middleware: upload.single('image'),
		endpoint: '/accounts/:username/upload',
		controller: accountsCtrls.uploadImage
	}, {
		type: 'DELETE',
		endpoint: '/accounts/:username',
		controller: accountsCtrls.del
	}, {
		type: 'GET',
		endpoint: '/accounts/search/:searchQuery',
		controller: accountsCtrls.search
	}],
	//Alias of account(s)
	users: [{
		type: 'GET',
		endpoint: '/user',
		controller: authCtrls.verify
	}, {
		type: 'GET',
		endpoint: '/users',
		controller: accountsCtrls.get
	}, {
		type: 'GET',
		endpoint: '/users/:username',
		controller: accountsCtrls.get
	}, {
		type: 'POST',
		endpoint: '/users',
		controller: accountsCtrls.add
	}, {
		type: 'PUT',
		endpoint: '/user/:username',
		controller: accountsCtrls.update
	}, {
		type: 'POST',
		endpoint: '/users/:username/upload',
		controller: accountsCtrls.uploadImage
	}, {
		type: 'DELETE',
		endpoint: '/users/:username',
		controller: accountsCtrls.del
	}, {
		type: 'GET',
		endpoint: '/users/search/:searchQuery',
		controller: accountsCtrls.search
	}],
	applications: [{
		type: 'GET',
		endpoint: '/apps',
		controller: appCtrls.get
	}, {
		type: 'GET',
		endpoint: '/apps/:name',
		controller: appCtrls.get
	}, {
		type: 'GET',
		endpoint: '/apps/:name/providers',
		controller: appCtrls.getProviders
	}, {
		type: 'PUT',
		endpoint: '/apps/:name/files',
		controller: appCtrls.files
	}, {
		type: 'POST',
		endpoint: '/apps/:name/publish',
		controller: appCtrls.publishFile
	}, {
		type: 'POST',
		endpoint: '/apps',
		controller: appCtrls.add
	}, {
		type: 'POST',
		endpoint: '/apps/:name/template',
		controller: appCtrls.applyTemplate
	}, {
		type: 'PUT',
		endpoint: '/apps/:name',
		controller: appCtrls.update
	}, {
		type: 'DELETE',
		endpoint: '/apps/:name',
		controller: appCtrls.del
	}, {
		type: 'PUT',
		endpoint: '/apps/:name/storage',
		controller: appCtrls.addStorage
	}, {
		type: 'PUT',
		endpoint: '/apps/:name/login',
		controller: appCtrls.login
	}, {
		type: 'PUT',
		endpoint: '/apps/:name/signup',
		controller: appCtrls.signup
	}, {
		type: 'GET',
		endpoint: '/apps/:name/account',
		controller: appCtrls.verify
	}, {
		type: 'PUT',
		endpoint: '/apps/:name/account/:username',
		controller: accountsCtrls.update
	}, {
		type: 'PUT',
		endpoint: '/apps/:name/logout',
		controller: appCtrls.logout
	}, {
		type: 'POST',
		endpoint: '/apps/:name/signup',
		controller: appCtrls.signup
	}, {
		type: 'GET',
		endpoint: '/apps/:name/groups',
		controller: appCtrls.groups
	}, {
		type: 'GET',
		endpoint: '/apps/:name/groups/:groupName',
		controller: appCtrls.groups
	}, {
		type: 'POST',
		endpoint: '/apps/:name/groups',
		controller: appCtrls.addGroup
	}, {
		type: 'PUT',
		endpoint: '/apps/:name/groups/:groupName',
		controller: appCtrls.updateGroup
	}, {
		type: 'DELETE',
		endpoint: '/apps/:name/groups/:groupName',
		controller: appCtrls.deleteGroup
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
	}],
	admin: [{
		type: 'GET',
		endpoint: '/admin/buckets',
		controller: adminCtrl.getBuckets
	}, {
		type: 'DELETE',
		endpoint: '/admin/buckets',
		controller: adminCtrl.deleteBucket
	}]
};