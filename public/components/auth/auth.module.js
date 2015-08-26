angular.module('hypercubeServer.auth', ['ui.router','angular-jwt', 'ngStorage'])
.constant('AUTH_EVENTS', {
  loginSuccess: 'auth-login-success',
  loginFailed: 'auth-login-failed',
  logoutSuccess: 'auth-logout-success',
  sessionTimeout: 'auth-session-timeout',
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
})
//String match for each role
.constant('USER_ROLES', {
  all: '*',
  admin: 'admin',
  editor: 'editor',
  user:'user',
  guest: 'guest'
})