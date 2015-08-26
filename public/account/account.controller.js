angular.module('hypercubeServer.account')
.controller('AccountCtrl', ['$scope','AuthService', '$state', '$log', function($scope, AuthService, $state, $log){
	
	// set-up loading state
	$scope.signupData = {
		loading: false,
		missing:{username:false, password:false}
	};
	$scope.loginData = {
		loading: false,
		missing:{username:false, password:false}
	};
	// --------------- Auth Session ----------------- //
	$scope.login = function() {
		if(!$scope.loginData.username || $scope.loginData.username.length < 1){
			$scope.loginData.missing.username = true;
		} else if(!$scope.loginData.password || $scope.loginData.password.length < 1){
			$scope.loginData.missing.password = true;
		} else {
			$scope.loginData.loading = true;
			AuthService.login($scope.loginData)
			.then(function (authData){
				$log.log('Successful login:', authData);
				$scope.loginData.loading = false;
				$scope.showToast("Logged in");
				$state.go('users');
			}, function (err){
				$log.error('Login error:', err);
				$scope.loginData = {loading:false, email:null, password:null};
			});
		}
			
	};
	$scope.logout = function(){
		AuthService.logout().then(function(){
			$log.log('logout successful');
      // $scope.showToast('Successfully Logged Out');
			//TODO: Refresh page after logout
			$state.go('home');
		}, function(err){
			$log.error('Error logging out');
		});
	};
	$scope.signup = function(){
		AuthService.signup($scope.signupForm).then(function(){
			$log.log('Signup successful');
			//TODO: Refresh page after logout
      // $scope.showToast('Successfully signed up');
			$state.go('users');
		}, function(err){
			$log.error('error siging up:', err);
		});
	};
}])