angular.module('tessellate.application.accounts')
.controller('AccountsCtrl', ['$log', '$scope', '$grout', 'application', function ($log, $scope, $grout, application){
		$scope.data = {
			loading:true,
			error:null
		};
		$scope.accounts = application.accounts;
		$log.log({description: 'Applicaiton accounts set to scope.', accounts: $scope.accounts});
		$scope.add = function(userData){
			$scope.data.loading = true;
			console.log('calling add with userData:', userData);
			$grout.Users.add(userData).then(function(response){
				console.log('User added successfull', response);
				//TODO: Push response not original data
				$scope.accounts.push(userData);
			}, function(err){
				console.error('Error adding a user', err);
				$scope.data.loading = false;
				$scope.data.error = err;
			});
		};
		$scope.delete = function(ind){
			$scope.data.loading = true;
			var userId = $scope.accounts[ind]._id;
			var username = $scope.accounts[ind].username;
			console.log('calling delete with username:', username);
			$grout.User(username).del().then(function(response){
				console.log('user deleted successfully');
			}, function(err){
				console.error('Error loading accounts', err);
				$scope.data.loading = false;
				$scope.data.error = err;
			});
		};
}])