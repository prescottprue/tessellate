angular.module('tessellate.application.manage', [])
  .config(function ($httpProvider) {
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    })