angular.module('tessellate.application.build')
.controller('BuildCtrl', ['$scope', '$log','$q', '$sce', '$grout', 'application', function ($scope, $log, $q, $sce, $grout, application){
  //Copy application data into scope
  console.log('application loaded:', $scope.application);
  $scope.application = _.extend({},application);
  // $scope.structure = [{name: 'index.html', type:'file'}, {name: 'testfolder', type:'folder', children:[{name:'infolder.js', type:'file'}]}]
  $scope.previewData = {device:'iphone5', url:$sce.trustAsResourceUrl("http://" + $scope.application.frontend.siteUrl)};
  $grout.App(application.name).Files.buildStructure().then(function (fileStructure){
      $log.log('structure loaded:', fileStructure);
      $scope.structure = fileStructure;
      $scope.$apply();
    }, function (err){
      $log.error('Error getting file structure:', err);
    });
    var editor;
  $scope.aceLoaded = function(_editor) {
    // Editor.setAce(_editor);
    editor = _editor;
  };
  $scope.aceChanged = function(e) {
  };
  $scope.getPossibleUsers = function(query){
    $log.info('getPossibleUsers called with', query);
    return $grout.Accounts.search(query).then(function (usersList){
      $log.log('users service loaded:', usersList);
      return usersList;
    }, function (err){
      $log.error('Error getting users list:', err);
    });
  };
  $scope.openFile = function(fileObj){
    $log.info('Open file called with', fileObj);
    $grout.App(application.name).File(fileObj).open().then(function (fileContents){
      $log.log('file opened:', fileContents);
      $scope.fileContents = fileContents;
      $scope.$apply();
      editor.setValue($scope.fileContents);
      $log.log('File contents loaded', $scope.fileContents);
    }, function (err){
      $log.error('Error opening file:', err);
    });
  };

}])
