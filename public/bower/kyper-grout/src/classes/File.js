import config from '../config';
import matter from './Matter';
import _ from 'lodash';

import AWS from 'aws-sdk';
//Convenience vars
let request = matter.utils.request;
let logger = matter.utils.logger;

class File {
	constructor(actionData) {
		if (actionData && _.isObject(actionData) && _.has(actionData, 'fileData') && _.has(actionData, 'app')) {
			_.extend(this, actionData.fileData);
			this.app = actionData.app;
			this.pathArray = this.path.split('/');
			//Get name from data or from pathArray
			this.name = _.has(actionData.fileData, 'name') ? actionData.fileData.name : this.pathArray[this.pathArray.length - 1];
		} else if (actionData && !_.isObject(actionData)) {
			logger.error({description: 'File data is not an object. File data must be an object that includes path and appName.', func: 'constructor', obj: 'File'});
			//TODO: Get appName from path data?
			throw new Error('File data must be an object that includes path and appName.');
		} else {
			logger.error({description: 'File data that includes path and app is needed to create a File action.', func: 'constructor', obj: 'File'});
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
			logger.log({description: 'Application Frontend data not available. Calling applicaiton get.', func: 'get', obj: 'File'});
			return this.app.get().then((appData) => {
				this.app = appData;
				logger.log({description: 'Application get successful. Getting file.', app: appData, func: 'get', obj: 'File'});
				return this.get();
			}, (err) => {
				logger.error({description: 'Application Frontend data not available. Make sure to call .get().', error: err, func: 'get', obj: 'File'});
				return Promise.reject({message: 'Front end data is required to get file.'});
			});
		} else {
			//If AWS Credential do not exist, set them
			if (typeof AWS.config.credentials == 'undefined' || !AWS.config.credentials) {
				logger.debug({description: 'AWS creds do not exist, so they are being set.', func: 'publish', obj: 'File'});
				setAWSConfig();
			}
			let s3 = new AWS.S3();
			let saveParams = {
				Bucket: this.app.frontend.bucketName,
				Key: this.path
			};
			//Set contentType from actionData to ContentType parameter of new object
			if (this.contentType) {
				saveParams.ContentType = this.contentType;
			}
			logger.debug({description: 'File get params built.', saveParams: saveParams, file: this, func: 'get', obj: 'File'});
			return new Promise((resolve, reject) => {
				s3.getObject(saveParams, function(err, data) {
					//[TODO] Add putting object ACL (make public)
					if (!err) {
						logger.info({description: 'File loaded successfully.', fileData: data, func: 'get', obj: 'File'});
						if (_.has(data, 'Body')) {
							logger.info({description: 'File has content.', fileData: data.Body.toString(), func: 'get', obj: 'File'});
							resolve(data.Body.toString());
						} else {
							resolve(data);
						}
					}	else {
						logger.error({description: 'Error loading file from S3.', error: err, func: 'get', obj: 'File'});
						return reject(err);
					}
				});
			});
		}
	}
	//Alias for get
	open() {
		return this.get();
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
			if (this.contentType) {
				saveParams.ContentType = this.contentType;
			}
			//If AWS Credential do not exist, set them
			if (typeof AWS.config.credentials == 'undefined' || !AWS.config.credentials) {
				logger.debug({description: 'AWS creds do not exist, so they are being set.', func: 'publish', obj: 'File'});
				setAWSConfig();
			}
			let s3 = new AWS.S3();

			logger.debug({description: 'File publish params built.', saveParams: saveParams, fileData: this, func: 'publish', obj: 'File'});
			return new Promise((resolve, reject) => {
				s3.putObject(saveParams, function(err, data) {
					//[TODO] Add putting object ACL (make public)
					if (!err) {
						logger.log({description: 'File saved successfully.', response: data, func: 'publish', obj: 'File'});
						resolve(data);
					}	else {
						logger.error({description: 'Error saving file to S3.', error: err, func: 'publish', obj: 'File'});
						reject(err);
					}
				});
			});
		}
	}
	del() {
		if (!this.app || !this.app.frontend) {
			logger.log({description: 'Application Frontend data not available. Calling applicaiton get.', func: 'get', obj: 'File'});
			return this.app.get().then((appData) => {
				this.app = appData;
				logger.log({description: 'Application get successful. Getting file.', app: appData, func: 'get', obj: 'File'});
				return this.get();
			}, (err) => {
				logger.error({description: 'Application Frontend data not available. Make sure to call .get().', error: err, func: 'get', obj: 'File'});
				return Promise.reject({message: 'Front end data is required to get file.'});
			});
		} else {
			//If AWS Credential do not exist, set them
			if (typeof AWS.config.credentials == 'undefined' || !AWS.config.credentials) {
				logger.debug({description: 'AWS creds do not exist, so they are being set.', func: 'publish', obj: 'File'});
				setAWSConfig();
			}
			let s3 = new AWS.S3();
			let saveParams = {
				Bucket: this.app.frontend.bucketName,
				Key: this.path
			};
			//Set contentType from actionData to ContentType parameter of new object
			if (this.contentType) {
				saveParams.ContentType = this.contentType;
			}
			logger.debug({description: 'File get params built.', saveParams: saveParams, file: this, func: 'get', obj: 'File'});
			return new Promise((resolve, reject) => {
				s3.deleteObject(saveParams, function(err, data) {
					//[TODO] Add putting object ACL (make public)
					if (!err) {
						logger.info({description: 'File loaded successfully.', fileData: data, func: 'get', obj: 'File'});
						if (_.has(data, 'Body')) {
							logger.info({description: 'File has content.', fileData: data.Body.toString(), func: 'get', obj: 'File'});
							resolve(data.Body.toString());
						} else {
							resolve(data);
						}
					}	else {
						logger.error({description: 'Error loading file from S3.', error: err, func: 'get', obj: 'File'});
						return reject(err);
					}
				});
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
		//TODO: Fill with default data for matching file type
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
