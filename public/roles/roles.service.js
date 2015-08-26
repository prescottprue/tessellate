angular.module('hypercubeServer.roles')
.factory('rolesService', ['$q', '$http', '$rootScope', function ($q, $http, $rootScope) {
	var roles = null;
	return {
		update:function(roleName, roleData){
			var deferred = $q.defer();
			console.log('UserService: Updating role with id: ' + roleName, roleData);
			$http.put('/roles/'+ roleName, roleData)
			.then(function (apiRes){
				console.log('UserService: User data loaded:', apiRes.data);
				deferred.resolve(apiRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				console.error('Error loading role', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		},
		get:function(roleName){
			var deferred = $q.defer();
			// console.log('Loading role with ID:', roleName);
			var endpointUrl = "/roles";
			console.log('getting roles');
			var isList = true;
			if(roleName){
				endpointUrl = endpointUrl + "/" + roleName;
				isList = false;
			}
			$http.get(endpointUrl)
			.then(function (apiRes){
				console.log('role data loaded:', apiRes.data);
				if(isList){
					roles = apiRes.data;
				} else {
					//TODO: Update role in list
				}
				deferred.resolve(apiRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				console.error('Error loading role data', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		},
		del:function(roleId){
			var deferred = $q.defer();
			// console.log('Loading role with ID:', roleId);
			if(roleId){
				endpointUrl =  "roles/" + roleId;
			}
			$http.delete(endpointUrl)
			.then(function (apiRes){
				console.log('role succesfully deleted:', apiRes.data);
				roles = apiRes.data;
				deferred.resolve(apiRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				console.error('Error deleting role', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		}
	};
}])