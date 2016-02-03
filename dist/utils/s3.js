'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.uploadFileToBucket = uploadFileToBucket;

var _config = require('../../config/config');

var _config2 = _interopRequireDefault(_config);

var _s = require('s3');

var _s2 = _interopRequireDefault(_s);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Load config variables
var s3Client = createS3Client();

/** Upload a local file to S3 bucket
 * @function uploadFile
 * @param {string} bucketName - Name of bucket to upload to
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */
function uploadFileToBucket(bucketName, fileData) {
	console.log({
		description: 'Upload file called.', bucketName: bucketName, fileData: fileData,
		func: 'uploadFile'
	});
	var localFile = fileData.localFile;
	var key = fileData.key;

	var fileParams = {
		localFile: localFile,
		s3Params: {
			Bucket: bucketName,
			Key: key,
			ACL: 'public-read'
		}
	};
	console.log({
		description: 'Upload file called.', fileParams: fileParams,
		func: 'uploadFile'
	});
	return new Promise(function (resolve, reject) {
		var uploader = s3Client.uploadFile(fileParams);
		uploader.on('error', function (error) {
			console.error({
				description: 'Error uploading file.',
				error: error, func: 'uploadFile'
			});
			reject(error);
		});
		// uploader.on('progress', () => {
		// 	console.log({
		// 		description: 'File upload progress.',
		// 		func: 'uploadFile'
		// 	});
		// });
		uploader.on('end', function () {
			var uploadedFile = { url: 'https://' + bucketName + '.s3.amazonaws.com/' + key };
			console.log({
				description: 'File upload progress.', uploadedFile: uploadedFile,
				func: 'uploadFile'
			});
			resolve(uploadedFile);
		});
	});
}

/**
* @description Configure S3 client module
 * @function createS3Client
 */
function createS3Client() {
	if (!_config2.default.aws || !_config2.default.aws.key || !_config2.default.aws.secret) {
		console.error({
			description: 'AWS Environment variables not set. S3 will not be enabled.',
			func: 'configureS3', file: 's3'
		});
		return;
	}
	return _s2.default.createClient({
		s3Options: {
			accessKeyId: _config2.default.aws.key,
			secretAccessKey: _config2.default.aws.secret
		}
	});
}