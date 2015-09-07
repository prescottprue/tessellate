angular.module('tessellate.application.groups')
.controller('GroupsCtrl', ['$scope',  '$state', '$log', '$grout', function ($scope, $state, $log, $grout){
		// $log.log('ApplicationsCtrl');
		$grout.groups.get().then(function (groups){
			$scope.groups = groups;
			$scope.$apply();
		});
}]);