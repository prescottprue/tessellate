import config from '../config';
import _ from 'lodash';
import matter from '../classes/Matter';
let request = matter.utils.request;
let logger = matter.utils.logger;

//Actions for directories list
class DirectoriesAction {
	constructor(actionData) {
		//Check to see if action is for a specific app
		if (actionData && _.isObject(actionData) && _.has(actionData, 'app')) {
			this.app = actionData.app;
			logger.log({description: 'Provided app data set to app parameter.', action: this, providedData: actionData, func: 'constructor', obj: 'DirectoriesAction'});
		} else if (actionData && _.isString(actionData)) {
			this.app = {name: actionData};
			logger.log({description: 'App name provided as string was set.', action: this, providedData: actionData, func: 'constructor', obj: 'DirectoriesAction'});
		}
		logger.info({description: 'New directories action.', action: this, providedData: actionData, func: 'constructor', obj: 'DirectoriesAction'});
	}
	get directoriesEndpoint() {
		let endpointArray = [matter.endpoint, 'directories'];
		//Check for app groups action
		if (_.has(this, 'app') && _.has(this.app, 'name')) {
			endpointArray.splice(1, 0, 'apps', this.app.name);
		}
		//Create string from endpointArray
		let endpointStr = endpointArray.join('/');
		logger.log({description: 'Directories endpoint built.', endpoint: endpointStr, func: 'directoriesEndpoint', obj: 'DirectoriesAction'});
		return endpointStr;
	}
	//Get users or single application
	get() {
		logger.debug({description: 'Directories get called.', action: this, func: 'get', obj: 'DirectoriesAction'});
		return request.get(this.directoriesEndpoint).then((response) => {
			logger.info({descrption: 'Directories loaded successfully.', response: response, func: 'get', obj: 'DirectoriesAction'});
			return response;
		})['catch']((errRes) => {
			logger.error({descrption: 'error getting users', error: errRes, func: 'get', obj: 'DirectoriesAction'});
			return Promise.reject(errRes);
		});
	}
	//Add an application
	add(appData) {
		logger.debug({description: 'Add directory called.', action: this, appData: appData, func: 'get', obj: 'DirectoriesAction'});
		return request.post(this.directoriesEndpoint, appData).then((response) => {
			logger.log({description: 'Application added successfully.', response: response, func: 'add', obj: 'DirectoriesAction'});
			//TODO: Return list of group objects
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error adding group.', error: errRes, func: 'add', obj: 'DirectoriesAction'});
			return Promise.reject(errRes);
		});
	}
	//Search with partial of directory name
	search(query) {
		var searchEndpoint = this.directoriesEndpoint + '/search/';
		if (query && _.isString(query)) {
			searchEndpoint += query;
		}
		if (!query || query == '') {
			logger.debug({description: 'Null query, returning empty array.', func: 'search', obj: 'DirectoriesAction'});
			return Promise.resolve([]);
		}
		return request.get(searchEndpoint).then((response) => {
			logger.log({description: 'Found directories based on search.', response: response, func: 'search', obj: 'DirectoriesAction'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error searching directories.', error: errRes, func: 'search', obj: 'DirectoriesAction'});
			return Promise.reject(errRes);
		});
	}
}
export default DirectoriesAction;
