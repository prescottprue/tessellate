angular.module('tessellate.application.directories')
.controller('DirectoriesCtrl', ['$scope',  '$state', '$log', '$grout', 'application', function ($scope, $state, $log, $grout, application){
		// $log.log('ApplicationsCtrl');
		$scope.directories = application.directories;
		// $grout.directories.get().then(function (directories){
		// 	$scope.directories = directories;
		// 	$scope.$apply();
		// });
}]);