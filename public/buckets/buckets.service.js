angular.module('hypercubeServer.buckets')
.factory('bucketsService', ['$q', '$http', '$log', '$rootScope','$sessionStorage', function ($q, $http, $log, $rootScope, $sessionStorage) {
	var buckets = null;
	return {
		add:function(bucketData){
			var d = $q.defer();
			if(!bucketData){
				$log.warn('[ApplicationsService.add()] No bucket data');
				d.reject({message:'Name required to create new bucket'});
			} else {
				console.log('$rootScope:', $rootScope);
				bucketData.owner = $rootScope.currentUser._id;
				$http.post(DB_URL + '/apps', bucketData)
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
		get:function(bucketName){
			var deferred = $q.defer();
			var endpointUrl = "/admin/buckets";
			// if(bucketName){
			// 	endpointUrl = endpointUrl + "/" + bucketName;
			// }
			$http.get(endpointUrl)
			.then(function (apiRes){
				console.log('bucket data loaded:', apiRes.data);
				deferred.resolve(apiRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				console.error('Error loading bucket data', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		},
		del:function(bucketName){
			var deferred = $q.defer();
			// console.log('Loading bucket with ID:', bucketName);
			if(!bucketName){
				$log.error('BucketName required');
				deferred.reject({message:"BucketName required"});
			}
			var endpointUrl =  "/admin/buckets/" + bucketName;
			$http.delete(endpointUrl)
			.then(function (apiRes){
				console.log('bucket succesfully deleted:', apiRes.data);
				buckets = apiRes.data;
				deferred.resolve(apiRes.data);
			})
			.catch(function (errRes){
				//TODO: Handle different error response codes
				console.error('Error deleting bucket', errRes.data);
				deferred.reject(errRes.data);
			});
			return deferred.promise;
		}
	};
}])