angular.module('hypercubeServer.auth')

.directive('authRoles', ['AuthService', function(AuthService) {
  return {
    restrict: 'A',  // Forces the directive to be an attribute.
    transclude: 'element',
    scope:{
    	authRoles:'@'
    },
    link: function link(scope, element, attrs) {
      scope.$watch('authRoles', function(value, oldValue) {
        if (AuthService.isAuthorized(value.split(","))) {
          element.addClass("ng-hide");
        }
      }, true);
    }
  };
}])