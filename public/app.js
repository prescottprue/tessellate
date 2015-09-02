angular.module('tessellate', [
    'ui.router', 
    'ngMaterial', 
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
.service('$grout', ['$window', '$log', function ($window, $log) {
  var grout = new $window.Grout();
  $log.info('new grout:', grout);
  return grout;
}])
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