import config from '../config';
import matter from '../classes/Matter';
import _ from 'lodash';
let request = matter.utils.request;
let logger = matter.utils.logger;

//Actions for specific user
class Account {
	constructor(accountData) {
		//Call matter with name and settings
		if (accountData && _.isObject(accountData) && _.has(accountData, 'username')) {
			_.extend(this, accountData);
		} else if (accountData && _.isString(accountData)) {
			this.username = accountData;
		} else {
			logger.error({description: 'AccountData is required to start an AccountAction', func: 'constructor', obj: 'Account'});
			throw new Error('username is required to start an AccountAction');
		}
	}
	//Build endpoint based on accountData
	get accountEndpoint() {
		let endpointArray = [matter.endpoint, 'accounts', this.username];
		//Check for app account action
		if (_.has(this, 'app') && _.has(this.app, 'name')) {
			endpointArray.splice(1, 0, 'apps', this.app.name);
		}
		//Create string from endpointArray
		let endpointStr = endpointArray.join('/');
		logger.log({description: 'Account Endpoint built.', endpoint: endpointStr, func: 'accountEndpoint', obj: 'Account'});
		return endpointStr;
	}
	//Get a user
	get() {
		logger.debug({description: 'Account data loaded successfully.', func: 'get', obj: 'Account'});
		return request.get(this.accountEndpoint).then((response) => {
			logger.info({description: 'Account data loaded successfully.', response: response, func: 'get', obj: 'Account'});
			return new Account(response);
		})['catch']((errRes) => {
			logger.error({description: 'Error getting user.', error: errRes, func: 'get', obj: 'Account'});
			return Promise.reject(errRes);
		});
	}
	//Update a Account
	update(accountData) {
		logger.debug({description: 'Update user called.', accountData: accountData, func: 'update', obj: 'Account'});
		return request.put(this.accountEndpoint, accountData).then((response) => {
			logger.info({description: 'Account updated successfully.', func: 'update', obj: 'Account'});
			//TODO: Extend this with current info before returning
			return new Account(response);
		})['catch']((errRes) => {
			logger.error({description: 'Error updating user.', func: 'update', obj: 'Account'});
			return Promise.reject(errRes);
		});
	}
	//Delete a Account
	del(accountData) {
		logger.debug({description: 'Delete user called.', func: 'del', obj: 'Account'});
		return request.del(this.accountEndpoint, accountData).then((response) => {
			logger.info({description: 'Delete user successful.', response: response, func: 'del', obj: 'Account'});
			return new Account(response);
		})['catch']((errRes) => {
			logger.error({description: 'Error deleting user.', accountData: accountData, error: errRes, func: 'del', obj: 'Account'});
		return Promise.reject(errRes);
		});
	}
}

export default Account;
