angular.module('tessellate.applications')
.controller('ApplicationsCtrl', ['$scope', '$http', '$log', '$mdDialog', '$grout', '$state', function ($scope, $http, $log, $mdDialog, $grout, $state){
		$scope.data = {
			loading:true,
			error:null,
			selectedAccounts:[],
			selectedAccount:null
		};
		console.log('ApplicationListController');
		$grout.Apps.get().then(function (applicationsList){
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
		$scope.startNew = function(ev){
			$mdDialog.show({
				controller: function($scope, $mdDialog, $grout, $q){
					$scope.data = {
						minLength:1,  //Hide search dropdown initially
						loading:true,
						error:null,
						selectedAccounts:[],
						selectedAccount:null
					};
					//Answer with newAppData
					$scope.create = function(newAppData){
						//Make collaborators array from selectedAccounts ids
						newAppData.collaborators = _.pluck($scope.data.selectedAccounts, 'id');
						$mdDialog.hide(newAppData);
					};
					//Cancel dialog
					$scope.cancel = function(){
						$mdDialog.cancel();
					};
					//Search templates based on input
					$scope.templateSearch = function(searchText){
						return $grout.Templates.search(searchText);
					};
					//Search users based on input
					$scope.collabSearch = function(searchText){
						return $grout.Accounts.search(searchText);
					};
				},
	      templateUrl: 'applications/applications-new.html',
	      parent: angular.element(document.body),
	      targetEvent: ev,
			}).then(function(answer) {
				$log.info('Create answered:', answer);
	      $scope.createApp(answer);
	    }, function() {
	    	// $log.log('New Dialog was canceled');
	    });
		};

		$scope.createApp = function(appData){
			$scope.data.loading = true;
			$log.log({description: 'Create app called.', appData: appData, func: 'createApp', obj: 'ApplicationsCtrl'});
			$grout.Apps.add(appData).then(function (newApp){
				$scope.data.loading = false;
				$log.log({description: 'App created successfully.', app: newApp, func: 'createApp', obj: 'ApplicationsCtrl'});
				$state.go('app.settings', {name:newApp.name});
			}, function (err){
				$log.error({description: 'Error creating application.', error: err, func: 'createApp', obj: 'ApplicationsCtrl'});
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
				$grout.App(application.name).del().then(function(deletedApp){
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