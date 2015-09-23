import config from '../config';
import _ from 'lodash';
import matter from './Matter';

import AWS from 'aws-sdk';
//Convenience vars
let request = matter.utils.request;
let logger = matter.utils.logger;

class Files {
	constructor(filesData) {
		if (filesData && _.isObject(filesData) && _.has(filesData, 'app')) { //Data is object containing directory data
			this.app = filesData.app;
		} else if (filesData && _.isString(filesData)) { //Data is string name
			this.app = {name: filesData};
		} else if (filesData && _.isArray(filesData)) {
			//TODO: Handle an array of files being passed as data
			logger.error({description: 'Action data object with name is required to start a Files Action.', func: 'constructor', obj: 'Files'});
			throw new Error('Files Data object with application is required to start a Files action.');
		} else {
			logger.error({description: 'Action data object with name is required to start a Files Action.', func: 'constructor', obj: 'Files'});
			throw new Error('Files Data object with name is required to start a Files action.');
		}
		logger.debug({description: 'Files object constructed.', func: 'constructor', obj: 'Files'});
	}
	publish() {
		//TODO: Publish all files
	}
	get() {
		if (!this.app.frontend || !this.app.frontend.bucketName) {
			logger.warn({description: 'Application Frontend data not available. Calling .get().', app: this.app, func: 'get', obj: 'Files'});
			return this.app.get().then((applicationData) => {
				logger.log({description: 'Application get returned.', data: applicationData, func: 'get', obj: 'Files'});
				this.app = applicationData;
				if (_.has(applicationData, 'frontend')) {
					return this.get();
				} else {
					logger.error({description: 'Application does not have Frontend to get files from.', func: 'get', obj: 'Files'});
					return Promise.reject({message: 'Application does not have frontend to get files from.'});
				}
			}, (err) => {
				logger.error({description: 'Application Frontend data not available. Make sure to call .get().', func: 'get', obj: 'Files'});
				return Promise.reject({message: 'Bucket name required to get objects'});
			});
		} else {
			//If AWS Credential do not exist, set them
			if (typeof AWS.config.credentials == 'undefined' || !AWS.config.credentials) {
				// logger.info('AWS creds are being updated to make request');
				setAWSConfig();
			}
			let s3 = new AWS.S3();
			let listParams = {Bucket: this.app.frontend.bucketName};
			return new Promise((resolve, reject) => {
				s3.listObjects(listParams, function(err, data) {
					if (!err) {
						logger.info({description: 'Files list loaded.', filesData: data, func: 'get', obj: 'Files'});
						return resolve(data.Contents);
					} else {
						logger.error({description: 'Error getting files from S3.', error: err, func: 'get', obj: 'Files'});
						return reject(err);
					}
				});
			});
		}
	}
	add(fileData) {
		//TODO: Add a file to files list
	}
	del() {
		//TODO: Delete a file from files list
	}
	buildStructure() {
		logger.debug({description: 'Build Structure called.', func: 'buildStructure', obj: 'Application'});
		return this.get().then((filesArray) => {
			const childStruct = childrenStructureFromArray(filesArray);
			//TODO: have child objects have correct classes (file/folder)
			logger.log({description: 'Child struct from array.', childStructure: childStruct, func: 'buildStructure', obj: 'Application'});
			return childStruct;
		}, (err) => {
			logger.error({description: 'Error getting application files.', error: err, func: 'buildStructure', obj: 'Application'});
			return Promise.reject({message: 'Error getting files.', error: err});
		});
	}
	//ALIAS FOR buildStructure
	// get structure() {
	// 	return this.buildStructure();
	// }
}
export default Files;
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
//Convert from array file structure (from S3) to 'children' structure used in Editor GUI (angular-tree-control)
//Examples for two files (index.html and /testFolder/file.js):
//Array structure: [{path:'index.html'}, {path:'testFolder/file.js'}]
//Children Structure [{type:'folder', name:'testfolder', children:[{path:'testFolder/file.js', name:'file.js', filetype:'javascript', contentType:'application/javascript'}]}]
function childrenStructureFromArray(fileArray) {
	// logger.log('childStructureFromArray called:', fileArray);
	//Create a object for each file that stores the file in the correct 'children' level
	var mappedStructure = fileArray.map(function(file) {
		return buildStructureObject(file);
	});
	return combineLikeObjs(mappedStructure);
}
//Convert file with key into a folder/file children object
function buildStructureObject(file) {
	var pathArray;
	// console.log('buildStructureObject with:', file);
	if (_.has(file, 'path')) {
		//Coming from files already having path (structure)
		pathArray = file.path.split('/');
	} else {
		//Coming from aws
		pathArray = file.Key.split('/');
		// console.log('file before pick:', file);
		file = _.pick(file, 'Key');
		file.path = file.Key;
		file.name = file.Key;
	}
	var currentObj = file;
	if (pathArray.length == 1) {
		currentObj.name = pathArray[0];
		if (!_.has(currentObj,'type')) {
			currentObj.type = 'file';
		}
		currentObj.path = pathArray[0];
		return currentObj;
	} else {
		var finalObj = {};
		_.each(pathArray, (loc, ind, list) => {
			if (ind != list.length - 1) {//Not the last loc
				currentObj.name = loc;
				currentObj.path = _.take(list, ind + 1).join('/');
				currentObj.type = 'folder';
				currentObj.children = [{}];
				//TODO: Find out why this works
				if (ind == 0) {
					finalObj = currentObj;
				}
				currentObj = currentObj.children[0];
			} else {
				currentObj.type = 'file';
				currentObj.name = loc;
				currentObj.path = pathArray.join('/');
				if (file.$id) {
					currentObj.$id = file.$id;
				}
			}
		});
		return finalObj;
	}
}
//Recursivley combine children of object's that have the same names
function combineLikeObjs(mappedArray) {
	var takenNames = [];
	var finishedArray = [];
	_.each(mappedArray, (obj, ind, list) => {
		if (takenNames.indexOf(obj.name) == -1) {
			takenNames.push(obj.name);
			finishedArray.push(obj);
		} else {
			var likeObj = _.findWhere(mappedArray, {name: obj.name});
			//Combine children of like objects
			likeObj.children = _.union(obj.children, likeObj.children);
			likeObj.children = combineLikeObjs(likeObj.children);
			// logger.log('extended obj:',likeObj);
		}
	});
	return finishedArray;
}
