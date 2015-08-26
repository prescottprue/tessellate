/** FileStorage Lib 
 *	@description generalized lib for file storage so the service/platform used for storage can be changed without affecting file storage calls
 */
var q = require('q'),
_ = require('underscore'),
s3 = require('./s3');


var bucketKeyPrefix = "hypercube-test1-";

exports.createBucket = function(bucketName){
	console.log('[fileStorage.createBucket()]');
	return s3.createBucketSite(bucketName);
};
exports.deleteBucket = function(bucketName){
	return s3.deleteBucket(bucketName);
};
exports.uploadFiles = function(bucketName, localDir){
	return s3.uploadFiles(bucketName, localDir);
};
//Get files stored within a bucket
exports.getFiles = function(bucketName){
	return s3.getFiles(bucketName);
};
exports.getBuckets = function(bucketName, localDir){
	return s3.getBuckets(bucketName, localDir);
};
exports.saveFile = function(bucketName, fileData){
	if(!_.has(fileData, 'key')){
		console.error('File key required to save');
	}
	if(!_.has(fileData, 'content')){
		console.error('File content required to save');
	}
	console.log('calling s3.saveFile with BucketName:' + bucketName + " key: " + fileData);
	return s3.saveFile(bucketName, fileData);
};
exports.uploadLocalDir = function(uploadData){
	return s3.uploadDir(uploadData.bucket, uploadData.localDir);
};
exports.signedUrl = function(urlData){
	urlData.bucket = urlData.bucket;
	return s3.getSignedUrl(urlData);
};