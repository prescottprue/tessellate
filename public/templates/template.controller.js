angular.module('tessellate.templates')
.controller('TemplateCtrl', ['$scope',  '$state', '$log', '$grout', '$stateParams',  function ($scope, $state, $log, $grout, $stateParams){
		// $log.log('ApplicationsCtrl');
		$grout.template($stateParams.name).get().then(function (templates){
			$scope.templates = templates;
		});
}]);