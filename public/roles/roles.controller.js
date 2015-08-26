angular.module('hypercubeServer.roles')
.controller('RolesCtrl', ['$scope','rolesService', function($scope,rolesService){
		$scope.data = {
			loading:true,
			error:null
		};
		rolesService.get().then(function (rolesList){
			$scope.data.loading = false;
			console.log('roles list loaded:', rolesList);
			$scope.roles = rolesList;
		}, function (err){
			console.error('Error loading roles', err);
			$scope.data.loading = false;
			$scope.data.error = err;
		});
		$scope.delete = function(ind){
			$scope.data.loading = true;
			var userId = $scope.roles[ind]._id;
			console.log('calling delete role with id:', userId);
			rolesService.delete(userId).then(function(response){
				console.log('role deleted successfully');
			}, function(err){
				console.error('Error loading roles', err);
				$scope.data.loading = false;
				$scope.data.error = err;
			});
		};
}])