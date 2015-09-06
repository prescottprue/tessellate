angular.module('tessellate.applications')
.controller('ApplicationCtrl', ['$scope', '$http', '$stateParams', '$grout', '$log', function ($scope, $http, $stateParams, $grout, $log){
		$scope.data = {
			loading:false,
			error:null,
			editing:false
		};
		//TODO: Move to a resolve
		//Load application data based on name
		if($stateParams.name){
			$scope.data.loading = true;
			$grout.app($stateParams.name).get()
			.then(function (applicationData){
				$log.log({description:'Application loaded successfully.', data:applicationData, obj:'ApplicationCtrl'});
				$scope.application = applicationData;
				$scope.data.loading = false;
				$scope.$apply();
			}).catch(function (err){
				$log.error({description:'Error getting application.', name:$stateParams.name, obj:'ApplicationCtrl'});
				$scope.data.error = err;
				$scope.data.loading = false;
			});
		} else {
			$log.error({description:'Invalid application id param.', obj:'ApplicationCtrl'})
			$scope.data.error = 'application Id is required to load application data';
		}
		//TODO: Make owner select an input that searches instead of a dropdown
		$scope.searchUsers = function(query){
			return $grout.users().search(query).then(function(usersList){
				$scope.usersList = usersList;
			});
		};
		$scope.update = function(){
			$scope.data.editing = false;
			$scope.data.loading = true;
			//TODO: Only compare against original to only send update
			$grout.app($stateParams.name).update($scope.application)
			.then(function (appData){
				$scope.application = appData;
				$log.log({description:'Application updated successfully.', data:appData, func:'update', obj:'ApplicationCtrl'});
			}).catch(function (err){
				$log.error({description:'Error updating application.', error:err, func:'update', obj:'ApplicationCtrl'});
				$scope.data.error = err;
			}).finally(function(){
				$scope.data.loading = false;
			});
		};
		
}])