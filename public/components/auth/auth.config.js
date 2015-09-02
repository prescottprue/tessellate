angular.module('tessellate.auth')
//Stop route changes that are not authorized and emit auth events
.run(function ($rootScope, $state, AUTH_EVENTS, AuthService, $log) {
  //Set current user
  AuthService.getCurrentUser().then(function(userData){
    $log.log({description: 'Current user set', data:userData});
  });
  //Set route change listener to stop naviation for unauthroized roles and emit auth events
  $rootScope.$on('$stateChangeStart', function (event, next) {
    if(next.authorizedRoles){
      var authorizedRoles = next.authorizedRoles;
        if (!AuthService.isAuthorized(authorizedRoles)) {
        event.preventDefault();
        if (AuthService.isAuthenticated()) {
          // user's role is not within authorized roles
          $log.warn('User not allowed');
          $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
          $state.go('login');
        } else {
          // user is not logged in
          $log.warn('User not logged in');
          $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
          $state.go('login');
        }
      }
    }
  });

})
//Intercept $http responses
.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS, $log) {
  return {
    //Broadcast auth error events
    responseError: function (response) { 
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
        403: AUTH_EVENTS.notAuthorized,
        419: AUTH_EVENTS.sessionTimeout,
        440: AUTH_EVENTS.sessionTimeout
      }[response.status], response);
      return $q.reject(response);
    }
  };
})