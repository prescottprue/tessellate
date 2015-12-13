'use strict';

var express = require('express');
var indexCtrls = require('../controllers/index');
var authCtrls = require('../controllers/auth');
var accountCtrls = require('../controllers/accounts');
var appCtrls = require('../controllers/applications');
var templateCtrls = require('../controllers/templates');
var adminCtrl = require('../controllers/admin');
var groupsCtrl = require('../controllers/groups');
var authrocketCtrls = require('../controllers/authrocket');

module.exports = {
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
	}],
	accounts: [{
		type: 'GET',
		endpoint: '/account',
		controller: authCtrls.verify
	}, {
		type: 'GET',
		endpoint: '/accounts',
		controller: accountCtrls.get
	}, {
		type: 'GET',
		endpoint: '/accounts/:username',
		controller: accountCtrls.get
	}, {
		type: 'POST',
		endpoint: '/accounts',
		controller: accountCtrls.add
	}, {
		type: 'PUT',
		endpoint: '/account/:username',
		controller: accountCtrls.update
	}, {
		type: 'DELETE',
		endpoint: '/accounts/:username',
		controller: accountCtrls['delete']
	}, {
		type: 'GET',
		endpoint: '/accounts/search/:searchQuery',
		controller: accountCtrls.search
	}],
	users: [{
		type: 'GET',
		endpoint: '/user',
		controller: authCtrls.verify
	}, {
		type: 'GET',
		endpoint: '/users',
		controller: accountCtrls.get
	}, {
		type: 'GET',
		endpoint: '/users/:username',
		controller: accountCtrls.get
	}, {
		type: 'POST',
		endpoint: '/users',
		controller: accountCtrls.add
	}, {
		type: 'PUT',
		endpoint: '/user/:username',
		controller: accountCtrls.update
	}, {
		type: 'DELETE',
		endpoint: '/users/:username',
		controller: accountCtrls['delete']
	}, {
		type: 'GET',
		endpoint: '/users/search/:searchQuery',
		controller: accountCtrls.search
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
		controller: appCtrls['delete']
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
		controller: accountCtrls.update
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
		controller: templateCtrls['delete']
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
		controller: groupsCtrl['delete']
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