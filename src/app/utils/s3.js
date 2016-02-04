
import config from '../../config/config';
import s3 from 's3';

//Load config variables
const s3Client = createS3Client();

/** Upload a local file to S3 bucket
 * @function uploadFile
 * @param {string} bucketName - Name of bucket to upload to
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */
export function uploadFileToBucket(bucketName, fileData){
	const { localPath, key } = fileData;
  const fileParams = {
    localFile: localPath,
    s3Params: {
      Bucket: bucketName,
      Key: key,
      ACL:'public-read'
    }
  };
  return new Promise((resolve, reject) => {
    const uploader = s3Client.uploadFile(fileParams);
		uploader.on('error', error => {
			console.error({
				description: 'Error uploading file.',
				error, func: 'uploadFile'
			});
			reject(error);
		});
		// uploader.on('progress', () => {
		// 	console.log({
		// 		description: 'File upload progress.',
		// 		func: 'uploadFile'
		// 	});
		// });
		uploader.on('end', () => {
			const uploadedFile = {url: `https://${bucketName}.s3.amazonaws.com/${key}`};
			console.log('File uploaded successfully.');
			resolve(uploadedFile);
		});
  });
}

/**
* @description Configure S3 client module
 * @function createS3Client
 */
function createS3Client() {
  if(!config.aws || !config.aws.key || !config.aws.secret){
    console.error({
			description: 'AWS Environment variables not set. S3 will not be enabled.',
			func: 'configureS3', file: 's3'
		});
    return;
  }
  return s3.createClient({
  	s3Options:{
  		accessKeyId: config.aws.key,
  		secretAccessKey: config.aws.secret
  	}
  });
}
