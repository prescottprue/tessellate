angular.module('tessellate.applications')
.controller('ApplicationsCtrl', ['$scope', '$http', '$log', '$mdDialog', '$grout', function ($scope, $http, $log, $mdDialog, $grout){
		$scope.data = {
			loading:true,
			error:null
		};
		console.log('ApplicationListController');
		$grout.apps.get().then(function (applicationsList){
			$log.log('applications list loaded:', applicationsList);
			$scope.data.loading = false;
			$scope.applications = applicationsList;
			//TODO: Move this to grout service to remove $apply
			$scope.$apply();
		}, function (err){
			$log.error('Error loading applications', err);
			$scope.data.loading = false;
			$scope.data.error = err;
		});
		$scope.delete = function(ind, ev){
			$scope.data.loading = true;
			var application = $scope.applications[ind];
			$scope.showConfirm(ev, {title:"Delete", description:"Are you sure you want to delete " + application.name + " ?"}).then(function(){
				$log.log('calling delete with id:', application._id);
				$grout.app(application.name).del().then(function(deletedApp){
					$log.log('application deleted successfully', deletedApp);
					$scope.applications.splice(ind, 1);
				}, function(err){
					$log.error('Error loading applications', err);
					$scope.data.loading = false;
					$scope.data.error = err;
				});
			});
		};

}])