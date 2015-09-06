angular.module('tessellate.account')
.controller('AccountCtrl', ['$scope', '$state', '$log', '$grout', function($scope, $state, $log, $grout){
	
	// set-up loading state
	$scope.signupData = {
		loading: false,
		missing:{username:false, password:false}
	};
	// $scope.loginData = {
	// 	loading: false,
	// 	missing:{username:false, password:false}
	// };
	// --------------- Auth Session ----------------- //

	$scope.logout = function(){
		$grout.logout().then(function(){
			$log.log('logout successful');
      // $scope.showToast('Successfully Logged Out');
			$state.go('home');
		}, function(err){
			$log.error('Error logging out');
		});
	};
	$scope.signup = function(){
		$grout.signup($scope.signupForm).then(function(){
			$log.log('Signup successful');
      $scope.showToast('Welcome!');
			$state.go('users');
		}, function(err){
			$log.error('error siging up:', err);
		});
	};
	$scope.userData = angular.copy($scope.currentUser);
	$scope.update = function() {
		//TODO: Compare and only send data that was modified
		$grout.updateProfile($scope.userData).then(function(){
			$log.log('Profile update successful.');
      $scope.showToast('Successfully signed up');
			$state.go('users');
		}, function(err){
			$log.error('error siging up:', err);
		});
	};
}])