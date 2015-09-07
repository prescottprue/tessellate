angular.module('tessellate.application', [
	'tessellate.application.configure',
	'tessellate.application.build',
	'tessellate.application.manage',
	
	'tessellate.application.users',
	'tessellate.application.groups',
	'tessellate.application.directories',
	])
.run(function ($rootScope, $state) {
  //Set route change listener to add state name to scope (for active css class on buttons)
  $rootScope.$on('$stateChangeStart', function (event, next) {
  	$rootScope.stateName = next.name;
	  var tabStates = ["app.build", "app.manage", "app.configure"];
		_.each(tabStates, function(state, ind){
			if(next.name == state){
				$rootScope.currentTabInd = ind;
			}
		});
  });
});
