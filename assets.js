module.exports = {
	vendor:[
		'/bower/angular/angular.js',
		'/bower/angular-animate/angular-animate.min.js',
		'/bower/angular-aria/angular-aria.min.js',
		'/bower/ui-router/release/angular-ui-router.min.js',
		'/bower/angular-material/angular-material.min.js',
		'/bower/angular-messages/angular-messages.min.js',
		'/bower/ngstorage/ngStorage.min.js',
		'/bower/angular-jwt/dist/angular-jwt.min.js',
		'/bower/underscore/underscore-min.js',

	],
	app:[
		'/app.js',
		'/app-theme.js',
		'/app-routes.js',
		'/app.controller.js',

		'/components/auth/auth.module.js',
		'/components/auth/auth.service.js',
		'/components/auth/auth.config.js',
		'/components/auth/auth.directive.js',
		'/components/auth/auth-session.service.js',

		'/components/nav/nav.module.js',
		'/components/nav/nav.controller.js',

		'/users/users.module.js',
		'/users/users.service.js',
		'/users/users.controller.js',
		'/users/user.controller.js',

		'/applications/applications.module.js',
		'/applications/applications.service.js',
		'/applications/applications.controller.js',
		'/applications/application.controller.js',

		'/roles/roles.module.js',
		'/roles/roles.service.js',
		'/roles/roles.controller.js',
		'/roles/role.controller.js',

		'/buckets/buckets.module.js',
		'/buckets/buckets.service.js',
		'/buckets/buckets.controller.js',

		'/account/account.module.js',
		'/account/account.controller.js',

		'/home/home.module.js',
		'/home/home.controller.js',
	]
}