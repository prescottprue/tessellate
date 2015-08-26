angular.module('hypercubeServer.nav')
.controller('NavCtrl', ['$scope', 'AuthService', '$state', '$log', function ($scope, AuthService, $state, $log){
  $scope.logout = function () {
    AuthService.logout().then(function () {
      $scope.showToast("Logout Successful");
      $state.go('home');
    }, function (err){
      console.error('Error logging out:', err);
      $state.go('home');
    });
  };
}])