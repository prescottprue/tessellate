angular.module('hypercubeServer.users')
.factory('usersService', ['$q', '$http', '$rootScope', '$log', function ($q, $http, $rootScope, $log) {
	var users = null;
	return {
		update:function(username, userData){
			var deferred = $q.defer();
			console.log('UserService: Updating user with id: ' + username, userData);
			var updateData = userData;
			if(_.has(updateData, "role") && _.isObject(updateData.role)){
				updateData.role = updateData.role._id; //Just send id
			}
			console.log('update with:', updateData);
			$http.put('/user/'+ username, updateData)
			.then(function (apiRes){
				console.log('UserService: User data loaded:', apiRes.data);
				deferred.resolve(apiRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				console.error('Error loading user', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		},
		get:function(username){
			var deferred = $q.defer();
			// console.log('Loading user with ID:', username);
			var endpointUrl = "/users";
			var isList = true;
			if(username){
				endpointUrl = endpointUrl + "/" + username;
				isList = false;
			}
			$http.get(endpointUrl)
			.then(function (apiRes){
				if(isList){
					users = apiRes.data;
				} else {
					//TODO: Update user in list
				}
				deferred.resolve(apiRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				$log.error('Error loading user(s) data', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		},
		del:function(username){
			var deferred = $q.defer();
			// console.log('Loading user with ID:', username);
			if(username){
				endpointUrl =  "users/" + username;
			}
			$http.delete(endpointUrl)
			.then(function (apiRes){
				console.log('user succesfully deleted:', apiRes.data);
				users = apiRes.data;
				deferred.resolve(apiRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				console.error('Error deleting user', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		}
	};
}])