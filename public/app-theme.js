angular.module('hypercubeServer')
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('blue')
    .accentPalette('green')
  $mdThemingProvider.theme('docs-dark', 'default').dark();
})