import config from '../config';
import matter from './Matter';
import _ from 'lodash';
let request = matter.utils.request;
let logger = matter.utils.logger;

//Actions for specific directory
class Directory {
	constructor(actionData) {
		if (actionData && _.isObject(actionData) && (_.has(actionData, 'directoryName') || _.has(actionData, 'name'))) { //Data is object containing directory data
			this.name = actionData.directoryName || actionData.name;
			if (_.has(actionData, 'appName')) {
				this.appName = actionData.appName;
			}
		} else if (actionData && _.isString(actionData)) { //Data is string name
			this.name = actionData;
		} else {
			logger.error({description: 'Action data object with name is required to start a Directory Action.', func: 'constructor', obj: 'Directory'});
			throw new Error('Directory Data object with name is required to start a Directory action.');
		}
	}
	get directoryEndpoint() {
		let endpointArray = [matter.endpoint, 'directories', this.name];
		//Check for app account action
		if (_.has(this, 'app') && _.has(this.app, 'name')) {
			endpointArray.splice(1, 0, 'apps', this.app.name);
		}
		//Create string from endpointArray
		let endpointStr = endpointArray.join('/');
		logger.log({description: 'Directory endpoint built.', endpoint: endpointStr, func: 'directoryEndpoint', obj: 'Directory'});
		return endpointStr;
	}
	//Get userlications or single userlication
	get() {
		return request.get(this.directoryEndpoint).then((response) => {
			logger.info({description: 'Directory data loaded successfully.', directoryData: directoryData, response: response, func: 'get', obj: 'Directory'});
			return response;
		})['catch']((errRes) => {
			logger.info({description: 'Error getting directory.', directoryData: directoryData, error: errRes, func: 'get', obj: 'Directory'});
			return Promise.reject(errRes);
		});
	}
	//Update an Directory
	update(directoryData) {
		logger.debug({description: 'Directory updated called.', directoryData: directoryData, func: 'update', obj: 'Directory'});
		return matter.utils.request.put(this.directoryEndpoint, directoryData).then((response) => {
			logger.info({description: 'Directory updated successfully.', directoryData: directoryData, response: response, func: 'update', obj: 'Directory'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error updating directory.', directoryData: directoryData, error: errRes, func: 'update', obj: 'Directory'});
			return Promise.reject(errRes);
		});
	}
	//Delete an Directory
	del(directoryData) {
		logger.debug({description: 'Delete directory called.', directoryData: directoryData, func: 'del', obj: 'Directory'});
		return request.delete(this.directoryEndpoint, userData).then((response) => {
			logger.info({description: 'Directory deleted successfully.', directoryData: directoryData, func: 'del', obj: 'Directory'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error deleting directory.', directoryData: directoryData, error: errRes, func: 'del', obj: 'Directory'});
			return Promise.reject(errRes);
		});
	}
}

export default Directory;
