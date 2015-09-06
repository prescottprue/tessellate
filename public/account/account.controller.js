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
			//TODO: Refresh page after logout
			$state.go('home');
		}, function(err){
			$log.error('Error logging out');
		});
	};
	$scope.signup = function(){
		$grout.signup($scope.signupForm).then(function(){
			$log.log('Signup successful');
			//TODO: Refresh page after logout
      // $scope.showToast('Successfully signed up');
			$state.go('users');
		}, function(err){
			$log.error('error siging up:', err);
		});
	};
}])