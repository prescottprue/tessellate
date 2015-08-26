angular.module('hypercubeServer.applications')
.factory('applicationsService', ['$q', '$http', '$rootScope','$sessionStorage', function ($q, $http, $rootScope, $sessionStorage) {
	var applications = null;
	return {
		add:function(applicationData){
			var d = $q.defer();
			if(!applicationData){
				$log.warn('[ApplicationsService.add()] No application data');
				d.reject({message:'Name required to create new application'});
			} else {
				console.log('$rootScope:', $rootScope);
				applicationData.owner = $rootScope.currentUser._id;
				$http.post(DB_URL + '/apps', applicationData)
				.then(function (apiRes){
					d.resolve(apiRes.data);
				})
				.catch(function (errRes){
					//TODO: Handle different error response codes
					$log.error('Error loading application', errRes.data);
					d.reject(errRes.data);
				});
			}

			return d.promise;
		},
		update:function(applicationId, applicationData){
			var deferred = $q.defer();
			console.log('applicationService: Updating application with id: ' + applicationId, applicationData);
			$http.put('/apps/'+ applicationId, applicationData)
			.then(function (apiRes){
				console.log('applicationService: application data loaded:', apiRes.data);
				deferred.resolve(apiRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				console.error('Error loading application', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		},
		get:function(applicationName){
			var deferred = $q.defer();
			// console.log('Loading application with ID:', applicationName);
			var endpointUrl = "/apps";
			var isList = true;
			if(applicationName){
				endpointUrl = endpointUrl + "/" + applicationName;
				isList = false;
			}
			$http.get(endpointUrl)
			.then(function (apiRes){
				console.log('application data loaded:', apiRes.data);
				if(isList){
					applications = apiRes.data;
				} else {
					//TODO: Update application in list
				}
				deferred.resolve(apiRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				console.error('Error loading application data', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		},
		del:function(applicationId){
			var deferred = $q.defer();
			// console.log('Loading application with ID:', applicationId);
			if(applicationId){
				endpointUrl =  "apps/" + applicationId;
			}
			$http.delete(endpointUrl)
			.then(function (apiRes){
				console.log('application succesfully deleted:', apiRes.data);
				applications = apiRes.data;
				deferred.resolve(apiRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				console.error('Error deleting application', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		}
	};
}])