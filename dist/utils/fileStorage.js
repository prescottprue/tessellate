'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.createBucket = createBucket;
exports.deleteBucket = deleteBucket;
exports.uploadFiles = uploadFiles;
exports.getFiles = getFiles;
exports.getBuckets = getBuckets;
exports.saveFile = saveFile;
exports.saveAccountFile = saveAccountFile;
exports.uploadLocalDir = uploadLocalDir;
exports.signedUrl = signedUrl;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

var _s = require('./s3');

var s3 = _interopRequireWildcard(_s);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** FileStorage Util
 *	@description standardized interface file storage so the service/platform used for storage can be changed without affecting file storage calls
 */
function createBucket(bucketName) {
	_logger2.default.log({
		description: 'Create bucket called.',
		name: bucketName, func: 'createBucket', obj: 'fileStorage'
	});
	return s3.createBucketSite(bucketName);
};
function deleteBucket(bucketName) {
	return s3.deleteBucket(bucketName);
};
function uploadFiles(bucketName, localDir) {
	return s3.uploadFiles(bucketName, localDir);
};
//Get files stored within a bucket
function getFiles(bucketName) {
	return s3.getFiles(bucketName);
};
function getBuckets(bucketName, localDir) {
	return s3.getBuckets(bucketName, localDir);
};
function saveFile(bucketName, fileData) {
	if (!_lodash2.default.has(fileData, 'key')) {
		_logger2.default.error({
			description: 'File key required to save',
			func: 'saveFile', obj: 'fileStorage'
		});
	}
	// if(!_.has(fileData, 'content')){
	// 	logger.error({
	// 		description: 'File content required to save',
	// 		func: 'saveFile', obj: 'fileStorage'
	// 	});
	// }
	_logger2.default.log({
		description: 'calling s3.saveFile with BucketName:',
		name: bucketName, data: fileData, func: 'saveFile', obj: 'fileStorage'
	});
	return s3.saveFile(bucketName, fileData);
};
function saveAccountFile(fileData) {
	_logger2.default.log({
		description: 'Saving file to account.',
		data: fileData, func: 'saveAccountFile', obj: 'fileStorage'
	});
	return s3.uploadFile(_default2.default.aws.imageBucket, fileData);
};
function uploadLocalDir(uploadData) {
	return s3.uploadDir(uploadData.bucket, uploadData.localDir);
};
function signedUrl(urlData) {
	return s3.getSignedUrl(urlData);
};