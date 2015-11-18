/** FileStorage Util
 *	@description standardized interface file storage so the service/platform used for storage can be changed without affecting file storage calls
 */
'use strict';

var _ = require('lodash');
var conf = require('../config/default').config;

var s3 = require('./s3');
var logger = require('./logger');

exports.createBucket = function (bucketName) {
	logger.log({ description: 'Create bucket called.', name: bucketName, func: 'createBucket', obj: 'fileStorage' });
	return s3.createBucketSite(bucketName);
};
exports.deleteBucket = function (bucketName) {
	return s3.deleteBucket(bucketName);
};
exports.uploadFiles = function (bucketName, localDir) {
	return s3.uploadFiles(bucketName, localDir);
};
//Get files stored within a bucket
exports.getFiles = function (bucketName) {
	return s3.getFiles(bucketName);
};
exports.getBuckets = function (bucketName, localDir) {
	return s3.getBuckets(bucketName, localDir);
};
exports.saveFile = function (bucketName, fileData) {
	if (!_.has(fileData, 'key')) {
		logger.error({ description: 'File key required to save', func: 'saveFile', obj: 'fileStorage' });
	}
	if (!_.has(fileData, 'content')) {
		logger.error({ description: 'File content required to save', func: 'saveFile', obj: 'fileStorage' });
	}
	logger.log({ description: 'calling s3.saveFile with BucketName:', name: bucketName, data: fileData, func: 'saveFile', obj: 'fileStorage' });
	return s3.saveFile(bucketName, fileData);
};
exports.uploadLocalDir = function (uploadData) {
	return s3.uploadDir(uploadData.bucket, uploadData.localDir);
};
exports.signedUrl = function (urlData) {
	urlData.bucket = urlData.bucket;
	return s3.getSignedUrl(urlData);
};