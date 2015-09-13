import config from '../config';
import _ from 'lodash';
import matter from '../classes/Matter';
import Account from '../classes/Account';

let logger = matter.utils.logger;
//Actions for accounts list
class AccountsAction {
	constructor(actionData) {
		//Check to see if action is for a specific app
		if (actionData && _.isObject(actionData) && _.has(actionData, 'app')) {
			this.app = actionData.app;
			logger.log({description: 'Provided app data set to app parameter.', action: this, providedData: actionData, func: 'constructor', obj: 'AccountsAction'});
		} else if (actionData && _.isString(actionData)) {
			this.app = {name: actionData};
			logger.log({description: 'App name provided as string was set.', action: this, providedData: actionData, func: 'constructor', obj: 'AccountsAction'});
		}
		logger.info({description: 'New Accounts action.', action: this, providedData: actionData, func: 'constructor', obj: 'AccountsAction'});
	}
	get accountsEndpoint() {
		let endpointArray = [matter.endpoint, 'accounts'];
		//Check for app account action
		if (_.has(this, 'app') && _.has(this.app, 'name')) {
			//Splice apps, appName into index 1
			endpointArray.splice(1, 0, 'apps', this.app.name);
		}
		//Create string from endpointArray
		let endpointStr = endpointArray.join('/');
		logger.log({description: 'Accounts Endpoint built.', endpoint: endpointStr, func: 'accountsEndpoint', obj: 'AccountsAction'});
		return endpointStr;
	}
	//Get accounts or single application
	get() {
		logger.log({description: 'Accounts get called.', func: 'get', obj: 'AccountsAction'});
		return matter.utils.request.get(this.accountsEndpoint).then((response) => {
			logger.info({description: 'Accounts loaded successfully.', func: 'get', obj: 'AccountsAction'});
			return response;
		})['catch']((errRes) => {
			logger.info({description: 'Error getting accounts.', error: errRes, func: 'get', obj: 'AccountsAction'});
			return Promise.reject(errRes.message || 'Error getting accounts.');
		});
	}
	//Add an application
	add(accountData) {
		logger.info({description: 'Account add called.', accountData: accountData, func: 'add', obj: 'AccountsAction'});
		return this.utils.request.post(this.accountsEndpoint, accountData).then((response) => {
			logger.info({description: 'Account added successfully.', response: response, newAccount: new Account(response), func: 'add', obj: 'AccountsAction'});
			return new Account(response);
		})['catch']((errRes) => {
			logger.error({description: 'Account add called.', error: errRes, accountData: accountData, func: 'add', obj: 'AccountsAction'});
			return Promise.reject(errRes.message || 'Error adding account.');
		});
	}
	//Search with partial of accountname
	search(query) {
		logger.log({description: 'Accounts search called.', query: query, func: 'search', obj: 'AccountsAction'});
		var searchEndpoint = this.accountsEndpoint + '/search/';
		if (query && _.isString(query)) {
			searchEndpoint += query;
		}
		if (!query || query == '') {
			logger.log({description: 'Null query, returning empty array.', func: 'search', obj: 'AccountsAction'});
			return Promise.resolve([]);
		}
		return matter.utils.request.get(searchEndpoint).then((response) => {
			logger.log({description: 'Accounts search responded.', response: response, query: query, func: 'search', obj: 'AccountsAction'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error searching Accounts.', error: errRes, query: query, func: 'search', obj: 'AccountsAction'});
			return Promise.reject(errRes.message || 'Error searching accounts.');
		});
	}
}
export default AccountsAction;
