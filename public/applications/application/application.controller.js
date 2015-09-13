angular.module('tessellate.application')
.controller('ApplicationCtrl', ['$scope', '$http', '$stateParams', '$grout', '$log','applications', 'application', function ($scope, $http, $stateParams, $grout, $log, applications, application){
		$scope.data = {
			loading:false,
			error:null,
			editing:false
		};
		//Load the applications list into scope
		$scope.applications = applications;

		//Load application data based on name
		$scope.application = application;

		$scope.update = function(){
			$scope.data.editing = false;
			$scope.data.loading = true;
			//TODO: Only compare against original to only send update
			$grout.App($stateParams.name).update($scope.application)
			.then(function (appData){
				$scope.data.loading = false;
				$scope.application = appData;
				$log.log({description:'Application updated successfully.', data:appData, func:'update', obj:'ApplicationCtrl'});
			},function (err){
				$scope.data.loading = false;

				$log.error({description:'Error updating application.', error:err, func:'update', obj:'ApplicationCtrl'});
				$scope.data.error = err;
			});
		};
}])