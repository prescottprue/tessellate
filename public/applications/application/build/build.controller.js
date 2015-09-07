angular.module('tessellate.application.build')
.controller('BuildCtrl', ['$rootScope', '$scope', '$log','$q', '$grout', 'application', function ($rootScope, $scope, $log, $q, $grout, application){
  //Copy application data into scope
  console.log('application loaded:', $scope.application);
  $scope.application = _.extend({},application);
  
  //TODO: Load users for collaborators options

  $scope.getPossibleUsers = function(query){
    // $log.info('getPossibleUsers called with', query);
    return $grout.users.search(query).then(function(usersList){
      $log.log('users service loaded:', usersList);
      return usersList;
    }, function(err){
      $log.error('error getting users list');
    });
    // return _.filter($scope.users, function(user){
    //   return user.email ? user.email.indexOf(query) : true; 
    // });
  };

}])