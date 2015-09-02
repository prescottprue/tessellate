angular.module('tessellate.applications')
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
			applicationsService.get($stateParams.name)
			.then(function (applicationData){
				$log.error({description:'Error getting application.', data:applicationData, obj:'ApplicationCtrl'});
				$scope.application = applicationData;
			}).catch(function (err){
				$log.error({description:'Error getting application.', name:$stateParams.name, obj:'ApplicationCtrl'});
				$scope.data.error = err;
			}).finally(function(){
				$scope.data.loading = false;
			});
		} else {
			$log.error({description:'Invalid application id param.', obj:'ApplicationCtrl'})
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
				// $scope.application = apiRes.data;
				$log.log({description:'Application data loaded.', data:appData, func:'update', obj:'ApplicationCtrl'});
			}).catch(function (err){
				$log.error({description:'Error loading applications.', error:err, func:'update', obj:'ApplicationCtrl'});
				$scope.data.error = err;
			}).finally(function(){
				$scope.data.loading = false;
			});
		};
		
}])