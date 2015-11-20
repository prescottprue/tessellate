'use strict';

/** s3 Utility
 *	@description functionality for accessing/reading/writing to and from S3. These functions are used by files such as fileStorage.js
 */
var aws = require('aws-sdk'),
    s3Sdk = require('s3'),
    _ = require('lodash'),
    logger = require('./logger');
var sourceS3Conf, s3, s3Client;

//Load config variables
var conf = require('../config/default').config;
configureS3();

/**
 * @description Delete an S3 Bucket
 * @function deleteBucket
 * @params {string} bucketName Name of new bucket to delete
 */
exports.deleteBucket = deleteS3Bucket;

/**
 * @description Get List of buckets
 * @function getBuckets
 */
exports.getBuckets = getBuckets;

/**
 * @description Save a file to an S3 bucket
 * @function saveFile
 * @param {string} bucketName - Name of bucket to save file to
 * @param {string} fileKey - Key of file to save
 * @param {string} fileContents - Contents of file to save
 */
exports.saveFile = saveToBucket;

/**
 * @description Get list of files within an S3 bucket
 * @function saveFile
 */
exports.getFiles = getObjects;

/**
 * @description Upload a local directory to a bucket
 * @function uploadToBucket
 * @params {string} bucketName Name of bucket to upload to
 * @params {string} bucketName Name of bucket to upload to
 */
exports.uploadDir = uploadDirToBucket;

/**
 * @description Copy one Bucket to another Bucket including the use of prefixes
 * @function copyBucketToBucket
 * @params {string|object} srcBucketInfo Object with name and prefix or name of bucket to copy as string
 * @params {string} srcBucketInfo.name Name of bucket to copy from
 * @params {string} srcBucketInfo.prefix Prefix of bucket to copy from
 * @params {string|object} destBucketName Object with name and prefix or name of bucket to copy src to
 * @params {string} srcBucketInfo.name Name of bucket to copy to
 * @params {string} srcBucketInfo.prefix Prefix of bucket to copy to
 */
exports.copyBucketToBucket = copyBucketToBucket;

/**
 * @description Create new S3 bucket and set default cors settings, and set index.html is website
 * @function createBucketSite
 * @params {string} newBucketName Name of new bucket to create
 */
exports.createBucketSite = function (bucketName) {
  logger.log({ description: 'createBucketSite called', bucketName: bucketName });
  if (!bucketName) {
    return Promise.reject({ status: 400, message: 'Bucket name is required to create bucket.' });
  }
  var runBucketCreation = new Promise.all([createS3Bucket(bucketName), setBucketCors(bucketName), setBucketWebsite(bucketName)]);
  return runBucketCreation.then(function (data) {
    logger.log({ description: 'Bucket site created successfully.', promiseData: data, bucketData: data[0], func: 'createBucketSite', obj: 's3' });
    return data[0];
  }, function (err) {
    logger.error({ description: 'Error setting new bucket cors config', error: err, func: 'createBucketSite', obj: 's3' });
    return Promise.reject({ message: 'Error creating bucket site.' });
  });
};

/** Get a signed url
 * @function saveFile
 * @param {object} urlData
 * @param {string} urlData.bucket - Bucket name for which to get signed url
 * @param {string} urlData.key - Key of object for which to get signed url
 */
exports.getSignedUrl = function (urlData) {
  var params = { Bucket: urlData.bucket, Key: urlData.key };
  return new Promise(function (resolve, reject) {
    s3.getSignedUrl(urlData.action, params, function (err, url) {
      if (err) {
        logger.log({ description: 'Error getting signed url:', err: err, func: 'getSignedUrl', obj: 's3' });
        reject(err);
      } else {
        logger.log({ description: 'Signed url generated.', url: url, func: 'getSignedUrl', obj: 's3' });
        resolve(url);
      }
    });
  });
};

//----------------- Helper Functions ------------------//
/**
* @description Configure AWS and S3 modules
 * @function configureS3
 */
function configureS3() {
  if (!_.has(conf.aws, 'key') || !_.has(conf.aws, 'secret')) {
    logger.error({ description: 'AWS Environment variables not set. S3 will not be enabled.', func: 'configureS3', file: 's3' });
    return;
  }
  //Setup S3 Config
  sourceS3Conf = new aws.Config({
    accessKeyId: conf.aws.key,
    secretAccessKey: conf.aws.secret
  });
  s3 = new aws.S3(sourceS3Conf);
  s3Client = s3Sdk.createClient({
    s3Options: {
      accessKeyId: conf.aws.key,
      secretAccessKey: conf.aws.secret
    }
  });
}
/**
 * @description Get S3 Buckets
 * @function uploadToBucket
 * @params {string} bucketName Name of bucket to upload to
 */
function getBuckets() {
  return new Promise(function (resolve, reject) {
    s3.listBuckets(function (err, data) {
      if (err) {
        logger.log({ description: "Error:", error: err, func: 'getBuckets', obj: 's3' });
        reject(err);
      } else {
        // for (var index in data.Buckets) {
        //   var bucket = data.Buckets[index];
        // }
        logger.log({ description: 'Buckets loaded successfully. ', buckets: data.Buckets, func: 'getBuckets', obj: 's3' });
        resolve(data.Buckets);
      }
    });
  });
}
/**
* @description Create a new bucket
* @function createS3Bucket
* @param {string} bucketName Name of bucket to create
*/
function createS3Bucket(bucketName) {
  logger.log({ description: 'CreateS3Bucket called.', bucketName: bucketName });
  var newBucketName = bucketName.toLowerCase();
  return new Promise(function (resolve, reject) {
    s3.createBucket({ Bucket: newBucketName, ACL: 'public-read' }, function (err, data) {
      if (err) {
        logger.error({ description: 'Error creating bucket.', err: err, func: 'createS3Bucket' });
        reject({ status: 500, error: err });
      } else {
        logger.log({ description: 'Bucket created successfully:', data: data, func: 'createS3Bucket' });
        // Setup Bucket website
        var dataContents = data.toString();
        // TODO: Return more accurate information here
        resolve({ name: newBucketName.toLowerCase(), websiteUrl: '' });
      }
    });
  });
}
/**
* @description Remove all contents then delete an S3 bucket
* @function deleteS3Bucket
* @param {string} bucketName - Name of bucket to delete
*/
function deleteS3Bucket(bucketName) {
  // logger.log('deleteS3Bucket called', bucketName);
  return new Promise(function (resolve, reject) {
    // Empty bucket
    var deleteTask = s3Client.deleteDir({ Bucket: bucketName });
    deleteTask.on('error', function (err) {
      logger.error('error deleting bucket:', err);
      reject(err);
    });
    deleteTask.on('end', function () {
      logger.log({ description: 'Bucket emptied of files successfully.', bucketName: bucketName, func: 'deleteS3Bucket', file: 's3' });
      // Delete bucket
      s3.deleteBucket({ Bucket: bucketName }, function (err, data) {
        if (err) {
          logger.error({ description: 'Error deleting bucket:', error: err, func: 'deleteS3Bucket', file: 's3' });
          reject(err);
        } else {
          // Setup Bucket website
          logger.log({ description: 'Bucket deleted successfully.', bucketName: bucketName, error: err, func: 'deleteS3Bucket', file: 's3' });
          resolve({ message: bucketName + ' Bucket deleted successfully' });
        }
      });
    });
  });
}
/** Set Cors configuration for an S3 bucket
* @function setBucketCors
* @param {string} newBucketName Name of bucket to set Cors configuration for
*/
//TODO: Set this when creating bucket?
function setBucketCors(bucketName) {
  var corsOptions = {
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [{
        AllowedHeaders: ['*'],
        AllowedMethods: ['HEAD', 'GET', 'PUT', 'POST'],
        AllowedOrigins: ['http://*', 'https://*'],
        MaxAgeSeconds: 3000
        // ExposeHeaders: ['STRING_VALUE'],
      }]
    }
  };
  logger.log({ description: 'Cors Options being applied to bucket.', bucketName: bucketName, corsOptions: corsOptions, func: 'setBucketCors' });
  return new Promise(function (resolve, reject) {
    s3.putBucketCors(corsOptions, function (err, data) {
      if (err) {
        logger.error({ description: 'Error creating bucket website setup.', error: err, func: 'setBucketCors' });
        reject({ status: 500, error: err });
      } else {
        logger.log({ description: 'Bucket cors set successfully.', data: data });
        resolve();
      }
    });
  });
}
/**
* @description Copy one Bucket to another Bucket including the use of prefixes
 * @function copyBucketToBucket
 * @param {string|object} srcBucketInfo Object with name and prefix or name of bucket to copy as string
 * @param {string} srcBucketInfo.name Name of bucket to copy from
 * @param {string} srcBucketInfo.prefix Prefix of bucket to copy from
 * @param {string|object} destBucketName Object with name and prefix or name of bucket to copy src to
 * @param {string} srcBucketInfo.name Name of bucket to copy to
 * @param {string} srcBucketInfo.prefix Prefix of bucket to copy to
 */
//TODO: Provide the option to delete the local copy or not after operation is complete
function copyBucketToBucket(srcBucketInfo, destBucketInfo) {
  logger.log({ description: 'copyBucketToBucket called.', srcBucket: srcBucketInfo, destBucket: destBucketInfo, func: 'copyBucketToBucket' });
  var srcBucket = { prefix: '' };
  var destBucket = { prefix: '' };
  //Handle strings and objects
  if (_.isString(srcBucketInfo)) {
    srcBucket.name = srcBucketInfo;
  } else {
    srcBucket.name = srcBucketInfo.name;
    if (_.has(srcBucketInfo, 'prefix')) {
      srcBucket.prefix = srcBucketInfo.prefix;
    }
  }
  if (_.isString(destBucketInfo)) {
    destBucket.name = destBucketInfo;
  } else {
    destBucket.name = destBucketInfo.name;
    if (_.has(destBucketInfo, 'prefix')) {
      destBucket.prefix = destBucketInfo.prefix;
    }
  }
  var tempFolder = localFileStore + srcBucket.name;
  return downloadBucketToDir(srcBucket, tempFolder).then(function (downloadRes) {
    logger.log({ description: 'Bucket downloaded successfully.', downloadRes: downloadRes, func: 'copyBucketToBucket' });
    return uploadDirToBucket(destBucket, tempFolder).then(function (uploadRes) {
      logger.log({ description: 'Bucket uploaded successfully.', downloadRes: downloadRes, func: 'copyBucketToBucket' });
      return rimraf(tempFolder, function (err) {
        if (err) {
          logger.error({ description: 'Error removing local directory.', error: err, func: 'copyBucketToBucket' });
          return Promise.reject({ message: 'Error removing local directory.' });
        }
        return Promise.resolve(destBucket);
      });
    }, function (err) {
      logger.log({ description: 'Bucket upload error.', error: err, func: 'copyBucketToBucket' });
      return Promise.reject(err);
    });
  }, function (err) {
    logger.log({ description: 'Bucket download error.', error: err, func: 'copyBucketToBucket' });
    return Promise.reject(err);
  });
}
/**
* @description Set website configuration for an S3 bucket
* @function setBucketWebsite
* @param {string} newBucketName Name of bucket for which to set website configuration
*/
function setBucketWebsite(bucketName) {
  // logger.log('[setBucketWebsite()] setBucketWebsite called:', bucketName);
  var websiteConfig = {
    Bucket: bucketName,
    WebsiteConfiguration: {
      IndexDocument: {
        Suffix: 'index.html'
      }
    }
  };
  return new Promise(function (resolve, reject) {
    s3.putBucketWebsite(websiteConfig, function (err, data) {
      if (err) {
        logger.error({ description: 'Error creating bucket website setup.', error: err, func: 'setBucketWebsite' });
        reject({ status: 500, error: err });
      } else {
        logger.log({ description: 'Website config set. ', bucketName: bucketName, data: data, func: 'setBucketWebsite' });
        resolve();
      }
    });
  });
}

/** Upload file contents to S3 given bucket, file key and file contents
 * @function saveToBucket
 * @param {string} bucketName - Name of bucket to upload to
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */
function saveToBucket(bucketName, fileData) {
  // logger.log('[saveToBucket] saveToBucket called', arguments);
  var saveParams = { Bucket: bucketName, Key: fileData.key, Body: fileData.content, ACL: 'public-read' };
  if (_.has(fileData, 'contentType')) {
    saveParams.ContentType = fileData.contentType;
  }
  return new Promise(function (resolve, reject) {
    s3.putObject(saveParams, function (err, data) {
      //[TODO] Add putting object ACL (make public)
      if (!err) {
        logger.log({ description: 'File saved successfully.', data: data, func: 'saveToBucket' });
        resolve(data);
      } else {
        logger.error({ description: 'Error saving file.', error: err, func: 'saveToBucket' });
        reject(err);
      }
    });
  });
}

/** Upload local directory contents to provided S3 Bucket
 * @function saveToBucket
 * @param {string} bucketPath - Name or Name/location of bucket to upload files to
 * @param {string} localDir - Local directory to upload to S3
 */
function uploadDirToBucket(bucketPath, localDir) {
  logger.log({ description: 'uploadDirToBucket called:', bucketPath: bucketPath, func: 'uploadDirToBucket', obj: 's3' });
  var prefix = "",
      bucketName = bucketPath;
  var bucketPathArray = bucketName.split("/");
  if (bucketPathArray.length > 0) {
    logger.log({ description: 'BucketPathArray built', array: bucketPathArray, func: 'uploadDirToBucket', obj: 's3' });
    bucketName = bucketPathArray[0];
    prefix = bucketPathArray.slice(1).join("/");
  }
  var upParams = {
    localDir: localDir,
    s3Params: {
      Bucket: bucketName,
      Prefix: prefix,
      ACL: 'public-read'
    }
  };
  return new Promise(function (resolve, reject) {
    var uploader = s3Client.uploadDir(upParams);
    uploader.on('error', function (err) {
      logger.error({ description: 'Unable to upload directory to bucket.', error: err, func: 'uploadDirToBucket', obj: 's3' });
      reject(err);
    });
    // uploader.on('progress', () => {
    //   logger.log("progress", uploader.progressAmount, uploader.progressTotal);
    // });
    uploader.on('end', function () {
      logger.log({ description: 'Upload succesful.', func: 'uploadDirToBucket' });
      // [TODO] Delete new app folders
      var bucketUrl = bucketName + '.s3-website-us-east-1.amazonaws.com';
      logger.log({ description: 'Uploader finished. Bucket url generated.', bucketName: bucketName, bucketUrl: bucketUrl, func: 'uploadDirToBucket' });
      resolve(bucketUrl);
    });
  });
}

/** Insert data into template files
 * @function uploadToBucket
 * @param {array} filesArray List of template files as strings
 * @param {object} templateData Data to be templated into the file
 */
function templateFiles(filesArray, templateData) {
  //TODO: Template each file
  // var replaceVar = "ZZ";
  return _.map(filesArray, function (file) {
    var template = _.template(fileString);
    return template(templateData);
  });
}

/** Insert data into a local directory of template files
 * @function uploadToBucket
 * @param {array} filesArray
 * @param {object} templateData Data to be templated into the file
 */
function templateLocalDir(dirPath, templateData) {}
//TODO: Template each file loaded from path directory
// var template = _.template(fileString);
// var compiledFile = template(templateData);

/**
 * @description Insert data into a local directory of template files
 * @function uploadToBucket
 * @param {array} filesArray
 * @param {object} templateData Data to be templated into the file
 */
function getObjects(bucketName) {
  return new Promise(function (resolve, reject) {
    if (!bucketName) {
      logger.error({ description: 'Bucket name required to get objects.', func: 'getObjects' });
      return reject({ message: 'Bucket name required to get objects' });
    }
    s3.listObjects({ Bucket: bucketName }, function (err, data) {
      if (err) {
        logger.error({ description: 'Error listing objects.', error: err, func: 'getObjects' });
        reject(err);
      } else {
        logger.log({ description: 'listObjects returned.', data: data, func: 'getObjects' });
        resolve(data);
      }
    });
  });
}