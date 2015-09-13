angular.module('tessellate.application.configure')
.controller('ConfigureCtrl', ['$scope', '$log', '$grout', 'application', function ( $scope, $log, $grout, application){
  //Copy application data into scope
  $scope.data = {
    minLength:1,  //Hide search dropdown initially
    selectedUser: null,
    selectedUsers: [],
    collabQueryText: null
  };
  $scope.application = _.extend({}, application);

  //Search users based on input
  $scope.collabSearch = function(searchText){
    return $grout.users.search(searchText);
  };
  $scope.saveNewProvider = function(){
    var appData = _.extend({}, $scope.application);
    appData.providers.push($scope.newProvider);
    $scope.update(appData);
  }
  $scope.update = function(updateInputData){
    //TODO: Only compare against original to only send update
    var updateData = $scope.applcation;
    if(updateInputData){
      updateData = updateInputData;
    }
    $grout.App(application.name).update(updateData)
    .then(function (appData){
      $scope.data.loading = false;
      $scope.application = appData;
      $log.log({description:'Application updated successfully.', data:appData, func:'update', obj:'ApplicationCtrl'});
    },function (err){
      $scope.data.loading = false;
      $log.error({description:'Error updating application.', error:err, func:'update', obj:'ApplicationCtrl'});
      $scope.data.error = err;
    });
  };
}])