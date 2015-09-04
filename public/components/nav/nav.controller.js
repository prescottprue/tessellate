angular.module('tessellate')
.controller('NavCtrl', ['$scope',  '$state', '$log', '$grout', function ($scope, $state, $log, $grout){
  $scope.logout = function () {
    $grout.logout().then(function () {
      $scope.showToast("Logout Successful");
      $state.go('home');
    }, function (err){
      console.error('Error logging out:', err);
      $state.go('home');
    });
  };
	$grout.currentUser.then(function(userData){
		$log.log('Current user loaded:', userData);
		$scope.currentUser = userData;
	})
}])