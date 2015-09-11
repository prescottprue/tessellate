angular.module('tessellate.application.groups')
.controller('GroupCtrl', ['$scope',  '$state', '$log', '$grout', '$stateParams', 'application',  function ($scope, $state, $log, $grout, $stateParams, application){
		// $log.log('GroupCtrl');
		$scope.group = _.findWhere(application.groups, {name: $stateParams.groupName});
		$log.log('GroupCtrl loaded group:', $scope.group);

		//TODO: Load from server if not available
		// $grout.Group($stateParams.name).get().then(function (group){
		// 	$scope.group = group;
		// });
}]);