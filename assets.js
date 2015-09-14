module.exports = {
	vendor:[
		'/bower/kyper-grout/dist/grout.bundle.js',
		'/bower/angular/angular.js',
		'/bower/angular-animate/angular-animate.min.js',
		'/bower/angular-aria/angular-aria.min.js',
		'/bower/ui-router/release/angular-ui-router.min.js',
		'/bower/angular-material/angular-material.min.js',
		'/bower/angular-messages/angular-messages.min.js',
		'/bower/angular-resizable/angular-resizable.min.js',
		'/bower/lodash/lodash.js',

	],
	app:[
		'/app.js',
		'/app-theme.js',
		'/app-routes.js',
		'/app.controller.js',

		'/applications/applications.module.js',
		'/applications/applications.controller.js',
		'/applications/application/application.module.js',
		'/applications/application/application.controller.js',

		'/applications/application/manage/manage.module.js',
		'/applications/application/manage/manage.controller.js',
		
		'/applications/application/configure/configure.module.js',
		'/applications/application/configure/configure.controller.js',

		'/applications/application/build/build.module.js',
		'/applications/application/build/build.controller.js',

		'/applications/application/accounts/accounts.module.js',
		'/applications/application/accounts/accounts.controller.js',
		'/applications/application/accounts/account.controller.js',
		
		'/applications/application/groups/groups.module.js',
		'/applications/application/groups/groups.controller.js',
		'/applications/application/groups/group.controller.js',

		'/applications/application/directories/directories.module.js',
		'/applications/application/directories/directories.controller.js',
		'/applications/application/directories/directory.controller.js',

		'/templates/templates.module.js',
		'/templates/templates.controller.js',
		'/templates/template.controller.js',

		'/account/account.module.js',
		'/account/account.controller.js',

		'/home/home.module.js',
		'/home/home.controller.js',
	]
}