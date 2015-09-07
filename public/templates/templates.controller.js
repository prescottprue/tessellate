angular.module('tessellate.templates')
.controller('TemplatesCtrl', ['$scope',  '$state', '$log', '$grout', function ($scope, $state, $log, $grout){
		// $log.log('ApplicationsCtrl');
		$grout.templates.get().then(function (templates){
			$scope.templates = templates;
			$scope.$apply();
		});
}]);