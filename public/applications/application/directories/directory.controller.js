angular.module('tessellate.application.directories')
.controller('DirectoryCtrl', ['$scope',  '$state', '$log', '$grout', '$stateParams',  function ($scope, $state, $log, $grout, $stateParams){
		// $log.log('ApplicationsCtrl');
		$grout.group($stateParams.name).get().then(function (group){
			$scope.group = group;
		});
}]);