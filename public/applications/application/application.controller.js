angular.module('tessellate.application')
.controller('ApplicationCtrl', ['$scope', '$http', '$stateParams', '$grout', '$log','applications', 'application', function ($scope, $http, $stateParams, $grout, $log, applications, application){
		$scope.data = {
			loading:false,
			error:null,
			editing:false
		};
		//TODO: Move to a resolve
		//Load application data based on name
		$scope.applications = applications;
		
		$scope.application = application;
		//TODO: Make owner select an input that searches instead of a dropdown
		$scope.searchUsers = function(query){
			return $grout.Accounts.search(query).then(function(usersList){
				$scope.usersList = usersList;
			});
		};
		$scope.update = function(){
			$scope.data.editing = false;
			$scope.data.loading = true;
			//TODO: Only compare against original to only send update
			$grout.App($stateParams.name).update($scope.application)
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