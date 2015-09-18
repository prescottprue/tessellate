angular.module('tessellate')

  .controller('AppCtrl', ['$scope', '$state', '$mdToast','$mdDialog', '$grout', '$rootScope', '$log', function ($scope, $state, $mdToast, $mdDialog, $grout, $rootScope, $log) {
    $scope.toastPosition = {
      left: false,
      right: true,
      bottom: false,
      top: true
    };
    $scope.loginData = {
      loading: false,
      missing:{username:false, password:false}
    };
    $scope.signupForm = {
      loading: false,
      missing:{username:false, password:false}
    };
    $scope.isLoggedIn = $grout.isLoggedIn;
    $grout.getCurrentUser().then(function(currentUser){
      $scope.currentUser = currentUser;
      $scope.$apply();
    });
    $scope.$watch('currentUser', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(!$scope.$$phase) {
          //$digest or $apply
          $scope.currentUser = newVal;
          $scope.$apply();
        }
      }
    });
    $scope.login = function() {
      if(!$scope.loginData.username || $scope.loginData.username.length < 1){
        $scope.loginData.missing.username = true;
      } else if(!$scope.loginData.password || $scope.loginData.password.length < 1){
        $scope.loginData.missing.password = true;
      } else {
        $scope.loginData.loading = true;
        $grout.login($scope.loginData)
        .then(function (authData){
          $log.log('Successful login:', authData);
          $scope.loginData.loading = false;
          $scope.showToast("Logged in");
          $scope.currentUser = authData;
          $scope.$apply();
          $state.go('apps');
        }, function (err){
          $scope.loginData = {loading:false, email:null, password:null};
          if(err){
            $log.error('Login error:', err);
            $scope.showToast('Error: ' + err);
          }
          $scope.$apply();
        });
      }
    };
    $scope.signup = function(){
      $log.log('Signup called', $scope.signupForm);
      $grout.signup($scope.signupForm).then(function(signupRes){
        $log.log('Signup successful', signupRes);
        $scope.showToast('Welcome!');
        $state.go('apps');
      }, function(err){
        $log.error('error siging up:', err);
        $scope.showToast('Error signing up.');
      });
    };
    $scope.logout = function () {
      $grout.logout().then(function () {
        $scope.showToast("Logout Successful");
        $scope.currentUser = null;
        $state.go('home');
      }, function (err){
        $log.error('Error logging out:', err);
        $state.go('home');
      });
    };
    $scope.clickTitle = function() {
      if($grout.isLoggedIn){
        $state.go('apps');
      } else {
        $state.go('home');
      }
    };
  	$scope.getToastPosition = function () {
      return Object.keys($scope.toastPosition).filter(function (pos) { return $scope.toastPosition[pos]; }).join(' ');
    };
    $scope.showToast = function (toastMessage) {
      $mdToast.show(
      	$mdToast.simple().content(toastMessage)
        .position($scope.getToastPosition())
        .hideDelay(3000)
      );
    };
    $scope.alert = '';
    $scope.showAlert = function(ev, alertObj) {
      // Appending dialog to document.body to cover sidenav in docs app
      // Modal dialogs should fully cover application
      // to prevent interaction outside of dialog
      var title = alertObj.title || "Alert";
      var description = alertObj.description || "Error, please try again.";
      console.log("showAlert:", ev, alertObj);
      $mdDialog.show(
        $mdDialog.alert()
          .parent(angular.element(document.body))
          .title(title)
          .content(description)
          // .ariaLabel('Alert Dialog Demo')
          .ok('Got it!')
          .targetEvent(ev)
      );
    };
    $scope.showConfirm = function(ev, confirmObj) {
      // Appending dialog to document.body to cover sidenav in docs app
      var title = confirmObj.title || "Confirm";
      var content = confirmObj.content || confirmObj.description || "Are you sure?";
      var confirmText = confirmObj.confirmText || "Yes";
      var cancelText = confirmObj.cancelText || "Cancel";

      var confirm = $mdDialog.confirm()
        .parent(angular.element(document.body))
        .title(title)
        .content(content)
        .ariaLabel('Lucky day')
        .ok(confirmText)
        .cancel(cancelText)
        .targetEvent(ev);
      return $mdDialog.show(confirm);
    };
  }]);