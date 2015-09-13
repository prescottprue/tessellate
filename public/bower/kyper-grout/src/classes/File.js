import config from '../config';
import matter from './Matter';
import _ from 'lodash';

import AWS from 'aws-sdk';
//Convenience vars
let request = matter.utils.request;
let logger = matter.utils.logger;

class File {
	constructor(fileData) {
		if (fileData && _.isObject(fileData) && _.has(fileData, ['path', 'app'])) {
			this.path = fileData.path;
			this.app = fileData.app;
			this.pathArray = this.path.split('/');
			//Get name from data or from pathArray
			this.name = _.has(fileData, 'name') ? fileData.name : this.pathArray[this.pathArray.length - 1];
		} else if (fileData && !_.isObject(fileData)) {
			logger.error({description: 'File data is not an object. File data must be an object that includes path and appName.', func: 'constructor', obj: 'File'});
			//TODO: Get appName from path data?
			throw new Error('File data must be an object that includes path and appName.');
		} else {
			logger.error({description: 'File data include path and app is needed to create a File action.', func: 'constructor', obj: 'File'});
			throw new Error('File data with path and app is needed to create file action.');
		}
		this.type = 'file';
		logger.debug({description: 'File object constructed.', file: this, func: 'constructor', obj: 'File'});
	}
	get ext() {
		let re = /(?:\.([^.]+))?$/;
		this.ext = re.exec(this.name)[1];
	}
	get() {
		if (!this.app || !this.app.frontend) {
			logger.error({description: 'Application Frontend data not available. Make sure to call .get().', func: 'get', obj: 'File'});
			return Promise.reject({message: 'Front end data is required to get file.'});
		} else {
			let saveParams = {
				Bucket: this.app.frontend.bucketName,
				Key: this.path
			};
			//Set contentType from fileData to ContentType parameter of new object
			if (fileData.contentType) {
				saveParams.ContentType = fileData.contentType;
			}
			logger.debug({description: 'File get params built.', saveParams: saveParams, fileData: fileData, func: 'get', obj: 'File'});
			return s3.getObject(saveParams, function(err, data) {
				//[TODO] Add putting object ACL (make public)
				if (!err) {
					logger.error({description: 'File loaded successfully.', fileData: data, func: 'get', obj: 'File'});
					return data;
				}	else {
					logger.error({description: 'Error loading file from S3.', error: err, func: 'get', obj: 'File'});
					return Promise.reject(err);
				}
			});
		}
	}
	//Alias for get
	open() {
		return this.get;
	}
	publish(fileData) {
		//TODO: Publish file to application
		logger.debug({description: 'File publish called.', file: this, fileData: fileData, func: 'publish', obj: 'File'});
		if (!this.app.frontend) {
			logger.error({description: 'Application Frontend data not available. Make sure to call .get().', func: 'publish', obj: 'File'});
			return Promise.reject({message: 'Front end data is required to publish file.'});
		} else {
			if (!_.has(fileData, ['content', 'path'])) {
				logger.error({description: 'File data including path and content required to publish.', func: 'publish', obj: 'File'});
				return Promise.reject({message: 'File data including path and content required to publish.'});
			}
			let saveParams = {
				Bucket: this.app.frontend.bucketName,
				Key: fileData.path,
				Body: fileData.content,
				ACL: 'public-read'
			};
			//Set contentType from fileData to ContentType parameter of new object
			if (fileData.contentType) {
				saveParams.ContentType = fileData.contentType;
			}
			//If AWS Credential do not exist, set them
			if (typeof AWS.config.credentials == 'undefined' || !AWS.config.credentials) {
				logger.debug({description: 'AWS creds do not exist, so they are being set.', func: 'publish', obj: 'File'});
				setAWSConfig();
			}
			logger.debug({description: 'File publish params built.', saveParams: saveParams, fileData: fileData, func: 'publish', obj: 'File'});
			return s3.putObject(saveParams, function(err, data) {
				//[TODO] Add putting object ACL (make public)
				if (!err) {
					logger.error({description: 'File saved successfully.', fileData: data, func: 'publish', obj: 'File'});
					return data;
				}	else {
					logger.error({description: 'Error saving file to S3.', error: err, func: 'publish', obj: 'File'});
					return Promise.reject(err);
				}
			});
		}
	}
	getTypes() {
		//Get content type and file type from extension
	}
	openWithFirepad(divId) {
		//TODO:Create new Firepad instance within div
	}
	getDefaultContent() {

	}
}
export default File;
//------------------ Utility Functions ------------------//

// AWS Config
function setAWSConfig() {
	AWS.config.update({
	  credentials: new AWS.CognitoIdentityCredentials({
	  IdentityPoolId: config.aws.cognito.poolId
	  }),
	  region: config.aws.region
	});
}
