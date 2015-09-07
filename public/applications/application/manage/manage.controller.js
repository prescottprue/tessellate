angular.module('tessellate.application.manage')
.controller('ManageCtrl', ['$rootScope', '$scope', '$log','$q', '$grout', 'application', function ($rootScope, $scope, $log, $q, $grout, application){
    $scope.data = {
      loading:true,
      error:null
    };
    //TODO: Check to see if application has groups before calling
    // $grout.groups.get().then(function (groups){
    //   $scope.groups = groups;
    //   $scope.$apply();
    // });
    $scope.groups = application.groups;
    console.warn('groups:', $scope.groups);
    //TODO: Check to see if application has groups before calling
    $grout.users.get().then(function (usersList){
      $scope.data.loading = false;
      console.log('users list loaded:', usersList);
      $scope.users = usersList;
      $scope.$apply();
    }, function (err){
      console.error('Error loading users', err);
      $scope.data.loading = false;
      $scope.data.error = err;
    });
    $scope.add = function(userData){
      $scope.data.loading = true;
      console.log('calling add with userData:', userData);
      $grout.users().add(userData).then(function(response){
        console.log('User added successfull', response);
        //TODO: Push response not original data
        $scope.users.push(userData);
      }, function(err){
        console.error('Error adding a user', err);
        $scope.data.loading = false;
        $scope.data.error = err;
      });
    };
    $scope.delete = function(ind){
      $scope.data.loading = true;
      var userId = $scope.users[ind]._id;
      var username = $scope.users[ind].username;
      console.log('calling delete with username:', username);
      $grout.user(username).delete().then(function(response){
        console.log('user deleted successfully');
      }, function(err){
        console.error('Error loading users', err);
        $scope.data.loading = false;
        $scope.data.error = err;
      });
    };
}])