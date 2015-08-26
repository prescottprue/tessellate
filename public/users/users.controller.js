angular.module('hypercubeServer.users')
.controller('UsersCtrl', ['$scope', '$http', 'usersService', function($scope, $http, usersService){
		$scope.data = {
			loading:true,
			error:null
		};
		usersService.get().then(function (usersList){
			$scope.data.loading = false;
			console.log('users list loaded:', usersList);
			$scope.users = usersList;
		}, function (err){
			console.error('Error loading users', err);
			$scope.data.loading = false;
			$scope.data.error = err;
		});
		$scope.delete = function(ind){
			$scope.data.loading = true;
			var userId = $scope.users[ind]._id;
			console.log('calling delete with id:', userId);
			usersService.delete(userId).then(function(response){
				console.log('user deleted successfully');
			}, function(err){
				console.error('Error loading users', err);
				$scope.data.loading = false;
				$scope.data.error = err;
			});
		};
}])