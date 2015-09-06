angular.module('tessellate')
.controller('UserCtrl', ['$scope', '$http', '$stateParams','$grout', function ($scope, $http, $stateParams, $grout){
		$scope.data = {
			loading:false,
			error:null,
			editing:false
		};
		if($stateParams.username){
			$scope.data.loading = true;
			$grout.user($stateParams.username).get()
			.then(function (userData){
				console.log('User Detail Ctrl: user data loaded:', userData);
				$scope.user = userData;
				$scope.$apply();
				$scope.data.loading = false;
			}).catch(function (err){
				console.error('User Detail Ctrl: Error loading user with username:' + $stateParams.username, err);
				$scope.data.error = err;
				$scope.data.loading = false;
			});
		} else {
			console.error('User Detail Ctrl: Invalid user id state param');
			$scope.data.error = 'User Id is required to load user data';
		}

		// $scope.getRoles = function(){
		// 	return rolesService.get().then(function(rolesList){
		// 		$scope.rolesList = rolesList;
		// 	});
		// };
		$scope.update = function(){
			$scope.data.editing = false;
			$scope.data.loading = true;
			var userData = $scope.user;
			$grout.user($stateParams.username).update(userData)
			.then(function (updatedUserData){
				console.log('User Detail Ctrl: User data loaded:', updatedUserData);
				// $scope.user = apiRes.data;
			}).catch(function (err){
				console.error('Error loading users', err);
				$scope.data.error = err;
			}).finally(function(){
				$scope.data.loading = false;
			});
		};
		
}])