angular.module('hypercubeServer.applications')
.controller('ApplicationCtrl', ['$scope', '$http', '$stateParams', 'applicationsService', 'usersService', function($scope, $http, $stateParams, applicationsService, usersService){
		$scope.data = {
			loading:false,
			error:null,
			editing:false
		};
		//TODO: Move to a resolve
		//Load application data based on name
		if($stateParams.name){
			$scope.data.loading = true;
			console.log('applicationName:', $stateParams.name)
			applicationsService.get($stateParams.name)
			.then(function (applicationData){
				console.log('application Detail Ctrl: application data loaded:', applicationData);
				$scope.application = applicationData;
			}).catch(function (err){
				console.error('application Detail Ctrl: Error loading application with id:' + $stateParams.name, err);
				$scope.data.error = err;
			}).finally(function(){
				$scope.data.loading = false;
			});
		} else {
			console.error('application Detail Ctrl: Invalid application id state param');
			$scope.data.error = 'application Id is required to load application data';
		}
		//TODO: Make owner select an input that searches instead of a dropdown
		$scope.getUsers = function(){
			return usersService.get().then(function(usersList){
				$scope.usersList = usersList;
			});
		};
		$scope.update = function(){
			$scope.data.editing = false;
			$scope.data.loading = true;
			applicationsService.update($stateParams.name, $scope.application)
			.then(function (appData){
				console.log('application Detail Ctrl: application data loaded:', appData);
				// $scope.application = apiRes.data;
			}).catch(function (err){
				console.error('Error loading applications', err);
				$scope.data.error = err;
			}).finally(function(){
				$scope.data.loading = false;
			});
		};
		
}])