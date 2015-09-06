angular.module('tessellate')
.config(function($stateProvider, $urlRouterProvider, $mdThemingProvider, USER_ROLES) {
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
    .state('users', {
      parent:'nav',
      url:'/users',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'users/users.html',
      controller:'UsersCtrl'
    })
    .state('user', {
      parent:'nav',
      url:'/user/:username',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'users/user.html',
      controller:'UserCtrl'
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
      url:'/apps/:name',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'applications/application.html',
      controller:'ApplicationCtrl'
    })
    .state('groups', {
      parent:'nav',
      url:'/groups',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'groups/groups.html',
      controller:'GroupsCtrl'
    })
    .state('group', {
      parent:'nav',
      url:'/groups/:name',
      authorizedRoles:[USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
      templateUrl:'groups/group.html',
      controller:'GroupCtrl'
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