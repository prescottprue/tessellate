import config from '../config';
import request from '../utils/request';
import Firebase from 'firebase';
import _ from 'lodash';

/**
 * Application class.
 *
 */
class Application {
	constructor(appData) {
		this.name = appData.name;
		this.owner = appData.owner || null;
		this.collaborators = appData.collaborators || [];
		this.createdAt = appData.createdAt;
		this.updatedAt = appData.updatedAt;
		this.frontend = appData.frontend || {};
		this.backend = appData.backend || {};
		if (Firebase) {
			this.fbRef = new Firebase(config.fbUrl + appData.name);
		}
	}
	//Get files list and convert to structure
	getStructure() {
		return this.getFiles().then((filesArray) => {
			const childStruct = childrenStructureFromArray(filesArray);
			console.log('Child struct from array:', childStruct);
			return childStruct;
		}, (err) => {
			console.error('[Application.getStructure] Error getting files: ', err);
			return Promise.reject({message: 'Error getting files.', error: err});
		});
	}
	//Get files list from S3
	getFiles() {
		if (!this.frontend || !this.frontend.bucketName) {
			console.error('[Applicaiton.getFiles] Attempting to get objects for bucket without name.');
			return Promise.reject({message: 'Bucket name required to get objects'});
		} else {
			//If AWS Credential do not exist, set them
			if (typeof AWS.config.credentials == 'undefined' || !AWS.config.credentials) {
				// console.info('AWS creds are being updated to make request');
				setAWSConfig();
			}
			var s3 = new AWS.S3();
			var listParams = {Bucket: this.frontend.bucketName};
			return new Promise((resolve, reject) => {
				s3.listObjects(listParams, function(err, data) {
					if (!err) {
						console.log('[Application.getObjects()] listObjects returned:', data);
						return resolve(data.Contents);
					} else {
						console.error('[Application.getObjects()] Error listing objects:', err);
						return reject(err);
					}
				});
			});
		}
	}
	publishFile(fileData) {
		if (!this.frontend) {
			console.error('Frontend data not available. Make sure to call .get().');
			return Promise.reject({message: 'Front end data is required to publish file.'});
		}
		var saveParams = {Bucket: this.frontent.bucketName, Key: fileData.key,  Body: fileData.content, ACL: 'public-read'};
		//Set contentType from fileData to ContentType parameter of new object
		if (fileData.contentType) {
			saveParams.ContentType = fileData.contentType;
		}
		// console.log('[$aws.$saveFiles] saveParams:', saveParams);
		return s3.putObject(saveParams, function(err, data) {
			//[TODO] Add putting object ACL (make public)
			if (!err) {
				console.log('[Application.publishFile()] file saved successfully. Returning:', data);
				return data;
			}	else {
				console.error('[Application.publishFile()] Error saving file:', err);
				return Promise.reject(err);
			}
		});
	}
	addStorage() {
		//TODO:Add storage bucket
		var endpoint = config.serverUrl + '/apps/' + this.name + '/storage';
		return request.post(endpoint, appData).then((response) => {
			console.log('[Application.addStorage()] Apps:', response);
			return new Application(response);
		})['catch']((errRes) => {
			console.error('[Application.addStorage()] Error getting apps list: ', errRes);
			return Promise.reject(errRes);
		});
	}
	applyTemplate() {
		var endpoint = config.serverUrl + '/apps/' + this.name + '/template';
		console.log('Applying templates to existing');
		// return request.post(endpoint, appData).then(function(response) {
		// 	console.log('[Application.addStorage()] Apps:', response);
		// 	if (!apps.isList) {
		// 		return new Application(response);
		// 	}
		// 	return response;
		// })['catch'](function(errRes) {
		// 	console.error('[Application.addStorage()] Error getting apps list: ', errRes);
		// 	return Promise.reject(errRes);
		// });
	}
}

export default Application;

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
	// console.log('childStructureFromArray called:', fileArray);
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
				currentObj.path = _.first(list, ind + 1).join('/');
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
			// console.log('extended obj:',likeObj);
		}
	});
	return finishedArray;
}
