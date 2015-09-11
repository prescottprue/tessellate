angular.module('tessellate.application.manage')
.controller('ManageCtrl', ['$rootScope', '$scope', '$log','$q', '$grout', 'application', '$mdDialog', function ($rootScope, $scope, $log, $q, $grout, application, $mdDialog){
    $scope.newData = {group: {}, directory: {}, user:{}};
    $scope.data = {
      loading:true,
      error:null,
    };
    $scope.groups = application.groups;
    console.warn('groups:', $scope.groups);
    //TODO: Check to see if application has groups before calling
    $grout.Accounts.get().then(function (usersList){
      $scope.data.loading = false;
      console.log('users list loaded:', usersList);
      $scope.accounts = usersList;
      $scope.$apply();
    }, function (err){
      console.error('Error loading users', err);
      $scope.data.loading = false;
      $scope.data.error = err;
    });
    $scope.startNewGroup = function(){
    };
    $scope.addGroup = function(groupData){
      $log.info('Calling groups add with:', groupData);
      application.Groups.add(groupData).then(function (groups){
        $log.info('Group added successfully.', groups);
        $scope.showToast('Group added successfully');
        $scope.groups = groups;
        $scope.$apply();
      });
    };
    $scope.addDirectory = function(directoryData){
      application.Directories.add(directoryData).then(function (directories){
        $log.info('Directories added successfully.', directories);
        $scope.showToast('Directories added successfully');
        $scope.directories = directories;
        $scope.$apply();
      });
    };
    $scope.addUser = function(userData){
      $scope.data.loading = true;
      console.log('calling add with userData:', userData);
      $grout.Accounts.add(userData).then(function(response){
        console.log('User added successfull', response);
        //TODO: Push response not original data
        $scope.accounts.push(userData);
      }, function(err){
        console.error('Error adding a user', err);
        $scope.data.loading = false;
        $scope.data.error = err;
      });
    };
    $scope.deleteUser = function(ind){
      $scope.data.loading = true;
      var userId = $scope.accounts[ind]._id;
      var username = $scope.accounts[ind].username;
      console.log('calling delete with username:', username);
      $grout.Account(username).del().then(function(response){
        console.log('user deleted successfully');
      }, function(err){
        console.error('Error loading users', err);
        $scope.data.loading = false;
        $scope.data.error = err;
      });
    };
    $scope.startNew = function(objType, ev){
      var newData = {type: objType};
      switch(objType) {
            case 'group':
                newData.scopeFunc = 'addGroup';
                newData.templateUrl = 'applications/application/groups/groups-new.html';
                break;
            case 'account':
                newData.scopeFunc = 'addAccount';
                newData.templateUrl = 'applications/application/accounts/accounts-new.html';
                break;
            case 'directory':
                newData.scopeFunc = 'addDirectory';
                newData.templateUrl = 'applications/application/directories/directories-new.html';
                break;
            default:
                $log.error('Invalid object type provided to startNew');
      }
      $mdDialog.show({
        controller: function($scope, $mdDialog, $grout, $q){
          $scope.data = {
            minLength:1,  //Hide search dropdown initially
            loading:true,
            error:null,
            selectedAccounts:[],
            selectedAccount:null,
            selectedGroups:[],
            selectedGroups:null
          };
          //Answer with newAppData
          $scope.create = function(newAppData){
            //Make collaborators array from selectedUsers ids
            if($scope.data.selectedAccounts){
              newAppData.accounts = _.pluck($scope.data.selectedAccounts, 'id');
            }
            if($scope.data.selectedGroups){
              newAppData.groups = _.pluck($scope.data.selectedGroups, 'id');
            }
            $mdDialog.hide(newAppData);
          };
          //Cancel dialog
          $scope.cancel = function(){
            $mdDialog.cancel();
          };
          //Search users based on input
          $scope.accountSearch = function(searchText){
            // return application.Accounts.search(searchText);
            return $grout.Accounts.search(searchText);

          };
          $scope.groupsSearch = function(searchText){
            return application.Groups.search(searchText);
          };
        },
        templateUrl: newData.templateUrl,
        parent: angular.element(document.body),
        targetEvent: ev,
      }).then(function (answer) {
        $log.info('Create answered:', answer);
        //Run specified scope function with answer data
        $scope[newData.scopeFunc](answer);
      }, function() {
        // $log.log('New Dialog was canceled');
      });
    };
}])