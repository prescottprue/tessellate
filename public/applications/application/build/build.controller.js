angular.module('tessellate.application.build')
.controller('BuildCtrl', ['$scope', '$log','$q', '$grout', 'application', function ($scope, $log, $q, $grout, application){
  //Copy application data into scope
  console.log('application loaded:', $scope.application);
  $scope.application = _.extend({},application);
  
  $scope.getPossibleUsers = function(query){
    $log.info('getPossibleUsers called with', query);
    return $grout.Accounts.search(query).then(function (usersList){
      $log.log('users service loaded:', usersList);
      return usersList;
    }, function (err){
      $log.error('Error getting users list:', err);
    });
  };

}])