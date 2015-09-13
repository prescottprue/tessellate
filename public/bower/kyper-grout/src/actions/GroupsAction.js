import config from '../config';
import _ from 'lodash';
import matter from '../classes/Matter';
let request = matter.utils.request;
let logger = matter.utils.logger;

//Actions for users list
class GroupsAction {
	constructor(actionData) {
		//Check to see if action is for a specific app
		if (actionData && _.isObject(actionData) && _.has(actionData, 'app')) {
			this.app = actionData.app;
			logger.log({description: 'Provided app data set to app parameter.', action: this, providedData: actionData, func: 'constructor', obj: 'GroupsAction'});
		} else if (actionData && _.isString(actionData)) {
			this.app = {name: actionData};
			logger.log({description: 'App name provided as string was set.', action: this, providedData: actionData, func: 'constructor', obj: 'GroupsAction'});
		}
		logger.info({description: 'New Groups action.', action: this, providedData: actionData, func: 'constructor', obj: 'GroupsAction'});
	}
	get groupsEndpoint() {
		let endpointArray = [matter.endpoint, 'groups'];
		//Check for app groups action
		if (_.has(this, 'app') && _.has(this.app, 'name')) {
			endpointArray = endpointArray.splice(1, 0, 'apps', this.app.name);
		}
		//Create string from endpointArray
		let endpointStr = endpointArray.join('/');
		logger.log({description: 'Groups Endpoint built.', endpoint: endpointStr, func: 'groupsEndpoint', obj: 'GroupsAction'});
		return endpointStr;
	}
	//Get users or single application
	get() {
		logger.debug({description: 'Get group called.', func: 'get', obj: 'GroupsAction'});
		return request.get(this.groupsEndpoint).then((response) => {
			logger.info({description: 'Groups loaded successfully.', response: response, func: 'get', obj: 'GroupsAction'});
			return response;
		})['catch']((errRes) => {
			logger.info({description: 'Error getting groups.', error: errRes, func: 'get', obj: 'GroupsAction'});
			return Promise.reject(errRes);
		});
	}
	//Add an application
	add(groupData) {
		var newGroupData = groupData;
		logger.debug({description: 'Add group called.', groupData: groupData, func: 'add', obj: 'GroupsAction'});
		if (_.isString(groupData)) {
			//Group data is string
			newGroupData = {name: groupData};
		}
		logger.debug({description: 'Add group called.', newGroupData: newGroupData, func: 'add', obj: 'GroupsAction'});
		return request.post(this.groupsEndpoint, newGroupData).then((response) => {
			logger.log({description: 'Group added to application successfully.', response: response, func: 'add', obj: 'GroupsAction'});
			//TODO: Return list of group objects
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error adding group.', error: errRes, func: 'add', obj: 'GroupsAction'});
			return Promise.reject(errRes);
		});
	}
	//Search with partial of username
	search(query) {
		logger.debug({description: 'Add group called.', groupData: groupData, func: 'search', obj: 'GroupsAction'});
		if (!query || query == '' || !_.isString(query)) {
			logger.log({description: 'Null or invalid query, returning empty array.', func: 'search', obj: 'GroupsAction'});
			return Promise.resolve([]);
		}
		let searchEndpoint = `${this.groupsEndpoint}/search/${query}`;
		logger.debug({description: 'Search endpoint created.', endpoint: searchEndpoint, func: 'search', obj: 'GroupsAction'});
		return request.get(searchEndpoint).then((response) => {
			logger.log({description: 'Found groups based on search.', response: response, func: 'search', obj: 'GroupsAction'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error searching groups.', error: errRes, func: 'search', obj: 'GroupsAction'});
			return Promise.reject(errRes);
		});
	}
}
export default GroupsAction;
