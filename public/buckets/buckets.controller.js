angular.module('hypercubeServer.buckets')
.controller('BucketsCtrl', ['$scope', '$http', '$log', 'bucketsService', function($scope, $http, $log, bucketsService){
		$scope.data = {
			loading:true,
			error:null
		};
		console.log('BucketListController');
		bucketsService.get().then(function (bucketsList){
			$log.log('buckets list loaded:', bucketsList);
			$scope.data.loading = false;
			$scope.buckets = bucketsList;
		}, function (err){
			$log.error('Error loading buckets', err);
			$scope.data.loading = false;
			$scope.data.error = err;
		});
		$scope.delete = function(ind, ev){
			$scope.data.loading = true;
			var bucket = $scope.buckets[ind];
			$scope.showConfirm(ev, {title:"Delete", description:"Are you sure you want to delete " + bucket.Name + " ?"}).then(function(){
				bucketsService.del(bucket.Name).then(function(deletedApp){
					$log.log('bucket deleted successfully', deletedApp);
					$scope.buckets.splice(ind, 1);
				}, function(err){
					$log.error('Error loading buckets', err);
					$scope.data.loading = false;
					$scope.data.error = err;
				});
			});
		};

}])