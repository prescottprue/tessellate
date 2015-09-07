angular.module('tessellate.application.configure')
.controller('ConfigureCtrl', ['$scope', '$log', '$grout', 'application', function ( $scope, $log, $grout, application){
  //Copy application data into scope
  console.log('application loaded:', $scope.application);
  $scope.application = _.extend({},application);
  $scope.data = {
    minLength:1,  //Hide search dropdown initially
    selectedUser: null,
    selectedUsers: [],
    collabQueryText: null
  };
  //Search users based on input
  $scope.collabSearch = function(searchText){
    return $grout.users.search(searchText);
  };
}])