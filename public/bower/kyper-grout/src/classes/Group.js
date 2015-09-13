import config from '../config';
import matter from './Matter';
import _ from 'lodash';
let request = matter.utils.request;
let logger = matter.utils.logger;

//Actions for specific user
class Group {
	constructor(actionData) {
		//Call matter with name and settings
		if (actionData && _.isObject(actionData) && _.has(actionData, 'groupData')) { //Data is object containing group data
			this.name = _.isObject(actionData.groupData) ? actionData.groupData.name : actionData.groupData;
			if (_.has(actionData, 'app')) {
				this.app = actionData.app;
			}
		} else if (actionData && _.isString(actionData)) { //Data is string name
			this.name = actionData;
		} else {
			logger.error({description: 'Action data is required to start a Group Action.', func: 'constructor', obj: 'Group'});
			throw new Error('Username is required to start an Group');
		}
	}
	get groupEndpoint() {
		let endpointArray = [matter.endpoint, 'groups', this.name];
		//Check for app account action

		if (_.has(this, 'app') && _.has(this.app, 'name')) {
			endpointArray.splice(1, 0, 'apps', this.app.name);
		}
		//Create string from endpointArray
		let endpointStr = endpointArray.join('/');
		logger.log({description: 'Group Endpoint built.', endpoint: endpointStr, func: 'groupEndpoint', obj: 'Group'});
		return endpointStr;
	}
	//Get userlications or single userlication
	get() {
		return request.get(this.groupEndpoint).then((response) => {
			logger.info({description: 'Group data loaded successfully.', response: response, func: 'get', obj: 'Group'});
			return response;
		})['catch']((errRes) => {
			logger.info({description: 'Error getting group.', error: errRes, func: 'get', obj: 'Group'});
			return Promise.reject(errRes.response.text || errRes.response);
		});
	}
	//Update an Group
	update(groupData) {
		logger.log({description: 'Group updated called.', groupData: groupData, func: 'update', obj: 'Group'});
		return matter.utils.request.put(this.groupEndpoint, groupData).then((response) => {
			logger.info({description: 'Group updated successfully.', groupData: groupData, response: response, func: 'update', obj: 'Group'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error updating group.', groupData: groupData, error: errRes, func: 'update', obj: 'Group'});
			return Promise.reject(errRes.response.text || errRes.response);
		});
	}
	//Delete an Group
	del(groupData) {
		logger.log({description: 'Delete group called.', groupData: groupData, func: 'del', obj: 'Group'});
		return request.del(this.groupEndpoint, {}).then((response) => {
			logger.info({description: 'Group deleted successfully.', groupData: groupData, func: 'del', obj: 'Group'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error deleting group.', error: errRes, text: errRes.response.text, groupData: groupData,  func: 'del', obj: 'Group'});
			return Promise.reject(errRes.response.text || errRes.response);
		});
	}
	//Update an Group
	addAccounts(accountsData) {
		logger.log({description: 'Group updated called.', accountsData: accountsData, func: 'update', obj: 'Group'});
		let accountsArray = accountsData;
		//Handle provided data being a string list
		if (_.isString(accountsData)) {
			accountsArray = accountsData.split(',');
		}
		//Check item in array to see if it is a string (username) instead of _id
		if (_.isString(accountsArray[0])) {
			logger.error({description: 'Accounts array only currently supports account._id not account.username.', accountsData: accountsData, func: 'update', obj: 'Group'});
			return Promise.reject({message: 'Accounts array only currently supports account._id not account.username.'});
		}
		logger.log({description: 'Updating group with accounts array.', accountsArray: accountsArray, func: 'update', obj: 'Group'});
		return this.update({accounts: accountsArray}).then((response) => {
			logger.info({description: 'Account(s) added to group successfully.', response: response, func: 'addAccounts', obj: 'Group'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error addAccountseting group.', error: errRes,  func: 'addAccounts', obj: 'Group'});
			return Promise.reject(errRes.response.text || errRes.response);
		});
	}
}

export default Group;
