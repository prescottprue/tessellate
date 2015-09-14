angular.module('tessellate.application.build', ['angularResizable', 'ui.ace', 'treeControl', 'ngFileUpload'])
  .config(function ($httpProvider) {
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    })