angular.module('tessellate.auth')

.factory('AuthService', ['$q', '$http', '$log', '$rootScope', 'AUTH_EVENTS', 'USER_ROLES', function ($q, $http, $log, $rootScope, AUTH_EVENTS, USER_ROLES) {
	var grout = new Grout();
	console.warn('grout:', grout);
	return {
		isAuthenticated : function (){
			return grout.isLoggedIn;
		},
		isAuthorized: function (authorizedRoles){
			$log.log('Authorized roles:', authorizedRoles);
			 if (!angular.isArray(authorizedRoles)) {
	      authorizedRoles = [authorizedRoles];
	    }
	    // $log.warn('Grout is in groups:', grout.isInGroups(authorizedRoles));
	    // $log.info('[isAuthorized()]  Role: '+ grout. +' Is allowed:', authorizedRoles.indexOf(Session.getRole()) !== -1);
	    // return (this.isAuthenticated() && authorizedRoles.indexOf(Session.getRole()) !== -1);
			//TODO: Have this use grout.isAuthorized(authorizedRoles)
			return this.isAuthenticated();
			// return ( this.isAuthenticated() && grout.isInGroups(authorizedRoles));
		},
		getCurrentUser:function (){
			return grout.currentUser;
		},
		signup:function (signupData){
			$log.log({description:'Signup called.', data:signupData, func:'signup', obj:'AuthService'});
			return grout.signup(signupData);
		},
		login:function (loginData){
			$log.log({description:'Login called.', data:loginData, func:'login', obj:'AuthService'});
			//TODO: Login with username or email
			return grout.login({
	      username: loginData.username,
	      password: loginData.password
	    });
		},
		logout:function (){
			$log.log({description:'Logout called.', func:'logout', obj:'AuthService'});
			return grout.logout();
		},
		updateProfile:function (userId, userData){
			var deferred = $q.defer();
			console.log('Updating user with id: ' + userId, userData);
			//TODO: Get User id from token
			$http.put('/user/'+ userId, userData)
			.then(function (updateRes){
				console.log('Profile update responded:', updateRes.data);
				deferred.resolve(updateRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				console.error('Error loading user', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		}
	};
}]);
// .factory('AuthResolver', function ($q, $rootScope, $state) {
//   return {
//     resolve: function () {
//       var deferred = $q.defer();
//       var unwatch = $rootScope.$watch('currentUser', function (currentUser) {
//         if (angular.isDefined(currentUser)) {
//           if (currentUser) {
//             deferred.resolve(currentUser);
//           } else {
//             deferred.reject();
//             $state.go('login');
//           }
//           unwatch();
//         }
//       });
//       return deferred.promise;
//     }
//   };
// });