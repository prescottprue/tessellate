angular.module('tessellate.application.configure', [])
  .config(function ($httpProvider) {
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    })