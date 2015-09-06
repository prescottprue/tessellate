angular.module('tessellate.applications')
.controller('ApplicationsCtrl', ['$scope', '$http', '$log', '$mdDialog', '$grout', '$state', function ($scope, $http, $log, $mdDialog, $grout, $state){
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
		var mdDialogCtrl = function($scope, dataToPass){
			// $scope.mdDialogData = dataToPass  
			console.log('dialog controller');
		};
		$scope.startNew = function(){
			console.log("start new called");
			$mdDialog.show({
				locals:{dataToPass: $scope.createApp},
				clickOutsideToClose:true,
				controllerAs:'ctrl',
				controller: mdDialogCtrl,
	      templateUrl: '/applications/applications-new.html',
			}).then(function(answer) {
				$log.info('Create answered:', answer);
	      $scope.createApp(answer);
	    }, function() {
	    	$log.log('New Dialog was canceled');
	    });
		};

		$scope.createApp = function(appData){
			$scope.data.loading = true;
			$grout.apps.add(appData).then(function (newApp){
				$scope.data.loading = false;
				$log.log('Application created successfully:', newApp);
				$state.go('app.settings', {name:newApp.name});
			}, function(err){
				$log.error('[ApplicationsCtrl.create()] Error creating application:', err);
				$scope.data.loading = false;
				$scope.data.error = err;
				$scope.showToast('Error: ' + err.message || err);
			});
		};
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