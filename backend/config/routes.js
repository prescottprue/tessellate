import express from 'express';
import * as indexCtrls from '../controllers/index';
import * as authCtrls from '../controllers/auth';
import * as usersCtrls from '../controllers/users';
import * as userCtrls from '../controllers/user';
import * as projectCtrls from '../controllers/projects';
import * as templateCtrls from '../controllers/templates';
import * as adminCtrl from '../controllers/admin';
import * as groupsCtrl from '../controllers/groups';
import * as authrocketCtrls from '../controllers/authrocket';
import multer from 'multer';
let upload = multer({dest: 'uploads/'});
export default {
	index:[
		{
			type:'GET',
			endpoint:'/',
			controller: indexCtrls.main
		}
	],
	auth:[
		{
			type:'POST',
			endpoint: '/signup',
			controller: authCtrls.signup
		},
		{
			type:'PUT',
			endpoint: '/login',
			controller: authCtrls.login
		},
		{
			type:'PUT',
			endpoint: '/logout',
			controller: authCtrls.logout
		},
		{
			type:'POST',
			endpoint: '/recover',
			controller: authCtrls.recover
		}
	],
	accounts:[
		{
			type:'GET',
			endpoint: '/user',
			controller: authCtrls.verify
		},
		{
			type:'GET',
			endpoint: '/users',
			controller: usersCtrls.get
		},
		{
			type:'GET',
			endpoint: '/users/:username',
			controller: usersCtrls.get
		},
		{
			type:'GET',
			endpoint: '/users/:username/projects',
			controller: userCtrls.getProjects
		},
		{
			type:'POST',
			endpoint: '/users/:username/projects',
			controller: projectCtrls.add
		},
		{
			type:'DELETE',
			endpoint: '/users/:username/projects/:projectName',
			controller: projectCtrls.del
		},
		{
			type:'POST',
			endpoint: '/users',
			controller: usersCtrls.add
		},
		{
			type:'PUT',
			endpoint: '/users/:username',
			controller: usersCtrls.update
		},
		{
			type:'POST',
			middleware: upload.single('image'),
			endpoint: '/users/:username/upload',
			controller: usersCtrls.uploadImage
		},
		{
			type:'DELETE',
			endpoint: '/users/:username',
			controller: usersCtrls.del
		},
		{
			type:'GET',
			endpoint: '/users/search/:searchQuery',
			controller: usersCtrls.search
		}
	],
	projects:[
		{
			type:'GET',
			endpoint: '/projects/:owner',
			controller: projectCtrls.get
		},
		{
			type:'GET',
			endpoint: '/projects/:owner/:name',
			controller: projectCtrls.get
		},
		{
			type:'GET',
			endpoint: '/projects/:owner/:name/providers',
			controller: projectCtrls.getProviders
		},
		{
			type:'PUT',
			endpoint: '/projects/:owner/:name/files',
			controller: projectCtrls.files
		},
		{
			type:'POST',
			endpoint: '/projects/:owner/:project/publish',
			controller: projectCtrls.publishFile
		},
		{
			type:'POST',
			endpoint: '/projects/:owner',
			controller: projectCtrls.add
		},
		{
			type:'POST',
			endpoint: '/projects/:owner/:project/template',
			controller: projectCtrls.applyTemplate
		},
		{
			type:'PUT',
			endpoint: '/projects/:owner/:project',
			controller: projectCtrls.update
		},
		{
			type:'DELETE',
			endpoint: '/projects/:owner/:project',
			controller: projectCtrls.del
		},
		{
			type:'PUT',
			endpoint: '/projects/:owner/:project/storage',
			controller: projectCtrls.addStorage
		},
		{
			type:'PUT',
			endpoint: '/projects/:owner/:project/login',
			controller: projectCtrls.login
		},
		{
			type:'PUT',
			endpoint: '/projects/:owner/:project/signup',
			controller: projectCtrls.signup
		},
		{
			type:'GET',
			endpoint: '/projects/:owner/:project/account',
			controller: projectCtrls.verify
		},
		{
			type:'PUT',
			endpoint: '/projects/:owner/:project/account/:username',
			controller: usersCtrls.update
		},
		{
			type:'PUT',
			endpoint: '/projects/:owner/:project/logout',
			controller: projectCtrls.logout
		},
		{
			type:'POST',
			endpoint:'/projects/:owner/:project/signup',
			controller: projectCtrls.signup
		},
		{
			type:'GET',
			endpoint: '/projects/:owner/:project/groups',
			controller: projectCtrls.groups
		},
		{
			type:'GET',
			endpoint: '/projects/:owner/:project/groups/:groupName',
			controller: projectCtrls.groups
		},
		{
			type:'POST',
			endpoint: '/projects/:owner/:project/groups',
			controller: projectCtrls.addGroup
		},
		{
			type:'PUT',
			endpoint: '/projects/:project/groups/:groupName',
			controller: projectCtrls.updateGroup
		},
		{
			type:'DELETE',
			endpoint: '/projects/:project/groups/:groupName',
			controller: projectCtrls.deleteGroup
		}
	],
	templates:[
		{
			type:'GET',
			endpoint: '/templates',
			controller: templateCtrls.get
		},
		{
			type:'GET',
			endpoint: '/templates/:name',
			controller: templateCtrls.get
		},
		{
			type:'GET',
			endpoint: '/templates/search/:searchQuery',
			controller: templateCtrls.search
		},
		{
			type:'POST',
			endpoint: '/templates',
			controller: templateCtrls.add
		},
		{
			type:'PUT',
			endpoint: '/templates/:name',
			controller: templateCtrls.update
		},
		{
			type:'PUT',
			endpoint: '/templates/:name/upload',
			controller: templateCtrls.upload
		},
		{
			type:'DELETE',
			endpoint: '/templates/:name',
			controller: templateCtrls.del
		}
	],
	groups:[
		{
			type:'GET',
			endpoint: '/groups',
			controller: groupsCtrl.get
		},
		{
			type:'GET',
			endpoint: '/groups/:name',
			controller: groupsCtrl.get
		},
		{
			type:'POST',
			endpoint: '/groups',
			controller:groupsCtrl.add
		},
		{
			type:'PUT',
			endpoint: '/groups/:name',
			controller:groupsCtrl.update
		},
		{
			type:'DELETE',
			endpoint: '/groups/:name',
			controller:groupsCtrl.del
		}
	],
};
