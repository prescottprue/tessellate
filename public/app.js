angular.module('tessellate', [
    'ui.router', 
    'ngMaterial', 
    'ngMessages',

    'tessellate.account',
    'tessellate.home', 
    'tessellate.users',
    'tessellate.applications'

  ])
.config(function ($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
})
.service('$grout', ['$window', '$log', '$q', function ($window, $log, $q) {
  var grout = new $window.Grout();
  $log.info('new grout:', grout);
  return grout;
}])
//Stop route changes that are not authorized and emit auth events
// .run(function ($rootScope, $state, AUTH_EVENTS, $grout, $log) {
//   //Set current user
//   // $grout.getCurrentUser(function(){
//   //   $log.info('Current user set:', $rootScope.currentUser);
//   // });
//   //Set route change listener to stop naviation for unauthroized roles and emit auth events
//   $rootScope.$on('$stateChangeStart', function (event, next) {
//     if(next.authorizedRoles){
//       var authorizedRoles = next.authorizedRoles;
//         if (!$grout.isInGroups(authorizedRoles)) {
//         event.preventDefault();
//         if ($grout.isLoggedIn) {
//           // user's role is not within authorized roles
//           $log.warn('User not allowed');
//           $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
//           $state.go('login');
//         } else {
//           // user is not logged in
//           $log.warn('User not logged in');
//           $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
//           $state.go('login');
//         }
//       }
//     }
//   });

// })
.directive('stopEvent', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      element.bind('mouseover', function (e){
        e.stopPropagation();
      })
      element.bind('click', function (e) {
        e.stopPropagation();
      });
    }
  };
 })
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
});