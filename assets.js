module.exports = {
	vendor:[
		'/bower/kyper-grout/dist/grout.bundle.js',
		'/bower/angular/angular.js',
		'/bower/angular-animate/angular-animate.min.js',
		'/bower/angular-aria/angular-aria.min.js',
		'/bower/ui-router/release/angular-ui-router.min.js',
		'/bower/angular-material/angular-material.min.js',
		'/bower/angular-messages/angular-messages.min.js',
		'/bower/lodash/lodash.js'

	],
	app:[
		'/app.js',
		'/app-theme.js',
		'/app-routes.js',
		'/app.controller.js',

		'/components/nav/nav.controller.js',

		'/users/users.module.js',
		'/users/users.controller.js',
		'/users/user.controller.js',

		'/applications/applications.module.js',
		'/applications/applications.controller.js',
		'/applications/application.controller.js',

		'/buckets/buckets.module.js',
		'/buckets/buckets.service.js',
		'/buckets/buckets.controller.js',

		'/account/account.module.js',
		'/account/account.controller.js',

		'/home/home.module.js',
		'/home/home.controller.js',
	]
}