/**
 * @description Interface for External File Storage (currently S3)
 */

import config from '../../config/config';
import * as s3 from './s3';
import rimraf from 'rimraf';

/** Upload a file to the image bucket then remove
 * @function uploadImage
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */
export async function uploadImage(file) {
	return await uploadAndRemoveLocal(config.contentSettings.images.bucket, file);
};

/** Upload an avatar image file to the image bucket with the avatar prefix then remove the local copy
 * @function uploadAvatar
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */
export async function uploadAvatar(file) {
	try {
    file.key = `${config.contentSettings.avatar.prefix}/${file.key}`;
    return await uploadImage(file);
  } catch(error) {
    console.error('Error uploading avatar: ', error.toString());
    throw error;
  }
}

/** Upload a local file to file storage
 * @function uploadFile
 * @param {string} bucketName - Name of bucket to upload to
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */
export async function uploadFileToBucket(bucket, fileData) {
	return await s3.uploadFileToBucket(bucket, fileData);
};

/** Upload a local file to S3 bucket the remove the local file
 * @function uploadAndRemoveLocal
 * @param {string} bucketName - Name of bucket to upload to
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */
export async function uploadAndRemoveLocal(bucket, file){
  try {
    const uploadedFile = await uploadFileToBucket(bucket, file);
    await removeLocalFile(file.localPath);
    return uploadedFile;
  } catch(error) {
    console.log('Error uploading and removing local', error.toString());
    return error;
  }
}

/** Remove a local file
 * @function uploadImage
 * @param {string} path - Path of local file to remove
 */
export function removeLocalFile(path) {
  return new Promise((resolve, reject) => {
    rimraf(path, {}, error => {
      if(error){
        console.log('Error deleting local file', error.toString());
        return reject(error);
      }
      resolve();
    });
  });
}
