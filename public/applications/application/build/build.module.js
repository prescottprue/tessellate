angular.module('tessellate.application.build', ['angularResizable'])
  .config(function ($httpProvider) {
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    })