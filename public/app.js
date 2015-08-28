angular.module('tessellate', [
    'ui.router', 
    'ngMaterial', 
    'ngStorage', 
    'angular-jwt',
    'ngMessages',

    'tessellate.auth',
    'tessellate.account',
    'tessellate.nav',
    'tessellate.home', 
    'tessellate.users',
    'tessellate.applications',
    'tessellate.buckets'

  ])
.config(function ($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
})
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
 });