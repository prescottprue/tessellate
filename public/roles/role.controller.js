angular.module('hypercubeServer.roles')
.controller('RoleController', ['$scope', '$stateParams', 'rolesService', function ($scope, $stateParams, rolesService){
		$scope.data = {
			loading:false,
			error:null,
			editing:false
		};

		if($stateParams.name){
			$scope.data.loading = true;
			console.log('role name:', $stateParams.name)
			rolesService.get($stateParams.name)
			.then(function (roleData){
				console.log('Role Detail Ctrl: role data loaded:', roleData);
				$scope.role = roleData;
			}).catch(function (err){
				console.error('Role Detail Ctrl: Error loading role with id:' + $stateParams.name, err);
				$scope.data.error = err;
			}).finally(function(){
				$scope.data.loading = false;
			});
		} else {
			console.error('Role Detail Ctrl: Invalid role id state param');
			$scope.data.error = 'Role Id is required to load role data';
		}

		$scope.update = function(){
			$scope.data.editing = false;
			$scope.data.loading = true;
			rolesService.update($stateParams.name, $scope.role)
			.then(function (updatedRoleData){
				console.log('Role Detail Ctrl: Role data loaded:', updatedRoleData);
				// $scope.role = apiRes.data;
			}).catch(function (err){
				console.error('Error loading roles', err);
				$scope.data.error = err;
			}).finally(function(){
				$scope.data.loading = false;
			});
		};
		
}])