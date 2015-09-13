angular.module('tessellate')
.config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider, USER_ROLES) {
  $stateProvider
    .state('layout', {
      abstract:true,
      templateUrl:'components/nav/topnav-layout.html'
    })
    .state('nav', {
      parent:'layout',
      abstract:true,
      views:{
        'topnav':{
          templateUrl:'components/nav/topnav.html'
        },
        'main':{
          template:'<div ui-view></div>'
        }
      }
    })
    .state('side-nav', {
      parent:'layout',
      abstract:true,
      views:{
        'topnav':{
          templateUrl:'components/nav/topnav.html',
          controller:'NavCtrl'
        },
        'main':{
          templateUrl:'components/nav/sidenav-layout.html'
        }
      }
    })
    .state('home', {
      parent:'nav',
      url:'/',
      templateUrl:'home/home.html',
      controller:'HomeCtrl'
    })

    .state('apps', {
      parent:'nav',
      url:'/apps',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'applications/applications.html',
      controller:'ApplicationsCtrl'
    })
    .state('app', {
      parent:'nav',
      abstract:true,
      url:'/apps/:name',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'applications/application/application.html',
      controller:'ApplicationCtrl',
      resolve:{
        applications:function($grout, $q, $log){
          return $q(function(resolve, reject){
            $grout.Apps.get().then(function (applicationList){
              // $log.log('[app.resolve] Application data loaded:', applicationList);
              resolve(applicationList);
            }, function (err){
              reject(err);
            });
          });
        },
        application:function($grout, $q, $stateParams, $log){
          return $q(function(resolve, reject){
            $grout.App($stateParams.name).get().then(function (applicationData){
              $log.log('application Detail Ctrl: application data loaded:', applicationData);
              resolve(applicationData);
            }, function (err){
              reject(err);
            });
          });
        }
      }
    })
    .state('app.configure', {
      url:'/configure',
      templateUrl:'applications/application/configure/configure.html',
      controller:'ConfigureCtrl'
    })
    .state('app.build', {
      url:'/build',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'applications/application/build/build.html',
      controller:'BuildCtrl'
    })
    .state('app.manage', {
      url:'/manage',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'applications/application/manage/manage.html',
      controller:'ManageCtrl'
    })
    .state('app.accounts', {
      url:'/accounts',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'applications/application/accounts/accounts.html',
      controller:'AccountsCtrl'
    })
    .state('app.account', {
      url:'/accounts/:username',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'applications/application/accounts/account.html',
      controller:'AccountCtrl'
    })
    .state('app.groups', {
      url:'/groups',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'applications/application/groups/groups.html',
      controller:'GroupsCtrl'
    })
    .state('app.group', {
      url:'/groups/:groupName',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'applications/application/groups/group.html',
      controller:'GroupCtrl'
    })
    .state('app.directories', {
      url:'/directories',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'applications/application/directories/directories.html',
      controller:'DirectoriesCtrl'
    })
    .state('app.directory', {
      url:'applications/application/directories/:name',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'directories/directory.html',
      controller:'DirectoryCtrl'
    })
    .state('templates', {
      parent:'side-nav',
      url:'/templates',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'templates/templates.html',
      controller:'TemplatesCtrl'
    })
    .state('template', {
      parent:'nav',
      url:'/templates/:name',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'templates/template.html',
      controller:'TemplateCtrl'
    })
    .state('account', {
      parent:'nav',
      url:'/account',
      templateUrl:'account/account-index.html',
      controller:'AccountCtrl'
    })
    .state('signup', {
      parent:'nav',
      url:'/signup',
      templateUrl:'account/account-signup.html',
      controller:'AccountCtrl'
    })
    .state('login', {
      parent:'nav',
      url:'/login',
      templateUrl:'account/account-login.html',
      controller:'AccountCtrl'
    })
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');
})