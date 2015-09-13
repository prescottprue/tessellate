angular.module('tessellate.application.accounts')
.controller('AccountCtrl', ['$log', '$scope', '$stateParams', '$state', '$grout', function ($log, $scope, $stateParams, $state, $grout){
		$scope.data = {
			loading:false,
			error:null,
			editing:false
		};
		if($stateParams.username){
			$scope.data.loading = true;
			$grout.Account($stateParams.username).get()
			.then(function (accountData){
				$log.log({description: 'Account data loaded into scope.', accountData: accountData});
				$scope.account = accountData;
				$scope.$apply();
				$scope.data.loading = false;
			}).catch(function (err){
				$log.error('User Detail Ctrl: Error loading account with username:' + $stateParams.username, err);
				$scope.data.error = err;
				$scope.data.loading = false;
			});
		}
		// $scope.getRoles = function(){
		// 	return rolesService.get().then(function(rolesList){
		// 		$scope.rolesList = rolesList;
		// 	});
		// };
		$scope.update = function(){
			$scope.data.editing = false;
			$scope.data.loading = true;
			var accountData = $scope.account;
			$grout.Account($stateParams.username).update(accountData)
			.then(function (updatedUserData){
				console.log('User Detail Ctrl: User data loaded:', updatedUserData);
				// $scope.account = apiRes.data;
			}).catch(function (err){
				console.error('Error loading users', err);
				$scope.data.error = err;
			}).finally(function(){
				$scope.data.loading = false;
			});
		};
		
}])