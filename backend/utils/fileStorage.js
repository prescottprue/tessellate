/** FileStorage Util
 *	@description standardized interface file storage so the service/platform used for storage can be changed without affecting file storage calls
 */
import _ from 'lodash';
import config from '../config/default';

import * as s3 from './s3';
import logger from './logger';

export function createBucket(bucketName) {
	logger.log({
		description: 'Create bucket called.',
		name: bucketName, func: 'createBucket', obj: 'fileStorage'
	});
	return s3.createBucketSite(bucketName);
};
export function deleteBucket(bucketName) {
	return s3.deleteBucket(bucketName);
};
export function uploadFiles(bucketName, localDir) {
	return s3.uploadFiles(bucketName, localDir);
};
//Get files stored within a bucket
export function getFiles(bucketName) {
	return s3.getFiles(bucketName);
};
export function getBuckets(bucketName, localDir) {
	return s3.getBuckets(bucketName, localDir);
};
export function saveFile(bucketName, fileData) {
	if(!_.has(fileData, 'key')){
		logger.error({description: 'File key required to save', func: 'saveFile', obj: 'fileStorage'});
	}
	if(!_.has(fileData, 'content')){
		logger.error({description: 'File content required to save', func: 'saveFile', obj: 'fileStorage'});
	}
	logger.log({description: 'calling s3.saveFile with BucketName:', name: bucketName, data: fileData, func: 'saveFile', obj: 'fileStorage'});
	return s3.saveFile(bucketName, fileData);
};
export function uploadLocalDir(uploadData) {
	return s3.uploadDir(uploadData.bucket, uploadData.localDir);
};
export function signedUrl(urlData) {
	urlData.bucketurlData.bu ;
	return s3.getSignedUrl(urlData);
};
