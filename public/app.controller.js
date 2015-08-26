angular.module('hypercubeServer')

  .controller('AppCtrl', ['$scope', '$state', '$mdToast','$mdDialog', 'AuthService',  function ($scope, $state, $mdToast, $mdDialog, AuthService) {
    $scope.toastPosition = {
      left: false,
      right: true,
      bottom: true,
      top: false
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