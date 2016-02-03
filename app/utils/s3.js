
const _ = require('lodash');
const config = require('../../config/config');
const aws = require('aws-sdk');

//Load config variables
configureS3();
/** Save file contents to S3 given bucket, file key and file contents
 * @function saveFile
 * @param {string} bucketName - Name of bucket to upload to
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */
exports.saveFile = function saveFile(bucketName, fileData){
	// console.log('[saveFile] saveFile called', arguments);
  var saveParams = {Bucket:bucketName, Key:fileData.key,  Body: fileData.content, ACL:'public-read'};
  if(_.has(fileData, 'contentType')){
  	saveParams.ContentType = fileData.contentType;
  }
  return new Promise((resolve, reject) => {
    s3.putObject(saveParams, (err, data) => {
      if(err){
        console.error({
					description: 'Error saving file.',
					error: err, func: 'saveFile'
				});
        return reject(err);
      }
      console.log({
				description: 'File saved successfully.',
				data: data, func: 'saveFile'
			});
      resolve(data);
    });
  });
}

/** Save file contents to S3 given bucket, file key and file contents
 * @function saveFile
 * @param {string} bucketName - Name of bucket to upload to
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */
exports.uploadFile =  function uploadFile(bucketName, fileData){
	const { localFile, key } = fileData;
  const fileParams = {localFile, s3Params: {Bucket:bucketName, Key:key, ACL:'public-read'}};
	logger.log({
		description: 'Upload file called.', fileParams,
		func: 'uploadFile'
	});
  return new Promise((resolve, reject) => {
    let uploader = s3Client.uploadFile(fileParams);
		uploader.on('error', (err) => {
			logger.error({
				description: 'Error uploading file.',
				error: err, func: 'uploadFile'
			});
			reject(err);
		});
		// uploader.on('progress', () => {
		// 	logger.log({
		// 		description: 'File upload progress.',
		// 		func: 'uploadFile'
		// 	});
		// });
		uploader.on('end', () => {
			const uploadedFile = {url: `https://${bucketName}.s3.amazonaws.com/${key}`};
			logger.log({
				description: 'File upload progress.', file: uploadedFile,
				func: 'uploadFile'
			});
			resolve(uploadedFile);
		});
  });
}

/**
* @description Configure AWS and S3 modules
 * @function configureS3
 */
function configureS3() {
  if(!_.has(config.aws, 'key') || !_.has(config.aws, 'secret')){
    console.error({
			description: 'AWS Environment variables not set. S3 will not be enabled.',
			func: 'configureS3', file: 's3'
		});
    return;
  }
  //Setup S3 Config
  sourceS3Conf = new aws.Config({
    accessKeyId: config.aws.key,
    secretAccessKey: config.aws.secret
  });
  s3 = new aws.S3(sourceS3Conf);
}
